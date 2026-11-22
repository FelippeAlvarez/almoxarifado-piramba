// Modo demonstração: mesmos métodos do store do Firebase, com dados no aparelho.
// © 2026 Felippe Alvarez. Todos os direitos reservados.
import { ALERTAS_PADRAO, CATEGORIAS, APP } from './config.js';

const KEY = 'almox-piramba-demo-v2';
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; }
}

// ---------- dados simulados para a demonstração ----------
function exemplos() {
  const dia = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  // [nome, categoria, unidade, mínimo, [[qtd, dias até vencer | null], ...], extras]
  const base = [
    ['Arroz tipo 1 (5 kg)', 'Alimentos', 'pacote', 1, [[2, 240]]],
    ['Feijão preto 1 kg', 'Alimentos', 'pacote', 2, [[1, 150]]],
    ['Leite integral 1 L', 'Alimentos', 'caixa', 6, [[3, 4], [2, 19]]],
    ['Iogurte natural', 'Alimentos', 'un', 0, [[4, -2]]],
    ['Café em pó 500 g', 'Alimentos', 'pacote', 2, [[1, 75]]],
    ['Ovos (dúzia)', 'Alimentos', 'caixa', 1, [[1, 6]]],
    ['Azeite extravirgem 500 ml', 'Alimentos', 'garrafa', 1, [[1, 410]]],
    ['Macarrão espaguete', 'Alimentos', 'pacote', 2, [[3, 200], [2, 26]]],
    ['Molho de tomate', 'Alimentos', 'lata', 3, [[5, 120]]],
    ['Água mineral 1,5 L', 'Bebidas', 'garrafa', 6, [[12, 300]]],
    ['Suco de uva integral', 'Bebidas', 'garrafa', 0, [[2, 12]]],
    ['Cerveja long neck', 'Bebidas', 'un', 0, [[6, -5]]],
    ['Detergente líquido', 'Limpeza', 'un', 2, [[1, 500]]],
    ['Sabão em pó 1,6 kg', 'Limpeza', 'caixa', 1, [[1, 365]]],
    ['Água sanitária 2 L', 'Limpeza', 'garrafa', 1, [[2, 28]]],
    ['Esponja de cozinha', 'Limpeza', 'un', 3, [[0, null]]],
    ['Papel higiênico (pct 12)', 'Banheiro e higiene', 'pacote', 1, [[1, null]]],
    ['Pasta de dente', 'Banheiro e higiene', 'un', 2, [[1, 3], [2, 330]]],
    ['Sabonete', 'Banheiro e higiene', 'un', 4, [[6, 720]]],
    ['Shampoo', 'Banheiro e higiene', 'un', 1, [[1, 540]]],
    ['Panela de pressão 4,5 L', 'Cozinha (utensílios)', 'un', 0, [[1, null]]],
    ['Jogo de facas', 'Cozinha (utensílios)', 'un', 0, [[1, null]]],
    ['Furadeira', 'Ferramentas', 'un', 0, [[1, null]], { emprestado: 'vizinho do 302', obs: 'Brocas na maleta azul.' }],
    ['Jogo de chaves de fenda', 'Ferramentas', 'un', 0, [[1, null]]],
    ['Pilhas AA', 'Outros', 'un', 4, [[2, 900]]],
    ['Lâmpada LED 9 W', 'Outros', 'un', 2, [[3, null]]],
  ];
  const agora = Date.now(); let n = 0;
  const itens = []; const lotes = []; const movimentos = [];
  const pessoas = [['demo-user', 'Você'], ['demo-2', 'Membro 2']];
  for (const [nome, categoria, unidade, minimo, ls, extra = {}] of base) {
    const id = 'ex' + (++n);
    itens.push({ id, nome, categoria, unidade, minimo, obs: '', emprestado: '', temValidade: ls.some(([, d]) => d !== null), criadoEm: agora - n * 3600e3, atualizadoEm: agora, ...extra });
    ls.forEach(([qtd, d], k) => {
      if (qtd > 0) lotes.push({ id: `${id}-l${k}`, itemId: id, qtd, validade: d === null ? null : dia(d), criadoEm: agora });
      const [uid, por] = pessoas[(n + k) % 2];
      movimentos.push({ id: `${id}-m${k}`, itemId: id, itemNome: nome, tipo: 'entrada', qtd: qtd || 2, validade: d === null ? null : dia(d), em: agora - (n * 7 + k) * 3600e3, uid, por });
    });
  }
  movimentos.push({ id: 'mx1', itemId: 'ex16', itemNome: 'Esponja de cozinha', tipo: 'saida', qtd: 2, validade: null, em: agora - 1800e3, uid: 'demo-2', por: 'Membro 2' });
  movimentos.sort((a, b) => b.em - a.em);
  return {
    casa: {
      id: 'demo', nome: APP.nome, codigo: 'DEMO0000', membros: ['demo-user', 'demo-2'],
      membrosInfo: { 'demo-user': 'Você (demonstração)', 'demo-2': 'Membro 2 (exemplo)' }, criadoPor: 'demo-user',
      alertas: { ...ALERTAS_PADRAO }, categorias: [...CATEGORIAS],
      lista: { ex3: { itemId: 'ex3', nome: 'Leite integral 1 L', qtd: 1, unidade: 'caixa', categoria: 'Alimentos', origem: 'sugestao' } },
    },
    itens, lotes, movimentos,
  };
}

export function createLocalStore() {
  let db = load() || exemplos();
  const user = { uid: 'demo-user', nome: 'Você (demonstração)', email: 'demonstração' };
  let listener = () => {};

  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* sem armazenamento */ }
  };
  const emit = () => listener({ fase: 'pronto', user, casa: db.casa, itens: db.itens, lotes: db.lotes, movimentos: db.movimentos });
  const commit = () => { save(); emit(); };
  const mov = (m) => {
    db.movimentos.unshift({ id: uid(), em: Date.now(), uid: user.uid, por: user.nome, ...m });
    db.movimentos = db.movimentos.slice(0, 300);
  };

  return {
    modo: 'demo',
    start(cb) { listener = cb; emit(); },
    async login() {}, async logout() {},
    async criarCasa() {}, async entrarCasa() {},

    salvarItem(dados, id) {
      const agora = Date.now();
      if (id) {
        const it = db.itens.find((i) => i.id === id);
        Object.assign(it, dados, { atualizadoEm: agora });
        mov({ itemId: id, itemNome: it.nome, tipo: 'edicao', texto: 'editou os dados do item' });
      } else {
        id = uid();
        db.itens.push({ id, ...dados, criadoEm: agora, atualizadoEm: agora });
      }
      commit();
      return id;
    },

    adicionarLotes(itemId, grupos) {
      const it = db.itens.find((i) => i.id === itemId);
      for (const g of grupos) {
        const ex = db.lotes.find((l) => l.itemId === itemId && (l.validade || null) === (g.validade || null));
        if (ex) ex.qtd = +(ex.qtd + g.qtd).toFixed(3);
        else db.lotes.push({ id: uid(), itemId, qtd: g.qtd, validade: g.validade || null, criadoEm: Date.now() });
        mov({ itemId, itemNome: it?.nome, tipo: 'entrada', qtd: g.qtd, validade: g.validade || null });
      }
      commit();
    },

    ajustarLote(loteId, delta) {
      const l = db.lotes.find((x) => x.id === loteId);
      if (!l) return;
      const it = db.itens.find((i) => i.id === l.itemId);
      const novo = +(l.qtd + delta).toFixed(3);
      if (novo <= 0) db.lotes = db.lotes.filter((x) => x.id !== loteId);
      else l.qtd = novo;
      mov({ itemId: l.itemId, itemNome: it?.nome, tipo: delta > 0 ? 'entrada' : 'saida', qtd: Math.abs(delta), validade: l.validade });
      commit();
    },

    alterarValidadeLote(loteId, validade) {
      const l = db.lotes.find((x) => x.id === loteId);
      if (!l) return;
      const it = db.itens.find((i) => i.id === l.itemId);
      const outro = db.lotes.find((x) => x.id !== loteId && x.itemId === l.itemId && (x.validade || null) === (validade || null));
      if (outro) { outro.qtd = +(outro.qtd + l.qtd).toFixed(3); db.lotes = db.lotes.filter((x) => x.id !== loteId); }
      else l.validade = validade || null;
      mov({ itemId: l.itemId, itemNome: it?.nome, tipo: 'edicao', texto: 'corrigiu uma validade', validade });
      commit();
    },

    excluirItem(itemId) {
      const it = db.itens.find((i) => i.id === itemId);
      db.itens = db.itens.filter((i) => i.id !== itemId);
      db.lotes = db.lotes.filter((l) => l.itemId !== itemId);
      mov({ itemId, itemNome: it?.nome, tipo: 'exclusao', texto: 'excluiu o item' });
      commit();
    },

    atualizarCasa(campos) { Object.assign(db.casa, campos); commit(); },

    // lista de compras compartilhada: chave -> {itemId, nome, qtd, unidade, categoria, origem}
    listaDefinir(chave, valor) {
      db.casa.lista = { ...(db.casa.lista || {}) };
      if (valor) db.casa.lista[chave] = valor; else delete db.casa.lista[chave];
      commit();
    },
    listaLimpar() { db.casa.lista = {}; commit(); },
    async novoCodigo() { return db.casa.codigo; },
    async sairDaCasa() {},

    apagarDemo() { try { localStorage.removeItem(KEY); } catch { /* sem armazenamento */ } location.reload(); },
  };
}
