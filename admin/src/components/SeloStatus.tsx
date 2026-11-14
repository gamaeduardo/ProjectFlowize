import type { Status } from '../lib/types';

const rotulos: Record<Status, string> = {
  ativo: 'Ativo',
  teste: 'Teste',
  inativo: 'Inativo',
};

export default function SeloStatus({ status }: { status: Status }) {
  return <span className={`selo selo-${status}`}>{rotulos[status]}</span>;
}
