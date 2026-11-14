/**
 * Dados comerciais da Flowize usados na landing e nos CTAs.
 *
 * TODO: trocar o WhatsApp abaixo pelo número comercial real antes de publicar.
 */
export const site = {
  nome: 'Flowize',
  dominio: 'flowizehub.com',
  whatsapp: '5511999999999',
  whatsappExibicao: '(11) 99999-9999',
  instagram: '',
  email: '',
} as const;

export function waLink(
  mensagem = 'Olá! Quero saber mais sobre o cardápio digital da Flowize.',
): string {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(mensagem)}`;
}

export const siteUrl = `https://${site.dominio}`;

if (site.whatsapp === '5511999999999') {
  console.warn(
    '[Flowize] O WhatsApp de contato ainda é o placeholder. Troque em src/lib/site.ts antes de publicar.',
  );
}
