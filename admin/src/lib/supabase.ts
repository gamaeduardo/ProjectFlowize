import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const chave = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const configurado = Boolean(url && chave);

/**
 * Cliente do Supabase.
 *
 * `null` = modo demonstração: o painel funciona com dados no localStorage,
 * útil para desenvolver a interface antes de criar o projeto no Supabase.
 */
export const supabase = configurado
  ? createClient(url!, chave!, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;
