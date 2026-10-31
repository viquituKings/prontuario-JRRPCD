import React, { useRef, useState, useEffect } from 'react';
import { 
  FileText, 
  UserPlus, 
  Database, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle,
  Activity,
  User,
  LogOut,
  KeyRound,
  ShieldCheck,
  History,
  ChevronDown,
  Shield
} from 'lucide-react';

export default function Header({ 
  isFirebase, 
  onNewPatient, 
  onOpenConfig, 
  pacientes,
  onImportPacientes,
  currentUser,
  onLogout,
  onOpenChangePassword,
  onOpenUserManagement,
  onOpenAuditLogs
}) {
  const fileInputRef = useRef(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(pacientes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `backup_prontuario_jrrpcd_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          if (confirm(`Deseja importar ${imported.length} registros de pacientes?`)) {
            onImportPacientes(imported);
          }
        } else {
          alert('Arquivo JSON inválido para prontuários.');
        }
      } catch (err) {
        alert('Erro ao processar o arquivo: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          {/* Logo e Título */}
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-md border border-slate-200 bg-white flex items-center justify-center shrink-0">
              <img 
                src="/logo.jpg" 
                alt="Logo JRRPCD" 
                className="w-full h-full object-contain p-0.5" 
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  GESTÃO JUNTA <span className="text-blue-600 font-semibold text-base font-normal">| OPM & Reabilitação</span>
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  JRRPCD
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Protocolo de OPM, Reabilitação Intelectual e Física
              </p>
            </div>
          </div>

          {/* Status do Banco e Ações */}
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
            
            {/* Status Firebase / Local */}
            <button
              onClick={onOpenConfig}
              title="Clique para configurar credenciais do Firebase"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isFirebase 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' 
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              {isFirebase ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Firestore Nuvem</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Modo Local / Conectar Firebase</span>
                </>
              )}
            </button>

            {/* Backup / Exportar */}
            <div className="hidden lg:flex items-center gap-1">
              <button
                onClick={handleExportBackup}
                title="Exportar backup completo em JSON"
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 text-xs flex items-center gap-1 transition"
              >
                <Download className="w-4 h-4" />
                <span>Exportar</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                title="Importar backup em JSON"
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 text-xs flex items-center gap-1 transition"
              >
                <Upload className="w-4 h-4" />
                <span>Importar</span>
              </button>
              <input 
                ref={fileInputRef} 
                type="file" 
                accept=".json" 
                className="hidden" 
                onChange={handleFileChange} 
              />
            </div>

            {/* Botão Novo Paciente */}
            <button
              onClick={onNewPatient}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <UserPlus className="w-4 h-4" />
              <span>Novo Paciente</span>
            </button>

            {/* Menu do Usuário Autenticado */}
            {currentUser && (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {currentUser.nome?.charAt(0) || 'U'}
                  </div>
                  <div className="hidden sm:block">
                    <span className="block text-xs font-bold text-slate-800 leading-tight">
                      {currentUser.nome}
                    </span>
                    <span className="text-[10px] text-blue-600 font-semibold block uppercase tracking-wider">
                      {currentUser.role === 'admin' ? 'Administrador' : 'Operador'}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Conectado como</span>
                      <strong className="text-slate-900 block truncate">{currentUser.nome}</strong>
                      <span className="text-[11px] font-mono text-slate-500">@{currentUser.username}</span>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenChangePassword();
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-medium transition"
                      >
                        <KeyRound className="w-4 h-4 text-slate-500" />
                        <span>Alterar Minha Senha</span>
                      </button>

                      {currentUser.role === 'admin' && (
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onOpenUserManagement();
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-medium transition"
                        >
                          <ShieldCheck className="w-4 h-4 text-indigo-600" />
                          <span>Gerenciar Usuários</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenAuditLogs();
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-medium transition"
                      >
                        <History className="w-4 h-4 text-blue-600" />
                        <span>Carimbos & Auditoria</span>
                      </button>
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onLogout();
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 font-semibold transition"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span>Sair do Sistema</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}

