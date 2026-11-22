// Geração da lista de compras em TXT e PDF (sem bibliotecas externas, funciona off-line).
// © 2026 Felippe Alvarez. Todos os direitos reservados.

const fmtQ = (n) => (Math.round(n * 1000) / 1000).toLocaleString('pt-BR');

// Agrupa por categoria; itens novos sem categoria vão para "Itens novos".
export function agrupar(entradas, ordem = []) {
  const g = new Map();
  for (const e of entradas) {
    const cat = e.categoria || 'Itens novos';
    if (!g.has(cat)) g.set(cat, []);
    g.get(cat).push(e);
  }
  for (const l of g.values()) l.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true }));
  const pos = (c) => { const i = ordem.indexOf(c); return i < 0 ? 999 : i; };
  return [...g].sort((a, b) => (a[0] === 'Itens novos') - (b[0] === 'Itens novos') || pos(a[0]) - pos(b[0]) || a[0].localeCompare(b[0], 'pt-BR'));
}

export function gerarTXT({ titulo, subtitulo, entradas, rodape, ordem }) {
  const linhas = [titulo, subtitulo, ''];
  for (const [cat, itens] of agrupar(entradas, ordem)) {
    linhas.push(cat.toUpperCase());
    for (const e of itens) linhas.push(`[ ] ${e.nome} — ${fmtQ(e.qtd)} ${e.unidade || 'un'}`);
    linhas.push('');
  }
  linhas.push(`Total: ${entradas.length} ${entradas.length === 1 ? 'item' : 'itens'}`, '', rodape);
  return linhas.join('\r\n');
}

// ---------- PDF mínimo (A4, Helvetica, WinAnsiEncoding) ----------
const ESPECIAIS = { '€': 0x80, '‚': 0x82, '„': 0x84, '…': 0x85, '•': 0x95, '–': 0x96, '—': 0x97, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '™': 0x99 };
function winAnsi(str) {
  let out = '';
  for (const ch of String(str)) {
    const c = ch.codePointAt(0);
    let b = c >= 32 && c <= 126 ? c : c >= 160 && c <= 255 ? c : ESPECIAIS[ch] ?? 63;
    const s = String.fromCharCode(b);
    out += s === '(' || s === ')' || s === '\\' ? '\\' + s : s;
  }
  return out;
}
// larguras aproximadas da Helvetica (em milésimos do tamanho da fonte)
function largura(str, tam, negrito) {
  let w = 0;
  for (const ch of String(str)) {
    if ('il.,:;!|\'`'.includes(ch)) w += 250;
    else if ('fjrtI()[] '.includes(ch)) w += 310;
    else if ('mwMW'.includes(ch)) w += 850;
    else if (ch >= 'A' && ch <= 'Z') w += 680;
    else w += 540;
  }
  return (w * tam * (negrito ? 1.06 : 1)) / 1000;
}
function cortar(str, tam, max, negrito) {
  if (largura(str, tam, negrito) <= max) return str;
  let s = str;
  while (s.length > 1 && largura(s + '…', tam, negrito) > max) s = s.slice(0, -1);
  return s.trimEnd() + '…';
}

export function gerarPDF({ titulo, subtitulo, entradas, rodape, ordem }) {
  const W = 595, H = 842, M = 56;
  const paginas = [];
  let ops = []; let y = 0;
  const txt = (x, yy, tam, s, negrito = false, cor = '0.09 0.14 0.17') =>
    ops.push(`BT ${cor} rg /${negrito ? 'F2' : 'F1'} ${tam} Tf ${x.toFixed(1)} ${yy.toFixed(1)} Td (${winAnsi(s)}) Tj ET`);
  const linha = (x1, yy, x2, cor = '0.85 0.88 0.9') => ops.push(`${cor} RG 0.6 w ${x1} ${yy.toFixed(1)} m ${x2} ${yy.toFixed(1)} l S`);
  const caixa = (x, yy, t) => ops.push(`0.35 0.42 0.47 RG 0.9 w ${x} ${yy.toFixed(1)} ${t} ${t} re S`);

  const novaPagina = (primeira) => {
    if (ops.length) paginas.push(ops);
    ops = [];
    ops.push(`0.12 0.23 0.3 rg 0 ${H - 8} ${W} 8 re f`);
    if (primeira) {
      txt(M, H - 70, 20, titulo, true, '0.12 0.23 0.3');
      txt(M, H - 90, 10.5, subtitulo, false, '0.36 0.42 0.47');
      y = H - 122;
    } else {
      txt(M, H - 50, 10.5, `${titulo} (continuação)`, true, '0.36 0.42 0.47');
      y = H - 78;
    }
  };
  novaPagina(true);
  const garantir = (alt) => { if (y - alt < 70) { novaPagina(false); return true; } return false; };
  const cabCat = (cat, cont) => {
    y -= 6;
    txt(M, y, 9.5, cat.toUpperCase() + (cont ? ' (continuação)' : ''), true, '0.36 0.42 0.47');
    y -= 8; linha(M, y, W - M, '0.75 0.79 0.82'); y -= 20;
  };

  for (const [cat, itens] of agrupar(entradas, ordem)) {
    garantir(44);
    cabCat(cat, false);
    for (const e of itens) {
      if (garantir(24)) cabCat(cat, true);
      const q = `${fmtQ(e.qtd)} ${e.unidade || 'un'}`;
      const wq = largura(q, 11.5, true);
      caixa(M, y - 2, 11);
      txt(M + 22, y, 11.5, cortar(e.nome, 11.5, W - 2 * M - 40 - wq));
      txt(W - M - wq, y, 11.5, q, true);
      y -= 9; linha(M + 22, y, W - M); y -= 16;
    }
    y -= 6;
  }
  garantir(30);
  txt(M, y - 4, 10, `Total: ${entradas.length} ${entradas.length === 1 ? 'item' : 'itens'}`, true, '0.36 0.42 0.47');
  paginas.push(ops);

  // monta objetos
  const objs = [];
  const add = (s) => { objs.push(s); return objs.length; };
  const idCatalogo = add(null); const idPaginas = add(null);
  const idF1 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  const idF2 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  const kids = [];
  paginas.forEach((p, i) => {
    const rod = [`BT 0.54 0.59 0.63 rg /F1 8.5 Tf ${M} 34 Td (${winAnsi(rodape)}) Tj ET`,
      `BT 0.54 0.59 0.63 rg /F1 8.5 Tf ${W - M - 60} 34 Td (${winAnsi(`Página ${i + 1} de ${paginas.length}`)}) Tj ET`];
    const conteudo = [...p, ...rod].join('\n');
    const idC = add(`<< /Length ${conteudo.length} >>\nstream\n${conteudo}\nendstream`);
    kids.push(add(`<< /Type /Page /Parent ${idPaginas} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${idF1} 0 R /F2 ${idF2} 0 R >> >> /Contents ${idC} 0 R >>`));
  });
  objs[idCatalogo - 1] = `<< /Type /Catalog /Pages ${idPaginas} 0 R >>`;
  objs[idPaginas - 1] = `<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(' ')}] /Count ${kids.length} >>`;
  const idInfo = add(`<< /Title (${winAnsi(titulo)}) /Author (Felippe Alvarez) /Producer (Almoxarifado da Piramba) >>`);

  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offs = [];
  objs.forEach((o, i) => { offs.push(pdf.length); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offs.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`;
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root ${idCatalogo} 0 R /Info ${idInfo} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff;
  return bytes;
}
