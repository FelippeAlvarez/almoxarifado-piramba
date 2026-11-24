// Almoxarifado da Piramba — interface
// © 2026 Felippe Alvarez. Todos os direitos reservados.
import { APP, firebaseConfig, CATEGORIAS, CATEGORIAS_SEM_VALIDADE, UNIDADES, ALERTAS_PADRAO } from './config.js';
import { createLocalStore } from './store-local.js';

// ---------- utilidades ----------
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
const num = (v) => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : NaN; };
const fmtQ = (n) => (Math.round(n * 1000) / 1000).toLocaleString('pt-BR');
const hoje = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const isoHoje = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const dias = (iso) => Math.round((parseISO(iso) - hoje()) / 86400000);
const fmtData = (iso) => (iso ? iso.split('-').reverse().join('/') : '');
const fmtQuando = (ms) => new Date(ms).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const plural = (n, s, p) => `${n} ${n === 1 ? s : p}`;

function textoPrazo(iso) {
  const d = dias(iso);
  if (d < 0) return `venceu há ${plural(-d, 'dia', 'dias')}`;
  if (d === 0) return 'vence hoje';
  if (d === 1) return 'vence amanhã';
  return `vence em ${d} dias`;
}

const ICON = {
  baixar: '<svg viewBox="0 0 24 24"><path d="M11 4h2v8.2l3.3-3.3 1.4 1.4L12 16l-5.7-5.7 1.4-1.4 3.3 3.3zM5 18h14v2H5z"/></svg>',
  compartilhar: '<svg viewBox="0 0 24 24"><path d="M18 16.1c-.8 0-1.4.3-2 .8l-7.1-4.2c.1-.2.1-.5.1-.7s0-.5-.1-.7L16 7.2c.5.5 1.2.8 2 .8 1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3c0 .2 0 .5.1.7L8 9.8C7.5 9.3 6.8 9 6 9c-1.7 0-3 1.3-3 3s1.3 3 3 3c.8 0 1.5-.3 2-.8l7.1 4.2c-.1.2-.1.4-.1.6 0 1.6 1.3 2.9 2.9 2.9s2.9-1.3 2.9-2.9-1.2-2.9-2.8-2.9z"/></svg>',
  painel: '<svg viewBox="0 0 24 24"><path d="M4 13h6V4H4zm0 7h6v-5H4zm10 0h6v-9h-6zm0-16v5h6V4z"/></svg>',
  estoque: '<svg viewBox="0 0 24 24"><path d="M3 7l9-4 9 4v10l-9 4-9-4zm9-1.8L6.2 7.7 12 10.3l5.8-2.6zM5 9.2v6.5l6 2.7v-6.5zm8 9.2l6-2.7V9.2l-6 2.7z"/></svg>',
  compras: '<svg viewBox="0 0 24 24"><path d="M7 18a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4zM5.2 4l.6 2H21l-2.4 8.4a2 2 0 01-1.9 1.6H8.3a2 2 0 01-1.9-1.5L3.7 4H1V2h4a1 1 0 011 .8z"/></svg>',
  ajustes: '<svg viewBox="0 0 24 24"><path d="M19.4 13a7.6 7.6 0 000-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 00-1.7-1L14.9 3h-4l-.4 2.9a7.4 7.4 0 00-1.7 1l-2.5-1-2 3.5L6.5 11a7.6 7.6 0 000 2l-2.1 1.6 2 3.5 2.5-1a7.4 7.4 0 001.7 1l.4 2.9h4l.4-2.9a7.4 7.4 0 001.7-1l2.5 1 2-3.5zM12.9 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z"/></svg>',
  mais: '<svg viewBox="0 0 24 24"><path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z"/></svg>',
  busca: '<svg viewBox="0 0 24 24"><path d="M10 3a7 7 0 015.6 11.2l5.1 5.1-1.4 1.4-5.1-5.1A7 7 0 1110 3zm0 2a5 5 0 100 10 5 5 0 000-10z"/></svg>',
  fechar: '<svg viewBox="0 0 24 24"><path d="M6.4 5L12 10.6 17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z"/></svg>',
  menos: '<svg viewBox="0 0 24 24"><path d="M5 11h14v2H5z"/></svg>',
  lapis: '<svg viewBox="0 0 24 24"><path d="M4 17.2V20h2.8l8.3-8.3-2.8-2.8zm15.7-9.5a1 1 0 000-1.4l-2-2a1 1 0 00-1.4 0l-1.6 1.6 2.8 2.8z"/></svg>',
  zap: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.1.1.3 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.7 1.2 1.6 2 1.1 1 2 1.3 2.3 1.4.3.1.4.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.6-.1 1.2z"/></svg>',
};

// ---------- mensagens de erro em português ----------
const ERROS = {
  'auth/configuration-not-found': 'O login com Google não está ativado no Firebase (Authentication › Método de login › Google).',
  'auth/operation-not-allowed': 'O login com Google não está ativado no Firebase (Authentication › Método de login › Google).',
  'auth/unauthorized-domain': 'Este endereço não está autorizado no Firebase (Authentication › Configurações › Domínios autorizados).',
  'auth/network-request-failed': 'Sem conexão com a internet. Verifique a rede e tente de novo.',
  'auth/popup-blocked': 'O navegador bloqueou a janela de login. Permita pop-ups para este site e tente de novo.',
  'auth/too-many-requests': 'Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.',
  'auth/user-disabled': 'Esta conta foi desativada no Firebase.',
  'auth/internal-error': 'Erro interno no login. Feche o app, abra de novo e tente outra vez.',
  'auth/web-storage-unsupported': 'O navegador está bloqueando o armazenamento de dados. Desative o modo anônimo e tente de novo.',
  'permission-denied': 'Sem permissão para esta operação. Confira se você ainda faz parte do almoxarifado e se as regras do Firestore foram publicadas.',
  'unavailable': 'Servidor indisponível ou sem internet. As alterações serão enviadas quando a conexão voltar.',
  'resource-exhausted': 'Limite gratuito diário do Firebase atingido. Tente novamente amanhã.',
  'failed-precondition': 'O banco de dados não está pronto. Confira no Firebase se o Firestore foi criado.',
  'not-found': 'Registro não encontrado. Ele pode ter sido apagado por outra pessoa.',
};
function traduzErro(e) {
  if (!e) return 'Ocorreu um erro. Tente novamente.';
  if (e.code && ERROS[e.code]) return ERROS[e.code];
  const m = String(e.message || '');
  const cod = Object.keys(ERROS).find((k) => m.includes(k));
  if (cod) return ERROS[cod];
  if (/Firebase|auth\/|firestore/i.test(m)) return `Erro do Firebase: ${e.code || m}. Tente novamente; se continuar, envie esta mensagem ao suporte.`;
  return m || 'Ocorreu um erro. Tente novamente.';
}
let ultimoAvisoErro = 0;
window.addEventListener('almox-erro', (ev) => {
  if (Date.now() - ultimoAvisoErro < 5000) return; // evita repetir o aviso em sequência
  ultimoAvisoErro = Date.now();
  toast(traduzErro(ev.detail));
});

// ---------- estado ----------
const S = {
  fase: 'carregando', user: null, casa: null, casas: [], itens: [], lotes: [], movimentos: [],
  view: 'painel', busca: '', cat: 'Todas', erro: '',
};
let store;

const alertas = () => ({ ...ALERTAS_PADRAO, ...(S.casa?.alertas || {}) });
// categorias editáveis em Ajustes (+ as que ainda estejam em uso por algum item)
const cats = () => {
  const base = S.casa?.categorias?.length ? S.casa.categorias : CATEGORIAS;
  return [...new Set([...base, ...S.itens.map((i) => i.categoria).filter(Boolean)])];
};

function statusLote(l) {
  if (!l.validade) return 'ok';
  const d = dias(l.validade); const a = alertas();
  if (d < 0) return 'vencido';
  if (d <= a.critico) return 'critico';
  if (d <= a.atencao) return 'atencao';
  return 'ok';
}
const PESO = { vencido: 3, critico: 2, atencao: 1, ok: 0 };

function derivar() {
  const porItem = new Map(S.itens.map((i) => [i.id, []]));
  for (const l of S.lotes) if (porItem.has(l.itemId)) porItem.get(l.itemId).push(l);
  return S.itens.map((it) => {
    const lotes = porItem.get(it.id).filter((l) => l.qtd > 0).sort((a, b) => {
      if (!a.validade) return 1; if (!b.validade) return -1; return a.validade.localeCompare(b.validade);
    });
    const total = lotes.reduce((s, l) => s + l.qtd, 0);
    const status = lotes.reduce((p, l) => (PESO[statusLote(l)] > PESO[p] ? statusLote(l) : p), 'ok');
    const minimo = Number(it.minimo) || 0;
    const baixo = minimo > 0 ? total < minimo : total === 0;
    return { ...it, lotes, total, status, baixo, prox: lotes.find((l) => l.validade)?.validade || null };
  }).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

// ---------- renderização ----------
const root = $('#app');

function render() {
  if (S.fase === 'carregando') { root.innerHTML = telaCarregando(); return; }
  if (S.fase === 'login') { root.innerHTML = telaLogin(); return; }
  if (S.fase === 'sem-casa') { root.innerHTML = telaSemCasa(); return; }
  const itens = derivar();
  const views = { painel: viewPainel, estoque: viewEstoque, compras: viewCompras, ajustes: viewAjustes };
  root.innerHTML = `
    ${store.modo === 'demo' ? '<div class="demo-bar">Modo demonstração — os dados ficam só neste aparelho</div>' : ''}
    <header class="topo">
      <button class="marca seletor" data-a="almoxarifados" aria-label="Trocar de almoxarifado"><img src="icons/icon-192.png" alt="" width="32" height="32"><div><strong>${esc(S.casa?.nome || APP.nome)} <span class="seta-sel">▾</span></strong><span>${esc(tituloView())}${S.casas.length > 1 ? ` · ${S.casas.length} almoxarifados` : ''}</span></div></button>
    </header>
    <main class="conteudo">${views[S.view](itens)}</main>
    <button class="fab" data-a="novo" ${S.view === 'ajustes' || S.view === 'compras' ? 'hidden' : ''} aria-label="Adicionar item">${ICON.mais}<span>Adicionar</span></button>
    <nav class="abas">
      ${aba('painel', 'Painel', itens.filter((i) => i.status === 'vencido' || i.status === 'critico').length)}
      ${aba('estoque', 'Estoque')}
      ${aba('compras', 'Compras', itens.filter((i) => i.baixo && !lista()[i.id]).length)}
      ${aba('ajustes', 'Ajustes')}
    </nav>`;
  const b = $('#busca'); if (b && document.activeElement?.id !== 'busca' && S._focoBusca) { b.focus(); b.setSelectionRange(b.value.length, b.value.length); }
}

const tituloView = () => ({ painel: 'Painel de controle', estoque: 'Estoque', compras: 'Lista de compras', ajustes: 'Ajustes' }[S.view]);
const aba = (id, rot, badge) => `<button class="aba ${S.view === id ? 'ativa' : ''}" data-a="view" data-v="${id}">${ICON[id]}<span>${rot}</span>${badge ? `<b class="badge">${badge}</b>` : ''}</button>`;

const telaCarregando = () => '<div class="tela-centro"><div class="spinner"></div><p>Carregando…</p></div>';

const telaLogin = () => `
  <div class="tela-centro login">
    <img src="icons/icon-512.png" alt="" width="96" height="96" class="logo-grande">
    <h1>${esc(APP.nome)}</h1>
    <p class="sub">Controle de itens da casa: estoque, validades e compras, compartilhado entre a família.</p>
    <button class="btn primario grande" data-a="login">Entrar com Google</button>
    ${botaoInstalar('btn grande btn-instalar')}
    ${S.erro ? `<p class="erro">${esc(S.erro)}</p>` : ''}
    <footer class="rodape-login">Versão ${APP.versao} · © 2026 ${esc(APP.autor)} · <a href="info.html#termos">Termos</a> · <a href="info.html#privacidade">Privacidade</a> · <button class="link-inline" data-a="compartilhar-app">Compartilhar</button></footer>
  </div>`;

const telaSemCasa = () => `
  <div class="tela-centro login">
    <img src="icons/icon-192.png" alt="" width="64" height="64">
    <h1>Bem-vindo${S.user ? ', ' + esc(S.user.nome.split(' ')[0]) : ''}</h1>
    <p class="sub">Para começar, crie o almoxarifado da casa ou entre em um já existente com o código de convite.</p>
    <div class="cartao bloco">
      <h3>Entrar com código de convite</h3>
      <input id="codigo" class="campo codigo" maxlength="9" placeholder="Ex.: K7MP4QXA" autocomplete="off" autocapitalize="characters">
      <button class="btn primario" data-a="entrar">Entrar</button>
    </div>
    <div class="ou">ou</div>
    <div class="cartao bloco">
      <h3>Criar novo almoxarifado</h3>
      <input id="nomecasa" class="campo" value="${esc(APP.nome)}">
      <button class="btn" data-a="criar">Criar</button>
    </div>
    ${S.erro ? `<p class="erro">${esc(S.erro)}</p>` : ''}
    <button class="link" data-a="logout">Sair da conta</button>
  </div>`;

function linhaAlerta(it, l) {
  const st = statusLote(l);
  return `<button class="linha" data-a="item" data-id="${it.id}">
    <span class="ponto ${st}"></span>
    <span class="linha-txt"><strong>${esc(it.nome)}</strong><small>${fmtQ(l.qtd)} ${esc(it.unidade || 'un')} · validade ${fmtData(l.validade)}</small></span>
    <span class="tag ${st}">${textoPrazo(l.validade)}</span></button>`;
}

function viewPainel(itens) {
  const a = alertas();
  const pares = itens.flatMap((it) => it.lotes.filter((l) => l.validade).map((l) => [it, l]));
  const venc = pares.filter(([, l]) => dias(l.validade) < 0);
  const crit = pares.filter(([, l]) => { const d = dias(l.validade); return d >= 0 && d <= a.critico; });
  const aten = pares.filter(([, l]) => { const d = dias(l.validade); return d > a.critico && d <= a.atencao; });
  const baixos = itens.filter((i) => i.baixo);
  const ord = (arr) => arr.sort((x, y) => x[1].validade.localeCompare(y[1].validade));
  const totUn = itens.length;

  if (!totUn) return `${faixaInstalar()}<div class="vazio"><div class="vazio-ico">${ICON.estoque}</div><h2>Almoxarifado vazio</h2><p>Toque em <b>Adicionar</b> para cadastrar o primeiro item.</p></div>`;

  return `
    ${faixaInstalar()}
    <section class="kpis">
      ${kpi('vencido', venc.length, 'Vencidos')}
      ${kpi('critico', crit.length, `Vencem em até ${a.critico} dias`)}
      ${kpi('atencao', aten.length, `Vencem em até ${a.atencao} dias`)}
      ${kpi('baixo', baixos.length, 'Abaixo do mínimo', 'compras')}
    </section>
    ${venc.length ? `<section><h2 class="secao">Vencidos</h2><div class="cartao lista">${ord(venc).map(([i, l]) => linhaAlerta(i, l)).join('')}</div></section>` : ''}
    ${crit.length ? `<section><h2 class="secao">Vencem em até ${a.critico} dias</h2><div class="cartao lista">${ord(crit).map(([i, l]) => linhaAlerta(i, l)).join('')}</div></section>` : ''}
    ${aten.length ? `<section><h2 class="secao">Vencem em até ${a.atencao} dias</h2><div class="cartao lista">${ord(aten).map(([i, l]) => linhaAlerta(i, l)).join('')}</div></section>` : ''}
    ${!venc.length && !crit.length && !aten.length ? `<div class="cartao ok-box"><strong>Nenhum vencimento nos próximos ${a.atencao} dias.</strong><span>${plural(totUn, 'item cadastrado', 'itens cadastrados')}.</span></div>` : ''}
    <section><h2 class="secao">Resumo por categoria</h2><div class="cartao lista">
      ${cats().map((c) => [c, itens.filter((i) => i.categoria === c)]).filter(([, l]) => l.length).map(([c, l]) =>
        `<button class="linha" data-a="filtrar" data-c="${esc(c)}"><span class="linha-txt"><strong>${esc(c)}</strong><small>${plural(l.length, 'item', 'itens')}</small></span><span class="seta">›</span></button>`).join('')}
    </div></section>`;
}
const kpi = (cls, n, rot, view) => `<button class="kpi ${cls} ${n ? '' : 'zero'}" data-a="${view ? 'view' : 'kpi'}" data-v="${view || ''}"><strong>${n}</strong><span>${rot}</span></button>`;

function cardItem(it) {
  const temVal = it.lotes.some((l) => l.validade);
  const resumoVal = it.total === 0 ? '<span class="tag vencido">em falta</span>'
    : temVal ? `<span class="tag ${it.status}">${it.status === 'ok' ? 'próx. ' + fmtData(it.prox) : textoPrazo(it.prox)}</span>` : '<span class="tag neutro">sem validade</span>';
  const nVal = it.lotes.filter((l) => l.validade).length;
  return `<button class="item" data-a="item" data-id="${it.id}">
    <span class="item-q"><strong>${fmtQ(it.total)}</strong><small>${esc(it.unidade || 'un')}</small></span>
    <span class="item-txt"><strong>${esc(it.nome)}</strong><small>${esc(it.categoria)}${nVal > 1 ? ` · ${nVal} validades` : ''}</small></span>
    <span class="item-tag">${resumoVal}${it.baixo && it.total > 0 ? '<span class="tag baixo">baixo</span>' : ''}</span></button>`;
}

function viewEstoque(itens) {
  const q = norm(S.busca);
  const chips = ['Todas', ...cats().filter((c) => itens.some((i) => i.categoria === c))];
  const lista = itens.filter((i) => (S.cat === 'Todas' || i.categoria === S.cat) && (!q || norm(`${i.nome} ${i.categoria} ${i.obs || ''}`).includes(q)));
  return `
    <div class="busca">${ICON.busca}<input id="busca" type="search" placeholder="Buscar item ou categoria" value="${esc(S.busca)}" autocomplete="off"></div>
    <div class="chips">${chips.map((c) => `<button class="chip ${S.cat === c ? 'ativo' : ''}" data-a="cat" data-c="${esc(c)}">${esc(c)}</button>`).join('')}</div>
    <p class="contagem">${plural(lista.length, 'item', 'itens')}</p>
    <div class="cartao lista-itens">${lista.map(cardItem).join('') || '<p class="nada">Nenhum item encontrado.</p>'}</div>`;
}

// ---------- lista de compras ----------
const lista = () => S.casa?.lista || {};
const qtdSugerida = (i) => { const f = (Number(i.minimo) || 0) - i.total; return f > 0 ? Math.ceil(f) : 1; };
const entradaDe = (i, origem) => ({ itemId: i.id, nome: i.nome, qtd: qtdSugerida(i), unidade: i.unidade || 'un', categoria: i.categoria || '', origem });
const qtdLista = (k, e) => `<span class="qtd-lista"><input class="campo mini" type="number" inputmode="decimal" min="0" step="any" data-lq="${esc(k)}" value="${esc(e.qtd)}" aria-label="Quantidade a comprar"><small>${esc(e.unidade || 'un')}</small></span>`;
const situacao = (i) => (i.total === 0 ? 'acabou' : `tem ${fmtQ(i.total)} ${esc(i.unidade || 'un')}`) + (i.minimo ? ` · mínimo ${fmtQ(Number(i.minimo))}` : '');

function viewCompras(itens) {
  const L = lista();
  const sugs = itens.filter((i) => i.baixo);
  const extras = Object.entries(L).filter(([k]) => !sugs.some((i) => i.id === k))
    .sort((a, b) => a[1].nome.localeCompare(b[1].nome, 'pt-BR'));
  const n = Object.keys(L).length;
  return `
    <h2 class="secao">Sugestões (${sugs.length})</h2>
    <p class="ajuda">Itens que acabaram ou estão abaixo do mínimo. Marque os que quer comprar e ajuste a quantidade.</p>
    <div class="cartao lista">${sugs.map((i) => {
      const e = L[i.id];
      return `<div class="linha sug ${e ? 'marcado' : ''}">
        <input type="checkbox" class="marca" data-a="sug" data-id="${i.id}" ${e ? 'checked' : ''} aria-label="Incluir ${esc(i.nome)}">
        <button class="linha-txt alvo" data-a="item" data-id="${i.id}"><strong>${esc(i.nome)}</strong><small>${situacao(i)}</small></button>
        ${e ? qtdLista(i.id, e) : ''}</div>`;
    }).join('') || '<p class="nada">Nenhuma sugestão: nada acabou nem está abaixo do mínimo.</p>'}</div>

    <h2 class="secao">Outros itens na lista (${extras.length})</h2>
    <div class="cartao lista">${extras.map(([k, e]) => {
      const it = e.itemId ? S.itens.find((i) => i.id === e.itemId) : null;
      const info = e.itemId ? (it ? `do estoque · ${situacao(derivar().find((d) => d.id === it.id) || { total: 0 })}` : 'item excluído do estoque') : 'item novo (não cadastrado)';
      return `<div class="linha sug marcado">
        <span class="linha-txt"><strong>${esc(e.nome)}</strong><small>${info}</small></span>
        ${qtdLista(k, e)}
        <button class="icone" data-a="lista-rem" data-id="${esc(k)}" aria-label="Remover ${esc(e.nome)}">${ICON.fechar}</button></div>`;
    }).join('') || '<p class="nada">Nenhum item adicionado.</p>'}</div>
    <div class="lista-acoes">
      <button class="btn" data-a="lista-estoque">${ICON.mais} Item do estoque</button>
      <button class="btn" data-a="lista-novo">${ICON.mais} Item novo</button>
    </div>
    <div class="gerar-barra">
      <button class="btn primario grande" data-a="gerar" ${n ? '' : 'disabled'}>Gerar lista (${plural(n, 'item', 'itens')})</button>
      ${n ? '<button class="link" data-a="lista-limpar">Limpar lista</button>' : ''}
    </div>`;
}

function sheetListaEstoque() {
  const L = lista();
  const itens = derivar();
  abrirSheet(`${cabSheet('Incluir item do estoque', 'Toque nos itens para incluir ou retirar da lista')}
    <div class="busca">${ICON.busca}<input id="busca-lista" type="search" placeholder="Buscar item" autocomplete="off"></div>
    <div class="cartao lista picker">${itens.map((i) => `<button class="linha ${L[i.id] ? 'marcado' : ''}" data-a="pick" data-id="${i.id}" data-n="${esc(norm(i.nome + ' ' + i.categoria))}">
      <span class="linha-txt"><strong>${esc(i.nome)}</strong><small>${esc(i.categoria)} · ${situacao(i)}</small></span>
      <span class="pick-st">${L[i.id] ? '✓ na lista' : '+ incluir'}</span></button>`).join('') || '<p class="nada">Nenhum item cadastrado.</p>'}</div>
    <button class="btn primario grande espaco" data-a="fechar">Concluir</button>`);
}

function sheetListaNovo() {
  abrirSheet(`${cabSheet('Incluir item novo', 'Para algo que ainda não está cadastrado no estoque')}
    <form id="form-lista-novo" class="form">
      <label>Nome<input id="ln-nome" class="campo" required placeholder="Ex.: Azeite extravirgem" autocomplete="off"></label>
      <p id="ln-aviso" class="aviso" hidden></p>
      <div class="dupla">
        <label>Quantidade<input id="ln-qtd" class="campo" type="number" inputmode="decimal" min="0" step="any" value="1"></label>
        <label>Unidade<input id="ln-un" class="campo" list="dl-un3" value="un"></label>
      </div>
      <datalist id="dl-un3">${UNIDADES.map((u) => `<option value="${u}">`).join('')}</datalist>
      <label>Categoria <small>(opcional, organiza a lista)</small><select id="ln-cat" class="campo"><option value="">—</option>${cats().map((c) => `<option>${esc(c)}</option>`).join('')}</select></label>
      <p id="ln-erro" class="erro" hidden></p>
      <button class="btn primario grande" type="submit">Incluir na lista</button>
    </form>`);
  setTimeout(() => $('#ln-nome')?.focus(), 50);
}

function entradasFinais() {
  return Object.values(lista()).map((e) => {
    const it = e.itemId ? S.itens.find((i) => i.id === e.itemId) : null;
    return { ...e, nome: it?.nome || e.nome, categoria: it?.categoria || e.categoria || '' };
  });
}
function dadosExport() {
  const agora = new Date();
  return {
    titulo: `Lista de compras — ${S.casa?.nome || APP.nome}`,
    subtitulo: `Gerada em ${agora.toLocaleDateString('pt-BR')} às ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}${S.user?.nome ? ' por ' + S.user.nome.split(' ')[0] : ''}`,
    entradas: entradasFinais(),
    rodape: `${APP.nome} v${APP.versao} · © 2026 ${APP.autor}`,
    arquivo: `lista-compras-${isoHoje()}`,
    ordem: cats(),
  };
}

async function sheetGerar() {
  const { agrupar } = await import('./exporta.js');
  const d = dadosExport();
  abrirSheet(`${cabSheet('Lista pronta', esc(d.subtitulo))}
    <div class="cartao previa">${agrupar(d.entradas, d.ordem).map(([cat, its]) => `<h4>${esc(cat)}</h4>${its.map((e) =>
      `<div class="previa-l"><span class="quad"></span><span>${esc(e.nome)}</span><b>${fmtQ(e.qtd)} ${esc(e.unidade || 'un')}</b></div>`).join('')}`).join('')}</div>
    <h3 class="sub-secao">Compartilhar</h3>
    <div class="acoes-sheet"><button class="btn primario" data-a="exp" data-f="pdf" data-m="comp">PDF</button><button class="btn primario" data-a="exp" data-f="txt" data-m="comp">TXT</button></div>
    <h3 class="sub-secao">Baixar no celular</h3>
    <div class="acoes-sheet"><button class="btn" data-a="exp" data-f="pdf" data-m="baixar">PDF</button><button class="btn" data-a="exp" data-f="txt" data-m="baixar">TXT</button></div>
    <p class="ajuda espaco">A lista continua salva no app até você tocar em “Limpar lista”. Ao chegar em casa, registre as compras pelo botão Adicionar.</p>`);
}

function baixarArquivo(file) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = file.name;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

async function exportarLista(formato, modo) {
  const { gerarPDF, gerarTXT } = await import('./exporta.js');
  const d = dadosExport();
  const file = formato === 'pdf'
    ? new File([gerarPDF(d)], `${d.arquivo}.pdf`, { type: 'application/pdf' })
    : new File(['﻿' + gerarTXT(d)], `${d.arquivo}.txt`, { type: 'text/plain' });
  if (modo === 'baixar') { baixarArquivo(file); toast(`Arquivo ${formato.toUpperCase()} baixado`); return; }
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: d.titulo }); return; }
    if (formato === 'txt' && navigator.share) { await navigator.share({ title: d.titulo, text: gerarTXT(d) }); return; }
  } catch (e) { if (e.name === 'AbortError') return; console.error(e); }
  baixarArquivo(file);
  toast('Este navegador não permite compartilhar arquivos; o arquivo foi baixado.');
}

function viewAjustes() {
  const a = alertas(); const c = S.casa || {};
  const membros = Object.entries(c.membrosInfo || {});
  const demo = store.modo === 'demo';
  return `
    <section><h2 class="secao">Meus almoxarifados (${S.casas.length})</h2><div class="cartao lista">
      <button class="linha" data-a="almoxarifados"><span class="linha-txt"><strong>Trocar, criar ou entrar com código</strong><small>${esc(S.casas.map((x) => x.nome).join(' · '))}</small></span><span class="seta">›</span></button>
      ${souCriadorSozinho() ? '<button class="linha" data-a="excluir-casa"><span class="linha-txt"><strong class="txt-perigo">Excluir este almoxarifado</strong><small>Apaga itens, validades, lista e histórico deste almoxarifado</small></span></button>' : ''}
      <button class="linha" data-a="sair-casa"><span class="linha-txt"><strong class="txt-perigo">Sair deste almoxarifado</strong><small>Os outros almoxarifados continuam disponíveis</small></span></button>
    </div></section>
    <section><h2 class="secao">Este almoxarifado</h2><div class="cartao form">
      <label>Nome<input id="aj-nome" class="campo" value="${esc(c.nome || '')}"></label>
      <div class="dupla">
        <label>Alerta urgente (dias)<input id="aj-crit" class="campo" type="number" min="1" max="60" value="${a.critico}"></label>
        <label>Alerta de atenção (dias)<input id="aj-aten" class="campo" type="number" min="2" max="365" value="${a.atencao}"></label>
      </div>
      <label>Categorias (uma por linha)<textarea id="aj-cats" class="campo" rows="7">${esc((c.categorias?.length ? c.categorias : CATEGORIAS).join('\n'))}</textarea></label>
      <p class="ajuda">A ordem aqui é a ordem usada no app e na lista de compras. Uma categoria retirada continua aparecendo enquanto algum item a usar.</p>
      <button class="btn primario" data-a="salvar-ajustes">Salvar ajustes</button>
    </div></section>
    <section><h2 class="secao">Pessoas (${membros.length} de ${APP.maxMembros})</h2><div class="cartao lista">
      ${membros.map(([u, n]) => `<div class="linha"><span class="avatar">${esc((n || '?')[0].toUpperCase())}</span><span class="linha-txt"><strong>${esc(n)}</strong><small>${u === S.user?.uid ? 'você' : u === c.criadoPor ? 'criador' : 'membro'}</small></span>${!demo && u !== S.user?.uid && S.user?.uid === c.criadoPor ? `<button class="btn pequeno perigo" data-a="remover-membro" data-id="${u}">Remover</button>` : ''}</div>`).join('')}
    </div>
    ${demo ? '<p class="ajuda">No modo demonstração não há convites. Eles funcionam na versão publicada.</p>' : `
    <div class="cartao convite"><span>Código de convite</span><strong class="mono">${esc(c.codigo || '')}</strong>
      <div class="acoes"><button class="btn whats" data-a="convidar">${ICON.zap} Convidar pelo WhatsApp</button><button class="btn pequeno" data-a="novo-codigo">Gerar novo código</button></div>
      <small>Quem tiver o código entra no almoxarifado (máximo de ${APP.maxMembros} pessoas). Gere um novo código se o atual vazar.</small></div>`}
    </section>
    <section><h2 class="secao">Dados</h2><div class="cartao lista">
      <button class="linha" data-a="exportar"><span class="linha-txt"><strong>Baixar cópia de segurança</strong><small>Arquivo .json com itens, validades e histórico</small></span><span class="seta">›</span></button>
      <button class="linha" data-a="historico"><span class="linha-txt"><strong>Histórico de movimentações</strong><small>Quem incluiu, retirou ou alterou</small></span><span class="seta">›</span></button>
      ${demo ? '<button class="linha" data-a="apagar-demo"><span class="linha-txt"><strong class="txt-perigo">Restaurar dados de exemplo</strong><small>Desfaz o que você testou e volta aos itens simulados</small></span></button>' : ''}
    </div></section>
    <section><h2 class="secao">Conta</h2><div class="cartao lista">
      <div class="linha"><span class="linha-txt"><strong>${esc(S.user?.nome || '')}</strong><small>${esc(S.user?.email || '')}</small></span></div>
      ${demo ? '' : '<button class="linha" data-a="logout"><span class="linha-txt"><strong>Sair da conta</strong></span></button>'}
    </div></section>
    <section><h2 class="secao">Sobre</h2><div class="cartao lista">
      ${instalado() ? '' : `<button class="linha" data-a="instalar"><span class="icone-linha">${ICON.baixar}</span><span class="linha-txt"><strong>Instalar o aplicativo</strong><small>Coloca o ícone na tela inicial do celular</small></span><span class="seta">›</span></button>`}
      <button class="linha" data-a="compartilhar-app"><span class="icone-linha">${ICON.compartilhar}</span><span class="linha-txt"><strong>Compartilhar o aplicativo</strong><small>Envia só o link do app, sem dar acesso aos seus almoxarifados</small></span><span class="seta">›</span></button>
      <a class="linha" href="info.html#manual"><span class="linha-txt"><strong>Manual de uso</strong></span><span class="seta">›</span></a>
      <a class="linha" href="info.html#termos"><span class="linha-txt"><strong>Termos de uso</strong></span><span class="seta">›</span></a>
      <a class="linha" href="info.html#privacidade"><span class="linha-txt"><strong>Política de privacidade</strong></span><span class="seta">›</span></a>
      <a class="linha" href="info.html#licenca"><span class="linha-txt"><strong>Licença e direitos autorais</strong></span><span class="seta">›</span></a>
      <a class="linha" href="info.html#creditos"><span class="linha-txt"><strong>Créditos</strong></span><span class="seta">›</span></a>
    </div>
    <p class="versao">${esc(APP.nome)} · versão ${APP.versao} (${APP.dataVersao})<br>© 2026 ${esc(APP.autor)}. Todos os direitos reservados.</p></section>`;
}

// ---------- instalação do aplicativo (PWA) ----------
let pedidoInstalacao = null; // evento guardado pelo navegador quando o app pode ser instalado
const instalado = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const avisoInstalarOculto = () => { try { return localStorage.getItem('almox-ocultar-instalar') === '1'; } catch { return false; } };
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); pedidoInstalacao = e; if (S.fase !== 'carregando') render(); });
window.addEventListener('appinstalled', () => { pedidoInstalacao = null; toast('Aplicativo instalado na tela inicial'); render(); });

const botaoInstalar = (classe = 'btn') => (instalado() ? '' : `<button class="${classe}" data-a="instalar">${ICON.baixar} Instalar o aplicativo</button>`);
const faixaInstalar = () => (instalado() || avisoInstalarOculto() ? '' : `
  <div class="faixa-instalar"><span>${ICON.baixar}</span><div><strong>Instale o app no celular</strong><small>Abre direto da tela inicial, em tela cheia e mais rápido.</small></div>
  <button class="btn pequeno primario" data-a="instalar">Instalar</button><button class="icone" data-a="ocultar-instalar" aria-label="Dispensar">${ICON.fechar}</button></div>`);

async function instalarApp() {
  if (pedidoInstalacao) {
    pedidoInstalacao.prompt();
    const { outcome } = await pedidoInstalacao.userChoice.catch(() => ({}));
    pedidoInstalacao = null;
    if (outcome === 'accepted') toast('Instalando…');
    render();
    return;
  }
  // Navegador não ofereceu a instalação automática: mostra como fazer manualmente.
  const ua = navigator.userAgent;
  const iphone = /iPhone|iPad|iPod/.test(ua);
  const dentroDeApp = /FBAN|FBAV|Instagram|WhatsApp|Line\/|; wv\)/.test(ua);
  const samsung = /SamsungBrowser/.test(ua);
  const firefox = /Firefox/.test(ua);
  const passos = dentroDeApp
    ? ['Este link foi aberto dentro de outro aplicativo (WhatsApp, Instagram…), que não permite instalar.', 'Toque no menu <b>⋮</b> desta tela e escolha <b>Abrir no navegador</b> (ou <b>Abrir no Chrome</b>).', 'No navegador, toque de novo em <b>Instalar o aplicativo</b>.']
    : iphone
      ? ['No Safari, toque no botão <b>Compartilhar</b> (quadrado com seta para cima).', 'Escolha <b>Adicionar à Tela de Início</b>.', 'Toque em <b>Adicionar</b>.']
      : samsung
        ? ['Toque no menu <b>≡</b> do navegador Samsung, no canto inferior.', 'Escolha <b>Adicionar página a</b> › <b>Tela inicial</b>.']
        : firefox
          ? ['Toque no menu <b>⋮</b> do Firefox.', 'Escolha <b>Instalar</b> (ou <b>Adicionar à tela inicial</b>).']
          : ['Toque no menu <b>⋮</b> do navegador, no canto superior direito.', 'Escolha <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.', 'Confirme em <b>Instalar</b>.'];
  abrirSheet(`${cabSheet('Instalar o aplicativo', 'Este navegador não oferece a instalação automática')}
    <ol class="passos">${passos.map((p) => `<li>${p}</li>`).join('')}</ol>
    <p class="ajuda espaco">Depois de instalado, o Almoxarifado abre pelo ícone na tela inicial, como os demais aplicativos.</p>`);
}

// ---------- compartilhar o aplicativo (só o link, sem dados) ----------
const linkApp = () => location.origin + location.pathname.replace(/(index\.html|info\.html)$/, '');
const textoConvite = () => `Conheça o ${APP.nome}: controle de estoque, validades e lista de compras da casa, para usar com a família no celular.`;
async function compartilharApp() {
  const url = linkApp();
  if (navigator.share) {
    try { await navigator.share({ title: APP.nome, text: textoConvite(), url }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  abrirSheet(`${cabSheet('Compartilhar o aplicativo', 'Envia só o link do app; os seus almoxarifados continuam privados')}
    <div class="cartao link-box"><span class="mono">${esc(url)}</span></div>
    <div class="acoes-sheet">
      <a class="btn whats" href="https://wa.me/?text=${encodeURIComponent(textoConvite() + ' ' + url)}" target="_blank" rel="noopener">${ICON.zap} WhatsApp</a>
      <button class="btn" data-a="copiar-link">Copiar link</button>
    </div>
    <p class="ajuda espaco">Quem receber o link cria os próprios almoxarifados. Para alguém participar de um almoxarifado seu, use o convite em Ajustes.</p>`);
}

// ---------- almoxarifados ----------
const souCriadorSozinho = () => S.casa && S.casa.criadoPor === S.user?.uid && (S.casa.membros || []).length <= 1;

function sheetAlmoxarifados() {
  const demo = store.modo === 'demo';
  abrirSheet(`${cabSheet('Meus almoxarifados', 'Cada almoxarifado tem estoque, lista de compras e pessoas próprios')}
    <div class="cartao lista">${S.casas.map((c) => `<button class="linha ${c.id === S.casa?.id ? 'marcado' : ''}" data-a="abrir-casa" data-id="${esc(c.id)}">
      <span class="avatar">${esc((c.nome || '?')[0].toUpperCase())}</span>
      <span class="linha-txt"><strong>${esc(c.nome)}</strong><small>${plural(c.membros, 'pessoa', 'pessoas')}${c.criadoPor === S.user?.uid ? ' · criado por você' : ''}</small></span>
      <span class="pick-st">${c.id === S.casa?.id ? '✓ aberto' : 'abrir'}</span></button>`).join('')}</div>
    <h3 class="sub-secao">Criar novo almoxarifado</h3>
    <form id="form-nova-casa" class="form-linha"><input id="nova-casa" class="campo" placeholder="Ex.: Casa de veraneio, Escritório" maxlength="60" autocomplete="off"><button class="btn primario" type="submit">Criar</button></form>
    <h3 class="sub-secao">Entrar com código de convite</h3>
    <form id="form-codigo" class="form-linha"><input id="codigo2" class="campo codigo" maxlength="9" placeholder="K7MP4QXA" autocomplete="off" autocapitalize="characters" ${demo ? 'disabled' : ''}><button class="btn" type="submit" ${demo ? 'disabled' : ''}>Entrar</button></form>
    ${demo ? '<p class="ajuda">No modo demonstração não há convites.</p>' : '<p class="ajuda">Peça o código a quem já participa do almoxarifado (Ajustes › Convidar pelo WhatsApp).</p>'}
    <p id="alm-erro" class="erro" hidden></p>`);
}

// ---------- folhas (modais) ----------
const sheet = $('#sheet');
function abrirSheet(html) {
  S.sheetItem = null;
  sheet.innerHTML = `<div class="sheet-corpo">${html}</div>`;
  if (!sheet.open) sheet.showModal();
}
function fecharSheet() { if (sheet.open) sheet.close(); }
sheet.addEventListener('click', (e) => { if (e.target === sheet) fecharSheet(); });
sheet.addEventListener('close', () => { S.sheetItem = null; });

const cabSheet = (titulo, sub = '') => `<div class="sheet-cab"><div><h2>${esc(titulo)}</h2>${sub ? `<small>${sub}</small>` : ''}</div><button class="icone" data-a="fechar" aria-label="Fechar">${ICON.fechar}</button></div>`;

function sheetItem(id) {
  const it = derivar().find((i) => i.id === id);
  if (!it) { fecharSheet(); return; }
  const movs = S.movimentos.filter((m) => m.itemId === id).slice(0, 8);
  abrirSheet(`
    ${cabSheet(it.nome, `${esc(it.categoria)}`)}
    <div class="total-item"><strong>${fmtQ(it.total)}</strong><span>${esc(it.unidade || 'un')} no total${it.minimo ? ` · mínimo ${fmtQ(Number(it.minimo))}` : ''}</span></div>
    ${it.emprestado ? `<p class="aviso">Emprestado / está com: <b>${esc(it.emprestado)}</b></p>` : ''}
    ${it.obs ? `<p class="obs">${esc(it.obs)}</p>` : ''}
    <h3 class="sub-secao">Quantidade por validade</h3>
    <div class="cartao lista">
      ${it.lotes.map((l) => {
        const st = statusLote(l);
        return `<div class="linha lote">
          <span class="ponto ${l.validade ? st : 'neutro'}"></span>
          <button class="linha-txt alvo" data-a="editar-lote" data-id="${l.id}">
            <strong>${l.validade ? fmtData(l.validade) : 'Sem validade'}</strong>
            <small>${l.validade ? textoPrazo(l.validade) : 'toque para informar uma validade'} ${ICON.lapis}</small></button>
          <div class="stepper"><button data-a="lote-menos" data-id="${l.id}" aria-label="Retirar 1">${ICON.menos}</button><b>${fmtQ(l.qtd)}</b><button data-a="lote-mais" data-id="${l.id}" aria-label="Acrescentar 1">${ICON.mais}</button></div>
        </div>`;
      }).join('') || '<p class="nada">Sem unidades em estoque.</p>'}
    </div>
    <div class="acoes-sheet">
      <button class="btn primario" data-a="add-unidades" data-id="${id}">${ICON.mais} Adicionar unidades</button>
      <button class="btn" data-a="editar-item" data-id="${id}">Editar dados</button>
    </div>
    <button class="btn bloco-largo lista-btn ${lista()[id] ? 'na-lista' : ''}" data-a="item-lista" data-id="${id}">${lista()[id] ? `✓ Na lista de compras (${fmtQ(lista()[id].qtd)} ${esc(lista()[id].unidade || 'un')}) — tocar para retirar` : '+ Incluir na lista de compras'}</button>
    ${movs.length ? `<h3 class="sub-secao">Últimas movimentações</h3><ul class="hist">${movs.map(linhaMov).join('')}</ul>` : ''}
    <button class="btn perigo bloco-largo" data-a="excluir-item" data-id="${id}">Excluir item</button>`);
  S.sheetItem = id;
}

function linhaMov(m) {
  const val = m.validade ? ` (val. ${fmtData(m.validade)})` : '';
  const t = m.tipo === 'entrada' ? `+${fmtQ(m.qtd)}${val}` : m.tipo === 'saida' ? `−${fmtQ(m.qtd)}${val}` : esc(m.texto || m.tipo);
  return `<li><span>${fmtQuando(m.em)} · ${esc((m.por || '').split(' ')[0])}</span><b class="${m.tipo}">${t}</b>${m.itemNome && S._histGeral ? `<em>${esc(m.itemNome)}</em>` : ''}</li>`;
}

// --- formulário de inclusão ---
const F = { itemId: null, grupos: [] };

function sheetNovo(itemId = null) {
  F.itemId = itemId; F.grupos = [{ qtd: '', validade: '' }];
  const it = itemId ? S.itens.find((i) => i.id === itemId) : null;
  abrirSheet(`
    ${cabSheet(it ? 'Adicionar unidades' : 'Novo item', it ? esc(it.nome) : 'Cadastre o item e suas validades')}
    <form id="form-novo" class="form" novalidate>
      ${it ? '' : `
      <label>Nome do item<input id="f-nome" class="campo" list="dl-itens" required placeholder="Ex.: Leite integral 1 L" autocomplete="off"></label>
      <datalist id="dl-itens">${S.itens.map((i) => `<option value="${esc(i.nome)}">`).join('')}</datalist>
      <p id="f-existente" class="aviso" hidden></p>
      <div id="f-detalhes">
        <div class="dupla">
          <label>Categoria<select id="f-cat" class="campo">${cats().map((c) => `<option>${esc(c)}</option>`).join('')}</select></label>
          <label>Unidade<input id="f-un" class="campo" list="dl-un" value="un"></label>
        </div>
        <datalist id="dl-un">${UNIDADES.map((u) => `<option value="${u}">`).join('')}</datalist>
      </div>`}
      <label>Quantidade<input id="f-qtd" class="campo" type="number" inputmode="decimal" min="0" step="any" value="1"></label>
      <fieldset class="validade">
        <legend>Validade</legend>
        <label class="check"><input type="checkbox" id="f-semval" ${it ? (it.temValidade === false ? 'checked' : '') : ''}> Sem validade</label>
        <div id="f-pergunta" class="pergunta" hidden>
          <p>Todas as <b id="f-qtd-txt"></b> unidades têm a mesma validade?</p>
          <div class="opcoes"><label><input type="radio" name="mesma" value="sim"> Sim, a mesma</label><label><input type="radio" name="mesma" value="nao"> Não, são diferentes</label></div>
        </div>
        <div id="f-data-unica"><label>Data de validade<input id="f-val" class="campo" type="date" min="2000-01-01"></label></div>
        <div id="f-grupos" hidden></div>
      </fieldset>
      ${it ? '' : `
      <div class="dupla">
        <label>Mínimo p/ compras<input id="f-min" class="campo" type="number" inputmode="decimal" min="0" step="any" placeholder="opcional"></label>
        <label>Observação<input id="f-obs" class="campo" placeholder="opcional"></label>
      </div>`}
      <p id="f-erro" class="erro" hidden></p>
      <button class="btn primario grande" type="submit">Salvar</button>
    </form>`);
  atualizarFormNovo();
  if (!it) setTimeout(() => $('#f-nome')?.focus(), 50);
}

function itemPorNome(nome) { const n = norm(nome); return n ? S.itens.find((i) => norm(i.nome) === n) : null; }

function atualizarFormNovo() {
  const form = $('#form-novo'); if (!form) return;
  const qtd = num($('#f-qtd').value);
  const sem = $('#f-semval').checked;
  const existente = $('#f-nome') ? itemPorNome($('#f-nome').value) : null;
  if ($('#f-existente')) {
    $('#f-existente').hidden = !existente;
    if (existente) $('#f-existente').innerHTML = `“${esc(existente.nome)}” já está cadastrado (${esc(existente.categoria)}). As unidades serão somadas ao estoque dele, separadas por validade.`;
    $('#f-detalhes').hidden = !!existente;
  }
  const multi = !sem && qtd > 1;
  $('#f-pergunta').hidden = !multi;
  $('#f-qtd-txt').textContent = Number.isFinite(qtd) ? fmtQ(qtd) : '';
  const resp = form.querySelector('input[name="mesma"]:checked')?.value;
  const diferentes = multi && resp === 'nao';
  $('#f-data-unica').hidden = sem || diferentes || (multi && !resp);
  $('#f-val').disabled = sem;
  $('#f-grupos').hidden = !diferentes;
  if (diferentes) renderGrupos(qtd);
}

function renderGrupos(qtd) {
  const soma = F.grupos.reduce((s, g) => s + (num(g.qtd) || 0), 0);
  const resto = +(qtd - soma).toFixed(3);
  $('#f-grupos').innerHTML = `
    <p class="ajuda">Informe quantas unidades há em cada validade.</p>
    ${F.grupos.map((g, i) => `<div class="grupo">
      <input class="campo" type="number" inputmode="decimal" min="0" step="any" placeholder="Qtd." data-g="${i}" data-k="qtd" value="${esc(g.qtd)}">
      <input class="campo" type="date" min="2000-01-01" data-g="${i}" data-k="validade" value="${esc(g.validade)}">
      ${F.grupos.length > 1 ? `<button type="button" class="icone" data-a="rem-grupo" data-i="${i}" aria-label="Remover">${ICON.fechar}</button>` : '<span></span>'}
    </div>`).join('')}
    <div class="grupos-rodape"><span class="${resto === 0 ? 'ok-txt' : 'erro-txt'}">${resto === 0 ? 'Todas as unidades distribuídas' : resto > 0 ? `Faltam distribuir ${fmtQ(resto)}` : `Excedeu em ${fmtQ(-resto)}`}</span>
    <button type="button" class="btn pequeno" data-a="add-grupo">+ Outra validade</button></div>`;
}

function salvarNovo(e) {
  e.preventDefault();
  const erro = (m) => { const p = $('#f-erro'); p.textContent = m; p.hidden = false; };
  const qtd = num($('#f-qtd').value);
  if (!(qtd > 0)) return erro('Informe uma quantidade maior que zero.');
  const sem = $('#f-semval').checked;
  let grupos;
  if (sem) grupos = [{ qtd, validade: null }];
  else {
    const resp = document.querySelector('input[name="mesma"]:checked')?.value;
    if (qtd > 1 && !resp) return erro('Responda se todas as unidades têm a mesma validade.');
    if (qtd > 1 && resp === 'nao') {
      grupos = F.grupos.map((g) => ({ qtd: num(g.qtd), validade: g.validade })).filter((g) => g.qtd > 0 || g.validade);
      if (grupos.some((g) => !(g.qtd > 0) || !g.validade)) return erro('Preencha quantidade e data em todas as linhas.');
      const soma = +grupos.reduce((s, g) => s + g.qtd, 0).toFixed(3);
      if (soma !== +qtd.toFixed(3)) return erro(`A soma das validades (${fmtQ(soma)}) precisa ser igual à quantidade (${fmtQ(qtd)}).`);
      const juntos = new Map(); grupos.forEach((g) => juntos.set(g.validade, (juntos.get(g.validade) || 0) + g.qtd));
      grupos = [...juntos].map(([validade, q]) => ({ validade, qtd: q }));
    } else {
      const v = $('#f-val').value;
      if (!v) return erro('Informe a data de validade ou marque “Sem validade”.');
      grupos = [{ qtd, validade: v }];
    }
  }
  if (grupos.some((g) => g.validade && dias(g.validade) < -3650)) return erro('Confira a data de validade: parece incorreta.');

  let itemId = F.itemId;
  if (!itemId) {
    const nome = $('#f-nome').value.trim().replace(/\s+/g, ' ');
    if (!nome) return erro('Informe o nome do item.');
    const ex = itemPorNome(nome);
    if (ex) itemId = ex.id;
    else {
      const min = num($('#f-min').value);
      itemId = store.salvarItem({
        nome, categoria: $('#f-cat').value, unidade: $('#f-un').value.trim() || 'un',
        minimo: min > 0 ? min : 0, obs: $('#f-obs').value.trim(), temValidade: !sem, emprestado: '',
      });
    }
  }
  store.adicionarLotes(itemId, grupos);
  const nomeIt = S.itens.find((i) => i.id === itemId)?.nome || 'Item';
  fecharSheet();
  toast(`${nomeIt}: ${fmtQ(qtd)} adicionado(s)`);
}

function sheetEditar(id) {
  const it = S.itens.find((i) => i.id === id);
  abrirSheet(`${cabSheet('Editar item', esc(it.nome))}
    <form id="form-editar" class="form" data-id="${id}">
      <label>Nome<input id="e-nome" class="campo" value="${esc(it.nome)}" required></label>
      <div class="dupla">
        <label>Categoria<select id="e-cat" class="campo">${cats().map((c) => `<option ${c === it.categoria ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label>
        <label>Unidade<input id="e-un" class="campo" list="dl-un2" value="${esc(it.unidade || 'un')}"></label>
      </div>
      <datalist id="dl-un2">${UNIDADES.map((u) => `<option value="${u}">`).join('')}</datalist>
      <label>Quantidade mínima (lista de compras)<input id="e-min" class="campo" type="number" inputmode="decimal" min="0" step="any" value="${it.minimo || ''}"></label>
      <label>Emprestado / está com <small>(ferramentas e utensílios)</small><input id="e-emp" class="campo" value="${esc(it.emprestado || '')}" placeholder="deixe vazio se está em casa"></label>
      <label>Observação<textarea id="e-obs" class="campo" rows="2">${esc(it.obs || '')}</textarea></label>
      <p id="e-erro" class="erro" hidden></p>
      <button class="btn primario grande" type="submit">Salvar alterações</button>
    </form>`);
}

function salvarEditar(e) {
  e.preventDefault();
  const id = e.target.dataset.id;
  const nome = $('#e-nome').value.trim().replace(/\s+/g, ' ');
  const err = $('#e-erro');
  if (!nome) { err.textContent = 'Informe o nome.'; err.hidden = false; return; }
  const dup = itemPorNome(nome);
  if (dup && dup.id !== id) { err.textContent = `Já existe um item chamado “${dup.nome}”.`; err.hidden = false; return; }
  const min = num($('#e-min').value);
  store.salvarItem({ nome, categoria: $('#e-cat').value, unidade: $('#e-un').value.trim() || 'un',
    minimo: min > 0 ? min : 0, emprestado: $('#e-emp').value.trim(), obs: $('#e-obs').value.trim() }, id);
  sheetItem(id);
  toast('Alterações salvas');
}

function sheetEditarLote(loteId) {
  const l = S.lotes.find((x) => x.id === loteId);
  const it = S.itens.find((i) => i.id === l.itemId);
  abrirSheet(`${cabSheet('Corrigir validade', `${esc(it.nome)} · ${fmtQ(l.qtd)} ${esc(it.unidade || 'un')}`)}
    <form id="form-lote" class="form" data-id="${loteId}" data-item="${it.id}">
      <label class="check"><input type="checkbox" id="l-sem" ${l.validade ? '' : 'checked'}> Sem validade</label>
      <label>Data de validade<input id="l-val" class="campo" type="date" value="${l.validade || ''}" ${l.validade ? '' : 'disabled'}></label>
      <p class="ajuda">Use para corrigir uma data digitada errada. Se a nova data já existir neste item, as quantidades são somadas.</p>
      <p id="l-erro" class="erro" hidden></p>
      <button class="btn primario grande" type="submit">Salvar</button>
    </form>`);
}

function sheetHistorico() {
  S._histGeral = true;
  abrirSheet(`${cabSheet('Histórico', 'Últimas 300 movimentações')}<ul class="hist geral">${S.movimentos.map(linhaMov).join('') || '<p class="nada">Sem movimentações.</p>'}</ul>`);
  S._histGeral = false;
}

function confirmar(titulo, texto, rotulo, acao) {
  abrirSheet(`${cabSheet(titulo)}<p class="confirma-txt">${texto}</p>
    <div class="acoes-sheet"><button class="btn" data-a="fechar">Cancelar</button><button class="btn perigo" id="btn-confirma">${esc(rotulo)}</button></div>`);
  $('#btn-confirma').onclick = () => { acao(); };
}

let toastT;
function toast(msg) {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.append(t); }
  t.textContent = msg; t.className = 'mostra';
  clearTimeout(toastT); toastT = setTimeout(() => { t.className = ''; }, 2400);
}

// ---------- eventos ----------
document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-a]'); if (!el) return;
  const a = el.dataset.a; const id = el.dataset.id;
  if (el.type === 'checkbox' && a !== 'sug') return;
  try {
    switch (a) {
      case 'view': S.view = el.dataset.v; render(); window.scrollTo(0, 0); break;
      case 'kpi': S.view = 'painel'; render(); break;
      case 'cat': S.cat = el.dataset.c; render(); break;
      case 'filtrar': S.cat = el.dataset.c; S.busca = ''; S.view = 'estoque'; render(); window.scrollTo(0, 0); break;
      case 'novo': sheetNovo(); break;
      case 'item': sheetItem(id); break;
      case 'fechar': fecharSheet(); break;
      case 'lote-mais': store.ajustarLote(id, 1); break;
      case 'lote-menos': {
        const l = S.lotes.find((x) => x.id === id);
        if (l && l.qtd <= 1) {
          const itId = l.itemId;
          confirmar('Retirar a última unidade?', 'Esta validade será removida do estoque. O item continua cadastrado.', 'Retirar', () => { store.ajustarLote(id, -l.qtd); sheetItem(itId); });
        } else store.ajustarLote(id, -1);
        break;
      }
      case 'editar-lote': sheetEditarLote(id); break;
      case 'add-unidades': sheetNovo(id); break;
      case 'editar-item': sheetEditar(id); break;
      case 'sug': {
        const it = derivar().find((i) => i.id === id);
        store.listaDefinir(id, el.checked && it ? entradaDe(it, 'sugestao') : null); break;
      }
      case 'item-lista': {
        const it = derivar().find((i) => i.id === id); const estava = !!lista()[id];
        store.listaDefinir(id, estava ? null : entradaDe(it, 'estoque'));
        toast(estava ? 'Retirado da lista de compras' : 'Incluído na lista de compras'); break;
      }
      case 'lista-rem': store.listaDefinir(id, null); break;
      case 'lista-estoque': sheetListaEstoque(); break;
      case 'lista-novo': sheetListaNovo(); break;
      case 'pick': {
        const na = !!lista()[id]; const it = derivar().find((i) => i.id === id);
        store.listaDefinir(id, na ? null : entradaDe(it, 'estoque'));
        el.classList.toggle('marcado', !na); el.querySelector('.pick-st').textContent = na ? '+ incluir' : '✓ na lista'; break;
      }
      case 'gerar': await sheetGerar(); break;
      case 'exp': await exportarLista(el.dataset.f, el.dataset.m); break;
      case 'lista-limpar': confirmar('Limpar lista?', 'Todos os itens marcados serão retirados da lista de compras, para todos da casa. O estoque não é alterado.', 'Limpar', () => { store.listaLimpar(); fecharSheet(); toast('Lista limpa'); }); break;
      case 'excluir-item': {
        const it = S.itens.find((i) => i.id === id);
        confirmar('Excluir item?', `“${esc(it.nome)}” e todas as suas quantidades serão apagados para todos da casa. Esta ação não pode ser desfeita.`, 'Excluir', () => { store.excluirItem(id); fecharSheet(); toast('Item excluído'); });
        break;
      }
      case 'add-grupo': F.grupos.push({ qtd: '', validade: '' }); atualizarFormNovo(); break;
      case 'rem-grupo': F.grupos.splice(Number(el.dataset.i), 1); atualizarFormNovo(); break;
      case 'convidar': {
        const url = location.href.split('#')[0].split('?')[0];
        const txt = `Entre no *${S.casa.nome}* para controlarmos juntos os itens da casa.\n1) Abra: ${url}\n2) Entre com sua conta Google\n3) Digite o código: *${S.casa.codigo}*`;
        window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, '_blank'); break;
      }
      case 'novo-codigo':
        confirmar('Gerar novo código?', 'O código atual deixa de funcionar. Quem já entrou continua com acesso.', 'Gerar', async () => { await store.novoCodigo(); fecharSheet(); toast('Novo código gerado'); });
        break;
      case 'remover-membro': {
        const nome = S.casa.membrosInfo[id];
        confirmar('Remover pessoa?', `${esc(nome)} perderá o acesso a este almoxarifado.`, 'Remover', async () => { await store.removerMembro(id); fecharSheet(); });
        break;
      }
      case 'salvar-ajustes': {
        const crit = Math.max(1, parseInt($('#aj-crit').value, 10) || ALERTAS_PADRAO.critico);
        const aten = Math.max(crit + 1, parseInt($('#aj-aten').value, 10) || ALERTAS_PADRAO.atencao);
        const cs = [...new Set($('#aj-cats').value.split('\n').map((s) => s.trim().replace(/\s+/g, ' ')).filter(Boolean))];
        if (!cs.length) { toast('Informe ao menos uma categoria.'); break; }
        store.atualizarCasa({ nome: $('#aj-nome').value.trim() || APP.nome, alertas: { critico: crit, atencao: aten }, categorias: cs });
        toast('Ajustes salvos'); break;
      }
      case 'exportar': exportar(); break;
      case 'historico': sheetHistorico(); break;
      case 'apagar-demo': confirmar('Restaurar exemplos?', 'Tudo o que foi alterado na demonstração será descartado e os itens simulados voltam ao estado inicial.', 'Restaurar', () => store.apagarDemo()); break;
      case 'sair-casa': {
        const ultimo = S.casa.criadoPor === S.user?.uid && (S.casa.membros || []).length <= 1;
        confirmar(`Sair de “${esc(S.casa.nome)}”?`, ultimo
          ? 'Você é a única pessoa neste almoxarifado: ao sair, ninguém mais terá acesso a ele. Para apagar de vez, use “Excluir este almoxarifado”.'
          : 'Você deixará de ver os itens deste almoxarifado. Para voltar, precisará de um novo código de convite. Os outros almoxarifados não são afetados.',
        'Sair', async () => { fecharSheet(); await store.sairDaCasa(); toast('Você saiu do almoxarifado'); });
        break;
      }
      case 'excluir-casa':
        confirmar(`Excluir “${esc(S.casa.nome)}”?`, 'Todos os itens, validades, lista de compras e histórico deste almoxarifado serão apagados definitivamente. Os outros almoxarifados não são afetados. Recomenda-se baixar antes a cópia de segurança.', 'Excluir definitivamente', async () => {
          fecharSheet(); S.fase = 'carregando'; render(); await store.excluirCasa(); toast('Almoxarifado excluído');
        });
        break;
      case 'almoxarifados': sheetAlmoxarifados(); break;
      case 'compartilhar-app': await compartilharApp(); break;
      case 'instalar': await instalarApp(); break;
      case 'ocultar-instalar': try { localStorage.setItem('almox-ocultar-instalar', '1'); } catch { /* sem armazenamento */ } render(); toast('Você pode instalar depois em Ajustes › Sobre'); break;
      case 'copiar-link': {
        try { await navigator.clipboard.writeText(linkApp()); toast('Link copiado'); } catch { toast('Não foi possível copiar. Copie o endereço exibido.'); }
        break;
      }
      case 'abrir-casa': fecharSheet(); if (id !== S.casa?.id) { store.trocarCasa(id); toast('Almoxarifado aberto'); } break;
      case 'login': S.erro = ''; await store.login(); break;
      case 'logout': await store.logout(); break;
      case 'criar': S.erro = ''; S.fase = 'carregando'; render(); await store.criarCasa($('#nomecasa')?.value.trim()); break;
      case 'entrar': { const c = $('#codigo').value; S.erro = ''; S.fase = 'carregando'; render(); await store.entrarCasa(c); break; }
      default: break;
    }
  } catch (err) {
    console.error(err);
    S.erro = traduzErro(err);
    if (['criar', 'entrar'].includes(a)) S.fase = 'sem-casa';
    render(); toast(S.erro);
  }
});

document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.id === 'busca') { S.busca = t.value; S._focoBusca = true; render(); S._focoBusca = false; return; }
  if (t.dataset.g !== undefined) { F.grupos[Number(t.dataset.g)][t.dataset.k] = t.value; renderGrupos(num($('#f-qtd').value)); return; }
  if (t.closest('#form-novo')) atualizarFormNovo();
  if (t.id === 'busca-lista') {
    const q = norm(t.value);
    sheet.querySelectorAll('[data-a="pick"]').forEach((b) => { b.hidden = q && !b.dataset.n.includes(q); });
  }
  if (t.id === 'ln-nome') {
    const ex = itemPorNome(t.value); const av = $('#ln-aviso');
    av.hidden = !ex; if (ex) av.textContent = `“${ex.nome}” já está cadastrado no estoque; será incluído como item do estoque.`;
  }
});
document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.closest('#form-novo') && t.dataset.g === undefined) {
    if (t.id === 'f-cat') $('#f-semval').checked = CATEGORIAS_SEM_VALIDADE.includes(t.value);
    atualizarFormNovo();
  }
  if (t.id === 'l-sem') $('#l-val').disabled = t.checked;
  if (t.dataset.lq) {
    const e = lista()[t.dataset.lq]; const q = num(t.value);
    if (e && q > 0) store.listaDefinir(t.dataset.lq, { ...e, qtd: q }); else if (e) t.value = e.qtd;
  }
});
document.addEventListener('submit', (e) => {
  if (e.target.id === 'form-novo') salvarNovo(e);
  else if (e.target.id === 'form-nova-casa' || e.target.id === 'form-codigo') {
    e.preventDefault();
    const err = $('#alm-erro'); err.hidden = true;
    const nova = e.target.id === 'form-nova-casa';
    const valor = (nova ? $('#nova-casa') : $('#codigo2')).value.trim();
    if (!valor) { err.textContent = nova ? 'Dê um nome ao novo almoxarifado.' : 'Digite o código de convite.'; err.hidden = false; return; }
    if (nova && S.casas.some((c) => norm(c.nome) === norm(valor))) { err.textContent = 'Você já tem um almoxarifado com esse nome.'; err.hidden = false; return; }
    e.target.querySelectorAll('button,input').forEach((x) => { x.disabled = true; });
    (nova ? store.criarCasa(valor) : store.entrarCasa(valor))
      .then(() => { fecharSheet(); toast(nova ? `“${valor}” criado` : 'Você entrou no almoxarifado'); })
      .catch((ex) => { err.textContent = traduzErro(ex); err.hidden = false; e.target.querySelectorAll('button,input').forEach((x) => { x.disabled = false; }); });
  }
  else if (e.target.id === 'form-lista-novo') {
    e.preventDefault();
    const nome = $('#ln-nome').value.trim().replace(/\s+/g, ' '); const q = num($('#ln-qtd').value); const err = $('#ln-erro');
    if (!nome) { err.textContent = 'Informe o nome.'; err.hidden = false; return; }
    if (!(q > 0)) { err.textContent = 'Informe uma quantidade maior que zero.'; err.hidden = false; return; }
    const ex = itemPorNome(nome);
    if (ex) store.listaDefinir(ex.id, { ...entradaDe(derivar().find((i) => i.id === ex.id), 'estoque'), qtd: q });
    else store.listaDefinir('n' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36), { itemId: null, nome, qtd: q, unidade: $('#ln-un').value.trim() || 'un', categoria: $('#ln-cat').value, origem: 'novo' });
    fecharSheet(); toast(`${nome} incluído na lista`);
  }
  else if (e.target.id === 'form-editar') salvarEditar(e);
  else if (e.target.id === 'form-lote') {
    e.preventDefault();
    const sem = $('#l-sem').checked; const v = $('#l-val').value;
    if (!sem && !v) { const p = $('#l-erro'); p.textContent = 'Informe a data ou marque “Sem validade”.'; p.hidden = false; return; }
    store.alterarValidadeLote(e.target.dataset.id, sem ? null : v);
    sheetItem(e.target.dataset.item); toast('Validade atualizada');
  }
});

function exportar() {
  const dados = { app: APP.nome, versao: APP.versao, exportadoEm: new Date().toISOString(), casa: { nome: S.casa?.nome, alertas: S.casa?.alertas, categorias: cats(), lista: S.casa?.lista || {} }, itens: S.itens, lotes: S.lotes, movimentos: S.movimentos };
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `almoxarifado-backup-${isoHoje()}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

// ---------- início ----------
async function iniciar() {
  const demo = String(firebaseConfig.apiKey || '').startsWith('COLE') || new URLSearchParams(location.search).has('demo');
  if (demo) store = createLocalStore();
  else {
    const { createFirebaseStore } = await import('./store-firebase.js');
    store = createFirebaseStore(firebaseConfig);
  }
  store.start((st) => {
    if (st.casa && st.casa.id !== S._ultimaCasa) {
      if (S._ultimaCasa) { S.view = 'painel'; S.cat = 'Todas'; S.busca = ''; if (sheet.open && S.sheetItem) fecharSheet(); }
      S._ultimaCasa = st.casa.id;
    }
    Object.assign(S, st);
    render();
    if (sheet.open && S.sheetItem) {
      const corpo = sheet.querySelector('.sheet-corpo'); const y = corpo ? corpo.scrollTop : 0;
      sheetItem(S.sheetItem);
      const novo = sheet.querySelector('.sheet-corpo'); if (novo) novo.scrollTop = y;
    }
  });
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
}
iniciar().catch((e) => {
  console.error(e);
  root.innerHTML = `<div class="tela-centro"><p class="erro">Não foi possível abrir o aplicativo. Verifique a internet (o primeiro acesso precisa de conexão) e tente de novo.</p><button class="btn primario" onclick="location.reload()">Tentar novamente</button></div>`;
});
