import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Eye, 
  Edit3, 
  Trash2, 
  PlusCircle, 
  Printer, 
  RotateCcw,
  Sparkles,
  Clock,
  UserCheck
} from 'lucide-react';

export default function PatientList({
  pacientes,
  onSelectPatient,
  onEditPatient,
  onDeletePatient,
  onOpenEvolutionModal,
  onPrintPatient,
  activeServicoFilter,
  onSelectServicoFilter
}) {
  const [filterServico, setFilterServico] = useState('');
  const [filterCid, setFilterCid] = useState('');
  const [filterMunicipio, setFilterMunicipio] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Sincroniza filtro vindo dos Cards de Estatística
  const currentServico = activeServicoFilter && activeServicoFilter !== 'todos' 
    ? activeServicoFilter 
    : filterServico;

  // Filtragem fiel ao prontuario.example
  const filteredPacientes = useMemo(() => {
    return pacientes.filter((p) => {
      // Filtro por Serviço
      const serv = currentServico;
      const matchServ = !serv || p.servico_especializado === serv;

      // Filtro por CID
      const cidTerm = filterCid.toUpperCase().trim();
      const matchCid = !cidTerm || (p.cid && p.cid.toUpperCase().includes(cidTerm));

      // Filtro por Município
      const munTerm = filterMunicipio.toUpperCase().trim();
      const matchMun = !munTerm || (p.municipio && p.municipio.toUpperCase().includes(munTerm));

      // Busca Geral
      const search = searchTerm.toUpperCase().trim();
      const matchSearch = !search || (
        (p.nome && p.nome.toUpperCase().includes(search)) ||
        (p.cid && p.cid.toUpperCase().includes(search)) ||
        (p.municipio && p.municipio.toUpperCase().includes(search)) ||
        (p.esf && p.esf.toUpperCase().includes(search)) ||
        (p.telefone && p.telefone.includes(search)) ||
        (p.observacoes && p.observacoes.toUpperCase().includes(search)) ||
        (p.opm_list && p.opm_list.some((o) => 
          (o.tipo && o.tipo.toUpperCase().includes(search)) || 
          (o.solicitada && o.solicitada.toUpperCase().includes(search))
        ))
      );

      return matchServ && matchCid && matchMun && matchSearch;
    });
  }, [pacientes, currentServico, filterCid, filterMunicipio, searchTerm]);

  const handleResetFilters = () => {
    setFilterServico('');
    setFilterCid('');
    setFilterMunicipio('');
    setSearchTerm('');
    if (onSelectServicoFilter) {
      onSelectServicoFilter('todos');
    }
  };

  return (
    <div className="space-y-4 no-print">
      
      {/* Barra de Filtros no padrão do prontuario.example */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Filtro por Serviço */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">
              Filtrar por Serviço
            </label>
            <select
              value={currentServico}
              onChange={(e) => {
                setFilterServico(e.target.value);
                if (onSelectServicoFilter) onSelectServicoFilter(e.target.value || 'todos');
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            >
              <option value="">TODOS OS SERVIÇOS</option>
              <option value="OPM">OPM</option>
              <option value="Reab. Intelectual">REAB. INTELECTUAL</option>
              <option value="Reab. Fisica">REAB. FÍSICA</option>
            </select>
          </div>

          {/* Filtro por CID */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">
              Filtrar por CID
            </label>
            <input
              type="text"
              value={filterCid}
              onChange={(e) => setFilterCid(e.target.value)}
              placeholder="EX: F84 OU ELA"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtro por Município */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">
              Filtrar por Município
            </label>
            <input
              type="text"
              value={filterMunicipio}
              onChange={(e) => setFilterMunicipio(e.target.value)}
              placeholder="EX: FUNILANDIA, SETE LAGOAS"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Botão Limpar Filtros */}
          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar Filtros</span>
            </button>
          </div>

        </div>

        {/* Busca rápida */}
        <div className="relative pt-2 border-t border-slate-100">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisa rápida por nome, telefone, OPM solicitada ou observações..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tabela de Pacientes fiel ao prontuario.example */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4">Data Ent.</th>
                <th className="p-4">Nome do Paciente</th>
                <th className="p-4">DN / Idade</th>
                <th className="p-4">Município</th>
                <th className="p-4">CID / Diagnóstico</th>
                <th className="p-4">Serviço</th>
                <th className="p-4">OPMs Solicitadas</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredPacientes.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">
                    Nenhum paciente encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredPacientes.map((p) => {
                  const servico = p.servico_especializado || 'OPM';
                  const badgeColor = 
                    servico === 'OPM' 
                      ? 'bg-blue-100 text-blue-700' 
                      : servico === 'Reab. Intelectual' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-emerald-100 text-emerald-700';

                  const opms = p.opm_list || [];
                  const dataEntrada = p.data_entrada || p.dataEntrada || '-';
                  const dn = p.dn || p.dataNascimento || '-';
                  const idadeText = p.idade ? `${p.idade}a` : '-';

                  return (
                    <tr 
                      key={p.id} 
                      className="hover:bg-slate-50/80 transition border-b border-slate-100 cursor-pointer group"
                      onClick={() => onSelectPatient(p)}
                    >
                      {/* Data de Entrada */}
                      <td className="p-4 font-medium text-slate-600 whitespace-nowrap">
                        {dataEntrada}
                      </td>

                      {/* Nome do Paciente */}
                      <td className="p-4 font-bold text-slate-900 group-hover:text-blue-600 transition">
                        <div>{p.nome}</div>
                        {p.telefone && (
                          <div className="text-[11px] text-slate-400 font-normal">
                            {p.telefone}
                          </div>
                        )}
                      </td>

                      {/* DN / Idade */}
                      <td className="p-4 text-slate-600 whitespace-nowrap">
                        {dn} ({idadeText})
                      </td>

                      {/* Município */}
                      <td className="p-4 text-slate-600">
                        <div className="font-medium text-slate-800">{p.municipio || '-'}</div>
                        {p.esf && (
                          <div className="text-[10px] text-slate-400">{p.esf}</div>
                        )}
                      </td>

                      {/* CID / Diagnóstico */}
                      <td className="p-4 text-slate-700 font-medium max-w-[220px]">
                        <span className="line-clamp-2" title={p.cid}>
                          {p.cid}
                        </span>
                      </td>

                      {/* Serviço Especializado */}
                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${badgeColor}`}>
                          {servico}
                        </span>
                      </td>

                      {/* OPMs Solicitadas */}
                      <td className="p-4 max-w-xs">
                        {opms.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {opms.map((o, idx) => (
                              <span 
                                key={idx}
                                className="inline-block bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-semibold border border-blue-100"
                              >
                                {o.tipo}: {o.solicitada}
                              </span>
                            ))}
                          </div>
                        ) : p.tipoOpm ? (
                          <span className="inline-block bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-semibold border border-blue-100">
                            {p.tipoOpm}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Ações */}
                      <td 
                        className="p-4 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Ver Prontuário Completo */}
                          <button
                            onClick={() => onSelectPatient(p)}
                            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition flex items-center justify-center"
                            title="Ver Prontuário & Evoluções"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Adicionar Evolução */}
                          <button
                            onClick={() => onOpenEvolutionModal(p)}
                            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-600 transition flex items-center justify-center"
                            title="Registrar Nova Evolução Clínica"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>

                          {/* Imprimir */}
                          <button
                            onClick={() => onPrintPatient(p)}
                            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition flex items-center justify-center"
                            title="Imprimir Prontuário"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Editar */}
                          <button
                            onClick={() => onEditPatient(p)}
                            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition flex items-center justify-center"
                            title="Editar Dados do Paciente"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Excluir */}
                          <button
                            onClick={() => {
                              if (confirm(`Tem certeza que deseja excluir o registro de ${p.nome}?`)) {
                                onDeletePatient(p.id);
                              }
                            }}
                            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition flex items-center justify-center"
                            title="Excluir Registro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé da tabela */}
        <div className="p-4 bg-slate-50/70 border-t border-slate-100 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Mostrando <strong>{filteredPacientes.length}</strong> de <strong>{pacientes.length}</strong> pacientes
          </span>
          <span className="text-[11px] text-slate-400">
            Clique em qualquer linha para abrir o prontuário e histórico de evolução clínica.
          </span>
        </div>
      </div>

    </div>
  );
}
