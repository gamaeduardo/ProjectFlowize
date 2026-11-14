import type { APIRoute } from 'astro';
import { renderOg } from '../lib/og';

export const GET: APIRoute = async () => {
  const png = await renderOg({
    titulo: 'Seu cardápio digital, com pedido no WhatsApp',
    subtitulo: 'Sem comissão. Sem aplicativo. Direto no seu negócio.',
  });

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
