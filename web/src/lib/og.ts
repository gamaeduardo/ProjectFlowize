import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

type Fonte = {
  name: string;
  data: Buffer;
  weight: 400 | 700;
  style: 'normal';
};

let fontes: Fonte[] | null = null;

function carregarFontes(): Fonte[] {
  if (fontes) return fontes;
  const dir = path.join(process.cwd(), 'src/assets/fonts');
  fontes = [
    {
      name: 'Instrument Sans',
      data: fs.readFileSync(path.join(dir, 'instrument-sans-400.woff')),
      weight: 400,
      style: 'normal',
    },
    {
      name: 'Instrument Sans',
      data: fs.readFileSync(path.join(dir, 'instrument-sans-700.woff')),
      weight: 700,
      style: 'normal',
    },
  ];
  return fontes;
}

export type OgOpcoes = {
  titulo: string;
  subtitulo?: string;
  destaque?: string;
  fundo?: string;
};

/** Luminância relativa para escolher texto claro ou escuro sobre uma cor. */
function luminancia(hex: string): number {
  const limpo = hex.replace('#', '');
  const cheio =
    limpo.length === 3
      ? limpo
          .split('')
          .map((c) => c + c)
          .join('')
      : limpo;
  const canais = [0, 2, 4].map((i) => parseInt(cheio.slice(i, i + 2), 16) / 255);
  const linear = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear(canais[0]) + 0.7152 * linear(canais[1]) + 0.0722 * linear(canais[2]);
}

/** Marca da Flowize em SVG, com as camadas ciano e magenta deslocadas. */
function marcaDataUri(cor: string): string {
  const camada = (x: number, y: number, tinta: string) =>
    `<g transform="translate(${x} ${y})" opacity=".95">` +
    `<circle cx="32" cy="32" r="18" fill="none" stroke="${tinta}" stroke-width="10"/>` +
    `<rect x="3" y="27" width="58" height="10" rx="5" fill="${tinta}"/>` +
    `</g>`;

  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
    camada(-2.4, -1.2, '#00d5e8') +
    camada(2.4, 1.2, '#ff2e93') +
    `<circle cx="32" cy="32" r="18" fill="none" stroke="${cor}" stroke-width="10"/>` +
    `<rect x="3" y="27" width="58" height="10" rx="5" fill="${cor}"/>` +
    '</svg>';

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/** Gera a imagem de compartilhamento (1200x630) em PNG. */
export async function renderOg(opcoes: OgOpcoes): Promise<Uint8Array> {
  const { titulo, subtitulo = '', destaque = '#00d5e8', fundo = '#0b0b0f' } = opcoes;

  const corDoFundo = luminancia(fundo) > 0.45 ? '#0b0b0f' : '#ffffff';
  const corDoDestaque = luminancia(destaque) > 0.55 ? '#0b0b0f' : '#ffffff';

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '1200px',
          height: '630px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px',
          background: fundo,
          color: corDoFundo,
          fontFamily: 'Instrument Sans',
        },
        children: [
          {
            type: 'div',
            props: {
              style: { display: 'flex', alignItems: 'center', gap: '18px' },
              children: [
                {
                  type: 'img',
                  props: {
                    src: marcaDataUri(corDoFundo),
                    width: 64,
                    height: 64,
                    style: { width: '64px', height: '64px' },
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: { fontSize: '30px', fontWeight: 700, letterSpacing: '-0.02em' },
                    children: 'Flowize',
                  },
                },
              ],
            },
          },
          {
            type: 'div',
            props: {
              style: { display: 'flex', flexDirection: 'column', gap: '16px' },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '76px',
                      fontWeight: 700,
                      lineHeight: 1.02,
                      letterSpacing: '-0.03em',
                      lineClamp: 2,
                    },
                    children: titulo,
                  },
                },
                ...(subtitulo
                  ? [
                      {
                        type: 'div',
                        props: {
                          style: { fontSize: '32px', opacity: 0.7 },
                          children: subtitulo,
                        },
                      },
                    ]
                  : []),
              ],
            },
          },
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '26px',
              },
              children: [
                { type: 'div', props: { style: { opacity: 0.65 }, children: 'flowizehub.com' } },
                {
                  type: 'div',
                  props: {
                    style: {
                      padding: '10px 22px',
                      borderRadius: '999px',
                      background: destaque,
                      color: corDoDestaque,
                      opacity: 1,
                      fontWeight: 700,
                      fontSize: '24px',
                    },
                    children: 'Cardápio digital',
                  },
                },
              ],
            },
          },
        ],
      },
    } as never,
    { width: 1200, height: 630, fonts: carregarFontes() },
  );

  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
}
