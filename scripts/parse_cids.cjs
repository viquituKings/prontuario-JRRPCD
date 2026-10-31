const fs = require('fs');
const path = require('path');

const xmlPath = path.join(__dirname, '..', 'cid', 'CID10.xml');
console.log('Reading:', xmlPath);
const xml = fs.readFileSync(xmlPath, 'latin1');

const cids = [];
const seen = new Set();

// Regex para categorias: <categoria codcat="A00">\s*<nome>Cólera</nome>
const catRegex = /<categoria\s+codcat="([^"]+)">\s*<nome>([^<]+)<\/nome>/gi;
let match;
while ((match = catRegex.exec(xml)) !== null) {
  const code = match[1].trim();
  const name = match[2].trim();
  const entry = `${code} - ${name}`;
  if (!seen.has(code)) {
    seen.add(code);
    cids.push(entry);
  }
}

// Regex para subcategorias: <subcategoria codsubcat="A000">\s*<nome>...</nome>
// Note: codsubcat="A000" representa A00.0
const subcatRegex = /<subcategoria\s+codsubcat="([^"]+)">\s*<nome>([^<]+)<\/nome>(?:\s*<nome50>([^<]+)<\/nome50>)?/gi;
while ((match = subcatRegex.exec(xml)) !== null) {
  const rawCode = match[1].trim();
  let formattedCode = rawCode;
  if (rawCode.length === 4) {
    formattedCode = `${rawCode.slice(0, 3)}.${rawCode.slice(3)}`;
  }
  const name = match[2].trim();
  const entry = `${formattedCode} - ${name}`;
  if (!seen.has(formattedCode)) {
    seen.add(formattedCode);
    cids.push(entry);
  }
}

console.log('Total CIDs extraídos de CID10.xml:', cids.length);

// Também verificar se CID-O.xml adiciona mais
const cidoPath = path.join(__dirname, '..', 'cid', 'CID-O.xml');
if (fs.existsSync(cidoPath)) {
  const cidoXml = fs.readFileSync(cidoPath, 'latin1');
  const cidoRegex = /<categoria\s+codcat="([^"]+)">\s*<nome>([^<]+)<\/nome>/gi;
  let countO = 0;
  while ((match = cidoRegex.exec(cidoXml)) !== null) {
    const code = match[1].trim();
    const name = match[2].trim();
    const entry = `${code} - ${name}`;
    if (!seen.has(code)) {
      seen.add(code);
      cids.push(entry);
      countO++;
    }
  }
  console.log('Total de CID-O adicionados:', countO);
}

// Ordenar
cids.sort((a, b) => a.localeCompare(b));

// Salvar em src/data/cids.json
const outDir = path.join(__dirname, '..', 'src', 'data');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const outFile = path.join(outDir, 'cids.json');
fs.writeFileSync(outFile, JSON.stringify(cids, null, 2), 'utf-8');
console.log('Arquivo salvo com sucesso em:', outFile, 'Tamanho:', (fs.statSync(outFile).size / 1024).toFixed(1), 'KB');
