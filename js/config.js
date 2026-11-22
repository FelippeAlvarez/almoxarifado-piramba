// =============================================================
// Almoxarifado da Piramba — configuração
// © 2026 Felippe Alvarez. Todos os direitos reservados.
// =============================================================

export const APP = {
  nome: 'Almoxarifado da Piramba',
  versao: '1.2.0',
  dataVersao: '22/11/2026',
  autor: 'Felippe Alvarez',
  maxMembros: 5,
};

// Cole aqui os dados do seu projeto Firebase (passo a passo no GUIA).
// Enquanto "apiKey" começar com "COLE", o app roda em MODO DEMONSTRAÇÃO
// (dados guardados só neste aparelho, sem sincronizar).
export const firebaseConfig = {
  apiKey: 'COLE_AQUI_A_API_KEY',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
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
