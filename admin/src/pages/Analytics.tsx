import { useEffect, useMemo, useState } from 'react';
import { listarClientes, listarVisitas } from '../lib/db';
import { hojeISO, mesDe, nomeDoMes, somarDias } from '../lib/datas';
import type { Cliente, Visita } from '../lib/types';

const DIAS_GRAFICO = 14;
const PERIODO = 60;

const inteiro = (valor: number) => valor.toLocaleString('pt-BR');

/** YYYY-MM do mês anterior. */
function mesAnterior(mes: string): string {
  const [ano, numero] = mes.split('-').map(Number);
  const data = new Date(ano, numero - 2, 1);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
}

/** Variação percentual; `null` quando não há base de comparação. */
function variacao(atual: number, anterior: number): number | null {
  if (anterior === 0) return null;
  return ((atual - anterior) / anterior) * 100;
}

type Resumo = {
  hoje: number;
  sete: number;
  mes: number;
  anterior: number;
  total: number;
};

const vazio = (): Resumo => ({ hoje: 0, sete: 0, mes: 0, anterior: 0, total: 0 });

export default function Analytics() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;

    Promise.all([listarClientes(), listarVisitas(PERIODO)])
      .then(([listaClientes, listaVisitas]) => {
        if (!ativo) return;
        setClientes(listaClientes);
        setVisitas(listaVisitas);
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
  }, []);

  const dados = useMemo(() => {
    const hoje = hojeISO();
    const sete = somarDias(hoje, -6);
    const mes = mesDe(hoje);
    const anterior = mesAnterior(mes);
    // Comparação justa: o mês passado só conta até o mesmo dia de hoje.
    const diaDoMes = hoje.slice(8, 10);

    const porCliente = new Map<string, Resumo>();
    for (const cliente of clientes) {
      porCliente.set(cliente.id, vazio());
    }

    for (const visita of visitas) {
      const alvo = porCliente.get(visita.client_id);
      if (!alvo) continue;

      alvo.total += visita.visitas;
      if (visita.dia === hoje) alvo.hoje += visita.visitas;
      if (visita.dia >= sete) alvo.sete += visita.visitas;
      if (mesDe(visita.dia) === mes) alvo.mes += visita.visitas;
      if (mesDe(visita.dia) === anterior && visita.dia.slice(8, 10) <= diaDoMes) {
        alvo.anterior += visita.visitas;
      }
    }

    const serie: Array<{ dia: string; total: number }> = [];
    for (let i = DIAS_GRAFICO - 1; i >= 0; i--) {
      serie.push({ dia: somarDias(hoje, -i), total: 0 });
    }

    const posicao = new Map(serie.map((item, indice) => [item.dia, indice]));
    for (const visita of visitas) {
      const indice = posicao.get(visita.dia);
      if (indice != null) serie[indice].total += visita.visitas;
    }

    const somar = (chave: keyof Resumo) =>
      [...porCliente.values()].reduce((soma, item) => soma + item[chave], 0);

    const linhas = clientes
      .map((cliente) => ({ cliente, resumo: porCliente.get(cliente.id) ?? vazio() }))
      .sort((a, b) => {
        if (b.resumo.mes !== a.resumo.mes) return b.resumo.mes - a.resumo.mes;
        return a.cliente.nome.localeCompare(b.cliente.nome, 'pt-BR');
      });

    return {
      hoje,
      mes,
      anterior,
      serie,
      linhas,
      total: {
        hoje: somar('hoje'),
        sete: somar('sete'),
        mes: somar('mes'),
        anterior: somar('anterior'),
      },
    };
  }, [clientes, visitas]);

  if (carregando) {
    return <p className="vazio">Carregando visitas…</p>;
  }

  const variacaoMes = variacao(dados.total.mes, dados.total.anterior);
  const maximo = Math.max(1, ...dados.serie.map((item) => item.total));
  const semVisitas = dados.linhas.every(({ resumo }) => resumo.total === 0);

  return (
    <>
      <div className="pagina-topo">
        <div>
          <h1>Analytics</h1>
          <p>
            Visitas por cardápio, contadas pelo próprio site — uma por sessão, sem cookie e sem
            guardar IP. O Umami continua com o detalhe (origem, dispositivo, tempo).
          </p>
        </div>
        <div className="acoes">
          <a
            className="btn btn-contorno"
            href="https://cloud.umami.is/websites"
            target="_blank"
            rel="noopener"
          >
            Abrir Umami ↗
          </a>
        </div>
      </div>

      {erro && <div className="aviso aviso-erro">{erro}</div>}

      <div className="resumo">
        <div className="resumo-item">
          <span className="resumo-rotulo">Visitas hoje</span>
          <strong>{inteiro(dados.total.hoje)}</strong>
          <small>todos os cardápios ativos</small>
        </div>
        <div className="resumo-item">
          <span className="resumo-rotulo">Últimos 7 dias</span>
          <strong>{inteiro(dados.total.sete)}</strong>
          <small>média de {inteiro(Math.round(dados.total.sete / 7))}/dia</small>
        </div>
        <div className="resumo-item">
          <span className="resumo-rotulo">{nomeDoMes(dados.mes)}</span>
          <strong>{inteiro(dados.total.mes)}</strong>
          <small>
            {variacaoMes == null
              ? 'sem base no mês passado'
              : `${variacaoMes >= 0 ? '+' : ''}${variacaoMes.toFixed(0)}% vs. mesmo período de ${nomeDoMes(
                  dados.anterior,
                )
                  .split(' de ')[0]
                  .toLowerCase()}`}
          </small>
        </div>
        <div className="resumo-item">
          <span className="resumo-rotulo">{nomeDoMes(dados.anterior)}</span>
          <strong>{inteiro(dados.total.anterior)}</strong>
          <small>até o dia {Number(dados.hoje.slice(8, 10))}</small>
        </div>
      </div>

      <div className="cartao">
        <div className="cartao-topo">
          <div>
            <h2>Últimos {DIAS_GRAFICO} dias</h2>
            <p>Soma de todos os cardápios. A barra rosa é hoje.</p>
          </div>
        </div>

        {semVisitas ? (
          <p className="vazio">
            Nenhuma visita registrada ainda. O contador liga quando o site é publicado com
            <code> PUBLIC_SUPABASE_URL </code>e<code> PUBLIC_SUPABASE_KEY</code>.
          </p>
        ) : (
          <div className="grafico" role="img" aria-label="Visitas por dia nos últimos 14 dias">
            {dados.serie.map((item, indice) => {
              const altura = Math.max(3, Math.round((item.total / maximo) * 100));
              const hoje = item.dia === dados.hoje;
              const esconderRotulo = (dados.serie.length - 1 - indice) % 2 === 1;
              return (
                <div className="grafico-coluna" key={item.dia} title={`${item.dia}: ${item.total} visita(s)`}>
                  <span className="grafico-total">{item.total > 0 ? inteiro(item.total) : ''}</span>
                  <div
                    className={`grafico-barra ${hoje ? 'grafico-barra-hoje' : ''}`}
                    style={{ height: `${altura}%` }}
                  />
                  <span className={`grafico-dia ${esconderRotulo ? 'grafico-dia-par' : ''}`}>
                    {item.dia.slice(8, 10)}/{item.dia.slice(5, 7)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="cartao">
        <div className="cartao-topo">
          <div>
            <h2>Por cardápio</h2>
            <p>
              Período de {PERIODO} dias. O mês passado é comparado até o dia de hoje. Clique em
              “Ver no Umami” quando o cliente tiver site próprio.
            </p>
          </div>
        </div>

        <table className="tabela">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Hoje</th>
              <th>7 dias</th>
              <th>Este mês</th>
              <th>Mês passado*</th>
              <th>Variação</th>
              <th>Total</th>
              <th aria-label="Ações" />
            </tr>
          </thead>
          <tbody>
            {dados.linhas.map(({ cliente, resumo }) => {
              const delta = variacao(resumo.mes, resumo.anterior);
              return (
                <tr key={cliente.id}>
                  <td data-rotulo="Cliente">
                    <span className="cliente-nome">{cliente.nome}</span>
                    <span className="cliente-slug">/{cliente.slug}</span>
                  </td>
                  <td data-rotulo="Hoje">{inteiro(resumo.hoje)}</td>
                  <td data-rotulo="7 dias">{inteiro(resumo.sete)}</td>
                  <td data-rotulo="Este mês">{inteiro(resumo.mes)}</td>
                  <td data-rotulo="Mês passado">{inteiro(resumo.anterior)}</td>
                  <td data-rotulo="Variação">
                    {delta == null ? (
                      <span className="selo selo-neutro">—</span>
                    ) : (
                      <span className={`selo ${delta >= 0 ? 'selo-sobe' : 'selo-desce'}`}>
                        {delta >= 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(0)}%
                      </span>
                    )}
                  </td>
                  <td data-rotulo="Total">{inteiro(resumo.total)}</td>
                  <td>
                    <div className="acoes-linha">
                      {cliente.analytics_website_id && (
                        <a
                          className="btn btn-fantasma btn-pequeno"
                          href={`https://cloud.umami.is/websites/${cliente.analytics_website_id}`}
                          target="_blank"
                          rel="noopener"
                        >
                          Ver no Umami
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
