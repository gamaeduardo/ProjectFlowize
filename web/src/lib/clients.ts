import { menuConfigSchema, type MenuConfig } from './schema';

export type Cliente = { slug: string; cfg: MenuConfig };

type LinhaCliente = {
  slug: string;
  nome: string;
  slogan: string | null;
  pacote: 'simples' | 'completo';
  status: 'teste' | 'ativo' | 'inativo';
  whatsapp: string;
  instagram: string | null;
  endereco: string | null;
  maps_url: string | null;
  analytics_website_id: string | null;
  tempo: string | null;
  taxa: number | string | null;
  horario: { abre: string; fecha: string } | null;
  pagamentos: string[] | null;
  cores: Record<string, string> | null;
  categorias: unknown;
};

/**
 * Lê variáveis de ambiente do processo de build.
 *
 * `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são segredos de build: não usam
 * o prefixo PUBLIC_ e por isso nunca chegam ao navegador.
 */
function envBuild(nome: string): string | undefined {
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return proc?.env?.[nome]?.trim() || undefined;
}

function validar(slug: string, cfg: unknown, origem: string): Cliente {
  const resultado = menuConfigSchema.safeParse(cfg);
  if (!resultado.success) {
    throw new Error(
      `Cardápio inválido (${origem}) para "${slug}":\n${JSON.stringify(
        resultado.error.format(),
        null,
        2,
      )}`,
    );
  }
  return { slug, cfg: resultado.data };
}

/** Lê os JSONs locais de src/data/clientes. Usado quando o Supabase não está configurado. */
async function carregarLocais(): Promise<Cliente[]> {
  const modules = import.meta.glob<{ default: unknown }>('../data/clientes/*.json', {
    eager: true,
  });

  return Object.entries(modules)
    .map(([caminho, modulo]) => {
      const slug = caminho.split('/').pop()!.replace(/\.json$/, '');
      return validar(slug, modulo.default, caminho);
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

/** Lê os clientes direto do Supabase no momento do build. */
async function carregarDoSupabase(url: string, chave: string): Promise<Cliente[]> {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.from('clients').select('*').order('slug', {
    ascending: true,
  });

  if (error) {
    throw new Error(`Não foi possível ler os clientes do Supabase: ${error.message}`);
  }

  return (data as LinhaCliente[]).map((linha) =>
    validar(
      linha.slug,
      {
        pacote: linha.pacote,
        status: linha.status,
        nome: linha.nome,
        slogan: linha.slogan ?? undefined,
        endereco: linha.endereco ?? undefined,
        maps_url: linha.maps_url ?? undefined,
        analytics_website_id: linha.analytics_website_id ?? undefined,
        whatsapp: linha.whatsapp,
        instagram: linha.instagram ?? undefined,
        tempo: linha.tempo ?? undefined,
        taxa: linha.taxa == null ? undefined : Number(linha.taxa),
        horario: linha.horario ?? undefined,
        pagamentos: linha.pagamentos ?? undefined,
        cores: linha.cores ?? undefined,
        categorias: linha.categorias,
      },
      'Supabase',
    ),
  );
}

let pendente: Promise<Cliente[]> | undefined;

/**
 * Clientes do site, lidos uma única vez por build.
 *
 * - Com `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`: usa o Supabase.
 * - Sem essas variáveis: usa os JSONs locais (desenvolvimento e deploy sem banco).
 */
export function getClientes(): Promise<Cliente[]> {
  pendente ??= (async () => {
    const url = envBuild('SUPABASE_URL');
    const chave = envBuild('SUPABASE_SERVICE_ROLE_KEY');

    if (!url || !chave) {
      const locais = await carregarLocais();
      console.log(`[Flowize] clientes: ${locais.length} arquivo(s) local(is)`);
      return locais;
    }

    const remotos = await carregarDoSupabase(url, chave);
    console.log(`[Flowize] clientes: ${remotos.length} do Supabase`);
    return remotos;
  })();

  return pendente;
}
