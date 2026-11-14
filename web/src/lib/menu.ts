import type { Item, MenuConfig } from './schema';

export type ItemPedido = { nome: string; op: string; preco: number };
export type Opcao = { id: number; nome: string; preco: number };
export type ItemComOpcoes = Item & { ops: Opcao[]; i: number };

function opcoesDoItem(item: Item): Array<[string, number]> {
  return item.opcoes ?? [['', item.preco ?? 0]];
}

/** Normaliza o pacote completo: uma lista plana de opções pedíveis + itens por índice. */
export function normalizarCompleto(cfg: MenuConfig) {
  const itens: ItemPedido[] = [];
  const todos: ItemComOpcoes[] = [];

  const categorias = cfg.categorias.map((categoria) => ({
    nome: categoria.nome,
    itens: categoria.itens.map((item) => {
      const ops: Opcao[] = opcoesDoItem(item).map(([nome, preco]) => {
        const id = itens.push({ nome: item.nome, op: nome, preco }) - 1;
        return { id, nome, preco };
      });
      const normalizado: ItemComOpcoes = { ...item, ops, i: todos.length };
      todos.push(normalizado);
      return normalizado;
    }),
  }));

  return { itens, todos, categorias };
}

/** Normaliza o pacote simples: categorias com itens e opções pedíveis. */
export function normalizarSimples(cfg: MenuConfig) {
  const itens: ItemPedido[] = [];

  const categorias = cfg.categorias.map((categoria) => ({
    nome: categoria.nome,
    itens: categoria.itens.map((item) => {
      const ops: Opcao[] = opcoesDoItem(item).map(([nome, preco]) => {
        const id = itens.push({ nome: item.nome, op: nome, preco }) - 1;
        return { id, nome, preco };
      });
      return { ...item, ops };
    }),
  }));

  return { itens, categorias };
}
