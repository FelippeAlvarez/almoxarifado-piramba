// Store com Firebase (Auth Google + Firestore com cache off-line).
// © 2026 Felippe Alvarez. Todos os direitos reservados.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult,
  onAuthStateChanged, signOut,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  doc, collection, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, limit,
  increment, arrayUnion, arrayRemove, writeBatch, serverTimestamp, deleteField,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { ALERTAS_PADRAO, CATEGORIAS, APP } from './config.js';

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const gerarCodigo = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => ALFABETO[b % ALFABETO.length]).join('');
// Erros de gravação em segundo plano: registra e avisa a interface (que mostra um aviso em português).
const erroSilencioso = (e) => {
  console.error('[Firestore]', e);
  try { window.dispatchEvent(new CustomEvent('almox-erro', { detail: e })); } catch { /* sem interface */ }
};

export function createFirebaseStore(config) {
  const app = initializeApp(config);
  const auth = getAuth(app);
  const fs = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });

  let listener = () => {};
  let user = null;
  let casaId = null;
  let unsubs = [];
  const st = { casa: null, itens: [], lotes: [], movimentos: [] };

  const emit = (extra = {}) => listener({ fase: 'pronto', user, ...st, ...extra });
  const col = (nome) => collection(fs, 'casas', casaId, nome);
  const parar = () => { unsubs.forEach((u) => u()); unsubs = []; };

  const mov = (m) => {
    const ref = doc(col('movimentos'));
    setDoc(ref, { ...m, em: Date.now(), uid: user.uid, por: user.nome }).catch(erroSilencioso);
  };

  function ouvirCasa(id) {
    parar();
    casaId = id;
    unsubs.push(onSnapshot(doc(fs, 'casas', id), (s) => {
      if (!s.exists() || !(s.data().membros || []).includes(user.uid)) {
        st.casa = null; emit({ fase: 'sem-casa' }); return;
      }
      st.casa = { id: s.id, ...s.data() }; emit();
    }, (e) => { erroSilencioso(e); emit({ fase: 'sem-casa' }); }));
    unsubs.push(onSnapshot(col('itens'), (s) => { st.itens = s.docs.map((d) => ({ id: d.id, ...d.data() })); emit(); }, erroSilencioso));
    unsubs.push(onSnapshot(col('lotes'), (s) => { st.lotes = s.docs.map((d) => ({ id: d.id, ...d.data() })); emit(); }, erroSilencioso));
    unsubs.push(onSnapshot(query(col('movimentos'), orderBy('em', 'desc'), limit(300)),
      (s) => { st.movimentos = s.docs.map((d) => ({ id: d.id, ...d.data() })); emit(); }, erroSilencioso));
  }

  return {
    modo: 'firebase',

    start(cb) {
      listener = cb;
      getRedirectResult(auth).catch(() => {});
      onAuthStateChanged(auth, async (u) => {
        parar();
        if (!u) { user = null; emit({ fase: 'login' }); return; }
        user = { uid: u.uid, nome: u.displayName || u.email, email: u.email };
        emit({ fase: 'carregando' });
        try {
          const perfil = await getDoc(doc(fs, 'usuarios', u.uid));
          const id = perfil.exists() ? perfil.data().casaId : null;
          if (id) ouvirCasa(id); else emit({ fase: 'sem-casa' });
        } catch (e) { erroSilencioso(e); emit({ fase: 'sem-casa' }); }
      });
    },

    async login() {
      const prov = new GoogleAuthProvider();
      prov.setCustomParameters({ prompt: 'select_account' });
      try { await signInWithPopup(auth, prov); } catch (e) {
        if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment'].includes(e.code)) await signInWithRedirect(auth, prov);
        else if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') throw e;
      }
    },
    async logout() { parar(); await signOut(auth); },

    async criarCasa(nome) {
      const ref = doc(collection(fs, 'casas'));
      const codigo = gerarCodigo();
      await setDoc(ref, {
        nome: nome || APP.nome, codigo, membros: [user.uid], membrosInfo: { [user.uid]: user.nome },
        criadoPor: user.uid, criadoEm: serverTimestamp(), alertas: { ...ALERTAS_PADRAO }, categorias: [...CATEGORIAS],
      });
      await setDoc(doc(fs, 'convites', codigo), { casaId: ref.id });
      await setDoc(doc(fs, 'usuarios', user.uid), { casaId: ref.id, nome: user.nome, email: user.email });
      ouvirCasa(ref.id);
    },

    async entrarCasa(codigoDigitado) {
      const codigo = String(codigoDigitado || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      const conv = await getDoc(doc(fs, 'convites', codigo));
      if (!conv.exists()) throw new Error('Código não encontrado. Confira com quem enviou o convite.');
      const id = conv.data().casaId;
      try {
        await updateDoc(doc(fs, 'casas', id), { membros: arrayUnion(user.uid), [`membrosInfo.${user.uid}`]: user.nome });
      } catch (e) {
        throw new Error(`Não foi possível entrar. A casa pode já ter o máximo de ${APP.maxMembros} pessoas.`);
      }
      await setDoc(doc(fs, 'usuarios', user.uid), { casaId: id, nome: user.nome, email: user.email });
      ouvirCasa(id);
    },

    salvarItem(dados, id) {
      const agora = Date.now();
      if (id) {
        updateDoc(doc(col('itens'), id), { ...dados, atualizadoEm: agora }).catch(erroSilencioso);
        mov({ itemId: id, itemNome: dados.nome, tipo: 'edicao', texto: 'editou os dados do item' });
        return id;
      }
      const ref = doc(col('itens'));
      setDoc(ref, { ...dados, criadoEm: agora, atualizadoEm: agora }).catch(erroSilencioso);
      return ref.id;
    },

    adicionarLotes(itemId, grupos) {
      const it = st.itens.find((i) => i.id === itemId);
      for (const g of grupos) {
        const v = g.validade || null;
        const ex = st.lotes.find((l) => l.itemId === itemId && (l.validade || null) === v);
        if (ex) updateDoc(doc(col('lotes'), ex.id), { qtd: increment(g.qtd) }).catch(erroSilencioso);
        else setDoc(doc(col('lotes')), { itemId, qtd: g.qtd, validade: v, criadoEm: Date.now() }).catch(erroSilencioso);
        mov({ itemId, itemNome: it?.nome || '', tipo: 'entrada', qtd: g.qtd, validade: v });
      }
    },

    ajustarLote(loteId, delta) {
      const l = st.lotes.find((x) => x.id === loteId);
      if (!l) return;
      const it = st.itens.find((i) => i.id === l.itemId);
      if (l.qtd + delta <= 0) deleteDoc(doc(col('lotes'), loteId)).catch(erroSilencioso);
      else updateDoc(doc(col('lotes'), loteId), { qtd: increment(delta) }).catch(erroSilencioso);
      mov({ itemId: l.itemId, itemNome: it?.nome || '', tipo: delta > 0 ? 'entrada' : 'saida', qtd: Math.abs(delta), validade: l.validade || null });
    },

    alterarValidadeLote(loteId, validade) {
      const l = st.lotes.find((x) => x.id === loteId);
      if (!l) return;
      const v = validade || null;
      const it = st.itens.find((i) => i.id === l.itemId);
      const outro = st.lotes.find((x) => x.id !== loteId && x.itemId === l.itemId && (x.validade || null) === v);
      const b = writeBatch(fs);
      if (outro) { b.update(doc(col('lotes'), outro.id), { qtd: increment(l.qtd) }); b.delete(doc(col('lotes'), loteId)); }
      else b.update(doc(col('lotes'), loteId), { validade: v });
      b.commit().catch(erroSilencioso);
      mov({ itemId: l.itemId, itemNome: it?.nome || '', tipo: 'edicao', texto: 'corrigiu uma validade', validade: v });
    },

    excluirItem(itemId) {
      const it = st.itens.find((i) => i.id === itemId);
      const b = writeBatch(fs);
      st.lotes.filter((l) => l.itemId === itemId).forEach((l) => b.delete(doc(col('lotes'), l.id)));
      b.delete(doc(col('itens'), itemId));
      b.commit().catch(erroSilencioso);
      mov({ itemId, itemNome: it?.nome || '', tipo: 'exclusao', texto: 'excluiu o item' });
    },

    atualizarCasa(campos) { updateDoc(doc(fs, 'casas', casaId), campos).catch(erroSilencioso); },

    // lista de compras compartilhada: chave -> {itemId, nome, qtd, unidade, categoria, origem}
    listaDefinir(chave, valor) {
      updateDoc(doc(fs, 'casas', casaId), { [`lista.${chave}`]: valor || deleteField() }).catch(erroSilencioso);
    },
    listaLimpar() { updateDoc(doc(fs, 'casas', casaId), { lista: {} }).catch(erroSilencioso); },

    async novoCodigo() {
      const antigo = st.casa?.codigo;
      const codigo = gerarCodigo();
      await setDoc(doc(fs, 'convites', codigo), { casaId });
      await updateDoc(doc(fs, 'casas', casaId), { codigo });
      if (antigo) await deleteDoc(doc(fs, 'convites', antigo)).catch(() => {});
      return codigo;
    },

    async removerMembro(uidAlvo) {
      await updateDoc(doc(fs, 'casas', casaId), { membros: arrayRemove(uidAlvo), [`membrosInfo.${uidAlvo}`]: deleteField() });
    },

    async sairDaCasa() {
      await updateDoc(doc(fs, 'casas', casaId), { membros: arrayRemove(user.uid), [`membrosInfo.${user.uid}`]: deleteField() });
      await setDoc(doc(fs, 'usuarios', user.uid), { casaId: null, nome: user.nome, email: user.email });
      parar(); casaId = null; emit({ fase: 'sem-casa' });
    },
  };
}
