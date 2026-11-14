import type { Arte } from './schema';
import { esc } from './format';

const POSICOES: Array<[number, number]> = [
  [50, 27],
  [69, 37],
  [72, 60],
  [53, 74],
  [31, 66],
  [29, 40],
  [50, 50],
  [41, 36],
  [61, 53],
  [43, 62],
  [58, 30],
  [36, 52],
];

/** Ilustração SVG usada quando o item não tem foto. */
export function artSvg(arte?: Arte): string {
  if (!arte) {
    return '<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="100" height="100" fill="#f3efec"/></svg>';
  }

  const cores = arte.cores.length ? arte.cores : ['#ccc'];
  const cor = (indice: number) => cores[indice % cores.length];
  let forma: string;

  if (arte.tipo === 'pizza' || arte.tipo === 'doce') {
    const base = arte.tipo === 'doce' ? '#5a2e1b' : '#f1c04f';
    forma =
      `<circle cx="50" cy="50" r="41" fill="#c98438"/>` +
      `<circle cx="50" cy="50" r="36" fill="${base}"/>` +
      POSICOES.map(
        (p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="${4 + (i % 3)}" fill="${cor(i)}"/>`,
      ).join('') +
      '<path d="M50 14V86M19 32L81 68M19 68L81 32" stroke="#0002" stroke-width="1.2"/>';
  } else if (arte.tipo === 'lata') {
    forma =
      `<rect x="34" y="20" width="32" height="62" rx="9" fill="${cor(0)}"/>` +
      `<rect x="34" y="32" width="32" height="26" fill="${cor(1)}"/>` +
      '<rect x="40" y="22" width="5" height="58" rx="2.5" fill="#fff5"/>';
  } else {
    forma =
      '<path d="M30 28H70L64 82H36Z" fill="#fff8"/>' +
      `<path d="M32 42H68L64 82H36Z" fill="${cor(0)}"/>` +
      `<path d="M54 14L58 28" stroke="${cor(1)}" stroke-width="3.5"/>`;
  }

  return `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="100" height="100" fill="${arte.fundo || 'none'}"/>${forma}</svg>`;
}

/** HTML da imagem do item: foto quando existir, ilustração caso contrário. */
export function itemImage(item: { foto?: string; arte?: Arte }): string {
  if (item.foto) {
    return `<img src="${esc(item.foto)}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover">`;
  }
  return artSvg(item.arte);
}
