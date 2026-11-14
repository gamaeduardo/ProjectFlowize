import type { Cliente } from './types';

/** Data de hoje no formato YYYY-MM-DD, no fuso do navegador. */
export function hojeISO(): string {
  return paraISO(new Date());
}

export function paraISO(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/** Meia-noite local evita o bug de fuso que volta um dia. */
function comoData(iso: string): Date {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return new Date(ano, mes - 1, dia, 12);
}

/** Diferença em dias: positivo quando `b` é depois de `a`. */
export function diasEntre(a: string, b: string): number {
  return Math.round((comoData(b).getTime() - comoData(a).getTime()) / 86_400_000);
}

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

/** Mês no formato YYYY-MM. */
export function mesDe(iso: string): string {
  return iso.slice(0, 7);
}

export function nomeDoMes(mes: string): string {
  const [ano, numero] = mes.split('-').map(Number);
  const data = new Date(ano, numero - 1, 1);
  const nome = data.toLocaleDateString('pt-BR', { month: 'long' });
  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)} de ${ano}`;
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
