import React, { useState, useEffect } from 'react';
import { 
  X, 
  History, 
  Search, 
  User, 
  Clock, 
  ShieldCheck, 
  Filter, 
  RefreshCw 
} from 'lucide-react';
import { listarAuditoria } from '../auth';

export default function AuditLogsModal({ isOpen, onClose }) {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroAcao, setFiltroAcao] = useState('todas');

  const carregarLogs = async () => {
    try {
      setIsLoading(true);
      const data = await listarAuditoria(200);
      setLogs(data);
    } catch (err) {
      console.error('Erro ao carregar auditoria:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      carregarLogs();
      setSearchTerm('');
      setFiltroAcao('todas');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const logsFiltrados = logs.filter((l) => {
    const term = searchTerm.toLowerCase();
    const matchSearch = 
      !searchTerm ||
      (l.detalhes && l.detalhes.toLowerCase().includes(term)) ||
      (l.usuarioNome && l.usuarioNome.toLowerCase().includes(term)) ||
      (l.usuarioUsername && l.usuarioUsername.toLowerCase().includes(term)) ||
      (l.pacienteNome && l.pacienteNome.toLowerCase().includes(term));

    const matchAcao =
      filtroAcao === 'todas' ||
      (filtroAcao === 'ARQUIVO_MORTO'
        ? l.acao && l.acao.startsWith('ARQUIVO_MORTO')
        : l.acao === filtroAcao);

    return matchSearch && matchAcao;
  });

  const getBadgeAcao = (acao) => {
    switch (acao) {
      case 'CADASTRO_PACIENTE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Cadastro Paciente</span>;
      case 'ALTERACAO_PACIENTE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">Alteração Paciente</span>;
      case 'EXCLUSAO_PACIENTE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">Exclusão Paciente</span>;
      case 'NOVO_PRONTUARIO':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">Novo Prontuário</span>;
      case 'EXCLUSAO_PRONTUARIO':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Exclusão Prontuário</span>;
      case 'LOGIN':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">Login</span>;
      case 'LOGOUT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Logout</span>;
      case 'TROCA_SENHA':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">Troca Senha</span>;
      case 'CRIACAO_USUARIO':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">Criação Usuário</span>;
      case 'EXCLUSAO_USUARIO':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Exclusão Usuário</span>;
      case 'ARQUIVO_MORTO_ENTRADA':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">Movido p/ Arquivo Morto</span>;
      case 'ARQUIVO_MORTO_CADASTRO':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Cadastro Arquivo Morto</span>;
      case 'ARQUIVO_MORTO_EDICAO':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">Edição Arquivo Morto</span>;
      case 'ARQUIVO_MORTO_RESTAURACAO':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Restauração Arquivo Morto</span>;
      case 'ARQUIVO_MORTO_EXCLUSAO':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">Exclusão Arquivo Morto</span>;
      case 'ARQUIVO_MORTO_IMPORTACAO':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">Importação CSV Arquivo Morto</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">{acao}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 lg:p-6 no-print">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabeçalho */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <History className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>Histórico de Auditoria & Carimbos do Sistema</span>
              </h2>
              <p className="text-[11px] text-slate-300">
                Registro imutável de todas as ações, cadastros, alterações e exclusões
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

        {/* Filtros e Busca */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por usuário, paciente ou detalhe da ação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={filtroAcao}
              onChange={(e) => setFiltroAcao(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 outline-none font-semibold text-slate-700"
            >
              <option value="todas">Todas as Ações</option>
              <option value="CADASTRO_PACIENTE">Cadastro de Paciente</option>
              <option value="ALTERACAO_PACIENTE">Alteração de Paciente</option>
              <option value="EXCLUSAO_PACIENTE">Exclusão de Paciente</option>
              <option value="NOVO_PRONTUARIO">Novo Prontuário</option>
              <option value="EXCLUSAO_PRONTUARIO">Exclusão de Prontuário</option>
              <option value="ARQUIVO_MORTO">Arquivo Morto</option>
              <option value="LOGIN">Logins</option>
              <option value="TROCA_SENHA">Troca de Senha</option>
              <option value="CRIACAO_USUARIO">Gestão de Usuários</option>
            </select>

            <button
              onClick={carregarLogs}
              className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition"
              title="Atualizar lista"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Conteúdo com Lista de Auditoria */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3 text-xs">
          {isLoading ? (
            <div className="text-center py-10 text-slate-400">Carregando carimbos de auditoria...</div>
          ) : logsFiltrados.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              Nenhum registro de auditoria encontrado com os filtros aplicados.
            </div>
          ) : (
            <div className="space-y-2">
              {logsFiltrados.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-white border border-slate-200 rounded-2xl shadow-2xs hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getBadgeAcao(item.acao)}
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        {item.usuarioNome || item.usuarioUsername}
                        <span className="font-mono text-[10px] text-slate-400 font-normal">
                          (@{item.usuarioUsername})
                        </span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {item.detalhes}
                    </p>

                    {item.dadosArquivoMorto && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] bg-amber-50/80 border border-amber-200 rounded-xl px-2.5 py-1.5 text-amber-950">
                        <span><strong>Paciente:</strong> {item.dadosArquivoMorto.nome}</span>
                        <span>•</span>
                        <span><strong>DN:</strong> {item.dadosArquivoMorto.dn || 'Não informada'}</span>
                        <span>•</span>
                        <span><strong>Data de Saída:</strong> {item.dadosArquivoMorto.dataSaida || '-'}</span>
                        {item.dadosArquivoMorto.pasta && (
                          <>
                            <span>•</span>
                            <span><strong>Pasta:</strong> {item.dadosArquivoMorto.pasta}</span>
                          </>
                        )}
                        {item.dadosArquivoMorto.observacoes && (
                          <>
                            <span>•</span>
                            <span><strong>Obs.:</strong> {item.dadosArquivoMorto.observacoes}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 shrink-0 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.dataHoraFormatada || item.dataHoraIso}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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

