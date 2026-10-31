import React, { useState } from 'react';
import { 
  Activity, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  KeyRound
} from 'lucide-react';
import { login } from '../auth';

export default function LoginScreen({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !senha.trim()) {
      setErrorMsg('Por favor, preencha o nome de usuário e a senha.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg('');
      const usuarioLogado = await login(username, senha);
      onLoginSuccess(usuarioLogado);
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao realizar login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemoAdmin = () => {
    setUsername('mariacecilia');
    setSenha('12345678');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans select-none">
      
      {/* Elementos decorativos de fundo */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cartão de Login */}
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
          
          {/* Cabeçalho do Cartão */}
          <div className="px-8 pt-8 pb-6 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-inner">
                <Activity className="w-6 h-6 text-cyan-300" />
              </div>
              <div>
                <span className="inline-block px-2 py-0.5 rounded bg-white/20 text-[10px] font-bold uppercase tracking-wider text-cyan-200">
                  Sistema de Prontuário & OPM
                </span>
                <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5 mt-0.5">
                  JRRPCD <span className="font-light text-blue-200">| Acesso Restrito</span>
                </h1>
              </div>
            </div>

            <p className="text-xs text-blue-100/90 leading-relaxed">
              Autenticação segura com controle de acesso e carimbo de auditoria em todas as operações.
            </p>
          </div>

          {/* Formulário de Acesso */}
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            
            {errorMsg && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold flex items-start gap-2.5 animate-shake">
                <span className="text-base shrink-0">⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Campo Usuário */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Nome de Usuário</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="ex: mariacecilia"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                  className="w-full text-sm font-semibold bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Senha</span>
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Digite sua senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full text-sm font-semibold bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 pr-11 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Botão Entrar */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {isLoading ? (
                <span>Autenticando...</span>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Caixa de Ajuda / Primeiro Acesso */}
            <div className="pt-4 border-t border-slate-100">
              <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block">
                    Acesso Administrador Padrão:
                  </span>
                  <span className="text-slate-700 font-medium">
                    Usuário: <strong className="text-blue-950 font-mono">mariacecilia</strong> • Senha: <strong className="text-blue-950 font-mono">12345678</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleFillDemoAdmin}
                  className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-700 font-bold text-[11px] rounded-lg border border-blue-300 shadow-2xs transition"
                  title="Preencher credenciais de Maria Cecília"
                >
                  Preencher
                </button>
              </div>
            </div>

          </form>

        </div>

        {/* Rodapé Seguro */}
        <div className="text-center mt-5 text-slate-400 text-xs flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Sessão protegida com auditoria de registros em tempo real</span>
        </div>

      </div>

    </div>
  );
}
