import lanchonete from '../../../web/src/data/clientes/lanchonete-da-ana.json';
import pizzaria from '../../../web/src/data/clientes/pizzaria-do-joao.json';
import type { Cliente } from './types';

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

export function semearDemo(): Cliente[] {
  return [
    montar('lanchonete-da-ana', lanchonete as unknown as JsonCliente),
    montar('pizzaria-do-joao', pizzaria as unknown as JsonCliente),
  ];
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
