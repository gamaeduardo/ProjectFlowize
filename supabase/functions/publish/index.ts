// Edge Function: publicar o site.
//
// Recebe POST do painel autenticado, confere a sessão e dispara o build hook
// do Netlify. O segredo fica nas variáveis da função, nunca no navegador.
//
// Deploy:
//   supabase functions deploy publish
//   supabase secrets set NETLIFY_BUILD_HOOK=https://api.netlify.com/build_hooks/xxxx

import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(corpo: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Use POST.' }, 405);
  }

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) {
    return json({ error: 'Sessão ausente.' }, 401);
  }

  const url = Deno.env.get('SUPABASE_URL');
  const chaveServico = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !chaveServico) {
    return json({ error: 'Função sem SUPABASE_URL ou SERVICE_ROLE_KEY.' }, 500);
  }

  const admin = createClient(url, chaveServico, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: usuario, error: erroUsuario } = await admin.auth.getUser(token);
  if (erroUsuario || !usuario.user) {
    return json({ error: 'Sessão inválida.' }, 401);
  }

  const hook = Deno.env.get('NETLIFY_BUILD_HOOK');
  if (!hook) {
    await admin.from('publish_events').insert({
      user_id: usuario.user.id,
      status: 'falhou',
      mensagem: 'NETLIFY_BUILD_HOOK não configurado.',
    });
    return json({ error: 'Build hook não configurado no Supabase.' }, 500);
  }

  const resposta = await fetch(hook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });

  if (!resposta.ok) {
    const mensagem = `Netlify respondeu ${resposta.status}.`;
    await admin.from('publish_events').insert({
      user_id: usuario.user.id,
      status: 'falhou',
      mensagem,
    });
    return json({ error: mensagem }, 502);
  }

  await admin.from('publish_events').insert({
    user_id: usuario.user.id,
    status: 'disparado',
    mensagem: null,
  });

  return json({
    ok: true,
    mensagem: 'Build disparado. O site atualiza em cerca de 1 minuto.',
  });
});
