import { gravarDemo, lerDemo, resetarDemo } from './demo';
import { supabase } from './supabase';
import type { Cliente, ClienteEntrada, EventoPublicacao } from './types';

export const modoDemo = !supabase;

function esperar(ms: number) {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

function mensagemDeErro(erro: { message?: string } | null): string {
  return erro?.message ?? 'Erro inesperado.';
}

function payload(entrada: ClienteEntrada) {
  return {
    slug: entrada.slug.trim().toLowerCase(),
    nome: entrada.nome.trim(),
    slogan: entrada.slogan?.trim() || null,
    pacote: entrada.pacote,
    status: entrada.status,
    whatsapp: entrada.whatsapp.replace(/\D/g, ''),
    instagram: entrada.instagram?.trim().replace(/^@/, '') || null,
    endereco: entrada.endereco?.trim() || null,
    maps_url: entrada.maps_url?.trim() || null,
    tempo: entrada.tempo?.trim() || null,
    taxa: entrada.taxa ?? 0,
    horario: entrada.horario,
    pagamentos: entrada.pagamentos.filter(Boolean),
    cores: entrada.cores,
    categorias: entrada.categorias,
    analytics_website_id: entrada.analytics_website_id?.trim() || null,
    dia_vencimento: entrada.dia_vencimento,
    valor_mensal: entrada.valor_mensal,
    paid_until: entrada.paid_until || null,
    notas: entrada.notas?.trim() || null,
  };
}

export async function listarClientes(): Promise<Cliente[]> {
  if (!supabase) {
    return lerDemo().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('nome', { ascending: true });

  if (error) throw new Error(mensagemDeErro(error));
  return (data ?? []) as Cliente[];
}

export async function obterCliente(id: string): Promise<Cliente | null> {
  if (!supabase) {
    return lerDemo().find((cliente) => cliente.id === id) ?? null;
  }

  const { data, error } = await supabase.from('clients').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(mensagemDeErro(error));
  return (data as Cliente | null) ?? null;
}

export async function salvarCliente(
  entrada: ClienteEntrada & { id?: string },
): Promise<Cliente> {
  const dados = payload(entrada);

  if (!supabase) {
    await esperar(350);
    const lista = lerDemo();
    const agora = new Date().toISOString();

    if (entrada.id) {
      const indice = lista.findIndex((cliente) => cliente.id === entrada.id);
      if (indice < 0) throw new Error('Cliente não encontrado.');

      const atualizado: Cliente = {
        ...lista[indice],
        ...dados,
        updated_at: agora,
      };
      lista[indice] = atualizado;
      gravarDemo(lista);
      return atualizado;
    }

    const novo: Cliente = {
      ...dados,
      id: `demo-${crypto.randomUUID()}`,
      published_at: null,
      created_at: agora,
      updated_at: agora,
    };
    lista.push(novo);
    gravarDemo(lista);
    return novo;
  }

  if (entrada.id) {
    const { data, error } = await supabase
      .from('clients')
      .update(dados)
      .eq('id', entrada.id)
      .select()
      .single();

    if (error) throw new Error(mensagemDeErro(error));
    return data as Cliente;
  }

  const { data, error } = await supabase.from('clients').insert(dados).select().single();
  if (error) throw new Error(mensagemDeErro(error));
  return data as Cliente;
}

export async function excluirCliente(id: string): Promise<void> {
  if (!supabase) {
    gravarDemo(lerDemo().filter((cliente) => cliente.id !== id));
    return;
  }

  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) throw new Error(mensagemDeErro(error));
}

export async function publicar(): Promise<string> {
  if (!supabase) {
    await esperar(1400);
    return 'Publicação simulada no modo demonstração. No ambiente real o Netlify gera o site em cerca de 1 minuto.';
  }

  const { data, error } = await supabase.functions.invoke('publish', {
    body: { origem: 'admin' },
  });

  if (error) {
    const contexto = (error as { context?: Response }).context;
    if (contexto) {
      try {
        const corpo = (await contexto.clone().json()) as { error?: string };
        if (corpo?.error) throw new Error(corpo.error);
      } catch (e) {
        if (e instanceof Error && e.message && e.message !== error.message) throw e;
      }
    }
    throw new Error(mensagemDeErro(error));
  }

  if (data?.error) throw new Error(String(data.error));
  return String(data?.mensagem ?? 'Build disparado.');
}

export async function ultimaPublicacao(): Promise<EventoPublicacao | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('publish_events')
    .select('id, created_at, status, mensagem')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return (data as EventoPublicacao | null) ?? null;
}

export async function enviarFoto(arquivo: File, slug: string): Promise<string> {
  if (!supabase) {
    return new Promise((resolver, rejeitar) => {
      const leitor = new FileReader();
      leitor.onload = () => resolver(String(leitor.result));
      leitor.onerror = () => rejeitar(new Error('Não foi possível ler a imagem.'));
      leitor.readAsDataURL(arquivo);
    });
  }

  const extensao = (arquivo.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const caminho = `${slug || 'sem-slug'}/${crypto.randomUUID()}.${extensao || 'jpg'}`;

  const { error } = await supabase.storage.from('fotos').upload(caminho, arquivo, {
    cacheControl: '31536000',
    contentType: arquivo.type,
    upsert: false,
  });

  if (error) throw new Error(mensagemDeErro(error));

  const { data } = supabase.storage.from('fotos').getPublicUrl(caminho);
  return data.publicUrl;
}

export { resetarDemo };
