import { z } from 'zod';

export const arteSchema = z.object({
  tipo: z.string().min(1),
  cores: z.array(z.string()).min(1),
  fundo: z.string().optional(),
});

export const opcaoSchema = z.tuple([z.string(), z.number().nonnegative()]);

export const itemSchema = z
  .object({
    nome: z.string().min(1),
    desc: z.string().optional(),
    preco: z.number().nonnegative().optional(),
    opcoes: z.array(opcaoSchema).min(1).optional(),
    foto: z.string().optional(),
    destaque: z.number().int().optional(),
    arte: arteSchema.optional(),
  })
  .refine((item) => item.preco !== undefined || (item.opcoes?.length ?? 0) > 0, {
    message: 'O item precisa ter "preco" ou "opcoes".',
    path: ['preco'],
  });

export const categoriaSchema = z.object({
  nome: z.string().min(1),
  itens: z.array(itemSchema).min(1),
});

export const menuConfigSchema = z.object({
  pacote: z.enum(['simples', 'completo']),
  status: z.enum(['teste', 'ativo', 'inativo']),
  nome: z.string().min(1),
  slogan: z.string().optional(),
  endereco: z.string().optional(),
  maps_url: z
    .string()
    .url('Use a URL completa do Maps, ex.: https://maps.app.goo.gl/…')
    .optional(),
  analytics_website_id: z.string().optional(),
  whatsapp: z
    .string()
    .regex(/^\d{10,15}$/, 'Use apenas dígitos, ex.: 5511999999999.'),
  instagram: z.string().optional(),
  tempo: z.string().optional(),
  taxa: z.number().nonnegative().optional(),
  horario: z.object({ abre: z.string(), fecha: z.string() }).optional(),
  pagamentos: z.array(z.string()).optional(),
  cores: z.record(z.string(), z.string()).optional(),
  categorias: z.array(categoriaSchema).min(1),
});

export type MenuConfig = z.infer<typeof menuConfigSchema>;
export type Item = z.infer<typeof itemSchema>;
export type Categoria = z.infer<typeof categoriaSchema>;
export type Arte = z.infer<typeof arteSchema>;
