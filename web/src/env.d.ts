/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_UMAMI_WEBSITE_ID?: string;
  readonly PUBLIC_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
