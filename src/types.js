// Definições de dados para o Prontuário JRRPCD / Gestão de OPM

export const SERVICOS_ESPECIALIZADOS = [
  'OPM',
  'Reab. Intelectual',
  'Reab. Fisica'
];

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

export const CIDS_DATABASE = [
  'F84 - TRANSTORNO DO ESPECTRO AUTISTA (TEA)',
  'F84.0 - AUTISMO INFANTIL',
  'F84.5 - SINDROME DE ASPERGER',
  'F90 - TRANSTORNO DO DÉFICIT DE ATENÇÃO E HIPERATIVIDADE (TDAH)',
  'G12.2 - ESCLEROSE LATERAL AMIOTRÓFICA (ELA)',
  'G20 - DOENÇA DE PARKINSON',
  'I69.4 - SEQUELA DE AVC',
  'Q90 - SÍNDROME DE DOWN',
  'Q05 - MIELOMENINGOCELE',
  'S06 - TRAUMATISMO CRANIOENCEFÁLICO (TCE)',
  'G80 - PARALISIA CEREBRAL',
  'G82 - PARAPLEGIA E TETRAPLEGIA',
  'C32 - NEOPLASIA MALIGNA DA LARINGE',
  'C71 - NEOPLASIA MALIGNA DO ENCÉFALO',
  'S88 - AMPUTAÇÃO TRAUMÁTICA DA PERNA',
  'S78 - AMPUTAÇÃO TRAUMÁTICA DA COXA',
  'M62.4 - CONTRATURA MUSCULAR',
  'E10.5 - DIABETES MELLITUS COM COMPLICAÇÕES CIRCULATÓRIAS'
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
 * Formata data ISO para exibição amigável
 */
export function formatarDataHoraBR(dataIso) {
  if (!dataIso) return '-';
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
    municipio: 'FUNILANDIA',
    esf: '',
    cid: 'G12.2 - ESCLEROSE LATERAL AMIOTRÓFICA (ELA)',
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
    cid: 'F84 - TRANSTORNO DO ESPECTRO AUTISTA (TEA), TDAH',
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
