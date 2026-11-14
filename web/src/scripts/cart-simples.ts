import { esc, estaAberto, money } from '../lib/format';
import { track } from '../lib/track';

type Dados = {
  pacote: 'simples';
  slug: string;
  nome: string;
  whatsapp: string;
  taxa: number;
  horario: { abre: string; fecha: string } | null;
  pagamentos: string[];
  itens: { nome: string; op: string; preco: number }[];
};

const $ = <T extends Element = HTMLElement>(seletor: string) =>
  document.querySelector<T>(seletor);

export function iniciarSimples() {
  const el = document.getElementById('menu-data');
  if (!el) return;

  const dados = JSON.parse(el.textContent || '{}') as Dados;
  const { itens } = dados;
  const taxa = Number(dados.taxa || 0);

  const statusEl = $('#statusLoja');
  if (statusEl && dados.horario) {
    const aberto = estaAberto(dados.horario);
    statusEl.textContent = aberto
      ? `Aberto até ${dados.horario.fecha}`
      : `Fechado · abre às ${dados.horario.abre}`;
  }

  const carrinho: Record<number, number> = {};
  const form = $('#form') as HTMLFormElement;
  const dlg = $('#dlg') as HTMLDialogElement;

  const ids = () =>
    Object.keys(carrinho)
      .filter((chave) => carrinho[Number(chave)] > 0)
      .map(Number);
  const subtotal = () =>
    ids().reduce((soma, id) => soma + itens[id].preco * carrinho[id], 0);
  const ehEntrega = () =>
    (form.querySelector('input[name="modo"]:checked') as HTMLInputElement).value === 'Entrega';
  const entrega = () => (ehEntrega() ? taxa : 0);

  function render() {
    const totalItens = ids().reduce((soma, id) => soma + carrinho[id], 0);

    const barra = $('#barra');
    if (barra) barra.classList.toggle('on', totalItens > 0);
    const qtdTxt = $('#qtdTxt');
    const subTxt = $('#subTxt');
    if (qtdTxt) qtdTxt.textContent = `Ver pedido (${totalItens})`;
    if (subTxt) subTxt.textContent = money(subtotal());

    const lista = $('#lista');
    if (lista) {
      lista.innerHTML = ids()
        .map(
          (id) =>
            `<div class="linha"><span>${esc(itens[id].nome)} ${esc(
              itens[id].op,
            )}<br><small>${money(itens[id].preco)}</small></span><span class="qtd"><button type="button" data-menos="${id}" aria-label="Diminuir">−</button><b>${
              carrinho[id]
            }</b><button type="button" data-mais="${id}" aria-label="Aumentar">+</button></span></div>`,
        )
        .join('');
    }

    const entrou = ehEntrega();
    const endBox = $('#endBox');
    if (endBox) endBox.hidden = !entrou;
    const campoEnd = form.elements.namedItem('end') as HTMLInputElement | null;
    if (campoEnd) campoEnd.required = entrou;

    const entregaBox = $('#tEntBox');
    if (entregaBox) entregaBox.hidden = !entrou || !taxa;

    const tSub = $('#tSub');
    const tEnt = $('#tEnt');
    const tTot = $('#tTot');
    if (tSub) tSub.textContent = money(subtotal());
    if (tEnt) tEnt.textContent = money(entrega());
    if (tTot) tTot.textContent = money(subtotal() + entrega());

    if (totalItens === 0 && dlg.open) dlg.close();
  }

  document.addEventListener('click', (evento) => {
    const botao = (evento.target as Element).closest<HTMLElement>('button');
    if (!botao) return;

    const { add, mais, menos } = botao.dataset;
    if (add !== undefined) {
      carrinho[Number(add)] = (carrinho[Number(add)] || 0) + 1;
      render();
    }
    if (mais !== undefined) {
      carrinho[Number(mais)]++;
      render();
    }
    if (menos !== undefined) {
      carrinho[Number(menos)]--;
      render();
    }
  });

  $('#ver')?.addEventListener('click', () => {
    render();
    dlg.showModal();
  });
  $('#voltar')?.addEventListener('click', () => dlg.close());
  form.addEventListener('change', render);

  form.addEventListener('submit', (evento) => {
    evento.preventDefault();

    const linhas = ids().map(
      (id) =>
        `${carrinho[id]}x ${itens[id].nome}${itens[id].op ? ' ' + itens[id].op : ''} (${money(
          itens[id].preco,
        )})`,
    );
    const total = subtotal() + entrega();
    const nome = (form.elements.namedItem('nome') as HTMLInputElement).value.trim();
    const endereco = (form.elements.namedItem('end') as HTMLInputElement).value.trim();
    const pagamento = (form.elements.namedItem('pag') as HTMLSelectElement).value;
    const obs = (form.elements.namedItem('obs') as HTMLTextAreaElement).value.trim();

    const mensagem = [
      'Olá! Quero fazer um pedido 🍕',
      '',
      ...linhas,
      '',
      `Subtotal: ${money(subtotal())}`,
      ehEntrega() && taxa ? `Entrega: ${money(taxa)}` : '',
      `Total: ${money(total)}`,
      '',
      `Nome: ${nome}`,
      ehEntrega() ? `Entrega: ${endereco}` : 'Retirada',
      `Pagamento: ${pagamento}`,
      obs ? `Obs: ${obs}` : '',
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
