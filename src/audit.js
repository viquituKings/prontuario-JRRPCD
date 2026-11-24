// Sistema de Auditoria e Carimbo de Ações do Prontuário JRRPCD
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { getDb } from './firebase';

const STORAGE_KEY_LOCAL_AUDIT = 'jrrpcd_local_auditoria';

export function getLocalAudit() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOCAL_AUDIT);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Erro ao ler auditoria local:', e);
  }
  return [];
}

export function saveLocalAudit(auditLogs) {
  try {
    localStorage.setItem(STORAGE_KEY_LOCAL_AUDIT, JSON.stringify(auditLogs.slice(0, 500)));
  } catch (e) {
    console.warn('Erro ao salvar auditoria local:', e);
  }
}

/**
 * Registra um carimbo de ação no histórico de auditoria (Firestore ou Local)
 */
export async function registrarAuditoria({
  acao,
  detalhes,
  usuario,
  pacienteId = '',
  pacienteNome = '',
  dadosArquivoMorto = null
}) {
  const db = getDb();
  const now = new Date();
  const logItem = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    acao, // 'LOGIN' | 'LOGOUT' | 'CADASTRO_PACIENTE' | 'ALTERACAO_PACIENTE' | 'EXCLUSAO_PACIENTE' | 'NOVO_PRONTUARIO' | 'EXCLUSAO_PRONTUARIO' | 'ARQUIVO_MORTO_ENTRADA' | 'ARQUIVO_MORTO_CADASTRO' | 'ARQUIVO_MORTO_EDICAO' | 'ARQUIVO_MORTO_RESTAURACAO' | 'ARQUIVO_MORTO_EXCLUSAO' | 'TROCA_SENHA' | 'CRIACAO_USUARIO' | 'EDICAO_USUARIO' | 'EXCLUSAO_USUARIO'
    detalhes: detalhes || '',
    usuarioUsername: usuario?.username || 'sistema',
    usuarioNome: usuario?.nome || usuario?.username || 'Sistema',
    usuarioRole: usuario?.role || 'operador',
    pacienteId: pacienteId || '',
    pacienteNome: pacienteNome || '',
    dataHoraIso: now.toISOString(),
    dataHoraFormatada: now.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  };

  if (dadosArquivoMorto) {
    logItem.dadosArquivoMorto = dadosArquivoMorto;
  }

  // Salva no Firestore se disponível
  if (db) {
    try {
      const docRef = doc(db, 'auditoria', logItem.id);
      await setDoc(docRef, logItem);
    } catch (err) {
      console.warn('Falha ao registrar auditoria no Firestore:', err);
    }
  }

  // Sempre grava também localmente para consulta rápida
  const locais = getLocalAudit();
  locais.unshift(logItem);
  saveLocalAudit(locais);

  return logItem;
}

/**
 * Obtém logs recentes de auditoria
 */
export async function listarAuditoria(limite = 100) {
  const db = getDb();
  if (db) {
    try {
      const q = query(collection(db, 'auditoria'), orderBy('dataHoraIso', 'desc'), limit(limite));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
    } catch (err) {
      console.warn('Falha ao buscar auditoria no Firestore, usando local:', err);
    }
  }
  return getLocalAudit().slice(0, limite);
}

