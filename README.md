# Flowize

Cardápios digitais com pedido direto no WhatsApp. A marca vive em
`flowizehub.com` e cada cliente tem uma página em `flowizehub.com/<slug>`.

## Estrutura

- `web/` — site em Astro: landing da marca, cardápios, imagens de compartilhamento e QR
- `netlify.toml` — build, redirecionamento `www` e headers de segurança/cache
- `cardapio-final/` — molde original do cardápio, mantido só como referência local

## Fases entregues

### Fase 0 — cardápios por cliente

- Páginas estáticas geradas no build a partir de `web/src/data/clientes/*.json`
- Dois pacotes: `simples` e `completo`
- Status por cliente: `ativo` (indexável), `teste` (`noindex`) e `inativo` (página indisponível)
- SEO: title, description, canonical, Open Graph, Twitter e JSON-LD (`Restaurant`)
- Imagem de compartilhamento por cliente em `/og/<slug>.png` (1200x630)
- QR code por cliente em `/qr/<slug>.svg`
- Sitemap apenas com clientes `ativo`
- Analytics opcional via Umami Cloud (plano Hobby), separado pelo caminho da página

### Fase 1 — landing da marca

- Home com hero, dores/solução, recursos, como funciona, exemplos, pacotes, FAQ e CTA
- Seção de exemplos com capturas reais dos cardápios (`/exemplos/<slug>.png`)
- JSON-LD de `Organization`, `WebSite`, `Service` e `FAQPage`
- Página 404 da marca
- Headers de segurança e cache no Netlify
- Redirecionamento de `www.flowizehub.com` para `flowizehub.com`
- WhatsApp, Instagram e e-mail centralizados em `web/src/lib/site.ts`

## Rodar

```bash
cd web
npm ci --force
npm run dev
```

Abra `http://localhost:4321/` para a landing e
`http://localhost:4321/pizzaria-do-joao` para um cardápio.

## Build

```bash
cd web
npm run build
npm run preview
```

Detalhes de conteúdo, campos do JSON e deploy estão em [`web/README.md`](web/README.md).

## Antes de publicar

Troque o WhatsApp placeholder em `web/src/lib/site.ts`. O build avisa no terminal
enquanto o número de exemplo estiver ativo.

## Próximas fases

1. Painel admin (`admin.flowizehub.com`) com login, CRUD de clientes, editor de itens e “Publicar”
2. Financeiro: vencimento, pagos, atrasados e cobrança no WhatsApp
3. Analytics: dashboard único e snapshots manuais
4. Leads: Google Maps, Instagram e funil
