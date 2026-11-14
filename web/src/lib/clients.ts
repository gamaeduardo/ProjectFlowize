import { menuConfigSchema, type MenuConfig } from './schema';

export type Cliente = { slug: string; cfg: MenuConfig };

const modules = import.meta.glob<{ default: unknown }>('../data/clientes/*.json', {
  eager: true,
});

/**
 * Lê e valida todos os clientes em src/data/clientes no momento do build.
 * Um JSON inválido quebra o build — de propósito.
 */
export const clientes: Cliente[] = Object.entries(modules)
  .map(([caminho, modulo]) => {
    const slug = caminho.split('/').pop()!.replace(/\.json$/, '');
    const resultado = menuConfigSchema.safeParse(modulo.default);
    if (!resultado.success) {
      throw new Error(
        `JSON inválido em ${caminho}:\n${JSON.stringify(resultado.error.format(), null, 2)}`,
      );
    }
    return { slug, cfg: resultado.data };
  })
  .sort((a, b) => a.slug.localeCompare(b.slug));
