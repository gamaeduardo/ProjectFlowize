import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { excluirLead, listarLeads, salvarLead } from '../lib/db';
import { hojeISO, somarDias } from '../lib/datas';
import { linkWhatsApp } from '../lib/financeiro';
import { dataCurta } from '../lib/format';
import type { EtapaLead, Lead, LeadEntrada, OrigemLead } from '../lib/types';

const ETAPAS: Array<{ valor: EtapaLead; rotulo: string }> = [
  { valor: 'novo', rotulo: 'Novo' },
  { valor: 'contatado', rotulo: 'Contatado' },
  { valor: 'negociando', rotulo: 'Negociando' },
  { valor: 'cliente', rotulo: 'Cliente' },
  { valor: 'perdido', rotulo: 'Perdido' },
];

const ORIGENS: Array<{ valor: OrigemLead; rotulo: string }> = [
  { valor: 'maps', rotulo: 'Google Maps' },
  { valor: 'instagram', rotulo: 'Instagram' },
  { valor: 'indicacao', rotulo: 'Indicação' },
  { valor: 'whatsapp', rotulo: 'WhatsApp' },
  { valor: 'outro', rotulo: 'Outro' },
];

/** Ordem de trabalho: quem está mais perto de fechar aparece primeiro. */
const PESO: Record<EtapaLead, number> = {
  negociando: 0,
  contatado: 1,
  novo: 2,
  cliente: 3,
  perdido: 4,
};

const rotuloOrigem = (origem: OrigemLead) =>
  ORIGENS.find((item) => item.valor === origem)?.rotulo ?? origem;

const entradaDe = (lead: Lead): LeadEntrada => ({
  nome: lead.nome,
  telefone: lead.telefone,
  instagram: lead.instagram,
  maps_url: lead.maps_url,
  bairro: lead.bairro,
  origem: lead.origem,
  etapa: lead.etapa,
  proximo_followup: lead.proximo_followup,
  notas: lead.notas,
  client_id: lead.client_id,
});

function mensagemAbordagem(lead: Lead): string {
  const primeiro = lead.nome.split(' ')[0];
  return (
    `Olá, ${primeiro}! Tudo bem? Vi o ${lead.nome} e queria te mostrar uma ideia rápida: ` +
    'um cardápio digital com pedido direto no seu WhatsApp, sem comissão de marketplace. ' +
    'Posso te mandar um exemplo de 30 segundos?'
  );
}

export default function Leads() {
  const navegar = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<'todos' | EtapaLead>('todos');
  const [editando, setEditando] = useState<Lead | null>(null);
  const [criando, setCriando] = useState(false);

  const hoje = hojeISO();

  async function carregar() {
    setErro('');
    try {
      setLeads(await listarLeads());
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  const resumo = useMemo(() => {
    const ativos = leads.filter(
      (lead) => lead.etapa === 'novo' || lead.etapa === 'contatado' || lead.etapa === 'negociando',
    );
    const atrasados = ativos.filter(
      (lead) => lead.proximo_followup != null && lead.proximo_followup < hoje,
    );

    return {
      noFunil: ativos.length,
      atrasados: atrasados.length,
      negociando: leads.filter((lead) => lead.etapa === 'negociando').length,
      clientes: leads.filter((lead) => lead.etapa === 'cliente').length,
    };
  }, [leads, hoje]);

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return leads
      .filter((lead) => {
        const casaBusca =
          !termo ||
          lead.nome.toLowerCase().includes(termo) ||
          (lead.bairro ?? '').toLowerCase().includes(termo) ||
          (lead.instagram ?? '').toLowerCase().includes(termo) ||
          (lead.telefone ?? '').includes(termo.replace(/\D/g, ''));
        const casaEtapa = filtro === 'todos' || lead.etapa === filtro;
        return casaBusca && casaEtapa;
      })
      .sort((a, b) => {
        const diferenca = PESO[a.etapa] - PESO[b.etapa];
        if (diferenca !== 0) return diferenca;

        const fa = a.proximo_followup ?? '9999-12-31';
        const fb = b.proximo_followup ?? '9999-12-31';
        if (fa !== fb) return fa < fb ? -1 : 1;

        return a.nome.localeCompare(b.nome, 'pt-BR');
      });
  }, [leads, busca, filtro]);

  async function mudarEtapa(lead: Lead, etapa: EtapaLead) {
    setErro('');
    setAviso('');
    try {
      const salvo = await salvarLead({ ...entradaDe(lead), etapa, id: lead.id });
      setLeads((atual) => atual.map((item) => (item.id === salvo.id ? salvo : item)));
      setAviso(`${lead.nome} agora está em “${ETAPAS.find((e) => e.valor === etapa)?.rotulo}”.`);
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  async function remover(lead: Lead) {
    if (!confirm(`Excluir o lead "${lead.nome}"?`)) return;
    setErro('');
    setAviso('');
    try {
      await excluirLead(lead.id);
      setLeads((atual) => atual.filter((item) => item.id !== lead.id));
      setAviso('Lead excluído.');
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  function virarCliente(lead: Lead) {
    navegar('/clientes/novo', { state: { lead } });
  }

  return (
    <>
      <div className="pagina-topo">
        <div>
          <h1>Leads</h1>
          <p>
            {resumo.noFunil} no funil · {resumo.atrasados} follow-up(s) atrasado(s)
          </p>
        </div>
        <div className="acoes">
          <button className="btn btn-primario" type="button" onClick={() => setCriando(true)}>
            Novo lead
          </button>
        </div>
      </div>

      {erro && <div className="aviso aviso-erro">{erro}</div>}
      {aviso && <div className="aviso aviso-ok">{aviso}</div>}

      <div className="resumo">
        <div className="resumo-item">
          <span className="resumo-rotulo">No funil</span>
          <strong>{resumo.noFunil}</strong>
          <small>novo, contatado ou negociando</small>
        </div>
        <div className={`resumo-item ${resumo.atrasados > 0 ? 'resumo-alerta' : ''}`}>
          <span className="resumo-rotulo">Follow-up atrasado</span>
          <strong>{resumo.atrasados}</strong>
          <small>chamar hoje</small>
        </div>
        <div className="resumo-item">
          <span className="resumo-rotulo">Negociando</span>
          <strong>{resumo.negociando}</strong>
          <small>perto de fechar</small>
        </div>
        <div className="resumo-item">
          <span className="resumo-rotulo">Viraram cliente</span>
          <strong>{resumo.clientes}</strong>
          <small>fim do funil</small>
        </div>
      </div>

      <div className="cartao">
        <div className="filtros">
          <div className="campo campo-busca">
            <input
              type="search"
              placeholder="Buscar por nome, bairro, @ ou telefone…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              aria-label="Buscar leads"
            />
          </div>
          <div className="chips">
            <button
              type="button"
              className={`chip ${filtro === 'todos' ? 'chip-ativo' : ''}`}
              onClick={() => setFiltro('todos')}
            >
              Todos
            </button>
            {ETAPAS.map((etapa) => (
              <button
                key={etapa.valor}
                type="button"
                className={`chip ${filtro === etapa.valor ? 'chip-ativo' : ''}`}
                onClick={() => setFiltro(etapa.valor)}
              >
                {etapa.rotulo}
              </button>
            ))}
          </div>
        </div>

        {carregando ? (
          <p className="vazio">Carregando leads…</p>
        ) : lista.length === 0 ? (
          <p className="vazio">
            {leads.length === 0
              ? 'Nenhum lead ainda. Cadastre o primeiro negócio que você quer prospectar.'
              : 'Nenhum lead encontrado com esses filtros.'}
          </p>
        ) : (
          <table className="tabela">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Contato</th>
                <th>Etapa</th>
                <th>Follow-up</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {lista.map((lead) => {
                const atrasado =
                  lead.proximo_followup != null &&
                  lead.proximo_followup < hoje &&
                  lead.etapa !== 'cliente' &&
                  lead.etapa !== 'perdido';

                return (
                  <tr key={lead.id}>
                    <td>
                      <span className="cliente-nome">{lead.nome}</span>
                      <span className="cliente-slug">
                        {[lead.bairro, rotuloOrigem(lead.origem)].filter(Boolean).join(' · ')}
                      </span>
                    </td>
                    <td data-rotulo="Contato">
                      <div className="lead-contato">
                        {lead.telefone && (
                          <a
                            href={linkWhatsApp(lead.telefone, mensagemAbordagem(lead))}
                            target="_blank"
                            rel="noopener"
                          >
                            WhatsApp ↗
                          </a>
                        )}
                        {lead.instagram && (
                          <a
                            href={`https://instagram.com/${lead.instagram}`}
                            target="_blank"
                            rel="noopener"
                          >
                            @{lead.instagram} ↗
                          </a>
                        )}
                        {lead.maps_url && (
                          <a href={lead.maps_url} target="_blank" rel="noopener">
                            Maps ↗
                          </a>
                        )}
                        {!lead.telefone && !lead.instagram && !lead.maps_url && (
                          <span className="cliente-slug">sem contato</span>
                        )}
                      </div>
                    </td>
                    <td data-rotulo="Etapa">
                      <select
                        className="etapa"
                        value={lead.etapa}
                        onChange={(e) => void mudarEtapa(lead, e.target.value as EtapaLead)}
                        aria-label={`Etapa de ${lead.nome}`}
                      >
                        {ETAPAS.map((etapa) => (
                          <option key={etapa.valor} value={etapa.valor}>
                            {etapa.rotulo}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td data-rotulo="Follow-up">
                      <span className={atrasado ? 'followup-atrasado' : ''}>
                        {lead.proximo_followup ? dataCurta(lead.proximo_followup) : '—'}
                        {atrasado ? ' · atrasado' : ''}
                      </span>
                    </td>
                    <td>
                      <div className="acoes-linha">
                        {lead.client_id && (
                          <Link
                            className="btn btn-fantasma btn-pequeno"
                            to={`/clientes/${lead.client_id}`}
                          >
                            Ver cardápio
                          </Link>
                        )}
                        {!lead.client_id && (
                          <button
                            className="btn btn-fantasma btn-pequeno"
                            type="button"
                            onClick={() => virarCliente(lead)}
                          >
                            Virar cliente
                          </button>
                        )}
                        <button
                          className="btn btn-contorno btn-pequeno"
                          type="button"
                          onClick={() => setEditando(lead)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn-fantasma btn-pequeno"
                          type="button"
                          onClick={() => void remover(lead)}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {(criando || editando) && (
        <FormularioLead
          lead={editando}
          onFechar={() => {
            setCriando(false);
            setEditando(null);
          }}
          onSalvo={async (mensagem) => {
            setCriando(false);
            setEditando(null);
            setAviso(mensagem);
            await carregar();
          }}
        />
      )}
    </>
  );
}

function FormularioLead({
  lead,
  onFechar,
  onSalvo,
}: {
  lead: Lead | null;
  onFechar: () => void;
  onSalvo: (mensagem: string) => Promise<void>;
}) {
  const hoje = hojeISO();
  const [dados, setDados] = useState<LeadEntrada>(() =>
    lead
      ? entradaDe(lead)
      : {
          nome: '',
          telefone: null,
          instagram: null,
          maps_url: null,
          bairro: null,
          origem: 'maps',
          etapa: 'novo',
          proximo_followup: somarDias(hoje, 3),
          notas: null,
          client_id: null,
        },
  );
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  function atualizar(mudanca: Partial<LeadEntrada>) {
    setDados((atual) => ({ ...atual, ...mudanca }));
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();

    if (dados.nome.trim().length < 2) {
      setErro('Informe o nome do negócio.');
      return;
    }

    const telefone = dados.telefone?.replace(/\D/g, '') ?? '';
    if (telefone && (telefone.length < 10 || telefone.length > 15)) {
      setErro('Telefone inválido: use DDI + DDD + número, só dígitos.');
      return;
    }

    setErro('');
    setSalvando(true);
    try {
      await salvarLead({ ...dados, id: lead?.id });
      await onSalvo(lead ? 'Lead atualizado.' : 'Lead cadastrado.');
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
        aria-labelledby="titulo-lead"
        onClick={(evento) => evento.stopPropagation()}
        onSubmit={enviar}
      >
        <h2 id="titulo-lead">{lead ? 'Editar lead' : 'Novo lead'}</h2>
        <p className="cliente-slug">
          Nome do negócio, contato e a próxima data de conversa. O resto é opcional.
        </p>

        {erro && <div className="aviso aviso-erro">{erro}</div>}

        <div className="grade">
          <div className="campo largura-total">
            <label htmlFor="lead-nome">Nome do negócio</label>
            <input
              id="lead-nome"
              value={dados.nome}
              onChange={(e) => atualizar({ nome: e.target.value })}
              placeholder="Ex.: Pizzaria do João"
              autoFocus
            />
          </div>

          <div className="campo">
            <label htmlFor="lead-telefone">WhatsApp</label>
            <input
              id="lead-telefone"
              value={dados.telefone ?? ''}
              onChange={(e) => atualizar({ telefone: e.target.value || null })}
              placeholder="5511999999999"
              inputMode="tel"
            />
            <small>Só dígitos, com DDI. Ex.: 5511999999999.</small>
          </div>

          <div className="campo">
            <label htmlFor="lead-instagram">Instagram</label>
            <input
              id="lead-instagram"
              value={dados.instagram ?? ''}
              onChange={(e) => atualizar({ instagram: e.target.value || null })}
              placeholder="pizzariadojoao"
            />
          </div>

          <div className="campo">
            <label htmlFor="lead-bairro">Bairro</label>
            <input
              id="lead-bairro"
              value={dados.bairro ?? ''}
              onChange={(e) => atualizar({ bairro: e.target.value || null })}
              placeholder="Ex.: Pinheiros"
            />
          </div>

          <div className="campo">
            <label htmlFor="lead-origem">Origem</label>
            <select
              id="lead-origem"
              value={dados.origem}
              onChange={(e) => atualizar({ origem: e.target.value as OrigemLead })}
            >
              {ORIGENS.map((origem) => (
                <option key={origem.valor} value={origem.valor}>
                  {origem.rotulo}
                </option>
              ))}
            </select>
          </div>

          <div className="campo largura-total">
            <label htmlFor="lead-maps">Link do Google Maps</label>
            <input
              id="lead-maps"
              value={dados.maps_url ?? ''}
              onChange={(e) => atualizar({ maps_url: e.target.value || null })}
              placeholder="https://maps.google.com/…"
            />
          </div>

          <div className="campo">
            <label htmlFor="lead-etapa">Etapa</label>
            <select
              id="lead-etapa"
              value={dados.etapa}
              onChange={(e) => atualizar({ etapa: e.target.value as EtapaLead })}
            >
              {ETAPAS.map((etapa) => (
                <option key={etapa.valor} value={etapa.valor}>
                  {etapa.rotulo}
                </option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label htmlFor="lead-followup">Próximo follow-up</label>
            <input
              id="lead-followup"
              type="date"
              value={dados.proximo_followup ?? ''}
              onChange={(e) => atualizar({ proximo_followup: e.target.value || null })}
            />
            <small>Deixe vazio se não quiser lembrete.</small>
          </div>

          <div className="campo largura-total">
            <label htmlFor="lead-notas">Notas</label>
            <textarea
              id="lead-notas"
              rows={3}
              value={dados.notas ?? ''}
              onChange={(e) => atualizar({ notas: e.target.value || null })}
              placeholder="O que ele pediu, objeções, quem indicou…"
            />
          </div>
        </div>

        <div className="modal-acoes">
          <button className="btn btn-fantasma" type="button" onClick={onFechar} disabled={salvando}>
            Cancelar
          </button>
          <button className="btn btn-primario" type="submit" disabled={salvando}>
            {salvando ? 'Salvando…' : lead ? 'Salvar lead' : 'Cadastrar lead'}
          </button>
        </div>
      </form>
    </div>
  );
}
