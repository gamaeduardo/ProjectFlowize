import type { APIRoute } from 'astro';
import { clientes } from '../lib/clients';

const site = (process.env.PUBLIC_SITE_URL || 'https://flowizehub.com').replace(/\/$/, '');

export const GET: APIRoute = () => {
  const urls = [
    `${site}/`,
    ...clientes
      .filter(({ cfg }) => cfg.status === 'ativo')
      .map(({ slug }) => `${site}/${slug}`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
