import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  Key, 
  HelpCircle, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink, 
  RotateCcw,
  Sparkles,
  ClipboardPaste
} from 'lucide-react';
import { 
  getStoredFirebaseConfig, 
  saveFirebaseConfig, 
  clearFirebaseConfig, 
  isFirebaseActive 
} from '../firebase';

export default function FirebaseConfigModal({ isOpen, onClose, onConfigSaved }) {
  const [config, setConfig] = useState({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  });

  const [rawPaste, setRawPaste] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);
  const isConnected = isFirebaseActive();

  useEffect(() => {
    const current = getStoredFirebaseConfig();
    if (current) {
      setConfig({
        apiKey: current.apiKey || '',
        authDomain: current.authDomain || '',
        projectId: current.projectId || '',
        storageBucket: current.storageBucket || '',
        messagingSenderId: current.messagingSenderId || '',
        appId: current.appId || '',
      });
    }
    setStatusMessage(null);
  }, [isOpen]);

  if (!isOpen) return null;

  // Analisa o código colado do console do Firebase e preenche os campos automaticamente
  const handleAutoParseSnippet = (text) => {
    setRawPaste(text);
    if (!text.trim()) return;

    const extract = (regex) => {
      const match = text.match(regex);
      return match ? match[1].trim() : '';
    };

    const apiKey = extract(/apiKey["']?\s*:\s*["']([^"']+)["']/i);
    const authDomain = extract(/authDomain["']?\s*:\s*["']([^"']+)["']/i);
    const projectId = extract(/projectId["']?\s*:\s*["']([^"']+)["']/i);
    const storageBucket = extract(/storageBucket["']?\s*:\s*["']([^"']+)["']/i);
    const messagingSenderId = extract(/messagingSenderId["']?\s*:\s*["']([^"']+)["']/i);
    const appId = extract(/appId["']?\s*:\s*["']([^"']+)["']/i);

    if (apiKey || projectId) {
      setConfig((prev) => ({
        ...prev,
        apiKey: apiKey || prev.apiKey,
        authDomain: authDomain || prev.authDomain,
        projectId: projectId || prev.projectId,
        storageBucket: storageBucket || prev.storageBucket,
        messagingSenderId: messagingSenderId || prev.messagingSenderId,
        appId: appId || prev.appId,
      }));
      setStatusMessage({
        type: 'success',
        text: 'Configurações extraídas com sucesso do texto colado!'
      });
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!config.apiKey.trim() || !config.projectId.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Por favor, informe ao menos a API Key e o Project ID do Firebase.'
      });
      return;
    }

    try {
      saveFirebaseConfig(config);
      setStatusMessage({
        type: 'success',
        text: 'Firebase configurado com sucesso! Sincronizando com Firestore...'
      });
      setTimeout(() => {
        onConfigSaved();
        onClose();
      }, 1000);
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: 'Erro ao salvar configuração: ' + err.message
      });
    }
  };

  const handleReset = () => {
    if (confirm('Deseja remover as configurações do Firebase e retornar ao armazenamento local?')) {
      clearFirebaseConfig();
      setConfig({
        apiKey: '',
        authDomain: '',
        projectId: '',
        storageBucket: '',
        messagingSenderId: '',
        appId: '',
      });
      setStatusMessage({
        type: 'info',
        text: 'Configurações removidas. Sistema operando em modo local.'
      });
      onConfigSaved();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 no-print">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabeçalho */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-600 to-orange-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Conexão com Firebase (Firestore & Hosting)</h2>
              <p className="text-xs text-orange-100">
                Sincronize prontuários em tempo real na nuvem do Google Firebase
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

        {/* Conteúdo */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-sm">
          
          {/* Status Atual */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            isConnected 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            {isConnected ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            )}
            <div>
              <div className="font-bold">
                {isConnected ? 'Firebase Firestore Ativo e Conectado!' : 'Operando em Armazenamento Local (Offline/Navegador)'}
              </div>
              <p className="text-xs mt-0.5 opacity-90">
                {isConnected 
                  ? 'Os dados dos pacientes e evoluções estão sincronizando diretamente na nuvem do Firestore.' 
                  : 'Seus dados estão salvos localmente neste navegador. Para sincronizar na nuvem e compartilhar entre computadores, configure o Firebase abaixo.'}
              </p>
            </div>
          </div>

          {/* Mensagem de Feedback */}
          {statusMessage && (
            <div className={`p-3 rounded-lg text-xs font-medium ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                : statusMessage.type === 'error'
                ? 'bg-red-100 text-red-800 border border-red-200'
                : 'bg-blue-100 text-blue-800 border border-blue-200'
            }`}>
              {statusMessage.text}
            </div>
          )}

          {/* Atalho Inteligente: Colar Código Completo */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Preenchimento Rápido (Cole o firebaseConfig do Console)
              </span>
            </label>
            <p className="text-xs text-slate-500">
              Copie o objeto fornecido pelo Firebase Console e cole aqui para preencher todos os campos de uma vez:
            </p>
            <textarea
              rows={3}
              placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  projectId: "prontuario-jrrpcd",\n  ...\n};`}
              value={rawPaste}
              onChange={(e) => handleAutoParseSnippet(e.target.value)}
              className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
            />
          </div>

          {/* Formulário de Campos Individuais */}
          <form onSubmit={handleSave} className="space-y-3.5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Parâmetros de Conexão do Firestore
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  API Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="AIzaSy..."
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  className="w-full text-xs font-mono rounded-lg border-slate-300 border px-3 py-2 bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: prontuario-jrrpcd"
                  value={config.projectId}
                  onChange={(e) => setConfig({ ...config, projectId: e.target.value })}
                  className="w-full text-xs font-mono rounded-lg border-slate-300 border px-3 py-2 bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Auth Domain
                </label>
                <input
                  type="text"
                  placeholder="ex: seu-projeto.firebaseapp.com"
                  value={config.authDomain}
                  onChange={(e) => setConfig({ ...config, authDomain: e.target.value })}
                  className="w-full text-xs font-mono rounded-lg border-slate-300 border px-3 py-2 bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Storage Bucket
                </label>
                <input
                  type="text"
                  placeholder="ex: seu-projeto.appspot.com"
                  value={config.storageBucket}
                  onChange={(e) => setConfig({ ...config, storageBucket: e.target.value })}
                  className="w-full text-xs font-mono rounded-lg border-slate-300 border px-3 py-2 bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Messaging Sender ID
                </label>
                <input
                  type="text"
                  placeholder="ex: 123456789012"
                  value={config.messagingSenderId}
                  onChange={(e) => setConfig({ ...config, messagingSenderId: e.target.value })}
                  className="w-full text-xs font-mono rounded-lg border-slate-300 border px-3 py-2 bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  App ID
                </label>
                <input
                  type="text"
                  placeholder="ex: 1:123456:web:abcd"
                  value={config.appId}
                  onChange={(e) => setConfig({ ...config, appId: e.target.value })}
                  className="w-full text-xs font-mono rounded-lg border-slate-300 border px-3 py-2 bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            {/* Guia Rápido de Criação */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                Como obter as chaves no Firebase:
              </span>
              <ol className="list-decimal pl-4 space-y-0.5">
                <li>Acesse <strong>console.firebase.google.com</strong> e crie um projeto gratuito.</li>
                <li>Ative o <strong>Cloud Firestore</strong> (em Criar Banco de Dados).</li>
                <li>Em <em>Configurações do Projeto &gt; Geral &gt; Seus Aplicativos</em>, adicione um app Web (&lt;/&gt;) e copie o <code>firebaseConfig</code>.</li>
              </ol>
            </div>

            {/* Ações */}
            <div className="pt-3 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Desconectar e Usar Modo Local</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition"
                >
                  Salvar e Conectar
                </button>
              </div>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
}
