import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { apagarPagamento, listarClientes, listarPagamentos, registrarPagamento } from '../lib/db';
import { hojeISO, mesDe, nomeDoMes } from '../lib/datas';
import { linkWhatsApp, mensagemCobranca, proximoVencimento, situacao } from '../lib/financeiro';
import { dataCurta, money, numero } from '../lib/format';
import type { Cliente, Pagamento } from '../lib/types';

type Filtro = 'todos' | 'atrasados' | 'a-vencer' | 'em-dia';

const diaVencimento = (cliente: Cliente) =>
  cliente.dia_vencimento ?? (cliente.paid_until ? Number(cliente.paid_until.slice(8, 10)) : 10);

export default function Financeiro() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [recebendo, setRecebendo] = useState<Cliente | null>(null);

  const hoje = hojeISO();
  const mesAtual = mesDe(hoje);

  async function carregar() {
    setErro('');
    try {
      const [listaClientes, listaPagamentos] = await Promise.all([
        listarClientes(),
        listarPagamentos(),
      ]);
      setClientes(listaClientes);
      setPagamentos(listaPagamentos);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  const linhas = useMemo(() => {
    return clientes
      .map((cliente) => ({ cliente, s: situacao(cliente, hoje) }))
      .sort((a, b) => {
        const peso = (t: string) =>
          t === 'atrasado' ? 0 : t === 'vence-hoje' ? 1 : t === 'a-vencer' ? 2 : t === 'em-dia' ? 3 : 4;
        const diferenca = peso(a.s.tipo) - peso(b.s.tipo);
        if (diferenca !== 0) return diferenca;
        return a.cliente.nome.localeCompare(b.cliente.nome, 'pt-BR');
      });
  }, [clientes, hoje]);

  const resumo = useMemo(() => {
    const comCobranca = linhas.filter(({ cliente }) => (cliente.valor_mensal ?? 0) > 0);
    const soma = (lista: typeof linhas) =>
      lista.reduce((total, { cliente }) => total + Number(cliente.valor_mensal ?? 0), 0);

    const atrasados = comCobranca.filter(({ s }) => s.tipo === 'atrasado');
    const aVencer = comCobranca.filter(({ s }) => s.tipo === 'a-vencer' || s.tipo === 'vence-hoje');

    const recebidoNoMes = pagamentos
      .filter((pagamento) => mesDe(pagamento.pago_em) === mesAtual)
      .reduce((total, pagamento) => total + Number(pagamento.valor), 0);

    return {
      mrr: soma(comCobranca.filter(({ cliente }) => cliente.status !== 'inativo')),
      recebidoNoMes,
      atrasado: soma(atrasados),
      atrasados: atrasados.length,
      aVencer: soma(aVencer),
      aVencerQuantidade: aVencer.length,
    };
  }, [linhas, pagamentos, mesAtual]);

  const filtradas = useMemo(() => {
    if (filtro === 'todos') return linhas;
    if (filtro === 'atrasados') return linhas.filter(({ s }) => s.tipo === 'atrasado');
    if (filtro === 'a-vencer')
      return linhas.filter(({ s }) => s.tipo === 'a-vencer' || s.tipo === 'vence-hoje');
    return linhas.filter(({ s }) => s.tipo === 'em-dia');
  }, [linhas, filtro]);

  async function estornar(pagamento: Pagamento) {
    if (!confirm('Estornar este pagamento? O vencimento do cliente volta para a data anterior.')) {
      return;
    }
    setErro('');
    setAviso('');
    try {
      await apagarPagamento(pagamento.id);
      setAviso('Pagamento estornado.');
      await carregar();
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  const recentes = useMemo(() => {
    const vistos = new Set<string>();
    return pagamentos.map((pagamento) => {
      const primeiro = !vistos.has(pagamento.client_id);
      vistos.add(pagamento.client_id);
      return { pagamento, podeEstornar: primeiro };
    });
  }, [pagamentos]);

  const nomeDoCliente = (id: string) =>
    clientes.find((cliente) => cliente.id === id)?.nome ?? 'Cliente removido';

  if (carregando) {
    return <p className="vazio">Carregando financeiro…</p>;
  }

  return (
    <>
      <div className="pagina-topo">
        <div>
          <h1>Financeiro</h1>
          <p>
            {nomeDoMes(mesAtual)} · o atraso aparece só aqui. O cardápio nunca é bloqueado
            automaticamente.
          </p>
        </div>
        <div className="acoes">
          <Link className="btn btn-contorno" to="/clientes">
            Ver clientes
          </Link>
        </div>
      </div>

      {erro && <div className="aviso aviso-erro">{erro}</div>}
      {aviso && <div className="aviso aviso-ok">{aviso}</div>}

      <div className="resumo">
        <div className="resumo-item">
          <span className="resumo-rotulo">Mensalidades ativas</span>
          <strong>{money(resumo.mrr)}</strong>
          <small>por mês, sem os inativos</small>
        </div>
        <div className="resumo-item">
          <span className="resumo-rotulo">Recebido em {nomeDoMes(mesAtual).split(' de ')[0]}</span>
          <strong>{money(resumo.recebidoNoMes)}</strong>
          <small>{pagamentos.filter((p) => mesDe(p.pago_em) === mesAtual).length} pagamento(s)</small>
        </div>
        <div className={`resumo-item ${resumo.atrasados > 0 ? 'resumo-alerta' : ''}`}>
          <span className="resumo-rotulo">Em atraso</span>
          <strong>{money(resumo.atrasado)}</strong>
          <small>
            {resumo.atrasados === 0
              ? 'ninguém atrasado'
              : `${resumo.atrasados} cliente(s)`}
          </small>
        </div>
        <div className="resumo-item">
          <span className="resumo-rotulo">A vencer em 30 dias</span>
          <strong>{money(resumo.aVencer)}</strong>
          <small>{resumo.aVencerQuantidade} cliente(s)</small>
        </div>
      </div>

      <div className="cartao">
        <div className="filtros">
          {(
            [
              ['todos', `Todos (${linhas.length})`],
              ['atrasados', `Atrasados (${resumo.atrasados})`],
              ['a-vencer', `A vencer (${resumo.aVencerQuantidade})`],
              ['em-dia', 'Em dia'],
            ] as Array<[Filtro, string]>
          ).map(([valor, rotulo]) => (
            <button
              key={valor}
              type="button"
              className={`chip ${filtro === valor ? 'chip-ativo' : ''}`}
              onClick={() => setFiltro(valor)}
            >
              {rotulo}
            </button>
          ))}
        </div>

        {filtradas.length === 0 ? (
          <p className="vazio">Nenhum cliente neste filtro.</p>
        ) : (
          <table className="tabela">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Mensalidade</th>
                <th>Pago até</th>
                <th>Situação</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {filtradas.map(({ cliente, s }) => (
                <tr key={cliente.id}>
                  <td data-rotulo="Cliente">
                    <span className="cliente-nome">{cliente.nome}</span>
                    <span className="cliente-slug">/{cliente.slug}</span>
                  </td>
                  <td data-rotulo="Mensalidade">{money(cliente.valor_mensal)}</td>
                  <td data-rotulo="Pago até">{dataCurta(cliente.paid_until)}</td>
                  <td data-rotulo="Situação">
                    <span className={`selo selo-fin-${s.tipo}`}>{s.rotulo}</span>
                  </td>
                  <td>
                    <div className="acoes-linha">
                      {cliente.whatsapp && (
                        <a
                          className="btn btn-fantasma btn-pequeno"
                          href={linkWhatsApp(cliente.whatsapp, mensagemCobranca(cliente, hoje))}
                          target="_blank"
                          rel="noopener"
                          title="Abrir conversa com mensagem pronta"
                        >
                          Cobrar
                        </a>
                      )}
                      <button
                        className="btn btn-contorno btn-pequeno"
                        type="button"
                        onClick={() => setRecebendo(cliente)}
                      >
                        Receber
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="cartao">
        <div className="cartao-topo">
          <div>
            <h2>Últimos pagamentos</h2>
            <p>Registrar um pagamento já empurra o “pago até” do cliente.</p>
          </div>
        </div>

        {recentes.length === 0 ? (
          <p className="vazio">Nenhum pagamento registrado ainda.</p>
        ) : (
          <table className="tabela">
            <thead>
              <tr>
                <th>Data</th>
                <th>Cliente</th>
                <th>Valor</th>
                <th>Referência</th>
                <th>Novo vencimento</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {recentes.map(({ pagamento, podeEstornar }) => (
                <tr key={pagamento.id}>
                  <td data-rotulo="Data">{dataCurta(pagamento.pago_em)}</td>
                  <td data-rotulo="Cliente">{nomeDoCliente(pagamento.client_id)}</td>
                  <td data-rotulo="Valor">{money(Number(pagamento.valor))}</td>
                  <td data-rotulo="Referência">{pagamento.referencia ?? '—'}</td>
                  <td data-rotulo="Novo vencimento">{dataCurta(pagamento.paid_until_novo)}</td>
                  <td>
                    <div className="acoes-linha">
                      {podeEstornar && (
                        <button
                          className="btn btn-fantasma btn-pequeno"
                          type="button"
                          onClick={() => estornar(pagamento)}
                        >
                          Estornar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {recebendo && (
        <FormularioRecebimento
          cliente={recebendo}
          hoje={hoje}
          onFechar={() => setRecebendo(null)}
          onSalvo={async (mensagem) => {
            setRecebendo(null);
            setAviso(mensagem);
            await carregar();
          }}
        />
      )}
    </>
  );
}

function FormularioRecebimento({
  cliente,
  hoje,
  onFechar,
  onSalvo,
}: {
  cliente: Cliente;
  hoje: string;
  onFechar: () => void;
  onSalvo: (mensagem: string) => Promise<void>;
}) {
  const [valor, setValor] = useState(String(cliente.valor_mensal ?? 0));
  const [pagoEm, setPagoEm] = useState(hoje);
  const [referencia, setReferencia] = useState(mesDe(cliente.paid_until ?? hoje));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const novoPaidUntil = proximoVencimento(cliente.paid_until, diaVencimento(cliente), hoje);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const valorNumero = numero(valor);

    if (valorNumero == null || valorNumero < 0) {
      setErro('Informe um valor válido.');
      return;
    }

    setErro('');
    setSalvando(true);
    try {
      await registrarPagamento({
        cliente,
        valor: valorNumero,
        pagoEm,
        referencia,
        novoPaidUntil,
      });

      const depois = situacao({ valor_mensal: valorNumero, paid_until: novoPaidUntil }, hoje);
      const pendencia =
        depois.tipo === 'atrasado'
          ? ` Ainda em atraso: ${depois.dias} dia${depois.dias > 1 ? 's' : ''} — registre outro pagamento se recebeu mais de um mês.`
          : '';

      await onSalvo(
        `Pagamento de ${money(valorNumero)} registrado. Cobertura até ${dataCurta(novoPaidUntil)}.${pendencia}`,
      );
    } catch (e) {
      setErro((e as Error).message);
      setSalvando(false);
    }
  }

  return (
    <div className="modal-fundo" role="presentation" onClick={onFechar}>
      <form
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-receber"
        onClick={(evento) => evento.stopPropagation()}
        onSubmit={enviar}
      >
        <h2 id="titulo-receber">Receber de {cliente.nome}</h2>
        <p className="cliente-slug">
          {cliente.paid_until
            ? `Cobertura atual até ${dataCurta(cliente.paid_until)} · novo vencimento ${dataCurta(novoPaidUntil)}`
            : `Sem pagamento registrado · primeiro vencimento ${dataCurta(novoPaidUntil)}`}
        </p>

        {erro && <div className="aviso aviso-erro">{erro}</div>}

        <div className="grade">
          <div className="campo">
            <label htmlFor="valor">Valor recebido (R$)</label>
            <input
              id="valor"
              type="number"
              min="0"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
          </div>

          <div className="campo">
            <label htmlFor="pago-em">Data do pagamento</label>
            <input
              id="pago-em"
              type="date"
              value={pagoEm}
              onChange={(e) => setPagoEm(e.target.value)}
            />
          </div>

          <div className="campo largura-total">
            <label htmlFor="referencia">Referência (mês)</label>
            <input
              id="referencia"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="2026-11"
            />
            <small>Só para o histórico. Não muda o vencimento.</small>
          </div>
        </div>

        <div className="modal-acoes">
          <button className="btn btn-fantasma" type="button" onClick={onFechar} disabled={salvando}>
            Cancelar
          </button>
          <button className="btn btn-primario" type="submit" disabled={salvando}>
            {salvando ? 'Registrando…' : 'Confirmar recebimento'}
          </button>
        </div>
      </form>
    </div>
  );
}
