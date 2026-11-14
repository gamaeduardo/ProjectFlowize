const MAPA: Record<string, string> = {
  textoDestaque: 'tdest',
  superficie: 'sup',
  capa: 'hero',
};

/**
 * Converte as cores do JSON em variáveis CSS. Define tanto o nome original
 * quanto o apelido usado pelos modelos (ex.: textoDestaque e tdest).
 */
export function cssVars(cores?: Record<string, string>): string {
  if (!cores) return '';
  const vars = new Set<string>();
  for (const [chave, valor] of Object.entries(cores)) {
    vars.add(`--${chave}:${valor};`);
    if (MAPA[chave]) vars.add(`--${MAPA[chave]}:${valor};`);
  }
  return [...vars].join('');
}
