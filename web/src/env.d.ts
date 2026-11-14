/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_UMAMI_WEBSITE_ID?: string;
  /** Lista de domínios separada por vírgula onde o Umami deve contar visitas. */
  readonly PUBLIC_UMAMI_DOMAINS?: string;
  readonly PUBLIC_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
