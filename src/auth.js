// Sistema de Autenticação, Controle de Acesso e Auditoria do Prontuário JRRPCD
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { getDb } from './firebase';

const STORAGE_KEY_AUTH_USER = 'jrrpcd_usuario_logado';
const STORAGE_KEY_LOCAL_USERS = 'jrrpcd_local_usuarios';
const STORAGE_KEY_LOCAL_AUDIT = 'jrrpcd_local_auditoria';

// Usuário Administrador Inicial Padrão
export const USUARIO_ADMIN_PADRAO = {
  username: 'mariacecilia',
  nome: 'Maria Cecília',
  role: 'admin', // 'admin' | 'operador'
  ativo: true,
  createdAt: '2026-01-01T08:00:00.000Z'
};

const SENHA_ADMIN_PADRAO_TEXTO = '12345678';

/**
 * Função utilitária para hash de senha utilizando Web Crypto API nativa
 */
export async function hashSenha(senha) {
  if (!senha) return '';
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(String(senha) + '_jrrpcd_salt_2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback simples se crypto.subtle não estiver disponível em algum contexto
    let hash = 0;
    const str = String(senha) + '_jrrpcd_salt_2026';
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return `hash_${Math.abs(hash)}`;
  }
}

// ========================================================
// PERSISTÊNCIA LOCAL (FALLBACK E SINCRONIZAÇÃO)
// ========================================================

function getLocalUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOCAL_USERS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Erro ao ler usuários locais:', e);
  }
  return [];
}

function saveLocalUsers(users) {
  try {
    localStorage.setItem(STORAGE_KEY_LOCAL_USERS, JSON.stringify(users));
  } catch (e) {
    console.warn('Erro ao salvar usuários locais:', e);
  }
}

function getLocalAudit() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOCAL_AUDIT);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Erro ao ler auditoria local:', e);
  }
  return [];
}

function saveLocalAudit(auditLogs) {
  try {
    localStorage.setItem(STORAGE_KEY_LOCAL_AUDIT, JSON.stringify(auditLogs.slice(0, 500)));
  } catch (e) {
    console.warn('Erro ao salvar auditoria local:', e);
  }
}

// ========================================================
// AUDITORIA / CARIMBO DE AÇÕES
// ========================================================

/**
 * Registra um carimbo de ação no histórico de auditoria (Firestore ou Local)
 */
export async function registrarAuditoria({
  acao,
  detalhes,
  usuario,
  pacienteId = '',
  pacienteNome = ''
}) {
  const db = getDb();
  const now = new Date();
  const logItem = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    acao, // 'LOGIN' | 'LOGOUT' | 'CADASTRO_PACIENTE' | 'ALTERACAO_PACIENTE' | 'EXCLUSAO_PACIENTE' | 'NOVO_PRONTUARIO' | 'EXCLUSAO_PRONTUARIO' | 'TROCA_SENHA' | 'CRIACAO_USUARIO' | 'EDICAO_USUARIO' | 'EXCLUSAO_USUARIO'
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

// ========================================================
// GERENCIAMENTO DE USUÁRIOS
// ========================================================

/**
 * Inicializa a coleção de usuários garantindo que mariacecilia / 12345678 exista
 */
export async function inicializarUsuarios() {
  const db = getDb();
  const senhaHash = await hashSenha(SENHA_ADMIN_PADRAO_TEXTO);

  const adminUser = {
    ...USUARIO_ADMIN_PADRAO,
    senhaHash
  };

  if (db) {
    try {
      const docRef = doc(db, 'usuarios', USUARIO_ADMIN_PADRAO.username);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        await setDoc(docRef, adminUser);
        console.log('Usuário administrador padrão criado no Firestore:', USUARIO_ADMIN_PADRAO.username);
      }
    } catch (err) {
      console.warn('Aviso ao inicializar usuário no Firestore:', err);
    }
  }

  // Garante também localmente
  const locais = getLocalUsers();
  const index = locais.findIndex((u) => u.username === USUARIO_ADMIN_PADRAO.username);
  if (index === -1) {
    locais.push(adminUser);
    saveLocalUsers(locais);
  }
}

/**
 * Realiza autenticação com nome de usuário e senha
 */
export async function login(username, senha) {
  const cleanUsername = String(username || '').trim().toLowerCase();
  const cleanSenha = String(senha || '').trim();

  if (!cleanUsername || !cleanSenha) {
    throw new Error('Informe o nome de usuário e a senha.');
  }

  const db = getDb();
  const inputHash = await hashSenha(cleanSenha);
  let userFound = null;

  // 1. Tenta buscar no Firestore
  if (db) {
    try {
      const docRef = doc(db, 'usuarios', cleanUsername);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        userFound = snap.data();
      }
    } catch (err) {
      console.warn('Erro ao consultar usuário no Firestore, verificando local:', err);
    }
  }

  // 2. Se não encontrou no Firestore ou Firestore offline, busca localmente
  if (!userFound) {
    const locais = getLocalUsers();
    userFound = locais.find((u) => u.username.toLowerCase() === cleanUsername);
  }

  // 3. Fallback especial para primeiro acesso de mariacecilia se a base ainda estiver vazia
  if (!userFound && cleanUsername === USUARIO_ADMIN_PADRAO.username) {
    const defaultHash = await hashSenha(SENHA_ADMIN_PADRAO_TEXTO);
    if (inputHash === defaultHash) {
      userFound = {
        ...USUARIO_ADMIN_PADRAO,
        senhaHash: defaultHash
      };
      // Salva no banco para persistir
      await salvarUsuario(userFound, userFound);
    }
  }

  if (!userFound) {
    throw new Error('Usuário não encontrado. Verifique o nome de usuário informado.');
  }

  if (userFound.ativo === false) {
    throw new Error('Este usuário foi desativado. Contate o administrador do sistema.');
  }

  // Validação da senha
  if (userFound.senhaHash !== inputHash) {
    throw new Error('Senha incorreta. Verifique sua senha e tente novamente.');
  }

  // Sessão sem a senhaHash
  const sessaoUsuario = {
    username: userFound.username,
    nome: userFound.nome,
    role: userFound.role || 'operador',
    loginEm: new Date().toISOString()
  };

  localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(sessaoUsuario));

  // Registra auditoria do login
  await registrarAuditoria({
    acao: 'LOGIN',
    detalhes: `Usuário ${sessaoUsuario.nome} (@${sessaoUsuario.username}) realizou login no sistema.`,
    usuario: sessaoUsuario
  });

  return sessaoUsuario;
}

/**
 * Encerra a sessão ativa do usuário
 */
export async function logout() {
  const usuario = getUsuarioLogado();
  if (usuario) {
    await registrarAuditoria({
      acao: 'LOGOUT',
      detalhes: `Usuário ${usuario.nome} (@${usuario.username}) encerrou a sessão.`,
      usuario
    });
  }
  localStorage.removeItem(STORAGE_KEY_AUTH_USER);
}

/**
 * Retorna o usuário logado na sessão atual (ou null se não houver login)
 */
export function getUsuarioLogado() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH_USER);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Erro ao ler usuário logado:', e);
  }
  return null;
}

/**
 * Troca a senha do usuário logado
 */
export async function trocarSenha({ username, senhaAtual, novaSenha, usuarioOperador }) {
  const cleanUsername = String(username || '').trim().toLowerCase();
  const cleanSenhaAtual = String(senhaAtual || '').trim();
  const cleanNovaSenha = String(novaSenha || '').trim();

  if (!cleanSenhaAtual) {
    throw new Error('Informe a senha atual.');
  }
  if (!cleanNovaSenha || cleanNovaSenha.length < 6) {
    throw new Error('A nova senha deve ter no mínimo 6 caracteres.');
  }

  const db = getDb();
  let userRecord = null;

  if (db) {
    try {
      const docRef = doc(db, 'usuarios', cleanUsername);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        userRecord = snap.data();
      }
    } catch (err) {
      console.warn('Erro ao buscar usuário no Firestore para troca de senha:', err);
    }
  }

  if (!userRecord) {
    const locais = getLocalUsers();
    userRecord = locais.find((u) => u.username.toLowerCase() === cleanUsername);
  }

  if (!userRecord) {
    throw new Error('Usuário não encontrado.');
  }

  const hashAtual = await hashSenha(cleanSenhaAtual);
  if (userRecord.senhaHash !== hashAtual) {
    throw new Error('A senha atual informada está incorreta.');
  }

  const novoHash = await hashSenha(cleanNovaSenha);
  const updatedUser = {
    ...userRecord,
    senhaHash: novoHash,
    senhaAlteradaEm: new Date().toISOString()
  };

  if (db) {
    try {
      await updateDoc(doc(db, 'usuarios', cleanUsername), {
        senhaHash: novoHash,
        senhaAlteradaEm: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Erro ao atualizar senha no Firestore, salvando local:', err);
    }
  }

  // Atualiza localmente
  const locais = getLocalUsers();
  const idx = locais.findIndex((u) => u.username.toLowerCase() === cleanUsername);
  if (idx >= 0) {
    locais[idx] = updatedUser;
  } else {
    locais.push(updatedUser);
  }
  saveLocalUsers(locais);

  // Registra auditoria
  await registrarAuditoria({
    acao: 'TROCA_SENHA',
    detalhes: `Senha do usuário @${cleanUsername} alterada com sucesso.`,
    usuario: usuarioOperador || { username: cleanUsername, nome: userRecord.nome }
  });

  return { success: true };
}

/**
 * Lista todos os usuários cadastrados
 */
export async function listarUsuarios() {
  const db = getDb();
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'usuarios'));
      if (!snap.empty) {
        return snap.docs.map((d) => {
          const data = d.data();
          return {
            username: data.username,
            nome: data.nome,
            role: data.role || 'operador',
            ativo: data.ativo !== false,
            createdAt: data.createdAt,
            senhaAlteradaEm: data.senhaAlteradaEm
          };
        });
      }
    } catch (err) {
      console.warn('Falha ao listar usuários do Firestore, lendo local:', err);
    }
  }

  return getLocalUsers().map((u) => ({
    username: u.username,
    nome: u.nome,
    role: u.role || 'operador',
    ativo: u.ativo !== false,
    createdAt: u.createdAt,
    senhaAlteradaEm: u.senhaAlteradaEm
  }));
}

/**
 * Cria ou edita um usuário (acesso administrativo)
 */
export async function salvarUsuario(dadosUsuario, usuarioOperador) {
  const cleanUsername = String(dadosUsuario.username || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '');

  if (!cleanUsername) {
    throw new Error('Informe um nome de usuário válido (apenas letras, números, pontos ou hífens).');
  }

  if (!dadosUsuario.nome?.trim()) {
    throw new Error('Informe o nome completo do usuário.');
  }

  const db = getDb();
  const agora = new Date().toISOString();

  // Verifica se é novo usuário ou edição
  let userExistente = null;
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'usuarios', cleanUsername));
      if (snap.exists()) userExistente = snap.data();
    } catch (err) {
      console.warn('Erro ao checar existência no Firestore:', err);
    }
  }
  if (!userExistente) {
    const locais = getLocalUsers();
    userExistente = locais.find((u) => u.username.toLowerCase() === cleanUsername);
  }

  let senhaHash = userExistente?.senhaHash;

  // Se for novo usuário ou se foi fornecida nova senha
  if (dadosUsuario.senha) {
    if (dadosUsuario.senha.length < 6) {
      throw new Error('A senha deve ter no mínimo 6 caracteres.');
    }
    senhaHash = await hashSenha(dadosUsuario.senha);
  } else if (!userExistente) {
    throw new Error('Informe uma senha inicial para o novo usuário.');
  }

  const userPayload = {
    username: cleanUsername,
    nome: dadosUsuario.nome.trim(),
    role: dadosUsuario.role === 'admin' ? 'admin' : 'operador',
    ativo: dadosUsuario.ativo !== false,
    senhaHash,
    updatedAt: agora,
    criadoPor: userExistente ? (userExistente.criadoPor || 'admin') : (usuarioOperador?.username || 'admin'),
    createdAt: userExistente?.createdAt || agora
  };

  if (db) {
    try {
      await setDoc(doc(db, 'usuarios', cleanUsername), userPayload, { merge: true });
    } catch (err) {
      console.error('Erro ao salvar usuário no Firestore:', err);
      throw err;
    }
  }

  // Atualiza local
  const locais = getLocalUsers();
  const idx = locais.findIndex((u) => u.username.toLowerCase() === cleanUsername);
  if (idx >= 0) {
    locais[idx] = userPayload;
  } else {
    locais.push(userPayload);
  }
  saveLocalUsers(locais);

  // Registra auditoria
  const acao = userExistente ? 'EDICAO_USUARIO' : 'CRIACAO_USUARIO';
  const detalhes = userExistente
    ? `Usuário @${cleanUsername} atualizado por @${usuarioOperador?.username || 'admin'}.`
    : `Novo usuário @${cleanUsername} (${userPayload.nome} - perfil ${userPayload.role}) cadastrado por @${usuarioOperador?.username || 'admin'}.`;

  await registrarAuditoria({
    acao,
    detalhes,
    usuario: usuarioOperador
  });

  return { success: true, username: cleanUsername };
}

/**
 * Exclui ou desativa um usuário
 */
export async function excluirUsuario(username, usuarioOperador) {
  const cleanUsername = String(username || '').trim().toLowerCase();

  if (cleanUsername === USUARIO_ADMIN_PADRAO.username) {
    throw new Error('O usuário administrador principal não pode ser excluído.');
  }

  if (usuarioOperador?.username?.toLowerCase() === cleanUsername) {
    throw new Error('Você não pode excluir seu próprio usuário logado.');
  }

  const db = getDb();
  if (db) {
    try {
      await deleteDoc(doc(db, 'usuarios', cleanUsername));
    } catch (err) {
      console.error('Erro ao excluir usuário no Firestore:', err);
      throw err;
    }
  }

  const locais = getLocalUsers();
  const filtrados = locais.filter((u) => u.username.toLowerCase() !== cleanUsername);
  saveLocalUsers(filtrados);

  await registrarAuditoria({
    acao: 'EXCLUSAO_USUARIO',
    detalhes: `Usuário @${cleanUsername} foi excluído do sistema por @${usuarioOperador?.username || 'admin'}.`,
    usuario: usuarioOperador
  });

  return { success: true };
}
