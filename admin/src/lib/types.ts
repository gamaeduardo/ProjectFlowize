// Cópia fiel de web/src/lib/schema.ts.
// Rode `npm run checar-schema` no admin depois de mudar o schema no site.

import type { Categoria } from './schema';

export type { MenuConfig, Item, Categoria, Arte } from './schema';

export type Status = 'teste' | 'ativo' | 'inativo';
export type Pacote = 'simples' | 'completo';

/** Linha da tabela `clients` como o painel usa. */
export type Cliente = {
  id: string;
  slug: string;
  nome: string;
  slogan: string | null;
  pacote: Pacote;
  status: Status;
  whatsapp: string;
  instagram: string | null;
  endereco: string | null;
  maps_url: string | null;
  tempo: string | null;
  taxa: number | null;
  horario: { abre: string; fecha: string } | null;
  pagamentos: string[];
  cores: Record<string, string>;
  categorias: Categoria[];
  analytics_website_id: string | null;
  dia_vencimento: number | null;
  valor_mensal: number | null;
  paid_until: string | null;
  notas: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ClienteEntrada = Omit<
  Cliente,
  'id' | 'created_at' | 'updated_at' | 'published_at'
>;

export type EventoPublicacao = {
  id: number;
  created_at: string;
  status: 'disparado' | 'falhou';
  mensagem: string | null;
};

/** Linha da tabela `payments`. */
export type Pagamento = {
  id: string;
  client_id: string;
  valor: number;
  pago_em: string;
  referencia: string | null;
  paid_until_anterior: string | null;
  paid_until_novo: string | null;
  created_at: string;
};

/** Linha da tabela `pageviews`: visitas de um cardápio em um dia. */
export type Visita = {
  client_id: string;
  dia: string;
  visitas: number;
};
