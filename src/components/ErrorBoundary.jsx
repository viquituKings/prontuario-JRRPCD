import React from 'react';
import { AlertTriangle, RefreshCw, LogOut, ShieldAlert } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary capturou erro:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetSession = () => {
    try {
      localStorage.removeItem('jrrpcd_usuario_logado');
    } catch (e) {
      console.warn('Erro ao limpar sessão:', e);
    }
    window.location.reload();
  };

  handleClearAll = () => {
    if (confirm('Isso irá limpar o cache e a sessão salvos neste navegador. Deseja continuar?')) {
      try {
        localStorage.clear();
      } catch (e) {
        console.warn('Erro ao limpar localStorage:', e);
      }
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100 font-sans">
          <div className="w-full max-w-lg bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Topo do Alerta */}
            <div className="px-6 py-6 bg-gradient-to-r from-rose-600 via-rose-700 to-red-800 text-white flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 border border-white/30">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-200 block">
                  Sistema de Prontuário JRRPCD
                </span>
                <h1 className="text-lg font-black tracking-tight text-white">
                  Ocorreu uma falha ao abrir o aplicativo
                </h1>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Um erro inesperado impediu o carregamento da interface. Você pode tentar recarregar a página ou redefinir a sessão de acesso:
              </p>

              {this.state.error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 font-mono text-[11px] break-words">
                  <div className="font-bold flex items-center gap-1.5 mb-1 text-rose-700">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Detalhes do Erro:</span>
                  </div>
                  <div>{this.state.error.toString()}</div>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  type="button"
                  onClick={this.handleReload}
                  className="w-full sm:flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Recarregar Página</span>
                </button>

                <button
                  type="button"
                  onClick={this.handleResetSession}
                  className="w-full sm:flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl border border-slate-300 transition flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4 text-slate-600" />
                  <span>Voltar ao Login</span>
                </button>
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={this.handleClearAll}
                  className="text-[11px] text-slate-400 hover:text-rose-600 transition underline underline-offset-2"
                >
                  Limpar todo o cache e reiniciar aplicação
                </button>
              </div>

            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

