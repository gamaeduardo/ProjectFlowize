import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import CardapioEditor from '../components/CardapioEditor';
import SeloStatus from '../components/SeloStatus';
import {
  excluirCliente,
  marcarLeadConvertido,
  obterCliente,
  publicar,
  salvarCliente,
} from '../lib/db';
import { dataHora, numero, slugify } from '../lib/format';
import { menuConfigSchema } from '../lib/schema';
import type { Cliente, ClienteEntrada, Lead, Pacote, Status } from '../lib/types';

type Aba = 'dados' | 'cardapio' | 'financeiro';

const CORES: Array<{ chave: string; rotulo: string; padrao: string }> = [
  { chave: 'destaque', rotulo: 'Destaque', padrao: '#d62828' },
  { chave: 'textoDestaque', rotulo: 'Texto do destaque', padrao: '#ffffff' },
  { chave: 'capa', rotulo: 'Capa (completo)', padrao: '#1c1210' },
  { chave: 'fundo', rotulo: 'Fundo (simples)', padrao: '#ffffff' },
  { chave: 'texto', rotulo: 'Texto (simples)', padrao: '#1d1d1b' },
  { chave: 'superficie', rotulo: 'Superfície (simples)', padrao: '#eef4f0' },
];

function vazio(): ClienteEntrada {
  return {
    slug: '',
    nome: '',
    slogan: null,
    pacote: 'simples',
    status: 'teste',
    whatsapp: '',
    instagram: null,
    endereco: null,
    maps_url: null,
    tempo: null,
    taxa: 0,
    horario: { abre: '18:00', fecha: '23:00' },
    pagamentos: ['Pix', 'Cartão na entrega', 'Dinheiro'],
    cores: { destaque: '#d62828', textoDestaque: '#ffffff' },
    categorias: [{ nome: 'Cardápio', itens: [{ nome: 'Novo item', preco: 0 }] }],
    analytics_website_id: null,
    dia_vencimento: 10,
    valor_mensal: null,
    paid_until: null,
    notas: null,
  };
}

function deCliente(cliente: Cliente): ClienteEntrada {
  const copia = { ...cliente } as Partial<Cliente>;
  delete copia.id;
  delete copia.created_at;
  delete copia.updated_at;
  delete copia.published_at;
  return copia as ClienteEntrada;
}

/** Cliente novo a partir de um lead: aproveita nome, contato e bairro. */
function deLead(lead: Lead): ClienteEntrada {
  return {
    ...vazio(),
    nome: lead.nome,
    slug: slugify(lead.nome),
    whatsapp: lead.telefone ?? '',
    instagram: lead.instagram,
    maps_url: lead.maps_url,
    endereco: lead.bairro,
    notas: lead.notas,
  };
}

export default function ClienteEditor() {
  const { id } = useParams<{ id: string }>();
  const navegar = useNavigate();
  const local = useLocation();
  const novo = !id || id === 'novo';

  const lead = novo ? ((local.state as { lead?: Lead } | null)?.lead ?? null) : null;

  const [dados, setDados] = useState<ClienteEntrada | null>(() =>
    novo ? (lead ? deLead(lead) : vazio()) : null,
  );
  const [clienteId, setClienteId] = useState<string | undefined>(novo ? undefined : id);
  const [publicadoEm, setPublicadoEm] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(!novo);
  const [aba, setAba] = useState<Aba>('dados');
  const [erro, setErro] = useState('');
  const [erros, setErros] = useState<string[]>([]);
  const [aviso, setAviso] = useState('');
  const [sujo, setSujo] = useState(novo);
  const [salvando, setSalvando] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    if (novo || !id) return;
    let ativo = true;

    obterCliente(id)
      .then((cliente) => {
        if (!ativo) return;
        if (!cliente) {
          setErro('Cliente não encontrado.');
          return;
        }
        setDados(deCliente(cliente));
        setPublicadoEm(cliente.published_at);
      })
      .catch((e: Error) => {
        if (ativo) setErro(e.message);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [id, novo]);

  function atualizar(mudanca: Partial<ClienteEntrada>) {
    setDados((atual) => (atual ? { ...atual, ...mudanca } : atual));
    setSujo(true);
    setAviso('');
  }

  async function salvar() {
    if (!dados) return;

    setErro('');
    setErros([]);
    setAviso('');

    const slug = dados.slug.trim().toLowerCase();

    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
      setErros([
        'Link inválido: use apenas letras minúsculas, números e hífen (ex.: pizzaria-do-joao).',
      ]);
      setAba('dados');
      return;
    }

    const validacao = menuConfigSchema.safeParse({
      pacote: dados.pacote,
      status: dados.status,
      nome: dados.nome.trim(),
      slogan: dados.slogan?.trim() || undefined,
      endereco: dados.endereco?.trim() || undefined,
      maps_url: dados.maps_url?.trim() || undefined,
      analytics_website_id: dados.analytics_website_id?.trim() || undefined,
      whatsapp: dados.whatsapp.replace(/\D/g, ''),
      instagram: dados.instagram?.trim() || undefined,
      tempo: dados.tempo?.trim() || undefined,
      taxa: dados.taxa ?? undefined,
      horario: dados.horario ?? undefined,
      pagamentos: dados.pagamentos.filter(Boolean),
      cores: dados.cores,
      categorias: dados.categorias,
    });

    if (!validacao.success) {
      setErros(
        validacao.error.issues.map((problema) => {
          const caminho = problema.path.join('.');
          return caminho ? `${caminho}: ${problema.message}` : problema.message;
        }),
      );
      return;
    }

    setSalvando(true);
    try {
      const salvo = await salvarCliente({ ...dados, slug, id: clienteId });
      setDados(deCliente(salvo));
      setClienteId(salvo.id);
      setPublicadoEm(salvo.published_at);
      setSujo(false);
      setAviso('Cliente salvo.');
      if (!clienteId) {
        if (lead) {
          try {
            await marcarLeadConvertido(lead.id, salvo.id);
          } catch {
            setAviso('Cliente salvo. O lead não foi marcado como cliente — ajuste na aba Leads.');
          }
        }
        navegar(`/clientes/${salvo.id}`, { replace: true });
      }
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  async function aoPublicar() {
    setErro('');
    setAviso('');
    setPublicando(true);
    try {
      setAviso(await publicar());
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setPublicando(false);
    }
  }

  async function aoExcluir() {
    if (!clienteId) return;
    if (!confirm(`Excluir "${dados?.nome}"? Essa ação não pode ser desfeita.`)) return;

    setExcluindo(true);
    try {
      await excluirCliente(clienteId);
      navegar('/clientes', { replace: true });
    } catch (e) {
      setErro((e as Error).message);
      setExcluindo(false);
    }
  }

  if (carregando) {
    return <p className="vazio">Carregando cliente…</p>;
  }

  if (!dados) {
    return (
      <>
        <div className="aviso aviso-erro">{erro || 'Cliente não encontrado.'}</div>
        <Link className="btn btn-contorno" to="/clientes">
          Voltar para clientes
        </Link>
      </>
    );
  }

  return (
    <>
      <div className="barra-editor">
        <div>
          <Link className="voltar" to="/clientes">
            ← Clientes
          </Link>
          <h1 style={{ marginTop: 6 }}>{novo ? 'Novo cliente' : dados.nome || 'Cliente'}</h1>
          <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
            <SeloStatus status={dados.status} />
            <span className="cliente-slug">/{dados.slug || 'sem-link'}</span>
          </div>
        </div>

        <div className="acoes">
          <button
            className="btn btn-contorno"
            type="button"
            onClick={aoPublicar}
            disabled={publicando || sujo}
            title={sujo ? 'Salve antes de publicar' : 'Disparar o build do site'}
          >
            {publicando ? 'Publicando…' : 'Publicar site'}
          </button>
          <button className="btn btn-primario" type="button" onClick={salvar} disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>

      {erro && <div className="aviso aviso-erro">{erro}</div>}
      {aviso && <div className="aviso aviso-ok">{aviso}</div>}
      {erros.length > 0 && (
        <div className="aviso aviso-erro">
          <strong>Confira antes de salvar:</strong>
          <ul>
            {erros.map((mensagem) => (
              <li key={mensagem}>{mensagem}</li>
            ))}
          </ul>
        </div>
      )}

      {lead && (
        <div className="aviso aviso-info">
          Vindo do lead <strong>{lead.nome}</strong>. Ao salvar, ele é marcado como cliente.
        </div>
      )}

      <div className="abas" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={aba === 'dados'}
          onClick={() => setAba('dados')}
        >
          Dados
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={aba === 'cardapio'}
          onClick={() => setAba('cardapio')}
        >
          Cardápio
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={aba === 'financeiro'}
          onClick={() => setAba('financeiro')}
        >
          Financeiro e notas
        </button>
      </div>

      {aba === 'dados' && (
        <div className="cartao">
          <div className="grade">
            <div className="campo">
              <label htmlFor="nome">Nome do negócio</label>
              <input
                id="nome"
                value={dados.nome}
                onChange={(e) => {
                  const nome = e.target.value;
                  atualizar({
                    nome,
                    ...(dados.slug ? {} : { slug: slugify(nome) }),
                  });
                }}
                placeholder="Ex.: Pizzaria do João"
              />
            </div>

            <div className="campo">
              <label htmlFor="slug">Link do cardápio</label>
              <div className="inline">
                <span className="cliente-slug">flowizehub.com/</span>
                <input
                  id="slug"
                  value={dados.slug}
                  onChange={(e) => atualizar({ slug: e.target.value.toLowerCase() })}
                  placeholder="pizzaria-do-joao"
                />
              </div>
            </div>

            <div className="campo largura-total">
              <label htmlFor="slogan">Slogan</label>
              <input
                id="slogan"
                value={dados.slogan ?? ''}
                onChange={(e) => atualizar({ slogan: e.target.value || null })}
                placeholder="Ex.: Forno a lenha de verdade"
              />
            </div>

            <div className="campo">
              <label htmlFor="pacote">Pacote</label>
              <select
                id="pacote"
                value={dados.pacote}
                onChange={(e) => atualizar({ pacote: e.target.value as Pacote })}
              >
                <option value="simples">Simples</option>
                <option value="completo">Completo</option>
              </select>
            </div>

            <div className="campo">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={dados.status}
                onChange={(e) => atualizar({ status: e.target.value as Status })}
              >
                <option value="teste">Teste (noindex, fora do sitemap)</option>
                <option value="ativo">Ativo (indexável)</option>
                <option value="inativo">Inativo (cardápio indisponível)</option>
              </select>
            </div>

            <div className="campo">
              <label htmlFor="whatsapp">WhatsApp (só números, com DDI)</label>
              <input
                id="whatsapp"
                value={dados.whatsapp}
                onChange={(e) => atualizar({ whatsapp: e.target.value })}
                placeholder="5511999999999"
                inputMode="numeric"
              />
            </div>

            <div className="campo">
              <label htmlFor="instagram">Instagram (sem @)</label>
              <input
                id="instagram"
                value={dados.instagram ?? ''}
                onChange={(e) => atualizar({ instagram: e.target.value || null })}
                placeholder="pizzariadojoao"
              />
            </div>

            <div className="campo largura-total">
              <label htmlFor="endereco">Endereço</label>
              <input
                id="endereco"
                value={dados.endereco ?? ''}
                onChange={(e) => atualizar({ endereco: e.target.value || null })}
                placeholder="Rua, número, bairro, cidade"
              />
            </div>

            <div className="campo largura-total">
              <label htmlFor="maps">Link do Google Maps</label>
              <input
                id="maps"
                value={dados.maps_url ?? ''}
                onChange={(e) => atualizar({ maps_url: e.target.value || null })}
                placeholder="https://maps.app.goo.gl/…"
              />
            </div>

            <div className="campo">
              <label htmlFor="tempo">Tempo de entrega</label>
              <input
                id="tempo"
                value={dados.tempo ?? ''}
                onChange={(e) => atualizar({ tempo: e.target.value || null })}
                placeholder="35–45 min"
              />
            </div>

            <div className="campo">
              <label htmlFor="taxa">Taxa de entrega (R$)</label>
              <input
                id="taxa"
                type="number"
                min="0"
                step="0.01"
                value={dados.taxa ?? ''}
                onChange={(e) => atualizar({ taxa: numero(e.target.value) })}
              />
            </div>

            <div className="campo">
              <label htmlFor="abre">Abre às</label>
              <input
                id="abre"
                type="time"
                value={dados.horario?.abre ?? ''}
                onChange={(e) =>
                  atualizar({
                    horario: {
                      abre: e.target.value,
                      fecha: dados.horario?.fecha ?? '',
                    },
                  })
                }
              />
            </div>

            <div className="campo">
              <label htmlFor="fecha">Fecha às</label>
              <input
                id="fecha"
                type="time"
                value={dados.horario?.fecha ?? ''}
                onChange={(e) =>
                  atualizar({
                    horario: {
                      abre: dados.horario?.abre ?? '',
                      fecha: e.target.value,
                    },
                  })
                }
              />
            </div>

            <div className="campo largura-total">
              <label htmlFor="pagamentos">Formas de pagamento (separadas por vírgula)</label>
              <input
                id="pagamentos"
                value={dados.pagamentos.join(', ')}
                onChange={(e) =>
                  atualizar({
                    pagamentos: e.target.value
                      .split(',')
                      .map((item) => item.trim())
                      .filter(Boolean),
                  })
                }
              />
            </div>
          </div>

          <h2 style={{ fontSize: '1rem', margin: '10px 0 14px' }}>Cores</h2>
          <div className="grade-3">
            {CORES.map(({ chave, rotulo, padrao }) => (
              <div className="campo" key={chave}>
                <label htmlFor={`cor-${chave}`}>{rotulo}</label>
                <div className="cor">
                  <input
                    id={`cor-${chave}`}
                    type="color"
                    value={dados.cores[chave] ?? padrao}
                    onChange={(e) =>
                      atualizar({ cores: { ...dados.cores, [chave]: e.target.value } })
                    }
                  />
                  <input
                    type="text"
                    aria-label={`${rotulo} em hexadecimal`}
                    value={dados.cores[chave] ?? padrao}
                    onChange={(e) =>
                      atualizar({ cores: { ...dados.cores, [chave]: e.target.value } })
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {aba === 'cardapio' && (
        <div className="cartao">
          <div className="cartao-topo">
            <div>
              <h2>Categorias e itens</h2>
              <p>O cardápio é validado ao salvar. Itens sem preço nem opções não passam.</p>
            </div>
          </div>

          <CardapioEditor
            categorias={dados.categorias}
            slug={dados.slug}
            pacote={dados.pacote}
            onChange={(categorias) => atualizar({ categorias })}
          />
        </div>
      )}

      {aba === 'financeiro' && (
        <>
          <div className="cartao">
            <div className="cartao-topo">
              <div>
                <h2>Financeiro</h2>
                <p>Atraso aparece só aqui. O cardápio nunca é bloqueado automaticamente.</p>
              </div>
            </div>

            <div className="grade-3">
              <div className="campo">
                <label htmlFor="vencimento">Dia de vencimento</label>
                <input
                  id="vencimento"
                  type="number"
                  min="1"
                  max="31"
                  value={dados.dia_vencimento ?? ''}
                  onChange={(e) => atualizar({ dia_vencimento: numero(e.target.value) })}
                />
              </div>

              <div className="campo">
                <label htmlFor="mensalidade">Mensalidade (R$)</label>
                <input
                  id="mensalidade"
                  type="number"
                  min="0"
                  step="0.01"
                  value={dados.valor_mensal ?? ''}
                  onChange={(e) => atualizar({ valor_mensal: numero(e.target.value) })}
                />
              </div>

              <div className="campo">
                <label htmlFor="pago">Pago até</label>
                <input
                  id="pago"
                  type="date"
                  value={dados.paid_until ?? ''}
                  onChange={(e) => atualizar({ paid_until: e.target.value || null })}
                />
              </div>

              <div className="campo largura-total">
                <label htmlFor="umami">ID do site no Umami (opcional)</label>
                <input
                  id="umami"
                  value={dados.analytics_website_id ?? ''}
                  onChange={(e) => atualizar({ analytics_website_id: e.target.value || null })}
                  placeholder="website-id"
                />
              </div>

              <div className="campo largura-total">
                <label htmlFor="notas">Notas internas</label>
                <textarea
                  id="notas"
                  value={dados.notas ?? ''}
                  onChange={(e) => atualizar({ notas: e.target.value || null })}
                  placeholder="Combinados, histórico de conversa, pendências…"
                />
              </div>
            </div>

            <p className="cliente-slug">
              Última publicação: {publicadoEm ? dataHora(publicadoEm) : 'nunca'}
            </p>
          </div>

          {clienteId && (
            <div className="cartao">
              <div className="cartao-topo">
                <div>
                  <h2>Zona de risco</h2>
                  <p>Excluir remove o cliente do banco. O cardápio sai do site na próxima publicação.</p>
                </div>
                <button
                  className="btn btn-perigo"
                  type="button"
                  onClick={aoExcluir}
                  disabled={excluindo}
                >
                  {excluindo ? 'Excluindo…' : 'Excluir cliente'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <div className="rodape-editor">
        <span className="cliente-slug">
          {sujo ? 'Alterações não salvas' : 'Tudo salvo'}
          {clienteId ? ` · id ${clienteId.slice(0, 8)}` : ''}
        </span>
        <div className="acoes">
          <Link className="btn btn-fantasma" to="/clientes">
            Cancelar
          </Link>
          <button className="btn btn-primario" type="button" onClick={salvar} disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </>
  );
}
