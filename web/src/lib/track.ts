/** Envia um evento para o Umami, sem quebrar a página se ele não estiver carregado. */
export function track(evento: string) {
  try {
    const umami = (window as unknown as { umami?: { track: (nome: string) => void } }).umami;
    umami?.track(evento);
  } catch {
    /* analytics é opcional */
  }
}
