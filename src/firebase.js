import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { PACIENTES_DEMO } from './types';
import { registrarAuditoria } from './audit';

const STORAGE_KEY_CONFIG = 'jrrpcd_firebase_config';
const STORAGE_KEY_LOCAL_DATA = 'jrrpcd_local_pacientes';
const STORAGE_KEY_LOCAL_ARQUIVO_MORTO = 'jrrpcd_local_arquivo_morto';

/**
 * Obtém as credenciais do Firebase:
 * 1. Do localStorage (se configurado pelo usuário na interface)
 * 2. Das variáveis de ambiente (VITE_FIREBASE_*)
 */
export function getStoredFirebaseConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.apiKey && parsed.projectId) {
        return { ...parsed, source: 'localStorage' };
      }
    }
  } catch (e) {
    console.warn('Erro ao ler config do localStorage:', e);
  }

  // Fallback para variáveis de ambiente ou projeto configurado
  const envConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBENg7P18TKIJuowfLe7gm9MS8vNYoI9A8',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'prontuariojrrcpd.firebaseapp.com',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'prontuariojrrcpd',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'prontuariojrrcpd.firebasestorage.app',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '363815324732',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:363815324732:web:44e9a040fc2b7dd52d8739',
  };

  if (envConfig.apiKey && envConfig.projectId) {
    return { ...envConfig, source: 'env' };
  }

  return null;
}

let firebaseApp = null;
let firestoreDb = null;

export function getDb() {
  if (firestoreDb) return firestoreDb;

  const config = getStoredFirebaseConfig();
  if (config && config.apiKey && config.projectId) {
    try {
      firebaseApp = getApps().length === 0 ? initializeApp(config) : getApp();
      firestoreDb = getFirestore(firebaseApp);
      return firestoreDb;
    } catch (err) {
      console.error('Falha ao inicializar Firebase:', err);
      return null;
    }
  }
  return null;
}

export function saveFirebaseConfig(config) {
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  // Limpa instâncias para recarregar
  firestoreDb = null;
  firebaseApp = null;
  return getDb();
}

export function clearFirebaseConfig() {
  localStorage.removeItem(STORAGE_KEY_CONFIG);
  firestoreDb = null;
  firebaseApp = null;
}

export function isFirebaseActive() {
  const db = getDb();
  return db !== null;
}

// ==========================================
// OPERAÇÕES DE DADOS (FIRESTORE COM FALLBACK LOCAL)
// ==========================================

function getLocalPacientes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOCAL_DATA);
    if (raw) {
      return JSON.parse(raw);
    }
    // Inicializa com dados demo
    localStorage.setItem(STORAGE_KEY_LOCAL_DATA, JSON.stringify(PACIENTES_DEMO));
    return PACIENTES_DEMO;
  } catch (e) {
    console.error('Erro ao ler pacientes locais:', e);
    return PACIENTES_DEMO;
  }
}

function saveLocalPacientes(pacientes) {
  try {
    localStorage.setItem(STORAGE_KEY_LOCAL_DATA, JSON.stringify(pacientes));
  } catch (e) {
    console.error('Erro ao salvar pacientes locais:', e);
  }
}

/**
 * Assina lista de pacientes em tempo real
 */
export function subscribePacientes(onUpdate, onError) {
  const db = getDb();

  if (db) {
    try {
      const q = query(collection(db, 'pacientes'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const pacientes = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          })).sort((a, b) => {
            const timeA = new Date(a.createdAt || a.updatedAt || 0).getTime();
            const timeB = new Date(b.createdAt || b.updatedAt || 0).getTime();
            return timeB - timeA;
          });
          onUpdate(pacientes);
        },
        (error) => {
          console.error('Erro no snapshot do Firestore:', error);
          if (onError) onError(error);
          // Fallback para local se o Firestore falhar por regras ou conexão
          const locais = getLocalPacientes();
          onUpdate(locais);
        }
      );
      return unsubscribe;
    } catch (err) {
      console.error('Erro ao conectar ao Firestore:', err);
      if (onError) onError(err);
      const locais = getLocalPacientes();
      onUpdate(locais);
      return () => {};
    }
  } else {
    // Modo local / Fallback
    const locais = getLocalPacientes();
    onUpdate(locais);

    const handleStorageChange = () => {
      onUpdate(getLocalPacientes());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }
}

/**
 * Cria ou atualiza um paciente com carimbo de auditoria
 */
export async function salvarPaciente(pacienteData, usuario) {
  const db = getDb();
  const id = pacienteData.id || (db ? doc(collection(db, 'pacientes')).id : `paciente_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
  const nowIso = new Date().toISOString();
  const isNovo = !pacienteData.id;

  const payload = {
    ...pacienteData,
    id,
    updatedAt: nowIso,
    evolucoes: pacienteData.evolucoes || []
  };

  // Carimbo do usuário e data/hora
  const userUsername = usuario?.username || 'sistema';
  const userNome = usuario?.nome || usuario?.username || 'Sistema';

  if (isNovo) {
    payload.createdAt = nowIso;
    payload.criadoPor = userUsername;
    payload.criadoPorNome = userNome;
    payload.criadoEm = nowIso;
  } else {
    // Mantém criação original caso exista
    payload.createdAt = pacienteData.createdAt || nowIso;
    payload.criadoPor = pacienteData.criadoPor || userUsername;
    payload.criadoPorNome = pacienteData.criadoPorNome || userNome;
    payload.criadoEm = pacienteData.criadoEm || pacienteData.createdAt || nowIso;
  }

  // Carimbo da última alteração
  payload.atualizadoPor = userUsername;
  payload.atualizadoPorNome = userNome;
  payload.atualizadoEm = nowIso;

  // Remove qualquer propriedade undefined antes de enviar ao Firestore
  const cleanPayload = {};
  for (const [k, v] of Object.entries(payload)) {
    if (v !== undefined) {
      cleanPayload[k] = v;
    }
  }

  if (db) {
    try {
      const docRef = doc(db, 'pacientes', id);
      await setDoc(docRef, cleanPayload, { merge: true });
    } catch (err) {
      console.error('Erro ao salvar no Firestore:', err);
      throw err;
    }
  } else {
    // Salva localmente
    const locais = getLocalPacientes();
    const index = locais.findIndex((p) => p.id === id);
    if (index >= 0) {
      locais[index] = cleanPayload;
    } else {
      locais.unshift(cleanPayload);
    }
    saveLocalPacientes(locais);
    window.dispatchEvent(new Event('storage'));
  }

  // Registra carimbo na auditoria
  try {
    await registrarAuditoria({
      acao: isNovo ? 'CADASTRO_PACIENTE' : 'ALTERACAO_PACIENTE',
      detalhes: isNovo 
        ? `Paciente "${cleanPayload.nome}" cadastrado no sistema.` 
        : `Cadastro do paciente "${cleanPayload.nome}" foi alterado.`,
      pacienteId: id,
      pacienteNome: cleanPayload.nome,
      usuario
    });
  } catch (auditErr) {
    console.warn('Falha ao gravar auditoria do paciente:', auditErr);
  }

  return { success: true, id, mode: db ? 'firestore' : 'local' };
}

/**
 * Remove um paciente com carimbo de auditoria
 */
export async function excluirPaciente(pacienteId, pacienteNome = '', usuario = null) {
  const db = getDb();

  if (db) {
    try {
      await deleteDoc(doc(db, 'pacientes', pacienteId));
    } catch (err) {
      console.error('Erro ao excluir no Firestore:', err);
      throw err;
    }
  } else {
    const locais = getLocalPacientes();
    const filtrados = locais.filter((p) => p.id !== pacienteId);
    saveLocalPacientes(filtrados);
    window.dispatchEvent(new Event('storage'));
  }

  // Registra carimbo na auditoria
  try {
    await registrarAuditoria({
      acao: 'EXCLUSAO_PACIENTE',
      detalhes: `Paciente "${pacienteNome || pacienteId}" foi excluído do sistema.`,
      pacienteId,
      pacienteNome,
      usuario
    });
  } catch (auditErr) {
    console.warn('Falha ao registrar auditoria de exclusão de paciente:', auditErr);
  }

  return { success: true, mode: db ? 'firestore' : 'local' };
}

/**
 * Importa uma lista de registros em lote (via CSV) para o Arquivo Morto com carimbo de auditoria
 */
export async function importarArquivoMortoLote(registros = [], usuario = null) {
  if (!Array.isArray(registros) || registros.length === 0) {
    throw new Error('Nenhum registro válido para importar.');
  }

  const db = getDb();
  const nowIso = new Date().toISOString();
  const userUsername = usuario?.username || 'sistema';
  const userNome = usuario?.nome || usuario?.username || 'Sistema';

  const payloads = registros.map((reg, index) => {
    const id = db
      ? doc(collection(db, 'arquivo_morto')).id
      : `arq_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 7)}`;

    const nomeFinal = (reg.nome || '').trim().toUpperCase();
    const dnFinal = (reg.dn || reg.dataNascimento || '').trim();
    const dataSaidaFinal = (reg.dataSaida || '').trim();
    const pastaFinal = (reg.pasta || '').trim().toUpperCase();
    const obsFinal = (reg.observacoes || '').trim();

    return sanitizeValue({
      id,
      nome: nomeFinal,
      dn: dnFinal,
      dataNascimento: dnFinal,
      dataSaida: dataSaidaFinal,
      pasta: pastaFinal,
      observacoes: obsFinal,
      origem: 'importacao_csv',
      arquivadoPor: userUsername,
      arquivadoPorNome: userNome,
      arquivadoEm: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
      atualizadoPor: userUsername,
      atualizadoPorNome: userNome,
      atualizadoEm: nowIso
    });
  });

  if (db) {
    const CHUNK_SIZE = 450;
    for (let i = 0; i < payloads.length; i += CHUNK_SIZE) {
      const chunk = payloads.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      for (const item of chunk) {
        batch.set(doc(db, 'arquivo_morto', item.id), item);
      }
      await batch.commit();
    }
  } else {
    const locais = getLocalArquivoMorto();
    const atualizados = [...payloads, ...locais];
    saveLocalArquivoMorto(atualizados);
    window.dispatchEvent(new Event('storage'));
  }

  try {
    const resumoPacientes = payloads
      .slice(0, 10)
      .map((p) => `${p.nome} (DN: ${p.dn || '-'}, Saída: ${p.dataSaida || '-'}, Pasta: ${p.pasta || 'Não informada'}${p.observacoes ? `, Obs: ${p.observacoes}` : ''})`)
      .join(' | ');
    const sufixo = payloads.length > 10 ? ` ... e mais ${payloads.length - 10} registro(s).` : '';

    await registrarAuditoria({
      acao: 'ARQUIVO_MORTO_IMPORTACAO',
      detalhes: `Importação via planilha CSV para o Arquivo Morto: ${payloads.length} registro(s) adicionado(s). ${resumoPacientes}${sufixo}`,
      pacienteId: payloads[0]?.id || '',
      pacienteNome: payloads.length === 1 ? payloads[0].nome : `${payloads.length} pacientes (CSV)`,
      usuario,
      dadosArquivoMorto: {
        nome: `${payloads.length} paciente(s) importado(s) via CSV`,
        dn: 'Múltiplos',
        dataSaida: payloads[0]?.dataSaida || '-',
        pasta: payloads.length === 1 ? payloads[0].pasta : 'Múltiplas / conforme planilha',
        observacoes: payloads.length === 1 ? payloads[0].observacoes : `Lote CSV com ${payloads.length} registros`,
        origem: 'importacao_csv'
      }
    });
  } catch (auditErr) {
    console.warn('Falha ao registrar auditoria da importação CSV do arquivo morto:', auditErr);
  }

  return { success: true, total: payloads.length, mode: db ? 'firestore' : 'local' };
}

/**
 * Adiciona um registro de prontuário médico / evolução com carimbo de auditoria
 */
export async function adicionarEvolucao(pacienteId, evolucaoData, pacienteNome = '', usuario = null) {
  const db = getDb();
  const nowIso = new Date().toISOString();

  const userUsername = usuario?.username || 'sistema';
  const userNome = usuario?.nome || usuario?.username || 'Sistema';

  const novaEvolucao = {
    id: `evo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    dataHora: evolucaoData.dataHora || nowIso,
    data: evolucaoData.data || '',
    observacao: evolucaoData.observacao || '',
    descricaoDispositivo: evolucaoData.descricaoDispositivo || '',
    descricao: evolucaoData.descricao || '',
    conduta: evolucaoData.conduta || '',
    profissional: evolucaoData.profissional || '',
    tipoAtendimento: evolucaoData.tipoAtendimento || '',
    tipoRegistro: evolucaoData.tipoRegistro || '',
    categoriaServico: evolucaoData.categoriaServico || '',
    dispositivosDeferidos: evolucaoData.dispositivosDeferidos || [],
    opcaoIntelectual: evolucaoData.opcaoIntelectual || '',
    // Carimbo do usuário
    criadoPor: userUsername,
    criadoPorNome: userNome,
    createdAt: nowIso
  };

  // Garante que nenhum campo de novaEvolucao seja undefined
  const cleanNovaEvolucao = {};
  for (const [k, v] of Object.entries(novaEvolucao)) {
    cleanNovaEvolucao[k] = v !== undefined ? v : '';
  }

  if (db) {
    try {
      const pacienteRef = doc(db, 'pacientes', pacienteId);
      const snap = await getDoc(pacienteRef);
      if (snap.exists()) {
        const dados = snap.data();
        const listaExistente = Array.isArray(dados.evolucoes) ? dados.evolucoes : [];
        const evolucoesSanitizadas = [cleanNovaEvolucao, ...listaExistente].map((evo) => {
          const itemLimpo = {};
          for (const [key, val] of Object.entries(evo)) {
            itemLimpo[key] = val !== undefined ? val : '';
          }
          return itemLimpo;
        });

        await updateDoc(pacienteRef, {
          evolucoes: evolucoesSanitizadas,
          updatedAt: nowIso,
          atualizadoPor: userUsername,
          atualizadoPorNome: userNome,
          atualizadoEm: nowIso
        });
      } else {
        await setDoc(pacienteRef, {
          id: pacienteId,
          evolucoes: [cleanNovaEvolucao],
          updatedAt: nowIso,
          atualizadoPor: userUsername,
          atualizadoPorNome: userNome,
          atualizadoEm: nowIso
        }, { merge: true });
      }
    } catch (err) {
      console.error('Erro ao adicionar prontuário médico no Firestore:', err);
      throw err;
    }
  } else {
    const locais = getLocalPacientes();
    const paciente = locais.find((p) => p.id === pacienteId);
    if (paciente) {
      if (!paciente.evolucoes) paciente.evolucoes = [];
      paciente.evolucoes.unshift(cleanNovaEvolucao);
      paciente.updatedAt = nowIso;
      paciente.atualizadoPor = userUsername;
      paciente.atualizadoPorNome = userNome;
      paciente.atualizadoEm = nowIso;
      saveLocalPacientes(locais);
      window.dispatchEvent(new Event('storage'));
    }
  }

  // Registra carimbo na auditoria
  try {
    const desc = cleanNovaEvolucao.descricaoDispositivo || cleanNovaEvolucao.opcaoIntelectual || cleanNovaEvolucao.descricao || 'Registro clínico';
    await registrarAuditoria({
      acao: 'NOVO_PRONTUARIO',
      detalhes: `Novo registro no prontuário médico de "${pacienteNome || pacienteId}": ${desc}`,
      pacienteId,
      pacienteNome,
      usuario
    });
  } catch (auditErr) {
    console.warn('Falha ao registrar auditoria de prontuário:', auditErr);
  }

  return { success: true, evolucao: cleanNovaEvolucao, mode: db ? 'firestore' : 'local' };
}

/**
 * Exclui uma evolução do prontuário com carimbo de auditoria
 */
export async function excluirEvolucao(pacienteId, evolucaoId, pacienteNome = '', usuario = null) {
  const db = getDb();
  const nowIso = new Date().toISOString();
  const userUsername = usuario?.username || 'sistema';
  const userNome = usuario?.nome || usuario?.username || 'Sistema';

  if (db) {
    try {
      const pacienteRef = doc(db, 'pacientes', pacienteId);
      const snap = await getDoc(pacienteRef);
      if (snap.exists()) {
        const dados = snap.data();
        const evolucoes = (dados.evolucoes || [])
          .filter((e) => e.id !== evolucaoId)
          .map((evo) => {
            const itemLimpo = {};
            for (const [key, val] of Object.entries(evo)) {
              itemLimpo[key] = val !== undefined ? val : '';
            }
            return itemLimpo;
          });
        await updateDoc(pacienteRef, {
          evolucoes,
          updatedAt: nowIso,
          atualizadoPor: userUsername,
          atualizadoPorNome: userNome,
          atualizadoEm: nowIso
        });
      }
    } catch (err) {
      console.error('Erro ao excluir evolução no Firestore:', err);
      throw err;
    }
  } else {
    const locais = getLocalPacientes();
    const paciente = locais.find((p) => p.id === pacienteId);
    if (paciente && paciente.evolucoes) {
      paciente.evolucoes = paciente.evolucoes.filter((e) => e.id !== evolucaoId);
      paciente.updatedAt = nowIso;
      paciente.atualizadoPor = userUsername;
      paciente.atualizadoPorNome = userNome;
      paciente.atualizadoEm = nowIso;
      saveLocalPacientes(locais);
      window.dispatchEvent(new Event('storage'));
    }
  }

  // Registra carimbo na auditoria
  try {
    await registrarAuditoria({
      acao: 'EXCLUSAO_PRONTUARIO',
      detalhes: `Anotação de prontuário (ID: ${evolucaoId}) do paciente "${pacienteNome || pacienteId}" foi excluída.`,
      pacienteId,
      pacienteNome,
      usuario
    });
  } catch (auditErr) {
    console.warn('Falha ao registrar auditoria de exclusão de prontuário:', auditErr);
  }

  return { success: true, mode: db ? 'firestore' : 'local' };
}

// ==========================================
// GESTÃO DE ARQUIVO MORTO (FIRESTORE COM FALLBACK LOCAL)
// ==========================================

function sanitizeValue(val) {
  if (val === undefined) return null;
  if (Array.isArray(val)) {
    return val.map((item) => sanitizeValue(item));
  }
  if (val !== null && typeof val === 'object') {
    const clean = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) {
        clean[k] = sanitizeValue(v);
      }
    }
    return clean;
  }
  return val;
}

function getLocalArquivoMorto() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOCAL_ARQUIVO_MORTO);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Erro ao ler arquivo morto local:', e);
  }
  return [];
}

function saveLocalArquivoMorto(registros) {
  try {
    localStorage.setItem(STORAGE_KEY_LOCAL_ARQUIVO_MORTO, JSON.stringify(registros));
  } catch (e) {
    console.error('Erro ao salvar arquivo morto local:', e);
  }
}

/**
 * Assina lista de pacientes no Arquivo Morto em tempo real
 */
export function subscribeArquivoMorto(onUpdate, onError) {
  const db = getDb();

  if (db) {
    try {
      const q = query(collection(db, 'arquivo_morto'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const lista = snapshot.docs
            .map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data()
            }))
            .sort((a, b) => {
              const timeA = new Date(a.arquivadoEm || a.createdAt || a.updatedAt || 0).getTime();
              const timeB = new Date(b.arquivadoEm || b.createdAt || b.updatedAt || 0).getTime();
              return timeB - timeA;
            });
          onUpdate(lista);
        },
        (error) => {
          console.error('Erro no snapshot de arquivo morto:', error);
          if (onError) onError(error);
          onUpdate(getLocalArquivoMorto());
        }
      );
      return unsubscribe;
    } catch (err) {
      console.error('Erro ao conectar arquivo morto ao Firestore:', err);
      if (onError) onError(err);
      onUpdate(getLocalArquivoMorto());
      return () => {};
    }
  } else {
    onUpdate(getLocalArquivoMorto());
    const handleStorageChange = () => {
      onUpdate(getLocalArquivoMorto());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }
}

/**
 * Move um paciente ativo (e todos os seus registros de serviço e histórico clínico) para o Arquivo Morto
 */
export async function moverPacienteParaArquivoMorto(
  paciente,
  { nome, dn, dataSaida, pasta = '', observacoes = '' },
  usuario = null
) {
  const db = getDb();
  const nowIso = new Date().toISOString();
  const userUsername = usuario?.username || 'sistema';
  const userNome = usuario?.nome || usuario?.username || 'Sistema';

  const archiveId = db
    ? doc(collection(db, 'arquivo_morto')).id
    : `arq_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const nomeFinal = (nome || paciente?.nome || '').trim().toUpperCase();
  const dnFinal = (dn || paciente?.dn || paciente?.dataNascimento || '').trim();
  const dataSaidaFinal = (dataSaida || '').trim();
  const pastaFinal = (pasta || '').trim().toUpperCase();
  const obsFinal = (observacoes || '').trim();

  const registrosOriginais = Array.isArray(paciente?.registros) && paciente.registros.length > 0
    ? paciente.registros
    : paciente ? [paciente] : [];

  const { registros: _omitRegistros, ...pacienteSemRegistros } = paciente || {};
  const evolucoes = Array.isArray(paciente?.evolucoes) ? paciente.evolucoes : [];

  const archivePayload = sanitizeValue({
    id: archiveId,
    nome: nomeFinal,
    dn: dnFinal,
    dataNascimento: dnFinal,
    dataSaida: dataSaidaFinal,
    pasta: pastaFinal,
    observacoes: obsFinal,
    origem: 'paciente_ativo',
    // Dados cadastrais e clínicos preservados
    cpf: paciente?.cpf || '',
    nome_mae: paciente?.nome_mae || paciente?.nomeMae || '',
    telefone: paciente?.telefone || '',
    telefones: paciente?.telefones || [],
    municipio: paciente?.municipio || '',
    esf: paciente?.esf || '',
    data_entrada: paciente?.data_entrada || paciente?.dataEntrada || '',
    idade: paciente?.idade || '',
    servico_especializado: paciente?.servico_especializado || '',
    servicos: paciente?.servicos || (paciente?.servico_especializado ? [paciente.servico_especializado] : []),
    cid: paciente?.cid || '',
    cid_list: paciente?.cid_list || [],
    opm_list: paciente?.opm_list || [],
    tipoOpm: paciente?.tipoOpm || '',
    observacoesCadastro: paciente?.observacoes || '',
    evolucoes,
    historico: {
      totalServicos: paciente?.totalServicos || registrosOriginais.length || 1,
      registrosOriginais,
      pacienteUnificado: pacienteSemRegistros
    },
    arquivadoPor: userUsername,
    arquivadoPorNome: userNome,
    arquivadoEm: nowIso,
    createdAt: nowIso,
    updatedAt: nowIso
  });

  // 1. Grava no Arquivo Morto primeiro para garantir preservação do histórico
  if (db) {
    await setDoc(doc(db, 'arquivo_morto', archiveId), archivePayload);
  } else {
    const locais = getLocalArquivoMorto();
    locais.unshift(archivePayload);
    saveLocalArquivoMorto(locais);
  }

  // 2. Remove os registros ativos da coleção pacientes
  const idsParaRemover = Array.isArray(paciente?.ids) && paciente.ids.length > 0
    ? paciente.ids
    : paciente?.id ? [paciente.id] : [];

  if (db) {
    for (const id of idsParaRemover) {
      await deleteDoc(doc(db, 'pacientes', id));
    }
  } else {
    const locaisPac = getLocalPacientes();
    const filtrados = locaisPac.filter((p) => !idsParaRemover.includes(p.id));
    saveLocalPacientes(filtrados);
    window.dispatchEvent(new Event('storage'));
  }

  // 3. Registra auditoria completa com todas as informações
  try {
    const totalServ = registrosOriginais.length;
    const totalEvo = evolucoes.length;
    await registrarAuditoria({
      acao: 'ARQUIVO_MORTO_ENTRADA',
      detalhes: `Paciente "${nomeFinal}" (DN: ${dnFinal || 'Não informada'}) foi direcionado ao Arquivo Morto em ${dataSaidaFinal}. Pasta física: ${pastaFinal || 'Não informada'}. Observações: ${obsFinal || 'Nenhuma observação informada'}. Histórico preservado: ${totalServ} serviço(s) e ${totalEvo} evolução(ões).`,
      pacienteId: archiveId,
      pacienteNome: nomeFinal,
      usuario,
      dadosArquivoMorto: {
        nome: nomeFinal,
        dn: dnFinal,
        dataSaida: dataSaidaFinal,
        pasta: pastaFinal,
        observacoes: obsFinal,
        origem: 'paciente_ativo',
        totalRegistros: totalServ,
        totalEvolucoes: totalEvo
      }
    });
  } catch (auditErr) {
    console.warn('Falha ao registrar auditoria de arquivo morto:', auditErr);
  }

  return { success: true, id: archiveId, mode: db ? 'firestore' : 'local' };
}

/**
 * Cadastra ou edita um registro diretamente no Arquivo Morto com carimbo de auditoria
 */
export async function salvarArquivoMorto(registroData, usuario = null) {
  const db = getDb();
  const nowIso = new Date().toISOString();
  const isNovo = !registroData.id;
  const id = registroData.id || (db
    ? doc(collection(db, 'arquivo_morto')).id
    : `arq_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`);

  const userUsername = usuario?.username || 'sistema';
  const userNome = usuario?.nome || usuario?.username || 'Sistema';

  const nomeFinal = (registroData.nome || '').trim().toUpperCase();
  const dnFinal = (registroData.dn || registroData.dataNascimento || '').trim();
  const dataSaidaFinal = (registroData.dataSaida || '').trim();
  const pastaFinal = (registroData.pasta || '').trim().toUpperCase();
  const obsFinal = (registroData.observacoes || '').trim();

  const payload = sanitizeValue({
    ...registroData,
    id,
    nome: nomeFinal,
    dn: dnFinal,
    dataNascimento: dnFinal,
    dataSaida: dataSaidaFinal,
    pasta: pastaFinal,
    observacoes: obsFinal,
    origem: registroData.origem || 'manual',
    arquivadoPor: registroData.arquivadoPor || userUsername,
    arquivadoPorNome: registroData.arquivadoPorNome || userNome,
    arquivadoEm: registroData.arquivadoEm || nowIso,
    createdAt: registroData.createdAt || nowIso,
    updatedAt: nowIso,
    atualizadoPor: userUsername,
    atualizadoPorNome: userNome,
    atualizadoEm: nowIso
  });

  if (db) {
    await setDoc(doc(db, 'arquivo_morto', id), payload, { merge: true });
  } else {
    const locais = getLocalArquivoMorto();
    const index = locais.findIndex((item) => item.id === id);
    if (index >= 0) {
      locais[index] = payload;
    } else {
      locais.unshift(payload);
    }
    saveLocalArquivoMorto(locais);
    window.dispatchEvent(new Event('storage'));
  }

  try {
    await registrarAuditoria({
      acao: isNovo ? 'ARQUIVO_MORTO_CADASTRO' : 'ARQUIVO_MORTO_EDICAO',
      detalhes: isNovo
        ? `Registro manual criado no Arquivo Morto para "${nomeFinal}" (DN: ${dnFinal || 'Não informada'}), Data de Saída: ${dataSaidaFinal}, Pasta: ${pastaFinal || 'Não informada'}. Observações: ${obsFinal || 'Nenhuma observação informada'}.`
        : `Registro no Arquivo Morto de "${nomeFinal}" (DN: ${dnFinal || 'Não informada'}) foi atualizado. Data de Saída: ${dataSaidaFinal}, Pasta: ${pastaFinal || 'Não informada'}. Observações: ${obsFinal || 'Nenhuma observação informada'}.`,
      pacienteId: id,
      pacienteNome: nomeFinal,
      usuario,
      dadosArquivoMorto: {
        nome: nomeFinal,
        dn: dnFinal,
        dataSaida: dataSaidaFinal,
        pasta: pastaFinal,
        observacoes: obsFinal,
        origem: payload.origem
      }
    });
  } catch (auditErr) {
    console.warn('Falha ao registrar auditoria do arquivo morto:', auditErr);
  }

  return { success: true, id, mode: db ? 'firestore' : 'local' };
}

/**
 * Restaura um paciente do Arquivo Morto (com histórico) de volta para a lista de pacientes ativos
 */
export async function restaurarPacienteDoArquivoMorto(arquivoItem, usuario = null) {
  const db = getDb();
  const nowIso = new Date().toISOString();
  const userUsername = usuario?.username || 'sistema';
  const userNome = usuario?.nome || usuario?.username || 'Sistema';

  const registrosOriginais = Array.isArray(arquivoItem?.historico?.registrosOriginais)
    ? arquivoItem.historico.registrosOriginais
    : [];

  if (registrosOriginais.length === 0) {
    throw new Error('Este registro do arquivo morto não possui histórico clínico completo para restauração.');
  }

  if (db) {
    for (const reg of registrosOriginais) {
      const regId = reg.id || doc(collection(db, 'pacientes')).id;
      const restoredPayload = sanitizeValue({
        ...reg,
        id: regId,
        updatedAt: nowIso,
        atualizadoPor: userUsername,
        atualizadoPorNome: userNome,
        atualizadoEm: nowIso
      });
      await setDoc(doc(db, 'pacientes', regId), restoredPayload, { merge: true });
    }
    await deleteDoc(doc(db, 'arquivo_morto', arquivoItem.id));
  } else {
    const locaisPac = getLocalPacientes();
    for (const reg of registrosOriginais) {
      const regId = reg.id || `paciente_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const restoredPayload = sanitizeValue({
        ...reg,
        id: regId,
        updatedAt: nowIso,
        atualizadoPor: userUsername,
        atualizadoPorNome: userNome,
        atualizadoEm: nowIso
      });
      const idx = locaisPac.findIndex((p) => p.id === regId);
      if (idx >= 0) {
        locaisPac[idx] = restoredPayload;
      } else {
        locaisPac.unshift(restoredPayload);
      }
    }
    saveLocalPacientes(locaisPac);

    const locaisArq = getLocalArquivoMorto().filter((item) => item.id !== arquivoItem.id);
    saveLocalArquivoMorto(locaisArq);
    window.dispatchEvent(new Event('storage'));
  }

  try {
    await registrarAuditoria({
      acao: 'ARQUIVO_MORTO_RESTAURACAO',
      detalhes: `Paciente "${arquivoItem.nome}" (DN: ${arquivoItem.dn || 'Não informada'}, Data de Saída anterior: ${arquivoItem.dataSaida || '-'}) foi restaurado do Arquivo Morto para pacientes ativos com ${registrosOriginais.length} registro(s).`,
      pacienteId: arquivoItem.id,
      pacienteNome: arquivoItem.nome,
      usuario,
      dadosArquivoMorto: {
        nome: arquivoItem.nome,
        dn: arquivoItem.dn || '',
        dataSaida: arquivoItem.dataSaida || '',
        observacoes: arquivoItem.observacoes || ''
      }
    });
  } catch (auditErr) {
    console.warn('Falha ao registrar auditoria de restauração do arquivo morto:', auditErr);
  }

  return { success: true, mode: db ? 'firestore' : 'local' };
}

/**
 * Exclui definitivamente um registro do Arquivo Morto com carimbo de auditoria
 */
export async function excluirArquivoMorto(arquivoItem, usuario = null) {
  const db = getDb();

  if (db) {
    await deleteDoc(doc(db, 'arquivo_morto', arquivoItem.id));
  } else {
    const locais = getLocalArquivoMorto().filter((item) => item.id !== arquivoItem.id);
    saveLocalArquivoMorto(locais);
    window.dispatchEvent(new Event('storage'));
  }

  try {
    await registrarAuditoria({
      acao: 'ARQUIVO_MORTO_EXCLUSAO',
      detalhes: `Registro de "${arquivoItem.nome}" (DN: ${arquivoItem.dn || 'Não informada'}, Data de Saída: ${arquivoItem.dataSaida || '-'}) foi excluído definitivamente do Arquivo Morto. Observações registradas: ${arquivoItem.observacoes || 'Nenhuma'}.`,
      pacienteId: arquivoItem.id,
      pacienteNome: arquivoItem.nome,
      usuario,
      dadosArquivoMorto: {
        nome: arquivoItem.nome,
        dn: arquivoItem.dn || '',
        dataSaida: arquivoItem.dataSaida || '',
        observacoes: arquivoItem.observacoes || ''
      }
    });
  } catch (auditErr) {
    console.warn('Falha ao registrar auditoria de exclusão do arquivo morto:', auditErr);
  }

  return { success: true, mode: db ? 'firestore' : 'local' };
}

