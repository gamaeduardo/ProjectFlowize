# Flowize — web

Site da marca (`/`) e cardápios dos clientes (`/<slug>`), em Astro.

## Desenvolvimento

```bash
npm install
npm run dev
```

Abra `http://localhost:4321/pizzaria-do-joao` ou `http://localhost:4321/lanchonete-da-ana`.

## Build

```bash
npm run build
npm run preview
```

O build gera páginas estáticas em `dist/`, além de:

- `/og/<slug>.png` — imagem de compartilhamento de cada cardápio
- `/og-default.png` — imagem padrão da marca
- `/qr/<slug>.svg` — QR code do cardápio
- `/sitemap.xml` — só clientes com status `ativo`

## Adicionar um cliente

1. Crie `src/data/clientes/<slug>.json` (sem acento, minúsculo, com hífen).
2. Use `pizzaria-do-joao.json` (pacote completo) ou `lanchonete-da-ana.json` (simples) como base.
3. Rode `npm run build`. Se o JSON estiver inválido, o build falha com a lista de erros.

Campos principais:

- `pacote`: `simples` ou `completo`.
- `status`: `ativo` (indexável), `teste` (gerado com `noindex`) ou `inativo` (página indisponível).
- `whatsapp`: só dígitos, com DDI. Ex.: `5511999999999`.
- `opcoes`: `[["Média", 38], ["Grande", 48]]` ou `preco` para preço único.
- `foto`: caminho da imagem. Sem foto, o pacote completo usa a ilustração de `arte`.
- `destaque: 1`: coloca o item em "Mais pedidos".

## Analytics (Umami Cloud — plano Hobby)

1. Crie um website no Umami Cloud apontando para `flowizehub.com`.
2. Copie o `website-id` para `PUBLIC_UMAMI_WEBSITE_ID`.
3. Como o Hobby tem 1 site só, a separação por cliente é feita pelo **caminho da página**.
4. O evento `Pedido iniciado` é enviado **sem propriedades** (cada propriedade conta como evento na cota).

## Variáveis de ambiente

Copie `.env.example` para `.env`:

```
PUBLIC_SITE_URL=https://flowizehub.com
PUBLIC_UMAMI_WEBSITE_ID=
```

## Deploy

Netlify com `base = web`, `publish = dist` (ver `netlify.toml` na raiz).
