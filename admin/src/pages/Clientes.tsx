import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SeloStatus from '../components/SeloStatus';
import { listarClientes, publicar, ultimaPublicacao } from '../lib/db';
import { dataHora, money } from '../lib/format';
import type { Cliente, EventoPublicacao } from '../lib/types';

const SITE = 'https://flowizehub.com';

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'ativo' | 'teste' | 'inativo'>('todos');
  const [publicando, setPublicando] = useState(false);
  const [ultima, setUltima] = useState<EventoPublicacao | null>(null);

  useEffect(() => {
    let ativo = true;

    listarClientes()
      .then((lista) => {
        if (ativo) setClientes(lista);
      })
      .catch((e: Error) => {
        if (ativo) setErro(e.message);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    ultimaPublicacao().then((evento) => {
      if (ativo) setUltima(evento);
    });

    return () => {
      ativo = false;
    };
  }, []);

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return clientes.filter((cliente) => {
      const casaBusca =
        !termo ||
        cliente.nome.toLowerCase().includes(termo) ||
        cliente.slug.toLowerCase().includes(termo);
      const casaStatus = filtro === 'todos' || cliente.status === filtro;
      return casaBusca && casaStatus;
    });
  }, [clientes, busca, filtro]);

  async function aoPublicar() {
    setErro('');
    setAviso('');
    setPublicando(true);
    try {
      setAviso(await publicar());
      setUltima(await ultimaPublicacao());
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setPublicando(false);
    }
  }

  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <>
      <div className="pagina-topo">
        <div>
          <h1>Clientes</h1>
          <p>
            {clientes.length} cadastrado(s)
            {ultima ? ` · última publicação ${dataHora(ultima.created_at)}` : ''}
          </p>
        </div>
        <div className="acoes">
          <button
            className="btn btn-contorno"
            type="button"
            onClick={aoPublicar}
            disabled={publicando}
          >
            {publicando ? 'Publicando…' : 'Publicar site'}
          </button>
          <Link className="btn btn-primario" to="/clientes/novo">
            Novo cliente
          </Link>
        </div>
      </div>

      {erro && <div className="aviso aviso-erro">{erro}</div>}
      {aviso && <div className="aviso aviso-ok">{aviso}</div>}

      <div className="cartao">
        <div className="filtros">
          <div className="campo campo-busca">
            <input
              type="search"
              placeholder="Buscar por nome ou link…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              aria-label="Buscar clientes"
            />
          </div>
          <div className="campo">
            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value as typeof filtro)}
              aria-label="Filtrar por status"
            >
              <option value="todos">Todos os status</option>
              <option value="ativo">Ativos</option>
              <option value="teste">Em teste</option>
              <option value="inativo">Inativos</option>
            </select>
          </div>
        </div>

        {carregando ? (
          <p className="vazio">Carregando clientes…</p>
        ) : lista.length === 0 ? (
          <p className="vazio">
            {clientes.length === 0
              ? 'Nenhum cliente ainda. Cadastre o primeiro.'
              : 'Nenhum cliente encontrado com esses filtros.'}
          </p>
        ) : (
          <table className="tabela">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Pacote</th>
                <th>Status</th>
                <th>Mensalidade</th>
                <th>Pago até</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {lista.map((cliente) => {
                const atrasado =
                  cliente.paid_until != null && cliente.paid_until < hoje && cliente.valor_mensal != null;

                return (
                  <tr key={cliente.id}>
                    <td>
                      <span className="cliente-nome">{cliente.nome}</span>
                      <span className="cliente-slug">/{cliente.slug}</span>
                    </td>
                    <td data-rotulo="Pacote">
                      {cliente.pacote === 'completo' ? 'Completo' : 'Simples'}
                    </td>
                    <td data-rotulo="Status">
                      <SeloStatus status={cliente.status} />
                    </td>
                    <td data-rotulo="Mensalidade">{money(cliente.valor_mensal)}</td>
                    <td data-rotulo="Pago até">
                      {cliente.paid_until ? (
                        <span className={atrasado ? 'selo selo-inativo selo-neutro' : ''}>
                          {new Date(`${cliente.paid_until}T12:00:00`).toLocaleDateString('pt-BR')}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <div className="acoes-linha">
                        <a
                          className="btn btn-fantasma btn-pequeno"
                          href={`${SITE}/${cliente.slug}`}
                          target="_blank"
                          rel="noopener"
                        >
                          Abrir ↗
                        </a>
                        <Link className="btn btn-contorno btn-pequeno" to={`/clientes/${cliente.id}`}>
                          Editar
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
