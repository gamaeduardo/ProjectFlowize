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

/** Gera a imagem de compartilhamento (1200x630) em PNG. */
export async function renderOg(opcoes: OgOpcoes): Promise<Uint8Array> {
  const { titulo, subtitulo = '', destaque = '#d62828', fundo = '#1c1210' } = opcoes;

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px',
          background: fundo,
          color: '#ffffff',
          fontFamily: 'Instrument Sans',
        },
        children: [
          {
            type: 'div',
            props: {
              style: { display: 'flex', alignItems: 'center', gap: '18px' },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      width: '56px',
                      height: '56px',
                      borderRadius: '16px',
                      background: destaque,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '30px',
                      fontWeight: 700,
                    },
                    children: 'F',
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
                opacity: 0.65,
              },
              children: [
                { type: 'div', props: { children: 'flowizehub.com' } },
                {
                  type: 'div',
                  props: {
                    style: {
                      padding: '10px 22px',
                      borderRadius: '999px',
                      background: destaque,
                      color: '#ffffff',
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
