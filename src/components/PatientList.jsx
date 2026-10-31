import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  User, 
  Phone, 
  MapPin, 
  Building2, 
  Stethoscope, 
  Accessibility, 
  Clock, 
  FileText, 
  MoreVertical, 
  Printer, 
  Edit3, 
  Trash2, 
  PlusCircle, 
  Eye, 
  ArrowUpDown,
  ExternalLink
} from 'lucide-react';
import { 
  formatarDataBR, 
  STATUS_PACIENTE 
} from '../types';

export default function PatientList({
  pacientes,
  onSelectPatient,
  onEditPatient,
  onDeletePatient,
  onOpenEvolutionModal,
  onPrintPatient,
  activeStatusFilter,
  onClearStatusFilter
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOpmFilter, setSelectedOpmFilter] = useState('todos');
  const [sortBy, setSortBy] = useState('dataEntrada_desc');

  // Obter lista única de OPMs para o filtro
  const uniqueOpms = useMemo(() => {
    const set = new Set();
    pacientes.forEach((p) => {
      if (p.tipoOpm) set.add(p.tipoOpm.trim());
    });
    return Array.from(set).sort();
  }, [pacientes]);

  // Filtragem dos pacientes
  const filteredPacientes = useMemo(() => {
    return pacientes.filter((p) => {
      // Filtro de texto (busca ampla)
      const term = searchTerm.toLowerCase().trim();
      const matchSearch = !term || (
        (p.nome && p.nome.toLowerCase().includes(term)) ||
        (p.cid && p.cid.toLowerCase().includes(term)) ||
        (p.tipoOpm && p.tipoOpm.toLowerCase().includes(term)) ||
        (p.municipio && p.municipio.toLowerCase().includes(term)) ||
        (p.esfReferencia && p.esfReferencia.toLowerCase().includes(term)) ||
        (p.telefone && p.telefone.includes(term)) ||
        (p.prontuarioObservacoes && p.prontuarioObservacoes.toLowerCase().includes(term))
      );

      // Filtro por Status
      const matchStatus = !activeStatusFilter || activeStatusFilter === 'todos' || (
        activeStatusFilter === 'em_avaliacao' 
          ? (p.status === 'triagem' || p.status === 'em_avaliacao')
          : activeStatusFilter === 'aguardando_opm'
          ? (p.status === 'aguardando_opm' || p.status === 'prova_ajuste')
          : activeStatusFilter === 'concluido'
          ? (p.status === 'concluido' || p.status === 'acompanhamento')
          : p.status === activeStatusFilter
      );

      // Filtro por OPM
      const matchOpm = selectedOpmFilter === 'todos' || p.tipoOpm === selectedOpmFilter;

      return matchSearch && matchStatus && matchOpm;
    }).sort((a, b) => {
      if (sortBy === 'dataEntrada_desc') {
        return (b.dataEntrada || '').localeCompare(a.dataEntrada || '');
      }
      if (sortBy === 'dataEntrada_asc') {
        return (a.dataEntrada || '').localeCompare(b.dataEntrada || '');
      }
      if (sortBy === 'nome_asc') {
        return (a.nome || '').localeCompare(b.nome || '');
      }
      if (sortBy === 'nome_desc') {
        return (b.nome || '').localeCompare(a.nome || '');
      }
      return 0;
    });
  }, [pacientes, searchTerm, activeStatusFilter, selectedOpmFilter, sortBy]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden no-print">
      
      {/* Barra de Filtros e Busca */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 space-y-3.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Campo de Busca */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome, CID, OPM, município, telefone, observações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 p-1"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Seletores de Filtro */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Filtro OPM */}
            <div className="relative min-w-[150px] flex-1 sm:flex-initial">
              <select
                value={selectedOpmFilter}
                onChange={(e) => setSelectedOpmFilter(e.target.value)}
                className="w-full text-xs font-medium rounded-xl border border-slate-200 bg-white py-2.5 px-3 focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
              >
                <option value="todos">Todas as OPMs</option>
                {uniqueOpms.map((opm) => (
                  <option key={opm} value={opm}>
                    {opm}
                  </option>
                ))}
              </select>
            </div>

            {/* Ordenação */}
            <div className="relative min-w-[150px] flex-1 sm:flex-initial">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full text-xs font-medium rounded-xl border border-slate-200 bg-white py-2.5 px-3 focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
              >
                <option value="dataEntrada_desc">Data de Entrada (Recentes)</option>
                <option value="dataEntrada_asc">Data de Entrada (Antigos)</option>
                <option value="nome_asc">Nome (A - Z)</option>
                <option value="nome_desc">Nome (Z - A)</option>
              </select>
            </div>

          </div>

        </div>

        {/* Indicador de filtro ativo */}
        {(activeStatusFilter && activeStatusFilter !== 'todos') && (
          <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50/80 px-3 py-1.5 rounded-lg border border-blue-100">
            <span>Filtro de categoria ativo: <strong>{activeStatusFilter}</strong></span>
            <button
              onClick={onClearStatusFilter}
              className="text-blue-600 hover:underline font-bold ml-auto"
            >
              Remover filtro
            </button>
          </div>
        )}
      </div>

      {/* Lista / Tabela */}
      {filteredPacientes.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
            <User className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Nenhum prontuário encontrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {searchTerm 
              ? `Não encontramos resultados correspondentes a "${searchTerm}". Tente outros termos.`
              : 'Nenhum paciente cadastrado para os filtros selecionados.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Paciente</th>
                <th className="py-3 px-4">Data Entrada</th>
                <th className="py-3 px-4">Município / ESF</th>
                <th className="py-3 px-4">CID / Diagnóstico</th>
                <th className="py-3 px-4">Tipo de OPM</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Evoluções</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPacientes.map((paciente) => {
                const statusConfig = STATUS_PACIENTE.find((s) => s.id === paciente.status) || STATUS_PACIENTE[0];
                const evolucoesCount = (paciente.evolucoes || []).length;

                return (
                  <tr 
                    key={paciente.id} 
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => onSelectPatient(paciente)}
                  >
                    {/* Nome e Idade */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition">
                        {paciente.nome}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span>Idade: <strong>{paciente.idade || '-'}</strong></span>
                        {paciente.telefone && (
                          <>
                            <span>•</span>
                            <span className="text-slate-600">{paciente.telefone}</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Data de Entrada */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs font-medium text-slate-700">
                      {formatarDataBR(paciente.dataEntrada)}
                    </td>

                    {/* Município / ESF */}
                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-medium text-slate-800">
                        {paciente.municipio || '-'}
                      </div>
                      <div className="text-slate-500 text-[11px] truncate max-w-[180px]">
                        {paciente.esfReferencia || 'ESF não informada'}
                      </div>
                    </td>

                    {/* CID / Diagnóstico */}
                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-semibold text-slate-800 truncate max-w-[200px]" title={paciente.cid}>
                        {paciente.cid || '-'}
                      </div>
                    </td>

                    {/* Tipo de OPM */}
                    <td className="py-3.5 px-4 text-xs">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
                        {paciente.tipoOpm || 'A definir'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </td>

                    {/* Evoluções Count */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                        <Clock className="w-3 h-3" />
                        {evolucoesCount}
                      </span>
                    </td>

                    {/* Ações */}
                    <td 
                      className="py-3.5 px-4 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()} // Impede abrir o modal ao clicar nos botões individuais
                    >
                      <div className="flex items-center justify-end gap-1">
                        
                        {/* Ver Prontuário */}
                        <button
                          onClick={() => onSelectPatient(paciente)}
                          title="Ver Prontuário Completo"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Evoluir */}
                        <button
                          onClick={() => onOpenEvolutionModal(paciente)}
                          title="Registrar Nova Evolução"
                          className="p-1.5 text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>

                        {/* Imprimir */}
                        <button
                          onClick={() => onPrintPatient(paciente)}
                          title="Imprimir Prontuário"
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Editar */}
                        <button
                          onClick={() => onEditPatient(paciente)}
                          title="Editar Cadastro"
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Excluir */}
                        <button
                          onClick={() => {
                            if (confirm(`Tem certeza que deseja excluir o prontuário de ${paciente.nome}? Esta ação não pode ser desfeita.`)) {
                              onDeletePatient(paciente.id);
                            }
                          }}
                          title="Excluir Prontuário"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Rodapé da Tabela */}
      <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/60 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>
          Mostrando <strong>{filteredPacientes.length}</strong> de <strong>{pacientes.length}</strong> pacientes cadastrados
        </span>
        <span className="text-[11px] text-slate-400">
          Dica: Clique sobre a linha de qualquer paciente para abrir o prontuário completo.
        </span>
      </div>

    </div>
  );
}
