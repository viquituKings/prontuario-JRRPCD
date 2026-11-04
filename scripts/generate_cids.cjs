const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Utilitário para decodificar strings de PDF
function decodePdfString(s) {
  return s
    .replace(/\\\\/g, '\\')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')');
}

console.log('=== Processando CIDs a partir de CID.pdf e CID10.xml ===');

// 1. Extração do CID.pdf
const pdfPath = path.join(__dirname, '..', 'cid', 'CID.pdf');
if (!fs.existsSync(pdfPath)) {
  console.error('Arquivo CID.pdf não encontrado em:', pdfPath);
  process.exit(1);
}

const pdfBuf = fs.readFileSync(pdfPath);
const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
let match;

const pdfChapters = [];
const pdfGroupsMap = new Map();
const pdfCategoriesMap = new Map();

while ((match = streamRegex.exec(pdfBuf.toString('binary'))) !== null) {
  try {
    const text = zlib.inflateSync(Buffer.from(match[1], 'binary')).toString('latin1');
    const tjRegex = /\[(.*?)\]\s*TJ/gs;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(text)) !== null) {
      const raw = tjMatch[1];

      // Detecta capítulo: ex: Capítulo I: Algumas doenças infecciosas e parasitárias \(A00-B99\)
      const chapMatch = raw.match(/Cap[íi]tulo\s+([IVXLCDM]+):\s*([^\\]+?)\s*\\?\(([A-Z][0-9]{2}-[A-Z][0-9]{2})\\?\)/i);
      if (chapMatch) {
        const roman = chapMatch[1];
        const name = chapMatch[2].trim();
        const code = chapMatch[3];
        if (!pdfChapters.some(c => c.code === code)) {
          pdfChapters.push({ roman, code, name });
        }
        continue;
      }

      // Detecta códigos regulares: ex: (A00)-gap(Nome) ou (A00-A09)-gap(Nome)
      const entryMatch = raw.match(/^\s*\(([A-Z][0-9]{2}[*†]?|[A-Z][0-9]{2}-[A-Z][0-9]{2})\)\s*-\s*[0-9.]+\s*\(([^\)]+)\)/);
      if (entryMatch) {
        const code = entryMatch[1].replace(/[*†]/g, '').trim();
        const desc = decodePdfString(entryMatch[2]).trim();

        if (code.includes('-')) {
          if (!pdfGroupsMap.has(code)) {
            pdfGroupsMap.set(code, desc);
          }
        } else {
          if (!pdfCategoriesMap.has(code)) {
            pdfCategoriesMap.set(code, desc);
          }
        }
      }
    }
  } catch (e) {
    // Ignora streams que não são de texto comprimido válido
  }
}

console.log(`CID.pdf processado:`);
console.log(` - Capítulos: ${pdfChapters.length}`);
console.log(` - Grupos: ${pdfGroupsMap.size}`);
console.log(` - Categorias (3 dígitos): ${pdfCategoriesMap.size}`);
console.log(` - Total de itens únicos no PDF: ${pdfGroupsMap.size + pdfCategoriesMap.size}`);

// 2. Extração de nomes completos oficiais do CID10.xml
const xmlPath = path.join(__dirname, '..', 'cid', 'CID10.xml');
let xmlCatMap = new Map();
let xmlSubcatMap = new Map();
let xmlGroupMap = new Map();
let xmlChapMap = new Map();

if (fs.existsSync(xmlPath)) {
  console.log('Lendo CID10.xml oficial para obter descrições completas não truncadas...');
  const xml = fs.readFileSync(xmlPath, 'latin1');

  // Capítulos
  const cRegex = /<capitulo\s+[^>]*numcap="([^"]+)"[^>]*>[\s\S]*?<nome>([^<]+)<\/nome>/gi;
  while ((match = cRegex.exec(xml)) !== null) {
    xmlChapMap.set(match[1].trim(), match[2].trim());
  }

  // Grupos
  const gRegex = /<grupo\s+[^>]*codgrupo="([^"]+)"[^>]*>[\s\S]*?<nome>([^<]+)<\/nome>/gi;
  while ((match = gRegex.exec(xml)) !== null) {
    xmlGroupMap.set(match[1].trim(), match[2].trim());
  }

  // Categorias (regex abrangente que suporta ehsubcat="sim" e outros atributos)
  const catRegex = /<categoria\s+[^>]*codcat="([^"]+)"[^>]*>[\s\S]*?<nome>([^<]+)<\/nome>/gi;
  while ((match = catRegex.exec(xml)) !== null) {
    xmlCatMap.set(match[1].trim(), match[2].trim());
  }

  // Subcategorias (4 dígitos formatadas como X00.0)
  const subcatRegex = /<subcategoria\s+[^>]*codsubcat="([^"]+)"[^>]*>[\s\S]*?<nome>([^<]+)<\/nome>/gi;
  while ((match = subcatRegex.exec(xml)) !== null) {
    const raw = match[1].trim();
    const formatted = raw.length === 4 ? `${raw.slice(0, 3)}.${raw.slice(3)}` : raw;
    xmlSubcatMap.set(formatted, match[2].trim());
  }

  console.log(`CID10.xml processado com sucesso:`);
  console.log(` - Grupos: ${xmlGroupMap.size}`);
  console.log(` - Categorias: ${xmlCatMap.size}`);
  console.log(` - Subcategorias: ${xmlSubcatMap.size}`);
} else {
  console.warn('Aviso: CID10.xml não encontrado em', xmlPath);
}

// 3. Montar dados estruturados de CID.json (representação fiel e enriquecida do CID.pdf)
const structuredCidsPdf = [];

for (const [code, desc] of pdfCategoriesMap) {
  const officialName = xmlCatMap.get(code) || desc;
  structuredCidsPdf.push({
    codigo: code,
    nome: officialName,
    tipo: 'categoria'
  });
}

for (const [code, desc] of pdfGroupsMap) {
  const officialName = xmlGroupMap.get(code) || desc;
  structuredCidsPdf.push({
    codigo: code,
    nome: officialName,
    tipo: 'grupo'
  });
}

// Ordenar estruturados
structuredCidsPdf.sort((a, b) => a.codigo.localeCompare(b.codigo));

const cidJsonOutput = {
  origem: 'Ministério da Previdência Social / SPS - Monitoramento de Benefícios por Incapacidade (CID.pdf)',
  data_geracao: new Date().toISOString(),
  total_itens: structuredCidsPdf.length,
  total_categorias: pdfCategoriesMap.size,
  total_grupos: pdfGroupsMap.size,
  capitulos: pdfChapters,
  cids: structuredCidsPdf
};

const cidJsonPath = path.join(__dirname, '..', 'cid', 'CID.json');
fs.writeFileSync(cidJsonPath, JSON.stringify(cidJsonOutput, null, 2), 'utf-8');
console.log(`Arquivo CID.json criado em: ${cidJsonPath} (${(fs.statSync(cidJsonPath).size / 1024).toFixed(1)} KB)`);

// 4. Montar o arquivo mestre do aplicativo: src/data/cids.json
// Este arquivo é consumido pelo CidAutocompleteInput na busca rápida.
// Deve conter:
//  a) Todas as categorias e grupos do CID.pdf (com nome oficial completo)
//  b) Todas as categorias do CID10.xml (garantindo 100% de cobertura)
//  c) Todas as subcategorias detalhadas (ex: G12.2, F84.0, G80.0, M54.5) necessárias para prontuários clínicos
//  d) Entradas de CID-O caso existam
const allEntriesMap = new Map();

// Helper para adicionar entrada padronizada
function addEntry(code, name) {
  if (!code || !name) return;
  const cleanCode = code.trim();
  const cleanName = name.trim();
  const entry = `${cleanCode} - ${cleanName}`;
  if (!allEntriesMap.has(cleanCode)) {
    allEntriesMap.set(cleanCode, entry);
  }
}

// Adiciona itens do CID.pdf
for (const item of structuredCidsPdf) {
  addEntry(item.codigo, item.nome);
}

// Adiciona todas as categorias do CID10.xml (garantindo que qualquer categoria com ehsubcat="sim" seja mantida)
for (const [code, name] of xmlCatMap) {
  addEntry(code, name);
}

// Adiciona todas as subcategorias detalhadas
for (const [code, name] of xmlSubcatMap) {
  addEntry(code, name);
}

// Adiciona CID-O caso exista
const cidoPath = path.join(__dirname, '..', 'cid', 'CID-O.xml');
if (fs.existsSync(cidoPath)) {
  const cidoXml = fs.readFileSync(cidoPath, 'latin1');
  const cidoRegex = /<categoria\s+[^>]*codcat="([^"]+)"[^>]*>[\s\S]*?<nome>([^<]+)<\/nome>/gi;
  let countO = 0;
  while ((match = cidoRegex.exec(cidoXml)) !== null) {
    const code = match[1].trim();
    const name = match[2].trim();
    if (!allEntriesMap.has(code)) {
      addEntry(code, name);
      countO++;
    }
  }
  console.log(`Adicionados ${countO} códigos específicos de oncologia (CID-O)`);
}

// Ordenar alfanumericamente por código
const sortedCidList = Array.from(allEntriesMap.values()).sort((a, b) => {
  return a.localeCompare(b, 'pt-BR', { numeric: true, sensitivity: 'base' });
});

const appCidsPath = path.join(__dirname, '..', 'src', 'data', 'cids.json');
fs.writeFileSync(appCidsPath, JSON.stringify(sortedCidList, null, 2), 'utf-8');
console.log(`Arquivo de aplicação src/data/cids.json atualizado:`);
console.log(` - Total de CIDs disponíveis no autocomplete: ${sortedCidList.length}`);
console.log(` - Tamanho do arquivo: ${(fs.statSync(appCidsPath).size / 1024).toFixed(1)} KB`);

// Verificação de CIDs críticos
const testCodes = ['B91', 'B92', 'I10', 'C61', 'A46', 'M54', 'M54.5', 'G12.2', 'F84.0', 'G80.0'];
console.log('\n--- Verificação de CIDs críticos no autocomplete ---');
for (const tc of testCodes) {
  const found = sortedCidList.find(c => c.startsWith(`${tc} -`));
  console.log(` - ${tc}: ${found ? '✓ ' + found : '❌ NÃO ENCONTRADO'}`);
}
console.log('=== Concluído com sucesso! ===');

