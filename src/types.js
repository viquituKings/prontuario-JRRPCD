// Definições de dados para o Prontuário JRRPCD / Gestão de OPM

export const SERVICOS_ESPECIALIZADOS = [
  'OPM',
  'Reab. Intelectual',
  'Reab. Fisica',
  'Reab. Visual',
  'Neonato de Risco'
];

/**
 * Retorna as classes Tailwind para o badge do serviço especializado
 */
export function getBadgeColorServico(servico) {
  switch (servico) {
    case 'OPM':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Reab. Intelectual':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'Reab. Fisica':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'Reab. Visual':
    case 'Reabilitação Visual':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Neonato de Risco':
    case 'Neonato de risco':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export const TIPOS_OPM = [
  'MEIO AUXILIAR DE LOCOMOÇÃO',
  'CADEIRA DE RODAS',
  'ÓRTESE',
  'PRÓTESE',
  'CALÇADO ORTOPÉDICO'
];

export const OPMS_SUGERIDAS = [
  'CADEIRA DE RODAS PADRÃO ADULTO',
  'CADEIRA DE RODAS PADRÃO INFANTIL',
  'CADEIRA MOTORIZADA',
  'CADEIRA DE BANHO COM ENCOSTO RECLINÁVEL',
  'CADEIRA DE BANHO COM ASSENTO SANITÁRIO',
  'MULETA CANADENSE',
  'MULETA AXILAR',
  'ANDADOR FIXO 4 PONTAS',
  'ANDADOR ARTICULADO / COM RODAS',
  'BENGALA 4 PONTAS',
  'ÓRTESE TORNOZELO-PÉ (AFO / GOTEIRA)',
  'ÓRTESE JOELHO-TORNOZELO-PÉ (KAFO)',
  'ÓRTESE SUROPODÁLICA FLEXÍVEL',
  'PRÓTESE TRANSTIBIAL',
  'PRÓTESE TRANSFEMORAL',
  'CALÇADO ORTOPÉDICO SOB MEDIDA',
  'PALMILHA SOB MEDIDA',
  'ALMOFADA DE GEL / AR'
];

// CIDs oficiais compatíveis com a concessão de Cadeira de Rodas Motorizada (Protocolo SUS)
export const CIDS_MOTORIZADA_COMPATIVEIS = [
  'B91', 'E849', 'G112', 'G118', 'G120', 'G121', 'G122', 'G128', 'G129',
  'G35', 'G379', 'G629', 'G710', 'G712', 'G729', 'G800', 'G803',
  'G810', 'G811', 'G819', 'G823', 'G824', 'G825', 'I694',
  'Q051', 'Q052', 'Q056', 'Q743', 'Q748', 'Q780', 'T093', 'Z899'
];

export const CIDS_MOTORIZADA_FORMATADOS = [
  'B91 (Sequelas de poliomielite)',
  'E84.9 (Fibrose cística)',
  'G11.2 (Ataxia cerebelar de início tardio)',
  'G11.8 (Outras ataxias hereditárias)',
  'G12.0 (Atrofia muscular espinal tipo I)',
  'G12.1 (Outras atrofias musculares espinais)',
  'G12.2 (Doença do neurônio motor - ELA)',
  'G12.8 (Outras atrofias musculares espinais)',
  'G12.9 (Atrofia muscular espinal NE)',
  'G35 (Esclerose múltipla)',
  'G37.9 (Doença desmielinizante do SNC)',
  'G62.9 (Polineuropatia não especificada)',
  'G71.0 (Distrofia muscular)',
  'G71.2 (Miopatias congênitas)',
  'G72.9 (Miopatia NE)',
  'G80.0 (Paralisia cerebral quadriparética)',
  'G80.3 (Paralisia cerebral discinética)',
  'G81.0 (Hemiplegia flácida)',
  'G81.1 (Hemiplegia espástica)',
  'G81.9 (Hemiplegia NE)',
  'G82.3 (Tetraplegia flácida)',
  'G82.4 (Tetraplegia espástica)',
  'G82.5 (Tetraplegia NE)',
  'I69.4 (Sequelas de AVC)',
  'Q05.1 (Espinha bífida torácica)',
  'Q05.2 (Espinha bífida lombar c/ hidrocefalia)',
  'Q05.6 (Espinha bífida lombar s/ hidrocefalia)',
  'Q74.3 (Artrogripose congênita múltipla)',
  'Q74.8 (Outras anomalias congênitas de membros)',
  'Q78.0 (Osteogênese imperfeita)',
  'T09.3 (Traumatismo da medula espinhal)',
  'Z89.9 (Amputação de membro NE)'
];

/**
 * Extrai o código limpo do CID para comparação (ex: 'G12.2 - ELA' -> 'G122')
 */
export function extrairCodigoCid(cidStr) {
  if (!cidStr) return '';
  const firstPart = cidStr.split('-')[0].trim();
  return firstPart.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

/**
 * Verifica se a lista de CIDs possui ao menos um CID compatível com Cadeira Motorizada
 */
export function verificarCompatibilidadeMotorizada(cids = []) {
  let list = [];
  if (Array.isArray(cids)) {
    list = cids;
  } else if (typeof cids === 'string') {
    list = cids.split(/[;,]/).map((c) => c.trim()).filter(Boolean);
  }

  const compativeis = [];

  for (const cidItem of list) {
    if (!cidItem) continue;
    const cleanCode = extrairCodigoCid(cidItem);
    if (!cleanCode) continue;

    const match = CIDS_MOTORIZADA_COMPATIVEIS.find((cComp) => {
      return cleanCode === cComp || cleanCode.startsWith(cComp) || cComp.startsWith(cleanCode);
    });

    if (match) {
      compativeis.push(cidItem);
    }
  }

  return {
    isCompativel: compativeis.length > 0,
    compativeis,
    totalCids: list.filter(Boolean).length
  };
}

/**
 * Identifica se Cadeira Motorizada foi assinalada na lista de OPMs ou campo texto
 */
export function isMotorizadaSolicitada(opmList = [], tipoOpm = '') {
  if (Array.isArray(opmList)) {
    const found = opmList.some((o) => {
      const tipo = (o.tipo || '').toUpperCase();
      const sol = (o.solicitada || '').toUpperCase();
      return sol.includes('MOTORIZADA') || tipo.includes('MOTORIZADA');
    });
    if (found) return true;
  }
  if (typeof tipoOpm === 'string') {
    return tipoOpm.toUpperCase().includes('MOTORIZADA');
  }
  return false;
}

/**
 * Verifica se o paciente possui ao menos uma OPM solicitada.
 * O preenchimento de dispositivos deferidos no formulário de prontuário deve estar disponível
 * exclusivamente para pacientes com OPM solicitados.
 */
export function temOpmSolicitada(patient) {
  if (!patient) return false;

  // 1. Verifica se há OPM preenchida na lista opm_list
  if (Array.isArray(patient.opm_list) && patient.opm_list.length > 0) {
    const hasValidOpm = patient.opm_list.some(
      (o) => o && typeof o.solicitada === 'string' && o.solicitada.trim().length > 0
    );
    if (hasValidOpm) return true;
  }

  // 2. Verifica no campo tipoOpm (compatibilidade legada) se não for apenas o nome de um serviço
  if (typeof patient.tipoOpm === 'string' && patient.tipoOpm.trim().length > 0) {
    const cleanTipo = patient.tipoOpm.trim().toLowerCase();
    const servicosIgnorados = [
      'opm',
      'reab. intelectual',
      'reab. intelectual;',
      'reab. fisica',
      'reab. fisica;',
      'reab. visual',
      'reab. visual;',
      'reabilitação visual',
      'neonato de risco',
      'neonato de risco;'
    ];
    if (!servicosIgnorados.includes(cleanTipo)) {
      return true;
    }
  }

  return false;
}

// Municípios da Microrregião de Saúde / Referência Regional
export const MUNICIPIOS_SUGERIDOS = [
  'SETE LAGOAS',
  'ARAÇAI',
  'BALDIM',
  'BIQUINHAS',
  'CACHOEIRA DA PRATA',
  'CAETANOPOLIS',
  'CAPIM BRANCO',
  'CENDRO DE ABAETE',
  'CORDISBURGO',
  'FORTUNA DE MINAS',
  'FUNILÂNDIA',
  'INHAUMA',
  'JEQUITIBÁ',
  'MARAVILHAS',
  'MORADA NOVA DE MINAS',
  'PAINEIRAS',
  'PAPAGAIOS',
  'PARAOPEBA',
  'POMPEU',
  'PRUDENTE DE MORAIS',
  'QUARTEL GERAL',
  'SANTANA DE PIRAPAMA'
];

// Unidades Básicas de Saúde e ESFs de Referência
export const ESFS_SUGERIDAS = [
  "ESF ALVORADA",
  "ESF PLANALTO",
  "ESF RURAL",
  "ESF JK",
  "ESF MÓVEL",
  "ESF MANOA",
  "ESF N. S. GRAÇAS",
  "ESF SANTA CRUZ",
  "ESF SÃO FRANCISCO",
  "ESF N. S. DO CARMO",
  "EAP MANOA",
  "EAP MONTREAL",
  "ESF SÃO JOÃO I",
  "ESF SÃO JOÃO II",
  "ESF BRASÍLIA",
  "ESF CANADÁ",
  "ESF CDI I",
  "ESF CDI II",
  "ESF EMILIA",
  "ESF ITAPOÃ I",
  "ESF ITAPOÃ II",
  "ESF MONTE CARLO",
  "ESF MONTREAL",
  "ESF BARREIRO I",
  "ESF BARREIRO II",
  "EAP VÁRZEA",
  "ESF CATARINA",
  "ESF ELDORADO",
  "ESF FAZENDA VELHA",
  "ESF IPORANGA",
  "ESF MORRO DO CLARO",
  "ESF PADRE TEODORO",
  "ESF PROGRESSO",
  "ESF SÃO GERALDO",
  "ESF UNIÃO",
  "C.S. OROZIMBO MACEDO",
  "ESF KWAIT",
  "ESF CAMPO VERDE",
  "ESF ESPERANÇA",
  "ESF JARDIM DOS PEQUISES",
  "ESF JARDIM EUROPA",
  "ESF BELO VALE I",
  "ESF BELO VALE II",
  "ESF VERDE VALE",
  "ESF BERNARDO VALADARES",
  "ESF NOVA CIDADE",
  "ESF OROZIMBO MACEDO",
  "EAP SANTA LUZIA",
  "EAP SANTO ANTÔNIO",
  "ESF SANTO ANTÔNIO",
  "ESF SANTA HELENA",
  "ESF SANTA LUZIA I",
  "ESF SANTA LUZIA II",
  "ESF BOA VISTA",
  "ESF FÁTIMA",
  "ESF SANTA ROSA",
  "ESF BOUGANVILLE",
  "ESF CIDADE DE DEUS I",
  "ESF CIDADE DE DEUS II",
  "ESF INTERLAGOS",
  "ESF JARDIM PRIMAVERA",
  "ESF LUXEMBURGO",
  "ESF AEROPORTO",
  "ESF SANTA FELICIDADE",
  "ESF DONA SÍLVIA",
  "ESF CAMPESTRE",
  "ESF BELA VISTA"
];

export const TIPOS_ATENDIMENTO = [
  'Acolhimento / Triagem Inicial',
  'Avaliação Médica Fisiátrica / Ortopédica',
  'Avaliação Fisioterapêutica',
  'Avaliação Terapia Ocupacional',
  'Medição e Moldagem de OPM',
  'Prova / Ajuste de OPM',
  'Entrega e Orientações de OPM',
  'Treino de Marcha / Uso de Meio Auxiliar',
  'Evolução de Retorno / Acompanhamento',
  'Visita Domiciliar',
  'Atendimento do Serviço Social'
];

/**
 * Remove acentos e normaliza texto para busca insensível
 */
export function normalizarTexto(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

/**
 * Remove acentos, tremas e cedilhas de nomes de pacientes e mães (Padrão SUS / CADSUS)
 */
export function removerAcentos(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

/**
 * Gera uma chave identificadora única para o paciente para desduplicação
 * (CPF ou combinação de Nome + Nome da Mãe + Data de Nascimento)
 */
export function getChaveIdentificacaoPaciente(p) {
  if (!p) return '';
  const cpfDigits = (p.cpf || '').replace(/\D/g, '');
  if (cpfDigits.length === 11) {
    return `CPF_${cpfDigits}`;
  }
  const nomeNorm = normalizarTexto(p.nome || '');
  const maeNorm = normalizarTexto(p.nome_mae || p.nomeMae || '');
  const dnVal = (p.dn || p.dataNascimento || '').trim();
  return `PAC_${nomeNorm}|MAE_${maeNorm}|DN_${dnVal}`;
}

/**
 * Retorna a lista de pacientes únicos a partir da relação total de registros
 */
export function extrairPacientesUnicos(pacientes = []) {
  if (!Array.isArray(pacientes)) return [];
  const mapa = new Map();
  for (const p of pacientes) {
    if (!p) continue;
    const chave = getChaveIdentificacaoPaciente(p);
    if (!mapa.has(chave)) {
      mapa.set(chave, p);
    }
  }
  return Array.from(mapa.values());
}

/**
 * Converte data BR (DD/MM/AAAA) ou ISO para objeto Date para comparação
 */
function parseDataBR(dataStr) {
  if (!dataStr) return null;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataStr)) {
    const [d, m, y] = dataStr.split('/');
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  const d = new Date(dataStr);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Agrupa registros de pacientes pelo identificador único (CPF ou Nome + Mãe + DN),
 * unificando serviços, OPMs, CIDs e evoluções em um único registro de paciente.
 */
export function agruparPacientesPorPessoa(pacientes = []) {
  if (!Array.isArray(pacientes)) return [];

  const mapa = new Map();

  for (const p of pacientes) {
    if (!p) continue;
    const chave = getChaveIdentificacaoPaciente(p);

    if (!mapa.has(chave)) {
      const servicoInicial = p.servico_especializado || 'OPM';

      const opmsIniciais = [];
      if (Array.isArray(p.opm_list)) {
        p.opm_list.forEach((o) => {
          if (o && (o.solicitada || o.tipo)) {
            opmsIniciais.push({
              tipo: o.tipo || 'OPM',
              solicitada: (o.solicitada || '').trim()
            });
          }
        });
      } else if (p.tipoOpm) {
        opmsIniciais.push({
          tipo: 'OPM',
          solicitada: p.tipoOpm.trim()
        });
      }

      const cidsIniciais = [];
      if (Array.isArray(p.cid_list)) {
        cidsIniciais.push(...p.cid_list);
      } else if (p.cid) {
        cidsIniciais.push(...p.cid.split(/[;]/).map((c) => c.trim()).filter(Boolean));
      }

      const evolucoesIniciais = Array.isArray(p.evolucoes) ? [...p.evolucoes] : [];

      mapa.set(chave, {
        ...p,
        chaveIdentificacao: chave,
        ids: [p.id],
        registros: [p],
        totalServicos: 1,
        servicos: [servicoInicial],
        opm_list: opmsIniciais,
        cid_list: Array.from(new Set(cidsIniciais)),
        evolucoes: evolucoesIniciais
      });
    } else {
      const existente = mapa.get(chave);
      existente.ids.push(p.id);
      existente.registros.push(p);
      existente.totalServicos += 1;

      // Unifica serviços sem duplicatas
      const novoServico = p.servico_especializado || 'OPM';
      if (!existente.servicos.includes(novoServico)) {
        existente.servicos.push(novoServico);
      }

      // Preserva a data de entrada mais antiga
      const dataExistente = existente.data_entrada || existente.dataEntrada;
      const dataNova = p.data_entrada || p.dataEntrada;
      if (dataNova && dataExistente) {
        const dEx = parseDataBR(dataExistente);
        const dNv = parseDataBR(dataNova);
        if (dNv && dEx && dNv < dEx) {
          existente.data_entrada = dataNova;
          existente.dataEntrada = dataNova;
        }
      } else if (!dataExistente && dataNova) {
        existente.data_entrada = dataNova;
        existente.dataEntrada = dataNova;
      }

      // Unifica OPMs sem duplicatas
      if (Array.isArray(p.opm_list)) {
        p.opm_list.forEach((o) => {
          if (o && (o.solicitada || o.tipo)) {
            const limpa = {
              tipo: o.tipo || 'OPM',
              solicitada: (o.solicitada || '').trim()
            };
            const jaExiste = existente.opm_list.some(
              (item) => item.tipo === limpa.tipo && item.solicitada.toUpperCase() === limpa.solicitada.toUpperCase()
            );
            if (!jaExiste) {
              existente.opm_list.push(limpa);
            }
          }
        });
      } else if (p.tipoOpm) {
        const limpa = { tipo: 'OPM', solicitada: p.tipoOpm.trim() };
        const jaExiste = existente.opm_list.some(
          (item) => item.solicitada.toUpperCase() === limpa.solicitada.toUpperCase()
        );
        if (!jaExiste) {
          existente.opm_list.push(limpa);
        }
      }

      // Unifica CIDs sem duplicatas
      const novosCids = Array.isArray(p.cid_list)
        ? p.cid_list
        : p.cid ? p.cid.split(/[;]/).map((c) => c.trim()).filter(Boolean) : [];

      for (const nc of novosCids) {
        if (!existente.cid_list.some((ec) => ec.toUpperCase() === nc.toUpperCase())) {
          existente.cid_list.push(nc);
        }
      }

      // Unifica Evoluções sem duplicatas
      if (Array.isArray(p.evolucoes)) {
        for (const evo of p.evolucoes) {
          if (!evo) continue;
          const jaTem = existente.evolucoes.some((e) => {
            if (e.id && evo.id && e.id === evo.id) return true;
            return e.dataHora === evo.dataHora && e.descricao === evo.descricao;
          });
          if (!jaTem) {
            existente.evolucoes.push(evo);
          }
        }
      }

      // Completa dados cadastrais que possam estar em branco no registro primário
      if (!existente.cpf && p.cpf) existente.cpf = p.cpf;
      if (!existente.telefone && p.telefone) existente.telefone = p.telefone;
      if (!existente.nome_mae && (p.nome_mae || p.nomeMae)) existente.nome_mae = p.nome_mae || p.nomeMae;
      if (!existente.municipio && p.municipio) existente.municipio = p.municipio;
      if (!existente.esf && p.esf) existente.esf = p.esf;
      if (!existente.dn && (p.dn || p.dataNascimento)) existente.dn = p.dn || p.dataNascimento;
      if (!existente.observacoes && p.observacoes) existente.observacoes = p.observacoes;
    }
  }

  // Pós-processamento das strings e ordenação de evoluções
  return Array.from(mapa.values()).map((pac) => {
    if (Array.isArray(pac.evolucoes) && pac.evolucoes.length > 1) {
      pac.evolucoes.sort((a, b) => {
        const dataA = a.dataHora || a.data || '';
        const dataB = b.dataHora || b.data || '';
        return dataB.localeCompare(dataA);
      });
    }

    pac.cid = pac.cid_list.join('; ');
    pac.tipoOpm = pac.opm_list.map((o) => `${o.tipo}: ${o.solicitada}`).join('; ');

    return pac;
  });
}

/**
 * Retorna a contagem total de OPMs solicitadas em todos os registros
 */
export function contarOpmsSolicitadas(pacientes = []) {
  if (!Array.isArray(pacientes)) return 0;
  let total = 0;
  for (const p of pacientes) {
    if (!p) continue;
    if (temOpmSolicitada(p)) {
      if (p.opm_list && Array.isArray(p.opm_list) && p.opm_list.length > 0) {
        const validOpms = p.opm_list.filter((o) => o.solicitada && o.solicitada.trim());
        total += validOpms.length > 0 ? validOpms.length : 1;
      } else if (p.tipoOpm) {
        const itens = p.tipoOpm.split(/[;]/).map((s) => s.trim()).filter(Boolean);
        total += itens.length > 0 ? itens.length : 1;
      } else {
        total += 1;
      }
    }
  }
  return total;
}

/**
 * Retorna a data atual no formato DD/MM/AAAA
 */
export function getHojeBR() {
  const hoje = new Date();
  const dia = String(hoje.getDate()).padStart(2, '0');
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const ano = hoje.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

/**
 * Validação do algoritmo oficial do CPF brasileiro
 */
export function validarCPF(cpf) {
  if (!cpf) return true; // Campo não obrigatório: se vazio, considera válido
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(digits.charAt(i), 10) * (10 - i);
  }
  let resto = 11 - (soma % 11);
  let digito1 = resto >= 10 ? 0 : resto;
  if (digito1 !== parseInt(digits.charAt(9), 10)) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(digits.charAt(i), 10) * (11 - i);
  }
  resto = 11 - (soma % 11);
  let digito2 = resto >= 10 ? 0 : resto;
  if (digito2 !== parseInt(digits.charAt(10), 10)) return false;

  return true;
}

/**
 * Formata CPF: 000.000.000-00
 */
export function formatarCPF(valor) {
  if (!valor) return '';
  const digits = valor.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/**
 * Calcula a idade com precisão a partir de data em formato DD/MM/AAAA ou YYYY-MM-DD
 */
export function calcularIdade(dataNasc) {
  if (!dataNasc) return '';
  let dia, mes, ano;

  if (typeof dataNasc === 'string' && dataNasc.includes('/')) {
    const parts = dataNasc.split('/');
    if (parts.length >= 3) {
      dia = parseInt(parts[0], 10);
      mes = parseInt(parts[1], 10) - 1;
      ano = parseInt(parts[2], 10);
    }
  } else if (typeof dataNasc === 'string' && dataNasc.includes('-')) {
    const parts = dataNasc.split('-');
    if (parts.length >= 3) {
      ano = parseInt(parts[0], 10);
      mes = parseInt(parts[1], 10) - 1;
      dia = parseInt(parts[2], 10);
    }
  }

  if (!ano || isNaN(ano) || ano < 1900 || isNaN(dia) || isNaN(mes)) return '';

  const nasc = new Date(ano, mes, dia);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();

  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
    idade--;
  }

  return idade >= 0 ? idade : '';
}

/**
 * Formata telefone brasileiro
 */
export function formatarTelefone(valor) {
  if (!valor) return '';
  const digits = valor.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Formata data de entrada/nascimento no formato DD/MM/AAAA
 */
export function formatarMascaraData(valor) {
  if (!valor) return '';
  const digits = valor.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

/**
 * Formata data (YYYY-MM-DD, DD/MM/AAAA ou ISO) para DD/MM/AAAA
 */
export function formatarDataBR(dataStr) {
  if (!dataStr) return '-';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
    const [ano, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}/${ano}`;
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataStr)) {
    return dataStr;
  }
  try {
    const d = new Date(dataStr);
    if (isNaN(d.getTime())) return dataStr;
    return d.toLocaleDateString('pt-BR');
  } catch {
    return dataStr;
  }
}

/**
 * Formata data ISO para exibição amigável
 */
export function formatarDataHoraBR(dataIso) {
  if (!dataIso) return '-';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dataIso)) {
    return formatarDataBR(dataIso);
  }
  try {
    const d = new Date(dataIso);
    if (isNaN(d.getTime())) return dataIso;
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dataIso;
  }
}

/**
 * Extrai a lista de dispositivos deferidos de uma evolução de forma estruturada.
 * Suporta array `dispositivosDeferidos`, string `descricaoDispositivo` e texto em `descricao`.
 */
export function extrairDispositivosDeferidos(evo) {
  if (!evo) return [];

  // 1. Se já está salvo como array estruturado
  if (Array.isArray(evo.dispositivosDeferidos) && evo.dispositivosDeferidos.length > 0) {
    return evo.dispositivosDeferidos
      .filter((d) => d && (d.dispositivo || d.nome))
      .map((d) => ({
        dispositivo: (d.dispositivo || d.nome || '').trim(),
        data: d.data ? formatarDataBR(d.data) : ''
      }));
  }

  // 2. Se está como string em descricaoDispositivo
  if (typeof evo.descricaoDispositivo === 'string' && evo.descricaoDispositivo.trim()) {
    return evo.descricaoDispositivo
      .split(/[;|\n]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((text) => {
        const match = text.match(/^(.*?)(?:\s*\((?:Deferido em:\s*)?(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})\))?$/i);
        if (match && match[1]?.trim()) {
          return {
            dispositivo: match[1].trim(),
            data: match[2] ? formatarDataBR(match[2].trim()) : ''
          };
        }
        return { dispositivo: text, data: '' };
      });
  }

  // 3. Se está como string em descricao iniciando por "Dispositivo(s) Deferido(s):"
  if (typeof evo.descricao === 'string' && evo.descricao.includes('Dispositivo(s) Deferido(s):')) {
    const raw = evo.descricao.replace(/Dispositivo\(s\)\s*Deferido\(s\):\s*/i, '');
    return raw
      .split(/[;|\n]/)
      .map((item) => item.trim())
      .filter((item) => item && !/^observa[çc][ãa]o/i.test(item))
      .map((text) => {
        const match = text.match(/^(.*?)(?:\s*\((\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})\))?$/i);
        if (match && match[1]?.trim()) {
          return {
            dispositivo: match[1].trim(),
            data: match[2] ? formatarDataBR(match[2].trim()) : ''
          };
        }
        return { dispositivo: text, data: '' };
      });
  }

  return [];
}

// Pacientes de demonstração com os campos atualizados
export const PACIENTES_DEMO = [
  {
    id: '1',
    data_entrada: '02/01/2026',
    nome: 'LUCIO CANDIDO DE OLIVEIRA',
    cpf: '123.456.789-00',
    nome_mae: 'MARIA APARECIDA DE OLIVEIRA',
    dn: '11/09/1956',
    idade: 69,
    telefone: '(31) 98545-8648',
    municipio: 'FUNILÂNDIA',
    esf: 'ESF CENTRO - FUNILÂNDIA',
    cid_list: [
      'G12.2 - Doença do neurônio motor (ELA)',
      'G82.0 - Paraplegia flácida'
    ],
    cid: 'G12.2 - Doença do neurônio motor (ELA); G82.0 - Paraplegia flácida',
    servico_especializado: 'OPM',
    opm_list: [
      { tipo: 'MEIO AUXILIAR DE LOCOMOÇÃO', solicitada: 'MULETA CANADENSE' },
      { tipo: 'CADEIRA DE RODAS', solicitada: 'CADEIRA MOTORIZADA' }
    ],
    observacoes: 'CADEIRA DE RODAS MOTORIZADA - RECEBIMENTO EM 19/05/2026;',
    evolucoes: [
      {
        id: 'evo-1',
        dataHora: '2026-02-04T10:00:00',
        profissional: 'Dr. Roberto Mendes (Médico Fisiatra - CRM 94821)',
        tipoAtendimento: 'Avaliação Médica Fisiátrica / Ortopédica',
        descricao: 'Paciente avaliado na Junta Regional CER II. Confirmada indicação clínica para meio auxiliar e cadeira motorizada.',
        conduta: 'Encaminhado ao setor de tecnologia assistiva para medição e laudo definitivo de concessão.'
      }
    ],
    createdAt: '2026-01-02T09:00:00'
  },
  {
    id: '2',
    data_entrada: '05/01/2026',
    nome: 'TIAGO VIDAL ALVES SOARES',
    cpf: '',
    nome_mae: 'ANA PAULA ALVES SOARES',
    dn: '26/04/2018',
    idade: 8,
    telefone: '(31) 98311-3240',
    municipio: 'SETE LAGOAS',
    esf: 'ESF MORRO DO CLARO',
    cid_list: [
      'F84.0 - Autismo infantil',
      'F90.0 - Distúrbios da atividade e da atenção (TDAH)'
    ],
    cid: 'F84.0 - Autismo infantil; F90.0 - Distúrbios da atividade e da atenção (TDAH)',
    servico_especializado: 'Reab. Intelectual',
    opm_list: [],
    observacoes: 'ENCAMINHADO PARA TERAPIA OCUPACIONAL E PSICOPEDAGOGIA NO CENTRO DE AUTISMO.',
    evolucoes: [
      {
        id: 'evo-2',
        dataHora: '2026-05-08T14:30:00',
        profissional: 'Mariana Duarte (Terapeuta Ocupacional - CREFITO 88124)',
        tipoAtendimento: 'Avaliação Terapia Ocupacional',
        descricao: 'Avaliação do perfil sensorial e habilidades de vida diária. Criança comunicativa com hiperfoco e hipersensibilidade auditiva.',
        conduta: 'Iniciado plano terapêutico individual com foco em integração sensorial e adaptações escolares.'
      }
    ],
    createdAt: '2026-01-05T10:30:00'
  }
];
