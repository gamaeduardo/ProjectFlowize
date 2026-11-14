import lanchonete from '../../../web/src/data/clientes/lanchonete-da-ana.json';
import pizzaria from '../../../web/src/data/clientes/pizzaria-do-joao.json';
import { hojeISO, paraISO, somarDias } from './datas';
import type { Cliente, Lead, Pagamento, Visita } from './types';

/**
 * Modo demonstração: usa os mesmos JSONs de web/src/data/clientes e guarda as
 * alterações no localStorage. Serve para testar o painel sem Supabase.
 */
const CHAVE = 'flowize:demo:clientes:v1';

type JsonCliente = {
  nome: string;
  slogan?: string;
  pacote: 'simples' | 'completo';
  status: 'teste' | 'ativo' | 'inativo';
  whatsapp: string;
  instagram?: string;
  endereco?: string;
  tempo?: string;
  taxa?: number;
  horario?: { abre: string; fecha: string };
  pagamentos?: string[];
  cores?: Record<string, string>;
  categorias: unknown;
};

function montar(slug: string, dados: JsonCliente): Cliente {
  const agora = new Date().toISOString();
  return {
    id: `demo-${slug}`,
    slug,
    nome: dados.nome,
    slogan: dados.slogan ?? null,
    pacote: dados.pacote,
    status: dados.status,
    whatsapp: dados.whatsapp,
    instagram: dados.instagram ?? null,
    endereco: dados.endereco ?? null,
    maps_url: null,
    tempo: dados.tempo ?? null,
    taxa: dados.taxa ?? 0,
    horario: dados.horario ?? null,
    pagamentos: dados.pagamentos ?? [],
    cores: dados.cores ?? {},
    categorias: dados.categorias as Cliente['categorias'],
    analytics_website_id: null,
    dia_vencimento: 10,
    valor_mensal: null,
    paid_until: null,
    notas: 'Cliente de demonstração',
    published_at: null,
    created_at: agora,
    updated_at: agora,
  };
}

/** Data local em YYYY-MM-DD (sem o deslocamento de fuso do toISOString). */
function iso(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${mes}-${dia}`;
}

export function semearDemo(): Cliente[] {
  const agora = new Date();
  const umMesAtras = new Date(agora.getFullYear(), agora.getMonth() - 1, 10);
  const daquiVinteDias = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 20);

  const ana = montar('lanchonete-da-ana', lanchonete as unknown as JsonCliente);
  ana.valor_mensal = 149;
  ana.dia_vencimento = 10;
  ana.paid_until = iso(umMesAtras); // em atraso, para testar a cobrança

  const joao = montar('pizzaria-do-joao', pizzaria as unknown as JsonCliente);
  joao.valor_mensal = 249;
  joao.dia_vencimento = 5;
  joao.paid_until = iso(daquiVinteDias); // a vencer

  return [ana, joao];
}

export function lerDemo(): Cliente[] {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) {
      const semente = semearDemo();
      gravarDemo(semente);
      return semente;
    }
    const dados = JSON.parse(bruto) as Cliente[];
    return Array.isArray(dados) ? dados : semearDemo();
  } catch {
    return semearDemo();
  }
}

export function gravarDemo(clientes: Cliente[]): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(clientes));
  } catch {
    // Sem espaço ou modo privado: o painel segue funcionando na sessão.
  }
}

export function resetarDemo(): Cliente[] {
  const semente = semearDemo();
  gravarDemo(semente);
  return semente;
}

/* -------------------------------------------------------------------------- */
/* Pagamentos (Fase 3)                                                        */
/* -------------------------------------------------------------------------- */

const CHAVE_PAGAMENTOS = 'flowize:demo:pagamentos:v1';

export function lerPagamentosDemo(): Pagamento[] {
  try {
    const bruto = localStorage.getItem(CHAVE_PAGAMENTOS);
    if (!bruto) return [];
    const dados = JSON.parse(bruto) as Pagamento[];
    return Array.isArray(dados) ? dados : [];
  } catch {
    return [];
  }
}

export function gravarPagamentosDemo(pagamentos: Pagamento[]): void {
  try {
    localStorage.setItem(CHAVE_PAGAMENTOS, JSON.stringify(pagamentos));
  } catch {
    // Sem espaço ou modo privado: o painel segue funcionando na sessão.
  }
}

/* -------------------------------------------------------------------------- */
/* Visitas (Fase 4)                                                           */
/* -------------------------------------------------------------------------- */

/** Ruído estável: o mesmo slug + dia sempre gera o mesmo número. */
function ruido(slug: string, dia: string): number {
  let hash = 2166136261;
  for (const texto of [slug, dia]) {
    for (let i = 0; i < texto.length; i++) {
      hash ^= texto.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
  }
  return (hash >>> 0) / 4294967295;
}

/**
 * Série de visitas inventada, mas estável, para o modo demonstração.
 * O painel real lê a tabela `pageviews`; aqui só queremos ver o gráfico vivo.
 */
export function lerVisitasDemo(dias = 60): Visita[] {
  const lista: Visita[] = [];
  const hoje = new Date();
  hoje.setHours(12, 0, 0, 0);

  for (const cliente of lerDemo()) {
    if (cliente.status === 'inativo') continue;

    const base = cliente.pacote === 'completo' ? 16 : 8;

    for (let i = dias - 1; i >= 0; i--) {
      const data = new Date(hoje);
      data.setDate(data.getDate() - i);
      const dia = paraISO(data);
      const fimDeSemana = data.getDay() === 0 || data.getDay() === 6 ? 1.5 : 1;
      const visitas = Math.round(base * fimDeSemana * (0.55 + ruido(cliente.slug, dia)));

      if (visitas > 0) lista.push({ client_id: cliente.id, dia, visitas });
    }
  }

  return lista;
}

/* -------------------------------------------------------------------------- */
/* Leads (Fase 5)                                                             */
/* -------------------------------------------------------------------------- */

const CHAVE_LEADS = 'flowize:demo:leads:v1';

function montarLead(
  id: string,
  dados: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'client_id'> & { client_id?: string | null },
): Lead {
  const agora = new Date().toISOString();
  return {
    id,
    ...dados,
    client_id: dados.client_id ?? null,
    created_at: agora,
    updated_at: agora,
  };
}

export function semearLeadsDemo(): Lead[] {
  const hoje = hojeISO();

  return [
    montarLead('demo-lead-joao', {
      nome: 'Pizzaria do João',
      telefone: '5511988887777',
      instagram: 'pizzariadojoao',
      maps_url: 'https://maps.google.com/?q=Pizzaria+do+Joao',
      bairro: 'Vila Mariana',
      origem: 'maps',
      etapa: 'cliente',
      proximo_followup: null,
      notas: 'Fechou o pacote completo. Cardápio no ar.',
      client_id: 'demo-pizzaria-do-joao',
    }),
    montarLead('demo-lead-ze', {
      nome: 'Hamburgueria do Zé',
      telefone: '5511977776666',
      instagram: 'hamburgueriadaze',
      maps_url: 'https://maps.google.com/?q=Hamburgueria+do+Ze',
      bairro: 'Pinheiros',
      origem: 'maps',
      etapa: 'contatado',
      proximo_followup: somarDias(hoje, -2),
      notas: 'Pediu para chamar depois do fim de semana.',
      client_id: null,
    }),
    montarLead('demo-lead-acai', {
      nome: 'Açaí da Praça',
      telefone: null,
      instagram: 'acaidapraca',
      maps_url: null,
      bairro: 'Butantã',
      origem: 'instagram',
      etapa: 'novo',
      proximo_followup: somarDias(hoje, 1),
      notas: 'Perfil com 4 mil seguidores, sem link na bio.',
      client_id: null,
    }),
    montarLead('demo-lead-nonna', {
      nome: 'Cantina da Nonna',
      telefone: '5511966665555',
      instagram: null,
      maps_url: 'https://maps.google.com/?q=Cantina+da+Nonna',
      bairro: 'Bela Vista',
      origem: 'indicacao',
      etapa: 'negociando',
      proximo_followup: somarDias(hoje, 4),
      notas: 'Indicação da Ana. Quer o pacote simples.',
      client_id: null,
    }),
    montarLead('demo-lead-pao', {
      nome: 'Padaria Pão Quente',
      telefone: '5511955554444',
      instagram: null,
      maps_url: 'https://maps.google.com/?q=Padaria+Pao+Quente',
      bairro: 'Moema',
      origem: 'maps',
      etapa: 'perdido',
      proximo_followup: null,
      notas: 'Já usa um sistema de marketplace e não quis trocar.',
      client_id: null,
    }),
  ];
}

export function lerLeadsDemo(): Lead[] {
  try {
    const bruto = localStorage.getItem(CHAVE_LEADS);
    if (!bruto) {
      const semente = semearLeadsDemo();
      gravarLeadsDemo(semente);
      return semente;
    }
    const dados = JSON.parse(bruto) as Lead[];
    return Array.isArray(dados) ? dados : semearLeadsDemo();
  } catch {
    return semearLeadsDemo();
  }
}

export function gravarLeadsDemo(leads: Lead[]): void {
  try {
    localStorage.setItem(CHAVE_LEADS, JSON.stringify(leads));
  } catch {
    // Sem espaço ou modo privado: o painel segue funcionando na sessão.
  }
}
