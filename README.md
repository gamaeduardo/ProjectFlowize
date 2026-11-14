# Flowize

Cardápios digitais com pedido direto no WhatsApp. Site da marca em
`flowizehub.com` e um cardápio por cliente em `flowizehub.com/<slug>`.

## Estrutura

- `web/` — site em Astro (marca + cardápios + imagens de compartilhamento + QR)
- `netlify.toml` — configuração de deploy
- `cardapio-final/` — molde original do cardápio, mantido só como referência local

## Fase 0 (atual)

- Páginas estáticas por cliente, geradas no build a partir de `web/src/data/clientes/*.json`
- Dois pacotes de cardápio: `simples` e `completo`
- Status por cliente: `ativo` (indexável), `teste` (`noindex`) e `inativo` (página indisponível)
- SEO: title, description, canonical, Open Graph, Twitter e JSON-LD (`Restaurant`)
- Imagem de compartilhamento por cliente em `/og/<slug>.png` (1200x630)
- QR code por cliente em `/qr/<slug>.svg`
- Sitemap apenas com clientes `ativo`
- Analytics opcional via Umami Cloud (plano Hobby), separado pelo caminho da página

## Rodar

```bash
cd web
npm ci --force
npm run dev
```

Abra `http://localhost:4321/pizzaria-do-joao`.

## Build

```bash
cd web
npm run build
npm run preview
```

Detalhes de conteúdo, campos do JSON e deploy estão em [`web/README.md`](web/README.md).

## Próximas fases

1. Landing page da marca
2. Painel admin (`admin.flowizehub.com`) com login, clientes, pagamentos e leads
3. Snapshots de analytics para relatórios no WhatsApp
