export const money = (valor: number) =>
  Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const escapeMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export const esc = (valor: unknown) =>
  String(valor ?? '').replace(/[&<>"']/g, (c) => escapeMap[c] ?? c);

/** JSON seguro para ir dentro de uma tag <script>. */
export function safeJson(valor: unknown): string {
  return JSON.stringify(valor)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function estaAberto(
  horario?: { abre: string; fecha: string } | null,
): boolean | null {
  if (!horario) return null;
  const [abre, fecha] = [horario.abre, horario.fecha].map((t) => {
    const [h, m] = t.split(':');
    return Number(h) * 60 + Number(m);
  });
  const agora = new Date();
  const minutos = agora.getHours() * 60 + agora.getMinutes();
  return abre <= fecha
    ? minutos >= abre && minutos < fecha
    : minutos >= abre || minutos < fecha;
}
