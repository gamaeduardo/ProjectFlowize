# Flowize — web

Site da marca (`/`) e cardápios dos clientes (`/<slug>`), em Astro.

## Conteúdo da marca

O nome, WhatsApp, Instagram e e-mail usados na landing e nos CTAs ficam em
`src/lib/site.ts`. **Troque o WhatsApp placeholder antes de publicar** — o build
avisa no terminal enquanto ele estiver com o número de exemplo.

## Desenvolvimento

```bash
npm ci
npm run dev
```

O compilador do Astro é instalado também na versão WASM
(`@astrojs/compiler-binding-wasm32-wasi`), declarada para `cpu: wasm32`. Em
máquinas x64 o npm recusaria esse pacote com `EBADPLATFORM`, então o
`.npmrc` do projeto define `force=true` — vale para `npm ci`, `npm install` e
para o install automático do Netlify. Os scripts `npm run dev` e
`npm run build` carregam o loader que troca o binding nativo pelo WASM —
necessário em CPUs x64 sem AVX2, onde o binding nativo morre com `SIGILL`.

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
- `/exemplos/<slug>.png` — capturas reais usadas na seção de exemplos da landing
- `/sitemap.xml` — só clientes com status `ativo`
- `/404.html` — página de erro da marca

As capturas em `public/exemplos/` são manuais: se mudar os cardápios de
demonstração, refaça os prints com o site rodando.

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

O script só conta visitas nos hostnames de `PUBLIC_UMAMI_DOMAINS` (lista separada
por vírgula, comparada com `location.hostname`). Padrão:
`flowizehub.com,www.flowizehub.com`. Para testar antes do domínio, inclua o
subdomínio do Netlify:

```
PUBLIC_UMAMI_DOMAINS=flowizehub.com,www.flowizehub.com,flowizehub.netlify.app
```

## Variáveis de ambiente

Copie `.env.example` para `.env`:

```
PUBLIC_SITE_URL=https://flowizehub.com
PUBLIC_UMAMI_WEBSITE_ID=
PUBLIC_UMAMI_DOMAINS=
```

### Dados do Supabase no build

Para o site sair do Supabase em vez dos JSONs locais, defina **no Netlify**
(Environment variables):

```
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

Sem o prefixo `PUBLIC_`, essas variáveis existem só durante o build e não vão
para o navegador. Sem elas, o build usa `src/data/clientes/*.json` — útil para
desenvolver e como fallback. Os dois caminhos passam pelo mesmo schema Zod: um
cliente inválido quebra o build.

## Deploy (Netlify)

O `netlify.toml` da raiz já define `base = web`, `publish = dist` e
`command = "npm ci && npm run build"`.

1. Suba o repositório no GitHub.
2. No Netlify: **Add new site → Import an existing project** e escolha o repositório.
3. Confirme as configurações de build (elas vêm do `netlify.toml`).
4. Em **Domain management**, adicione `flowizehub.com` e `www.flowizehub.com`.
5. No registrador do domínio, crie os registros que o Netlify indicar
   (normalmente um `A` para o domínio raiz e um `CNAME` para `www`).
6. Ative o HTTPS automático (Let's Encrypt) no Netlify.
7. Em **Site configuration → Environment variables**, preencha
   `PUBLIC_UMAMI_WEBSITE_ID` quando o Umami estiver configurado.

O redirecionamento de `www.flowizehub.com` para `flowizehub.com` já está no
`netlify.toml`, junto com os headers de segurança e cache.
