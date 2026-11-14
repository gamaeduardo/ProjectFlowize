import type { APIRoute } from 'astro';
import { renderOg } from '../lib/og';

export const GET: APIRoute = async () => {
  const png = await renderOg({
    titulo: 'Cardápios digitais para o seu negócio',
    subtitulo: 'Peça pelo celular, sem comissão.',
  });

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
