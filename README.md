# Flowize

Cardápios digitais com pedido direto no WhatsApp. A marca vive em
`flowizehub.com` e cada cliente tem uma página em `flowizehub.com/<slug>`.
O painel fica em `admin.flowizehub.com`.

## Estrutura

- `web/` — site em Astro: landing da marca, cardápios, imagens de compartilhamento e QR
- `admin/` — painel React + Vite: clientes, editor de cardápio e publicação
- `supabase/` — migration, seed e Edge Function de publicação
- `web/public/_headers` e `admin/public/_headers` — headers de segurança e cache no Cloudflare Pages
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
- Headers de segurança e cache no Cloudflare Pages
- Redirecionamento de `www.flowizehub.com` para `flowizehub.com` (Redirect Rule na zona)
- WhatsApp, Instagram e e-mail centralizados em `web/src/lib/site.ts`

### Fase 2 — painel e banco (concluída)

- Schema no Supabase: `clients` (dados + cardápio em JSONB validado), `publish_events`, `payments` e `pageviews`
- RLS: só usuário autenticado lê e escreve; o site público não consulta o banco
- Login por e-mail e senha (sem cadastro público)
- CRUD de clientes, busca, filtro por status e sinalização de vencimento
- Editor de cardápio: categorias, itens, preços, opções, fotos e ilustrações
- Botão **Publicar site** via Edge Function + build hook do Cloudflare Pages
- Build do site lê do Supabase quando configurado, com fallback para os JSONs locais
- Modo demonstração no painel, sem Supabase, usando dados no navegador

### Fase 3 — financeiro (concluída)

- Resumo do mês, atrasados e a vencer, com filtros
- Cobrança no WhatsApp com mensagem pronta
- Registro de pagamento (empurra o `paid_until`) e estorno do último pagamento
- Atraso é só sinalização no painel: o cardápio nunca é bloqueado automaticamente

### Fase 4 — analytics (concluída)

- Contador próprio de visitas por cardápio (1 por sessão, sem cookie e sem IP)
- Cards, gráfico de 14 dias e tabela por cliente com variação mensal
- Umami Cloud continua como fonte de detalhe

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
3. Rode as migrations de `supabase/migrations/` no SQL Editor do Supabase
   (financeiro e contador de visitas). São idempotentes.
4. No Cloudflare Pages, crie **dois projetos** do mesmo repositório
   (Workers & Pages → Create → Pages → Connect to Git):
   - site: root `web`, build `npm ci && npm run build`, saída `dist`
   - painel: root `admin`, mesma build, saída `dist`
   Em ambos, defina `NODE_VERSION=22`.
5. Variáveis do site: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_KEY`, `PUBLIC_UMAMI_WEBSITE_ID` e
   `PUBLIC_UMAMI_DOMAINS`. No painel: `VITE_SUPABASE_URL` e
   `VITE_SUPABASE_ANON_KEY`.
6. Crie o **Deploy hook** do site no Cloudflare e salve a URL no segredo
   `BUILD_HOOK` do Supabase.
7. Quando o domínio estiver comprado, adicione `flowizehub.com` e
   `admin.flowizehub.com` como Custom domains.

> Os `netlify.toml` ficaram como legado da hospedagem antiga; podem ser
> apagados depois que os sites do Netlify forem removidos.

## Próximas fases

1. Leads: Google Maps, Instagram e funil
2. Preview com token (`/preview/<slug>?token=...`) para aprovar antes de publicar
3. Domínio próprio por cliente e relatório automatizado
