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
  serverTimestamp 
} from 'firebase/firestore';
import { PACIENTES_DEMO } from './types';

const STORAGE_KEY_CONFIG = 'jrrpcd_firebase_config';
const STORAGE_KEY_LOCAL_DATA = 'jrrpcd_local_pacientes';

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
 * Cria ou atualiza um paciente
 */
export async function salvarPaciente(pacienteData) {
  const db = getDb();
  const id = pacienteData.id || (db ? doc(collection(db, 'pacientes')).id : `paciente_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
  const nowIso = new Date().toISOString();

  const payload = {
    ...pacienteData,
    id,
    updatedAt: nowIso,
    evolucoes: pacienteData.evolucoes || []
  };

  if (!payload.createdAt) {
    payload.createdAt = nowIso;
  }

  if (db) {
    try {
      const docRef = doc(db, 'pacientes', id);
      await setDoc(docRef, payload, { merge: true });
      return { success: true, id, mode: 'firestore' };
    } catch (err) {
      console.error('Erro ao salvar no Firestore:', err);
      throw err;
    }
  } else {
    // Salva localmente
    const locais = getLocalPacientes();
    const index = locais.findIndex((p) => p.id === id);
    if (index >= 0) {
      locais[index] = payload;
    } else {
      locais.unshift(payload);
    }
    saveLocalPacientes(locais);
    // Dispara evento para atualização imediata dos componentes
    window.dispatchEvent(new Event('storage'));
    return { success: true, id, mode: 'local' };
  }
}

/**
 * Remove um paciente
 */
export async function excluirPaciente(pacienteId) {
  const db = getDb();

  if (db) {
    try {
      await deleteDoc(doc(db, 'pacientes', pacienteId));
      return { success: true, mode: 'firestore' };
    } catch (err) {
      console.error('Erro ao excluir no Firestore:', err);
      throw err;
    }
  } else {
    const locais = getLocalPacientes();
    const filtrados = locais.filter((p) => p.id !== pacienteId);
    saveLocalPacientes(filtrados);
    window.dispatchEvent(new Event('storage'));
    return { success: true, mode: 'local' };
  }
}

/**
 * Adiciona uma evolução ao prontuário do paciente
 */
export async function adicionarEvolucao(pacienteId, evolucaoData) {
  const db = getDb();
  const novaEvolucao = {
    id: `evo_${Date.now()}`,
    dataHora: evolucaoData.dataHora || new Date().toISOString(),
    profissional: evolucaoData.profissional,
    tipoAtendimento: evolucaoData.tipoAtendimento,
    descricao: evolucaoData.descricao,
    conduta: evolucaoData.conduta || '',
    createdAt: new Date().toISOString()
  };

  if (db) {
    try {
      const pacienteRef = doc(db, 'pacientes', pacienteId);
      const snap = await getDoc(pacienteRef);
      if (snap.exists()) {
        const dados = snap.data();
        const evolucoes = [novaEvolucao, ...(dados.evolucoes || [])];
        await updateDoc(pacienteRef, {
          evolucoes,
          updatedAt: new Date().toISOString()
        });
      }
      return { success: true, evolucao: novaEvolucao, mode: 'firestore' };
    } catch (err) {
      console.error('Erro ao adicionar evolução no Firestore:', err);
      throw err;
    }
  } else {
    const locais = getLocalPacientes();
    const paciente = locais.find((p) => p.id === pacienteId);
    if (paciente) {
      if (!paciente.evolucoes) paciente.evolucoes = [];
      paciente.evolucoes.unshift(novaEvolucao);
      paciente.updatedAt = new Date().toISOString();
      saveLocalPacientes(locais);
      window.dispatchEvent(new Event('storage'));
    }
    return { success: true, evolucao: novaEvolucao, mode: 'local' };
  }
}

/**
 * Exclui uma evolução do prontuário
 */
export async function excluirEvolucao(pacienteId, evolucaoId) {
  const db = getDb();

  if (db) {
    try {
      const pacienteRef = doc(db, 'pacientes', pacienteId);
      const snap = await getDoc(pacienteRef);
      if (snap.exists()) {
        const dados = snap.data();
        const evolucoes = (dados.evolucoes || []).filter((e) => e.id !== evolucaoId);
        await updateDoc(pacienteRef, {
          evolucoes,
          updatedAt: new Date().toISOString()
        });
      }
      return { success: true, mode: 'firestore' };
    } catch (err) {
      console.error('Erro ao excluir evolução no Firestore:', err);
      throw err;
    }
  } else {
    const locais = getLocalPacientes();
    const paciente = locais.find((p) => p.id === pacienteId);
    if (paciente && paciente.evolucoes) {
      paciente.evolucoes = paciente.evolucoes.filter((e) => e.id !== evolucaoId);
      paciente.updatedAt = new Date().toISOString();
      saveLocalPacientes(locais);
      window.dispatchEvent(new Event('storage'));
    }
    return { success: true, mode: 'local' };
  }
}

