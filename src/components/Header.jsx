import React, { useRef } from 'react';
import { 
  FileText, 
  UserPlus, 
  Database, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle,
  Activity
} from 'lucide-react';

export default function Header({ 
  isFirebase, 
  onNewPatient, 
  onOpenConfig, 
  pacientes,
  onImportPacientes 
}) {
  const fileInputRef = useRef(null);

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
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  JRRPCD <span className="text-blue-600 font-semibold text-base font-normal">| Prontuário & Evolução</span>
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  Rede de Cuidados PCD
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Controle Clínico, Órteses, Próteses e Materiais Especiais (OPM)
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
          </div>

        </div>
      </div>
    </header>
  );
}
