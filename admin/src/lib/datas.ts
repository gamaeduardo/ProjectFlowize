/** Utilidades de data que não dependem de fuso: tudo em YYYY-MM-DD local. */

export function paraISO(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/** Data de hoje no formato YYYY-MM-DD, no fuso do navegador. */
export function hojeISO(): string {
  return paraISO(new Date());
}

/** Meio-dia local evita o bug de fuso que volta um dia. */
export function comoData(iso: string): Date {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return new Date(ano, mes - 1, dia, 12);
}

/** Diferença em dias: positivo quando `b` é depois de `a`. */
export function diasEntre(a: string, b: string): number {
  return Math.round((comoData(b).getTime() - comoData(a).getTime()) / 86_400_000);
}

/** Soma (ou subtrai) dias de uma data YYYY-MM-DD. */
export function somarDias(iso: string, dias: number): string {
  const data = comoData(iso);
  data.setDate(data.getDate() + dias);
  return paraISO(data);
}

/** Mês no formato YYYY-MM. */
export function mesDe(iso: string): string {
  return iso.slice(0, 7);
}

export function nomeDoMes(mes: string): string {
  const [ano, numero] = mes.split('-').map(Number);
  const data = new Date(ano, numero - 1, 1);
  const nome = data.toLocaleDateString('pt-BR', { month: 'long' });
  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)} de ${ano}`;
}
