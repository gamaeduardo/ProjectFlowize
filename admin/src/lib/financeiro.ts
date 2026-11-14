import { comoData, diasEntre, hojeISO } from './datas';
import type { Cliente } from './types';

/** Monta YYYY-MM-DD com o dia limitado ao último dia do mês. */
function montar(ano: number, mes: number, dia: number): string {
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const diaFinal = Math.min(Math.max(dia, 1), ultimoDia);
  return `${ano}-${String(mes).padStart(2, '0')}-${String(diaFinal).padStart(2, '0')}`;
}

/** Soma meses mantendo o dia de vencimento (31/01 → 28/02). */
export function somarMeses(iso: string, meses: number, diaVencimento: number): string {
  const base = comoData(iso);
  const alvo = new Date(base.getFullYear(), base.getMonth() + meses, 1);
  return montar(alvo.getFullYear(), alvo.getMonth() + 1, diaVencimento);
}

/**
 * Próximo `paid_until` depois de receber.
 *
 * - Já pagou antes: avança um mês a partir do vencimento atual.
 * - Nunca pagou: cobre até o vencimento deste mês, ou do próximo se já passou.
 */
export function proximoVencimento(
  pago: string | null,
  diaVencimento: number,
  hoje = hojeISO(),
): string {
  if (pago) return somarMeses(pago, 1, diaVencimento);

  const [ano, mes] = hoje.split('-').map(Number);
  const vencimentoDoMes = montar(ano, mes, diaVencimento);

  return vencimentoDoMes >= hoje ? vencimentoDoMes : somarMeses(vencimentoDoMes, 1, diaVencimento);
}

export type Situacao = 'atrasado' | 'vence-hoje' | 'a-vencer' | 'em-dia' | 'sem-cobranca';

export type SituacaoCliente = {
  tipo: Situacao;
  dias: number;
  rotulo: string;
};

/** Situação de cobrança de um cliente hoje. */
export function situacao(
  cliente: Pick<Cliente, 'valor_mensal' | 'paid_until'>,
  hoje = hojeISO(),
): SituacaoCliente {
  if (cliente.valor_mensal == null || !cliente.paid_until) {
    return { tipo: 'sem-cobranca', dias: 0, rotulo: 'Sem cobrança' };
  }

  const dias = diasEntre(cliente.paid_until, hoje);

  if (dias > 0) {
    return { tipo: 'atrasado', dias, rotulo: `${dias} dia${dias > 1 ? 's' : ''} de atraso` };
  }
  if (dias === 0) {
    return { tipo: 'vence-hoje', dias: 0, rotulo: 'Vence hoje' };
  }
  if (dias >= -30) {
    return { tipo: 'a-vencer', dias, rotulo: `Vence em ${Math.abs(dias)} dia${dias < -1 ? 's' : ''}` };
  }
  return { tipo: 'em-dia', dias, rotulo: 'Em dia' };
}

/** Mensagem de cobrança pronta para o WhatsApp. */
export function mensagemCobranca(cliente: Cliente, hoje = hojeISO()): string {
  const primeiroNome = cliente.nome.split(' ')[0];
  const valor = Number(cliente.valor_mensal ?? 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
  const { tipo, dias } = situacao(cliente, hoje);

  if (tipo === 'atrasado') {
    const venceu = new Date(`${cliente.paid_until}T12:00:00`).toLocaleDateString('pt-BR');
    return (
      `Oi, ${primeiroNome}! Tudo bem? Passando para lembrar da mensalidade do cardápio digital ` +
      `(${valor}), que venceu em ${venceu} — está ${dias} dia${dias > 1 ? 's' : ''} em aberto. ` +
      `Se já pagou, desconsidere. Qualquer dúvida me chama. Obrigado!`
    );
  }

  return (
    `Oi, ${primeiroNome}! Tudo bem? A mensalidade do cardápio digital (${valor}) ` +
    `vence em ${new Date(`${cliente.paid_until}T12:00:00`).toLocaleDateString('pt-BR')}. ` +
    `Quando puder, me confirma o pagamento. Obrigado!`
  );
}

export function linkWhatsApp(whatsapp: string, mensagem: string): string {
  return `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(mensagem)}`;
}
