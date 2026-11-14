import { useState, type ChangeEvent } from 'react';
import { enviarFoto } from '../lib/db';
import type { Categoria, Item } from '../lib/schema';
import type { Pacote } from '../lib/types';

interface Props {
  categorias: Categoria[];
  slug: string;
  pacote: Pacote;
  onChange: (categorias: Categoria[]) => void;
}

const TIPOS_ARTE = [
  { valor: 'pizza', rotulo: 'Pizza' },
  { valor: 'doce', rotulo: 'Doce' },
  { valor: 'lata', rotulo: 'Lata' },
  { valor: 'copo', rotulo: 'Copo / vidro' },
];

function copiar(categorias: Categoria[]): Categoria[] {
  return structuredClone(categorias);
}

export default function CardapioEditor({ categorias, slug, pacote, onChange }: Props) {
  const [enviando, setEnviando] = useState('');
  const [erro, setErro] = useState('');

  function alterarCategoria(indice: number, mudanca: Partial<Categoria>) {
    const proximas = copiar(categorias);
    proximas[indice] = { ...proximas[indice], ...mudanca };
    onChange(proximas);
  }

  function moverCategoria(indice: number, direcao: -1 | 1) {
    const destino = indice + direcao;
    if (destino < 0 || destino >= categorias.length) return;
    const proximas = copiar(categorias);
    [proximas[indice], proximas[destino]] = [proximas[destino], proximas[indice]];
    onChange(proximas);
  }

  function removerCategoria(indice: number) {
    if (categorias.length <= 1) {
      setErro('O cardápio precisa ter pelo menos uma categoria.');
      return;
    }
    onChange(categorias.filter((_, i) => i !== indice));
  }

  function adicionarCategoria() {
    onChange([
      ...categorias,
      { nome: 'Nova categoria', itens: [{ nome: 'Novo item', preco: 0 }] },
    ]);
  }

  function alterarItem(ci: number, ii: number, mudanca: Partial<Item>) {
    const proximas = copiar(categorias);
    proximas[ci].itens[ii] = { ...proximas[ci].itens[ii], ...mudanca };
    onChange(proximas);
  }

  function moverItem(ci: number, ii: number, direcao: -1 | 1) {
    const destino = ii + direcao;
    const itens = categorias[ci].itens;
    if (destino < 0 || destino >= itens.length) return;
    const proximas = copiar(categorias);
    [proximas[ci].itens[ii], proximas[ci].itens[destino]] = [
      proximas[ci].itens[destino],
      proximas[ci].itens[ii],
    ];
    onChange(proximas);
  }

  function removerItem(ci: number, ii: number) {
    const proximas = copiar(categorias);
    proximas[ci].itens.splice(ii, 1);
    onChange(proximas);
  }

  function adicionarItem(ci: number) {
    const proximas = copiar(categorias);
    proximas[ci].itens.push({ nome: '', preco: 0 });
    onChange(proximas);
  }

  function definirPreco(ci: number, ii: number, modo: 'unico' | 'opcoes') {
    if (modo === 'unico') {
      alterarItem(ci, ii, { preco: 0, opcoes: undefined });
    } else {
      alterarItem(ci, ii, { preco: undefined, opcoes: [['', 0]] });
    }
  }

  async function subirFoto(ci: number, ii: number, evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!arquivo) return;

    const chave = `${ci}-${ii}`;
    setErro('');
    setEnviando(chave);

    try {
      const url = await enviarFoto(arquivo, slug);
      alterarItem(ci, ii, { foto: url });
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setEnviando('');
    }
  }

  return (
    <div>
      {erro && <div className="aviso aviso-erro">{erro}</div>}

      {categorias.map((categoria, ci) => (
        <section className="categoria" key={ci}>
          <div className="categoria-topo">
            <div className="campo">
              <label htmlFor={`categoria-${ci}`}>Categoria</label>
              <input
                id={`categoria-${ci}`}
                value={categoria.nome}
                onChange={(e) => alterarCategoria(ci, { nome: e.target.value })}
                placeholder="Ex.: Pizzas"
              />
            </div>

            <div className="mini-acoes">
              <button
                type="button"
                title="Mover para cima"
                onClick={() => moverCategoria(ci, -1)}
                disabled={ci === 0}
              >
                ↑
              </button>
              <button
                type="button"
                title="Mover para baixo"
                onClick={() => moverCategoria(ci, 1)}
                disabled={ci === categorias.length - 1}
              >
                ↓
              </button>
              <button
                type="button"
                title="Remover categoria"
                onClick={() => {
                  if (confirm(`Remover a categoria "${categoria.nome}" e seus itens?`)) {
                    removerCategoria(ci);
                  }
                }}
              >
                ×
              </button>
            </div>
          </div>

          {categoria.itens.map((item, ii) => {
            const modo = item.opcoes?.length ? 'opcoes' : 'unico';

            return (
              <article className="item" key={ii}>
                <div className="item-topo">
                  <strong>{item.nome || `Item ${ii + 1}`}</strong>
                  <div className="mini-acoes">
                    <button
                      type="button"
                      title="Mover para cima"
                      onClick={() => moverItem(ci, ii, -1)}
                      disabled={ii === 0}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      title="Mover para baixo"
                      onClick={() => moverItem(ci, ii, 1)}
                      disabled={ii === categoria.itens.length - 1}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      title="Remover item"
                      onClick={() => removerItem(ci, ii)}
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div className="grade">
                  <div className="campo">
                    <label htmlFor={`item-${ci}-${ii}-nome`}>Nome</label>
                    <input
                      id={`item-${ci}-${ii}-nome`}
                      value={item.nome}
                      onChange={(e) => alterarItem(ci, ii, { nome: e.target.value })}
                      placeholder="Ex.: Calabresa"
                    />
                  </div>

                  <div className="campo">
                    <label htmlFor={`item-${ci}-${ii}-desc`}>Descrição</label>
                    <input
                      id={`item-${ci}-${ii}-desc`}
                      value={item.desc ?? ''}
                      onChange={(e) =>
                        alterarItem(ci, ii, { desc: e.target.value || undefined })
                      }
                      placeholder="Ingredientes, tamanho…"
                    />
                  </div>

                  <div className="campo largura-total">
                    <label>Preço</label>
                    <div className="inline">
                      <label className="inline">
                        <input
                          type="radio"
                          name={`preco-${ci}-${ii}`}
                          checked={modo === 'unico'}
                          onChange={() => definirPreco(ci, ii, 'unico')}
                        />
                        Preço único
                      </label>
                      <label className="inline">
                        <input
                          type="radio"
                          name={`preco-${ci}-${ii}`}
                          checked={modo === 'opcoes'}
                          onChange={() => definirPreco(ci, ii, 'opcoes')}
                        />
                        Opções (tamanhos)
                      </label>
                    </div>
                  </div>

                  {modo === 'unico' ? (
                    <div className="campo">
                      <label htmlFor={`item-${ci}-${ii}-preco`}>Valor (R$)</label>
                      <input
                        id={`item-${ci}-${ii}-preco`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.preco ?? 0}
                        onChange={(e) =>
                          alterarItem(ci, ii, { preco: Number(e.target.value) })
                        }
                      />
                    </div>
                  ) : (
                    <div className="campo largura-total">
                      <label>Opções</label>
                      <div className="opcoes">
                        {(item.opcoes ?? []).map(([rotulo, valor], oi) => (
                          <div className="opcao" key={oi}>
                            <input
                              value={rotulo}
                              aria-label={`Nome da opção ${oi + 1}`}
                              placeholder="Ex.: Grande"
                              onChange={(e) => {
                                const opcoes = [...(item.opcoes ?? [])] as [string, number][];
                                opcoes[oi] = [e.target.value, opcoes[oi][1]];
                                alterarItem(ci, ii, { opcoes });
                              }}
                            />
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              aria-label={`Preço da opção ${oi + 1}`}
                              value={valor}
                              onChange={(e) => {
                                const opcoes = [...(item.opcoes ?? [])] as [string, number][];
                                opcoes[oi] = [opcoes[oi][0], Number(e.target.value)];
                                alterarItem(ci, ii, { opcoes });
                              }}
                            />
                            <button
                              className="btn btn-fantasma btn-pequeno"
                              type="button"
                              title="Remover opção"
                              onClick={() => {
                                const opcoes = (item.opcoes ?? []).filter((_, i) => i !== oi);
                                alterarItem(ci, ii, { opcoes });
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button
                          className="btn btn-contorno btn-pequeno"
                          type="button"
                          onClick={() =>
                            alterarItem(ci, ii, {
                              opcoes: [...(item.opcoes ?? []), ['', 0]] as [string, number][],
                            })
                          }
                        >
                          + opção
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="campo largura-total">
                    <label htmlFor={`item-${ci}-${ii}-foto`}>Foto</label>
                    <div className="foto-campo">
                      {item.foto ? (
                        <img className="foto-previa" src={item.foto} alt="" />
                      ) : (
                        <span className="foto-previa" aria-hidden="true" />
                      )}
                      <input
                        id={`item-${ci}-${ii}-foto`}
                        type="text"
                        value={item.foto ?? ''}
                        placeholder="https://…"
                        onChange={(e) =>
                          alterarItem(ci, ii, { foto: e.target.value || undefined })
                        }
                      />
                      <label className="btn btn-contorno btn-pequeno upload">
                        {enviando === `${ci}-${ii}` ? 'Enviando…' : 'Enviar'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => subirFoto(ci, ii, e)}
                          disabled={enviando === `${ci}-${ii}`}
                        />
                      </label>
                    </div>
                    <small>Sem foto, o cardápio mostra a ilustração definida abaixo.</small>
                  </div>

                  {pacote === 'completo' && (
                    <div className="campo largura-total">
                      <label className="inline">
                        <input
                          type="checkbox"
                          checked={Boolean(item.destaque)}
                          onChange={(e) =>
                            alterarItem(ci, ii, { destaque: e.target.checked ? 1 : undefined })
                          }
                        />
                        Mostrar em “Mais pedidos”
                      </label>
                    </div>
                  )}

                  <div className="campo largura-total">
                    <label>Ilustração</label>
                    <div className="grade-3">
                      <div className="campo">
                        <select
                          aria-label="Tipo de ilustração"
                          value={item.arte?.tipo ?? 'pizza'}
                          onChange={(e) =>
                            alterarItem(ci, ii, {
                              arte: {
                                tipo: e.target.value,
                                cores: item.arte?.cores?.length
                                  ? item.arte.cores
                                  : ['#d62828', '#f1c04f'],
                                fundo: item.arte?.fundo,
                              },
                            })
                          }
                        >
                          {TIPOS_ARTE.map((tipo) => (
                            <option key={tipo.valor} value={tipo.valor}>
                              {tipo.rotulo}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="campo">
                        <label>Fundo</label>
                        <div className="cor">
                          <input
                            type="color"
                            aria-label="Cor de fundo"
                            value={item.arte?.fundo ?? '#f3efec'}
                            onChange={(e) =>
                              alterarItem(ci, ii, {
                                arte: {
                                  tipo: item.arte?.tipo ?? 'pizza',
                                  cores: item.arte?.cores ?? ['#d62828', '#f1c04f'],
                                  fundo: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="campo">
                        <label>Cores</label>
                        <div className="cor">
                          {(item.arte?.cores ?? []).map((cor, corIndice) => (
                            <input
                              key={corIndice}
                              type="color"
                              aria-label={`Cor ${corIndice + 1}`}
                              value={cor}
                              onChange={(e) => {
                                const cores = [...(item.arte?.cores ?? [])];
                                cores[corIndice] = e.target.value;
                                alterarItem(ci, ii, {
                                  arte: {
                                    tipo: item.arte?.tipo ?? 'pizza',
                                    cores,
                                    fundo: item.arte?.fundo,
                                  },
                                });
                              }}
                            />
                          ))}
                          <button
                            className="btn btn-contorno btn-pequeno"
                            type="button"
                            onClick={() =>
                              alterarItem(ci, ii, {
                                arte: {
                                  tipo: item.arte?.tipo ?? 'pizza',
                                  cores: [...(item.arte?.cores ?? []), '#ffffff'],
                                  fundo: item.arte?.fundo,
                                },
                              })
                            }
                          >
                            + cor
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          <button
            className="btn btn-contorno btn-pequeno"
            type="button"
            onClick={() => adicionarItem(ci)}
            style={{ marginTop: 12 }}
          >
            + item em {categoria.nome || 'categoria'}
          </button>
        </section>
      ))}

      <button className="btn btn-contorno" type="button" onClick={adicionarCategoria}>
        + nova categoria
      </button>
    </div>
  );
}
