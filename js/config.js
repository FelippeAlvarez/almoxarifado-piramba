// =============================================================
// Almoxarifado da Piramba — configuração
// © 2026 Felippe Alvarez. Todos os direitos reservados.
// =============================================================

export const APP = {
  nome: 'Almoxarifado da Piramba',
  versao: '1.2.1',
  dataVersao: '23/11/2026',
  autor: 'Felippe Alvarez',
  maxMembros: 5,
};

// Projeto Firebase "almoxarifado-piramba". Estes dados não são senha: só identificam
// o projeto; a proteção dos dados está nas regras do Firestore (firestore.rules).
// Para abrir o modo demonstração (exemplos, sem sincronizar), acrescente ?demo ao endereço.
export const firebaseConfig = {
  apiKey: 'AIzaSyBCOyY_93yavyAAF2ydCyyHUjUT_TwxzqM',
  authDomain: 'almoxarifado-piramba-dc6ef.firebaseapp.com',
  projectId: 'almoxarifado-piramba-dc6ef',
  storageBucket: 'almoxarifado-piramba-dc6ef.firebasestorage.app',
  messagingSenderId: '787659790144',
  appId: '1:787659790144:web:3ca28301dee7b33e380ca5',
};

// Categorias iniciais (podem ser alteradas em Ajustes).
export const CATEGORIAS = [
  'Alimentos',
  'Bebidas',
  'Limpeza',
  'Banheiro e higiene',
  'Cozinha (utensílios)',
  'Ferramentas',
  'Outros',
];

// Categorias que, por padrão, já vêm marcadas como "sem validade".
export const CATEGORIAS_SEM_VALIDADE = ['Cozinha (utensílios)', 'Ferramentas'];

export const UNIDADES = ['un', 'pacote', 'caixa', 'garrafa', 'lata', 'rolo', 'kg', 'g', 'L', 'ml'];

export const ALERTAS_PADRAO = { critico: 7, atencao: 30 };
