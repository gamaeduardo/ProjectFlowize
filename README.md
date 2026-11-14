# Flowize

Cardápios digitais com pedido direto no WhatsApp. A marca vive em
`flowizehub.com` e cada cliente tem uma página em `flowizehub.com/<slug>`.
O painel fica em `admin.flowizehub.com`.

## Estrutura

- `web/` — site em Astro: landing da marca, cardápios, imagens de compartilhamento e QR
- `admin/` — painel React + Vite: clientes, editor de cardápio e publicação
- `supabase/` — migration, seed e Edge Function de publicação
- `netlify.toml` — build do site, redirecionamento `www` e headers
- `cardapio-final/` — molde original do cardápio, mantido só como referência local

## Fases entregues

### Fase 0 — cardápios por cliente

- Páginas estáticas geradas no build a partir de `web/src/data/clientes/*.json` ou do Supabase
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

### Fase 2 — painel e banco (em andamento)

- Schema no Supabase: `clients` (dados + cardápio em JSONB validado), `publish_events` e bucket `fotos`
- RLS: só usuário autenticado lê e escreve; o site público não consulta o banco
- Login por e-mail e senha (sem cadastro público)
- CRUD de clientes, busca, filtro por status e sinalização de vencimento
- Editor de cardápio: categorias, itens, preços, opções, fotos e ilustrações
- Botão **Publicar site** via Edge Function + build hook do Netlify
- Build do site lê do Supabase quando configurado, com fallback para os JSONs locais
- Modo demonstração no painel, sem Supabase, usando dados no navegador

## Rodar

```bash
# site
cd web
npm ci
npm run dev

# painel (outro terminal)
cd admin
npm ci
cp .env.example .env   # opcional: sem isso abre em modo demonstração
npm run dev
```

Abra `http://localhost:4321/` para a landing, `http://localhost:4321/pizzaria-do-joao`
para um cardápio e `http://localhost:5174` para o painel.

## Build

```bash
cd web && npm run build && npm run preview
cd admin && npm run build && npm run preview
```

Detalhes do site em [`web/README.md`](web/README.md) e do painel em
[`admin/README.md`](admin/README.md).

## Antes de publicar

1. Troque o WhatsApp placeholder em `web/src/lib/site.ts`. O build avisa no
   terminal enquanto o número de exemplo estiver ativo.
2. Configure o Supabase e a Edge Function `publish` (passo a passo em
   `admin/README.md`).
3. Crie o segundo site no Netlify para o painel, com **Base directory** `admin`
   e o domínio `admin.flowizehub.com`.

## Próximas fases

1. Financeiro: painel de atrasados e cobrança no WhatsApp
2. Analytics: dashboard único e snapshots manuais
3. Leads: Google Maps, Instagram e funil
4. Preview com token (`/preview/<slug>?token=...`) para aprovar antes de publicar
