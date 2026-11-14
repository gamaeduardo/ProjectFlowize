import type { APIRoute } from 'astro';
import QRCode from 'qrcode';
import { clientes } from '../../lib/clients';

export function getStaticPaths() {
  return clientes.map(({ slug }) => ({ params: { slug } }));
}

const site = (process.env.PUBLIC_SITE_URL || 'https://flowizehub.com').replace(/\/$/, '');

export const GET: APIRoute = async ({ params }) => {
  const svg = await QRCode.toString(`${site}/${params.slug}`, {
    type: 'svg',
    margin: 1,
    width: 512,
    color: { dark: '#1c1210', light: '#ffffff' },
  });

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
