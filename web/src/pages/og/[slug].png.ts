import type { APIRoute } from 'astro';
import { getClientes } from '../../lib/clients';
import { renderOg } from '../../lib/og';
import type { MenuConfig } from '../../lib/schema';

export async function getStaticPaths() {
  const clientes = await getClientes();
  return clientes.map(({ slug, cfg }) => ({ params: { slug }, props: { cfg } }));
}

export const GET: APIRoute = async ({ props }) => {
  const { cfg } = props as { cfg: MenuConfig };

  const png = await renderOg({
    titulo: cfg.nome,
    subtitulo: cfg.slogan ?? '',
    destaque: cfg.cores?.destaque ?? '#d62828',
    fundo: cfg.cores?.capa ?? '#1c1210',
  });

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
