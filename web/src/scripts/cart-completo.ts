import { itemImage } from '../lib/art';
import { esc, estaAberto, money } from '../lib/format';
import { track } from '../lib/track';

type Opcao = { id: number; nome: string; preco: number };

type Item = {
  nome: string;
  desc?: string;
  foto?: string;
  arte?: { tipo: string; cores: string[]; fundo?: string };
  ops: Opcao[];
  i: number;
};

type Dados = {
  pacote: 'completo';
  slug: string;
  nome: string;
  whatsapp: string;
  taxa: number;
  horario: { abre: string; fecha: string } | null;
  pagamentos: string[];
  itens: { nome: string; op: string; preco: number }[];
  todos: Item[];
};

const $ = <T extends Element = HTMLElement>(seletor: string) =>
  document.querySelector<T>(seletor);

export function iniciarCompleto() {
  const el = document.getElementById('menu-data');
  if (!el) return;

  const dados = JSON.parse(el.textContent || '{}') as Dados;
  const { itens, todos, taxa: taxaEntrega } = dados;

  const statusEl = $('#statusLoja');
  if (statusEl && dados.horario) {
    const aberto = estaAberto(dados.horario);
    statusEl.textContent = aberto
      ? `Aberto até ${dados.horario.fecha}`
      : `Fechado · abre às ${dados.horario.abre}`;
    statusEl.className = aberto ? 'on' : 'off';
  }

  const carrinho: { id: number; qtd: number; obs: string }[] = [];
  const subtotal = () =>
    carrinho.reduce((soma, linha) => soma + itens[linha.id].preco * linha.qtd, 0);

  /* Parallax leve no herói */
  const hero = $('#hero');
  let tick = 0;
  if (hero && !matchMedia('(prefers-reduced-motion:reduce)').matches) {
    addEventListener(
      'scroll',
      () => {
        if (tick) return;
        tick = 1;
        requestAnimationFrame(() => {
          const y = Math.min(scrollY, 320);
          hero.style.transform = `translate3d(0,${y * 0.3}px,0) rotate(${y * 0.05}deg)`;
          tick = 0;
        });
      },
      { passive: true },
    );
  }

  /* Item */
  let atual: Item | undefined;
  let selecionada = 0;
  let quantidade = 1;

  const dI = $('#dI') as HTMLDialogElement;
  const dC = $('#dC') as HTMLDialogElement;
  const form = $('#form') as HTMLFormElement;

  const atualizarItem = () => {
    const qn = $('#qn');
    const aP = $('#aP');
    if (qn) qn.textContent = String(quantidade);
    if (aP) aP.textContent = money(itens[selecionada].preco * quantidade);
  };

  function abrir(item: Item) {
    atual = item;
    selecionada = item.ops[0].id;
    quantidade = 1;

    const art = $('#iArt');
    const nome = $('#iNome');
    const desc = $('#iDesc');
    const obs = $('#iObs') as HTMLTextAreaElement | null;
    const ops = $('#iOps');

    if (art) art.innerHTML = itemImage(item);
    if (nome) nome.textContent = item.nome;
    if (desc) desc.textContent = item.desc || '';
    if (obs) obs.value = '';
    if (ops) {
      ops.innerHTML =
        item.ops.length > 1
          ? item.ops
              .map(
                (op, indice) =>
                  `<label class="op"><input type="radio" name="op" value="${op.id}" ${
                    indice ? '' : 'checked'
                  }><span>${esc(op.nome)}</span><b>${money(op.preco)}</b></label>`,
              )
              .join('')
          : '';
    }

    atualizarItem();
    dI.showModal();
  }

  const opsEl = $('#iOps');
  opsEl?.addEventListener('change', (evento) => {
    selecionada = Number((evento.target as HTMLInputElement).value);
    atualizarItem();
  });

  $('#m')?.addEventListener('click', () => {
    quantidade = Math.max(1, quantidade - 1);
    atualizarItem();
  });
  $('#M')?.addEventListener('click', () => {
    quantidade++;
    atualizarItem();
  });
  $('#fI')?.addEventListener('click', () => dI.close());

  $('#add')?.addEventListener('click', () => {
    if (!atual) return;
    const obs = (($('#iObs') as HTMLTextAreaElement | null)?.value || '').trim();
    const existente = carrinho.find((linha) => linha.id === selecionada && linha.obs === obs);
    if (existente) existente.qtd += quantidade;
    else carrinho.push({ id: selecionada, qtd: quantidade, obs });
    dI.close();
    render();
  });

  document.addEventListener('click', (evento) => {
    const alvo = (evento.target as Element).closest<HTMLElement>(
      '[data-i],[data-mais],[data-menos]',
    );
    if (!alvo) return;

    if (alvo.dataset.i !== undefined) abrir(todos[Number(alvo.dataset.i)]);
    if (alvo.dataset.mais !== undefined) {
      carrinho[Number(alvo.dataset.mais)].qtd++;
      render();
    }
    if (alvo.dataset.menos !== undefined) {
      const indice = Number(alvo.dataset.menos);
      carrinho[indice].qtd--;
      if (carrinho[indice].qtd < 1) carrinho.splice(indice, 1);
      render();
    }
  });

  dI.addEventListener('click', (evento) => {
    if (evento.target === dI) dI.close();
  });
  dC.addEventListener('click', (evento) => {
    if (evento.target === dC) dC.close();
  });

  /* Carrinho */
  const ehEntrega = () =>
    (form.querySelector('input[name="modo"]:checked') as HTMLInputElement).value === 'Entrega';
  const taxa = () => (ehEntrega() ? taxaEntrega : 0);

  function render() {
    const quantidadeTotal = carrinho.reduce((soma, linha) => soma + linha.qtd, 0);
    const entrega = ehEntrega();

    const barra = $('#barra');
    if (barra) barra.classList.toggle('on', quantidadeTotal > 0);
    const qtdTxt = $('#qtdTxt');
    const subTxt = $('#subTxt');
    if (qtdTxt) qtdTxt.textContent = `Ver pedido (${quantidadeTotal})`;
    if (subTxt) subTxt.textContent = money(subtotal());

    const lista = $('#lista');
    if (lista) {
      lista.innerHTML = carrinho
        .map(
          (linha, indice) =>
            `<div class="linha"><span>${esc(itens[linha.id].nome)} ${esc(
              itens[linha.id].op,
            )}<br><small>${money(itens[linha.id].preco)}${
              linha.obs ? ' · ' + esc(linha.obs) : ''
            }</small></span><span class="qtd"><button type="button" data-menos="${indice}" aria-label="Diminuir">−</button><b>${
              linha.qtd
            }</b><button type="button" data-mais="${indice}" aria-label="Aumentar">+</button></span></div>`,
        )
        .join('');
    }

    const endBox = $('#endBox');
    if (endBox) endBox.hidden = !entrega;
    const campoEnd = form.elements.namedItem('end') as HTMLInputElement | null;
    if (campoEnd) campoEnd.required = entrega;

    const entregaBox = $('#tEB');
    if (entregaBox) entregaBox.hidden = !entrega;

    const tS = $('#tS');
    const tE = $('#tE');
    const tT = $('#tT');
    if (tS) tS.textContent = money(subtotal());
    if (tE) tE.textContent = money(taxa());
    if (tT) tT.textContent = money(subtotal() + taxa());

    if (!quantidadeTotal && dC.open) dC.close();
  }

  $('#ver')?.addEventListener('click', () => {
    render();
    dC.showModal();
  });
  $('#vC')?.addEventListener('click', () => dC.close());
  form.addEventListener('change', render);

  form.addEventListener('submit', (evento) => {
    evento.preventDefault();

    const linhas = carrinho.map(
      (linha) =>
        `${linha.qtd}x ${itens[linha.id].nome}${itens[linha.id].op ? ' ' + itens[linha.id].op : ''} (${money(
          itens[linha.id].preco,
        )})${linha.obs ? '\n   Obs: ' + linha.obs : ''}`,
    );
    const entrega = ehEntrega();
    const nome = (form.elements.namedItem('nome') as HTMLInputElement).value.trim();
    const endereco = (form.elements.namedItem('end') as HTMLInputElement).value.trim();
    const pagamento = (form.elements.namedItem('pag') as HTMLSelectElement).value;

    const mensagem = [
      'Olá! Quero fazer um pedido 🍕',
      '',
      ...linhas,
      '',
      `Subtotal: ${money(subtotal())}`,
      entrega ? `Entrega: ${money(taxaEntrega)}` : '',
      `Total: ${money(subtotal() + taxa())}`,
      '',
      `Nome: ${nome}`,
      entrega ? `Entrega: ${endereco}` : 'Retirada no local',
      `Pagamento: ${pagamento}`,
    ]
      .filter((linha, indice, lista) => linha !== '' || lista[indice - 1] !== '')
      .join('\n');

    track('Pedido iniciado');
    window.open(
      `https://wa.me/${dados.whatsapp}?text=${encodeURIComponent(mensagem)}`,
      '_blank',
      'noopener',
    );
  });

  render();
}
