// Filtro de robôs usado pelo Umami e pelo contador próprio.
//
// Sem isso, crawler, scanner e automação (que executam JavaScript) entram nas
// visitas e aparecem como "usuários" em países de datacenter. A lista é de
// user-agents conhecidos — não é infalível, mas corta o grosso do ruído.
//
// Cuidado ao editar: NÃO inclua `whatsapp`, `instagram` ou `facebook` soltos.
// Os navegadores internos desses apps são usados por gente de verdade no Brasil.
export const BOT_UA =
  'googlebot|bingbot|yandex|baiduspider|duckduckbot|slurp|ahrefs|semrush|mj12|dotbot|' +
  'petalbot|bytespider|gptbot|ccbot|claudebot|perplexity|applebot|facebookexternalhit|' +
  'google-inspectiontool|adsbot|mediapartners|feedfetcher|crawler|headless|lighthouse|' +
  'pingdom|uptime|phantomjs|selenium|puppeteer|playwright';
