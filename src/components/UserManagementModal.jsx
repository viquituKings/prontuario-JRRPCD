import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Trash2, 
  KeyRound, 
  Check, 
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Shield,
  UserCheck
} from 'lucide-react';
import { listarUsuarios, salvarUsuario, excluirUsuario } from '../auth';
import { formatarDataHoraBR } from '../types';

export default function UserManagementModal({ isOpen, onClose, currentUser }) {
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form de novo usuário / edição
  const [novoNome, setNovoNome] = useState('');
  const [novoUsername, setNovoUsername] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [novoRole, setNovoRole] = useState('operador');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mensagens
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal para reset de senha de um usuário
  const [userToResetPassword, setUserToResetPassword] = useState(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');

  const carregarUsuarios = async () => {
    try {
      setIsLoading(true);
      const lista = await listarUsuarios();
      setUsuarios(lista);
    } catch (err) {
      setErrorMsg('Erro ao listar usuários: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      carregarUsuarios();
      setErrorMsg('');
      setSuccessMsg('');
      setShowAddForm(false);
    }
  }, [isOpen]);

  if (!isOpen || !currentUser) return null;

  const handleCriarUsuario = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!novoNome.trim() || !novoUsername.trim() || !novaSenha.trim()) {
      setErrorMsg('Preencha todos os campos obrigatórios.');
      return;
    }

    if (novaSenha.length < 6) {
      setErrorMsg('A senha inicial deve ter no mínimo 6 caracteres.');
      return;
    }

    try {
      setIsSubmitting(true);
      await salvarUsuario({
        nome: novoNome.trim(),
        username: novoUsername.trim().toLowerCase(),
        senha: novaSenha,
        role: novoRole,
        ativo: true
      }, currentUser);

      setSuccessMsg(`Usuário @${novoUsername.trim().toLowerCase()} cadastrado com sucesso!`);
      setNovoNome('');
      setNovoUsername('');
      setNovaSenha('');
      setNovoRole('operador');
      setShowAddForm(false);
      await carregarUsuarios();
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao cadastrar usuário.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAtivo = async (u) => {
    if (u.username === 'mariacecilia') {
      alert('O administrador padrão não pode ser desativado.');
      return;
    }

    try {
      await salvarUsuario({
        ...u,
        ativo: !u.ativo
      }, currentUser);
      await carregarUsuarios();
    } catch (err) {
      alert('Erro ao alterar status: ' + err.message);
    }
  };

  const handleExcluirUsuario = async (u) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário @${u.username} (${u.nome})?`)) {
      return;
    }

    try {
      await excluirUsuario(u.username, currentUser);
      setSuccessMsg(`Usuário @${u.username} excluído com sucesso.`);
      await carregarUsuarios();
    } catch (err) {
      alert(err.message || 'Erro ao excluir usuário.');
    }
  };

  const handleConfirmarResetSenha = async (e) => {
    e.preventDefault();
    if (!resetPasswordValue || resetPasswordValue.length < 6) {
      alert('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    try {
      await salvarUsuario({
        ...userToResetPassword,
        senha: resetPasswordValue
      }, currentUser);

      alert(`Senha do usuário @${userToResetPassword.username} redefinida com sucesso!`);
      setUserToResetPassword(null);
      setResetPasswordValue('');
      await carregarUsuarios();
    } catch (err) {
      alert('Erro ao redefinir senha: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 no-print">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabeçalho */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-cyan-200" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>Controle de Acesso e Gestão de Usuários</span>
              </h2>
              <p className="text-[11px] text-blue-200">
                Gerencie operadores, administradores e redefina credenciais de acesso
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensagens de Feedback */}
        <div className="px-6 pt-4 space-y-2">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          
          {/* Barra de Ações Superior */}
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Usuários Cadastrados ({usuarios.length})</span>
            </span>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition hover:scale-[1.02]"
            >
              <UserPlus className="w-4 h-4" />
              <span>{showAddForm ? 'Cancelar Cadastro' : 'Cadastrar Novo Usuário'}</span>
            </button>
          </div>

          {/* Formulário de Cadastro de Novo Usuário */}
          {showAddForm && (
            <form onSubmit={handleCriarUsuario} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5 animate-in fade-in duration-150">
              <div className="border-b border-slate-200 pb-2">
                <strong className="text-slate-900 block font-bold text-xs">
                  Dados do Novo Usuário
                </strong>
                <span className="text-[11px] text-slate-500">
                  Preencha os dados de identificação e a senha de acesso inicial.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Dra. Ana Paula Silva"
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Nome de Usuário (login) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: anapaula"
                    value={novoUsername}
                    onChange={(e) => setNovoUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                    className="w-full text-xs font-semibold font-mono bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Senha Inicial (mínimo 6 dígitos) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Defina a senha inicial"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Perfil de Acesso <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={novoRole}
                    onChange={(e) => setNovoRole(e.target.value)}
                    className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="operador">Operador (Acesso padrão aos prontuários)</option>
                    <option value="admin">Administrador (Controle total e gestão de usuários)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : 'Confirmar e Cadastrar'}
                </button>
              </div>
            </form>
          )}

          {/* Lista de Usuários */}
          {isLoading ? (
            <div className="text-center py-8 text-slate-400">Carregando usuários...</div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white shadow-2xs">
              {usuarios.map((u) => {
                const isAdmin = u.role === 'admin';
                const isCurrent = currentUser.username.toLowerCase() === u.username.toLowerCase();
                const isMasterAdmin = u.username.toLowerCase() === 'mariacecilia';

                return (
                  <div key={u.username} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isAdmin ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {isAdmin ? <Shield className="w-4 h-4 text-indigo-600" /> : <UserCheck className="w-4 h-4 text-slate-600" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-900 text-xs">{u.nome}</strong>
                          <span className="font-mono text-[11px] text-slate-500">@{u.username}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isAdmin 
                              ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}>
                            {isAdmin ? 'Administrador' : 'Operador'}
                          </span>
                          {!u.ativo && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-red-100 text-red-700 border border-red-200">
                              Desativado
                            </span>
                          )}
                        </div>

                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {isCurrent && <span className="text-emerald-600 font-bold mr-2">● Sua sessão ativa</span>}
                          {isMasterAdmin && <span className="text-indigo-600 font-bold mr-2">★ Administrador Principal</span>}
                        </div>
                      </div>
                    </div>

                    {/* Ações por Usuário */}
                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      {/* Botão Redefinir Senha */}
                      <button
                        type="button"
                        onClick={() => {
                          setUserToResetPassword(u);
                          setResetPasswordValue('');
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center gap-1"
                        title="Redefinir senha deste usuário"
                      >
                        <KeyRound className="w-3 h-3 text-slate-600" />
                        <span>Redefinir Senha</span>
                      </button>

                      {/* Botão Ativar / Desativar */}
                      {!isMasterAdmin && !isCurrent && (
                        <button
                          type="button"
                          onClick={() => handleToggleAtivo(u)}
                          className={`px-2 py-1 text-[11px] font-semibold rounded-lg transition ${
                            u.ativo 
                              ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200' 
                              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                          title={u.ativo ? 'Desativar acesso' : 'Reativar acesso'}
                        >
                          {u.ativo ? 'Desativar' : 'Reativar'}
                        </button>
                      )}

                      {/* Botão Excluir */}
                      {!isMasterAdmin && !isCurrent && (
                        <button
                          type="button"
                          onClick={() => handleExcluirUsuario(u)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Excluir usuário permanentemente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Sub-modal: Redefinir Senha de um Usuário */}
        {userToResetPassword && (
          <div className="fixed inset-0 z-60 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-5 w-full max-w-sm border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-blue-600" />
                <span>Redefinir Senha de @{userToResetPassword.username}</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Digite a nova senha para o usuário <strong>{userToResetPassword.nome}</strong>:
              </p>

              <form onSubmit={handleConfirmarResetSenha} className="space-y-3">
                <input
                  type="password"
                  required
                  autoFocus
                  minLength={6}
                  placeholder="Nova senha (mínimo 6 dígitos)"
                  value={resetPasswordValue}
                  onChange={(e) => setResetPasswordValue(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setUserToResetPassword(null)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm"
                  >
                    Salvar Nova Senha
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Rodapé */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
