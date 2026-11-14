import { hojeISO, somarDias } from './datas';
import { gravarDemo, gravarPagamentosDemo, lerDemo, lerPagamentosDemo, lerVisitasDemo, resetarDemo } from './demo';
import { supabase } from './supabase';
import type { Cliente, ClienteEntrada, EventoPublicacao, Pagamento, Visita } from './types';

export const modoDemo = !supabase;

function esperar(ms: number) {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

function mensagemDeErro(erro: { message?: string } | null): string {
  return erro?.message ?? 'Erro inesperado.';
}

/** Explica os erros mais comuns do botão "Publicar site" sem jargão. */
function traduzirPublicacao(mensagem: string): string {
  if (/not found|404/i.test(mensagem)) {
    return 'A função "publish" ainda não foi publicada no Supabase. Veja admin/README.md, seção "Publicar o site pelo painel".';
  }
  if (/failed to send a request|failed to fetch|network/i.test(mensagem)) {
    return 'Não foi possível falar com o Supabase. Confira a conexão e recarregue o painel.';
  }
  if (/jwt|session|401/i.test(mensagem)) {
    return 'Sessão expirada. Saia e entre de novo no painel.';
  }
  return mensagem;
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
    return 'Publicação simulada no modo demonstração. No ambiente real o site é gerado em cerca de 1 minuto.';
  }

  const { data, error } = await supabase.functions.invoke('publish', {
    body: { origem: 'admin' },
  });

  if (error) {
    const contexto = (error as { context?: Response }).context;
    if (contexto) {
      try {
        const corpo = (await contexto.clone().json()) as { error?: string; message?: string };
        const mensagem = corpo?.error ?? corpo?.message;
        if (mensagem) throw new Error(traduzirPublicacao(mensagem));
      } catch (e) {
        if (e instanceof Error && e.message && e.message !== error.message) throw e;
      }
    }
    throw new Error(traduzirPublicacao(mensagemDeErro(error)));
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

/* -------------------------------------------------------------------------- */
/* Financeiro (Fase 3)                                                        */
/* -------------------------------------------------------------------------- */

export async function listarPagamentos(limite = 60): Promise<Pagamento[]> {
  if (!supabase) {
    return lerPagamentosDemo()
      .slice()
      .sort((a, b) => (a.pago_em < b.pago_em ? 1 : a.pago_em > b.pago_em ? -1 : 0))
      .slice(0, limite);
  }

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .order('pago_em', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limite);

  if (error) throw new Error(mensagemDeErro(error));
  return (data ?? []) as Pagamento[];
}

export async function registrarPagamento(dados: {
  cliente: Cliente;
  valor: number;
  pagoEm: string;
  referencia: string;
  novoPaidUntil: string;
}): Promise<void> {
  const { cliente, valor, pagoEm, referencia, novoPaidUntil } = dados;

  if (!supabase) {
    await esperar(250);
    const lista = lerDemo();
    const indice = lista.findIndex((item) => item.id === cliente.id);
    if (indice < 0) throw new Error('Cliente não encontrado.');

    const pagamento: Pagamento = {
      id: `demo-${crypto.randomUUID()}`,
      client_id: cliente.id,
      valor,
      pago_em: pagoEm,
      referencia: referencia || null,
      paid_until_anterior: cliente.paid_until,
      paid_until_novo: novoPaidUntil,
      created_at: new Date().toISOString(),
    };

    const pagamentos = lerPagamentosDemo();
    pagamentos.push(pagamento);
    gravarPagamentosDemo(pagamentos);

    lista[indice] = { ...lista[indice], paid_until: novoPaidUntil };
    gravarDemo(lista);
    return;
  }

  const { error } = await supabase.rpc('registrar_pagamento', {
    p_client_id: cliente.id,
    p_valor: valor,
    p_pago_em: pagoEm,
    p_referencia: referencia || null,
    p_novo_paid_until: novoPaidUntil,
  });

  if (error) throw new Error(traduzirFinanceiro(mensagemDeErro(error)));
}

export async function apagarPagamento(id: string): Promise<void> {
  if (!supabase) {
    const pagamentos = lerPagamentosDemo();
    const alvo = pagamentos.find((pagamento) => pagamento.id === id);
    gravarPagamentosDemo(pagamentos.filter((pagamento) => pagamento.id !== id));

    if (alvo) {
      const lista = lerDemo();
      const indice = lista.findIndex((cliente) => cliente.id === alvo.client_id);
      if (indice >= 0) {
        lista[indice] = { ...lista[indice], paid_until: alvo.paid_until_anterior };
        gravarDemo(lista);
      }
    }
    return;
  }

  const { error } = await supabase.rpc('estornar_pagamento', { p_id: id });
  if (error) throw new Error(traduzirFinanceiro(mensagemDeErro(error)));
}

function traduzirFinanceiro(mensagem: string): string {
  if (/could not find the function|does not exist/i.test(mensagem)) {
    return 'A função registrar_pagamento ainda não existe no banco. Rode supabase/migrations/20261114180000_financeiro.sql no SQL Editor.';
  }
  return mensagem;
}

/* -------------------------------------------------------------------------- */
/* Visitas (Fase 4)                                                           */
/* -------------------------------------------------------------------------- */

export async function listarVisitas(dias = 60): Promise<Visita[]> {
  if (!supabase) {
    return lerVisitasDemo(dias);
  }

  const desde = somarDias(hojeISO(), -(dias - 1));
  const { data, error } = await supabase
    .from('pageviews')
    .select('client_id, dia, visitas')
    .gte('dia', desde)
    .order('dia', { ascending: true });

  if (error) {
    if (/does not exist|relation/i.test(error.message)) {
      throw new Error(
        'A tabela pageviews ainda não existe no banco. Rode supabase/migrations/20261114200000_visitas.sql no SQL Editor.',
      );
    }
    throw new Error(mensagemDeErro(error));
  }

  return (data ?? []) as Visita[];
}
