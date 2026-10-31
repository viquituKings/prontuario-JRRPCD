// Constantes e dados de auxílio para o Prontuário JRRPCD

export const OPMS_SUGERIDAS = [
  'Cadeira de Rodas Padrão Adulto',
  'Cadeira de Rodas Padrão Infantil',
  'Cadeira de Rodas para Obeso',
  'Cadeira de Rodas Motorizada',
  'Cadeira de Banho com Encosto Reclinável',
  'Cadeira de Banho com Assento Sanitário',
  'Andador Fixo com 4 Pontas',
  'Andador Articulado / com Rodas',
  'Bengala 4 Pontas',
  'Muleta Canadense (par)',
  'Muleta Axilar (par)',
  'Órtese Tornozelo-Pé (AFO / Goteira)',
  'Órtese Joelho-Tornozelo-Pé (KAFO)',
  'Órtese Suropodálica Flexível',
  'Tutor Longo com Articulação',
  'Prótese Transtibial',
  'Prótese Transfemoral',
  'Prótese de Desarticulação de Quadril',
  'Prótese Transradial',
  'Prótese Transumeral',
  'Calçado Ortopédico Sob Medida',
  'Palmilha Sob Medida',
  'Colete Putti / Boston / Milwaukee',
  'Almofada de Gel / Ar para Cadeira de Rodas'
];

export const CIDS_COMUNS = [
  { codigo: 'G80', descricao: 'Paralisia cerebral' },
  { codigo: 'I69', descricao: 'Sequelas de doenças cerebrovasculares (AVC)' },
  { codigo: 'G82', descricao: 'Paraplegia e tetraplegia' },
  { codigo: 'G12.2', descricao: 'Doença do neurônio motor (ELA)' },
  { codigo: 'G35', descricao: 'Esclerose múltipla' },
  { codigo: 'M62.4', descricao: 'Contratura muscular' },
  { codigo: 'M79.7', descricao: 'Fibromialgia' },
  { codigo: 'Q05', descricao: 'Espinha bífida (Mielomeningocele)' },
  { codigo: 'Q66', descricao: 'Deformidades congênitas dos pés' },
  { codigo: 'Q68.0', descricao: 'Deformidades congênitas do joelho' },
  { codigo: 'S88', descricao: 'Amputação traumática da perna' },
  { codigo: 'S78', descricao: 'Amputação traumática do quadril e da coxa' },
  { codigo: 'T92', descricao: 'Sequelas de traumatismo do membro superior' },
  { codigo: 'T93', descricao: 'Sequelas de traumatismo do membro inferior' },
  { codigo: 'E10.5 / E14.5', descricao: 'Diabetes com complicações circulatórias / Pé diabético' },
  { codigo: 'M16', descricao: 'Coxartrose (artrose do quadril)' },
  { codigo: 'M17', descricao: 'Gonartrose (artrose do joelho)' }
];

export const STATUS_PACIENTE = [
  { id: 'triagem', label: 'Triagem / Entrada', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'em_avaliacao', label: 'Em Avaliação', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'aguardando_opm', label: 'Aguardando Fabricação/OPM', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'prova_ajuste', label: 'Prova e Ajuste', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { id: 'concluido', label: 'OPM Concedida / Concluído', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'acompanhamento', label: 'Em Acompanhamento', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  { id: 'arquivado', label: 'Arquivado', color: 'bg-slate-100 text-slate-700 border-slate-200' }
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
 * Calcula a idade a partir da data de nascimento no formato YYYY-MM-DD
 */
export function calcularIdade(dataNascimento) {
  if (!dataNascimento) return '';
  const nascimento = new Date(dataNascimento + 'T00:00:00');
  const hoje = new Date();

  if (isNaN(nascimento.getTime())) return '';

  let anos = hoje.getFullYear() - nascimento.getFullYear();
  let meses = hoje.getMonth() - nascimento.getMonth();
  let dias = hoje.getDate() - nascimento.getDate();

  if (dias < 0) {
    meses--;
  }

  if (meses < 0) {
    anos--;
    meses += 12;
  }

  if (anos < 0) return '0 anos';
  if (anos === 0) {
    if (meses === 0) {
      return `${Math.max(0, dias)} dias`;
    }
    return `${meses} ${meses === 1 ? 'mês' : 'meses'}`;
  }

  return `${anos} ${anos === 1 ? 'ano' : 'anos'}${meses > 0 ? ` e ${meses} m` : ''}`;
}

/**
 * Formata telefone com máscara brasileira (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 */
export function formatarTelefone(valor) {
  if (!valor) return '';
  const digits = valor.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) {
    return `(${digits}`;
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
 * Formata data ISO (YYYY-MM-DD) para PT-BR (DD/MM/AAAA)
 */
export function formatarDataBR(dataIso) {
  if (!dataIso) return '-';
  try {
    const [ano, mes, dia] = dataIso.split('T')[0].split('-');
    if (!ano || !mes || !dia) return dataIso;
    return `${dia}/${mes}/${ano}`;
  } catch {
    return dataIso;
  }
}

/**
 * Formata data e hora para exibição completa
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

// Dados de demonstração para carregar se não houver dados no Firestore/Local
export const PACIENTES_DEMO = [
  {
    id: 'demo-1',
    dataEntrada: '2026-10-15',
    nome: 'Maria Francisca da Silva',
    dataNascimento: '1968-04-12',
    idade: '58 anos e 6 m',
    telefone: '(11) 98452-1144',
    municipio: 'São Paulo',
    esfReferencia: 'ESF Jardim das Flores',
    cid: 'I69.3 - Sequelas de infarto cerebral (Hemiparesia E)',
    tipoOpm: 'Órtese Tornozelo-Pé (AFO / Goteira)',
    status: 'aguardando_opm',
    prontuarioObservacoes: 'Paciente encaminhada pela ESF Jardim das Flores após AVC isquêmico com hemiparesia à esquerda e pé equinovaro. Marcha com claudicação e déficit de dorsiflexão.',
    evolucoes: [
      {
        id: 'evo-1',
        dataHora: '2026-10-15T09:30:00',
        profissional: 'Dra. Camila Rocha (Fisioterapeuta - CREFITO 14829)',
        tipoAtendimento: 'Acolhimento / Triagem Inicial',
        descricao: 'Realizada triagem inicial da paciente acompanhada pela filha. Verificado histórico de AVE há 8 meses. Apresenta hipertonia elástica grau 2 em tríceps sural à esquerda.',
        conduta: 'Solicitada avaliação médica para prescrição de AFO rígida e inclusão no programa de cinesioterapia motora.'
      },
      {
        id: 'evo-2',
        dataHora: '2026-10-22T14:15:00',
        profissional: 'Dr. Roberto Mendes (Médico Fisiatra - CRM 94821)',
        tipoAtendimento: 'Avaliação Médica Fisiátrica / Ortopédica',
        descricao: 'Avaliação clínica confirmando indicação de Órtese Tornozelo-Pé tipo goteira posterior em polipropileno a 90 graus para membro inferior esquerdo.',
        conduta: 'Encaminhada ao setor de órteses para molde gessado. Retorno agendado para prova.'
      }
    ],
    createdAt: '2026-10-15T09:30:00'
  },
  {
    id: 'demo-2',
    dataEntrada: '2026-10-20',
    nome: 'João Lucas Souza Pereira',
    dataNascimento: '2019-08-25',
    idade: '7 anos e 2 m',
    telefone: '(11) 97123-9988',
    municipio: 'Guarulhos',
    esfReferencia: 'UBS Vila Esperança',
    cid: 'G80.0 - Paralisia cerebral espástica quadriparética',
    tipoOpm: 'Cadeira de Rodas Padrão Infantil',
    status: 'prova_ajuste',
    prontuarioObservacoes: 'Criança com diagnóstico de PC quadriparética, sem controle total de tronco, necessita de cadeira de rodas adaptada com apoio de cabeça e cinto torácico.',
    evolucoes: [
      {
        id: 'evo-3',
        dataHora: '2026-10-20T10:00:00',
        profissional: 'Mariana Duarte (Terapeuta Ocupacional - CREFITO 88124)',
        tipoAtendimento: 'Medição e Moldagem de OPM',
        descricao: 'Realizada tomada de medidas antropométricas: largura de quadril 28cm, profundidade de assento 32cm, altura do encosto 45cm. Prescritos apoios laterais e apoio de cabeça anatômico.',
        conduta: 'Encaminhado pedido ao laboratório de tecnologia assistiva. Aguardando entrega da estrutura base para adaptação.'
      }
    ],
    createdAt: '2026-10-20T10:00:00'
  },
  {
    id: 'demo-3',
    dataEntrada: '2026-10-28',
    nome: 'Antônio Carlos de Albuquerque',
    dataNascimento: '1955-11-03',
    idade: '70 anos e 11 m',
    telefone: '(11) 96541-2233',
    municipio: 'Santo André',
    esfReferencia: 'ESF Centro Integrado',
    cid: 'S88.0 - Amputação traumática da perna (nível transtibial D)',
    tipoOpm: 'Prótese Transtibial',
    status: 'em_avaliacao',
    prontuarioObservacoes: 'Paciente diabético pós-amputação transtibial direita há 6 meses. Coto cicatrizado, sem espículas ósseas palpatórias, com bom tônus muscular para protetização.',
    evolucoes: [
      {
        id: 'evo-4',
        dataHora: '2026-10-28T11:00:00',
        profissional: 'Felipe Santos (Protesista / Ortesista)',
        tipoAtendimento: 'Avaliação Inicial',
        descricao: 'Avaliação do coto: formato cônico regular, sensibilidade preservada, força muscular de quadríceps grau 4+. Indicado soquete com liner de silicone e pé dinâmico.',
        conduta: 'Iniciado enfaixamento compressivo de modelagem final. Tiragem de molde em gesso marcada para próxima semana.'
      }
    ],
    createdAt: '2026-10-28T11:00:00'
  }
];
