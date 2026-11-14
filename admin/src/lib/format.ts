export const money = (valor: number | null | undefined) =>
  valor == null
    ? '—'
    : Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Datas sem hora (`2026-11-10`) são lidas ao meio-dia local para não voltar um dia. */
function comoData(iso: string): Date {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00`) : new Date(iso);
}

export const dataCurta = (iso: string | null | undefined) => {
  if (!iso) return '—';
  const data = comoData(iso);
  if (Number.isNaN(data.getTime())) return '—';
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const dataHora = (iso: string | null | undefined) => {
  if (!iso) return '—';
  const data = comoData(iso);
  if (Number.isNaN(data.getTime())) return '—';
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function slugify(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export const numero = (valor: string): number | null => {
  if (valor.trim() === '') return null;
  const convertido = Number(valor.replace(',', '.'));
  return Number.isFinite(convertido) ? convertido : null;
};
