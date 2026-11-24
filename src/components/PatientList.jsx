import React, { useState, useMemo, useEffect } from 'react';
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
  UserCheck,
  Layers,
  Archive,
  ArrowUpDown
} from 'lucide-react';
import { 
  MUNICIPIOS_SUGERIDOS,
  isMotorizadaSolicitada,
  verificarCompatibilidadeMotorizada,
  agruparPacientesPorPessoa,
  getChaveIdentificacaoPaciente,
  contarOpmsSolicitadas,
  getBadgeColorServico,
  temOpmSolicitada
} from '../types';

const STORAGE_KEY_PATIENT_VIEW_MODE = 'jrrpcd_patient_view_mode';

function parseDataTimestamp(dataStr) {
  if (!dataStr) return 0;
  const trimmed = String(dataStr).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.split('/');
    return new Date(Number(y), Number(m) - 1, Number(d)).getTime() || 0;
  }
  const ts = new Date(trimmed).getTime();
  return isNaN(ts) ? 0 : ts;
}

export default function PatientList({
  pacientes,
  onSelectPatient,
  onEditPatient,
  onDeletePatient,
  onArchivePatient,
  onOpenEvolutionModal,
  onPrintPatient,
  activeServicoFilter,
  onSelectServicoFilter
}) {
  const [filterServico, setFilterServico] = useState('');
  const [filterCid, setFilterCid] = useState('');
  const [filterMunicipio, setFilterMunicipio] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [ordenacao, setOrdenacao] = useState('entrada_recente');
  const [agruparPorPaciente, setAgruparPorPaciente] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_PATIENT_VIEW_MODE) !== 'separated';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_PATIENT_VIEW_MODE,
        agruparPorPaciente ? 'unified' : 'separated'
      );
    } catch (e) {
      console.warn('Erro ao salvar modo de visualização da lista:', e);
    }
  }, [agruparPorPaciente]);

  // Sincroniza filtro vindo dos Cards de Estatística
  const currentServico = activeServicoFilter && activeServicoFilter !== 'todos' 
    ? activeServicoFilter 
    : filterServico;

  // 1. Prepara a lista conforme o modo selecionado (Unificado por pessoa ou Separado por solicitação)
  const pacientesAgrupados = useMemo(() => {
    return agruparPacientesPorPessoa(pacientes);
  }, [pacientes]);

  const mapaUnificadoPorChave = useMemo(() => {
    const map = new Map();
    for (const pac of pacientesAgrupados) {
      if (pac.chaveIdentificacao) {
        map.set(pac.chaveIdentificacao, pac);
      }
    }
    return map;
  }, [pacientesAgrupados]);

  const getProntuarioUnificado = (p) => {
    const chave = p.chaveIdentificacao || getChaveIdentificacaoPaciente(p);
    return mapaUnificadoPorChave.get(chave) || p;
  };

  const pacientesSeparados = useMemo(() => {
    return pacientes
      .filter(Boolean)
      .map((p) => {
        const opmList = Array.isArray(p.opm_list)
          ? p.opm_list
          : p.tipoOpm
            ? [{ tipo: 'OPM', solicitada: p.tipoOpm.trim(), data: p.data_entrada || p.dataEntrada || '' }]
            : [];
        const cidList = Array.isArray(p.cid_list)
          ? p.cid_list
          : p.cid
            ? p.cid.split(/[;]/).map((c) => c.trim()).filter(Boolean)
            : [];

        return {
          ...p,
          ids: [p.id],
          registros: [p],
          totalServicos: 1,
          servicos: [p.servico_especializado || 'OPM'],
          opm_list: opmList,
          cid_list: cidList
        };
      });
  }, [pacientes]);

  const pacientesBase = agruparPorPaciente ? pacientesAgrupados : pacientesSeparados;

  const totalPacientesGeral = pacientesAgrupados.length;
  const totalServicosGeral = pacientes.length;

  // 2. Filtragem e ordenação dos registros com base nos filtros selecionados (Padrão: Alfabética A-Z)
  const filteredPacientes = useMemo(() => {
    const filtrados = pacientesBase.filter((p) => {
      // Filtro por Serviço: verifica se o paciente possui o serviço entre seus atendimentos
      const serv = currentServico;
      const matchServ = !serv || (
        (Array.isArray(p.servicos) && p.servicos.includes(serv)) ||
        p.servico_especializado === serv
      );

      // Filtro por CID
      const cidTerm = filterCid.toUpperCase().trim();
      const matchCid = !cidTerm || (
        (p.cid && p.cid.toUpperCase().includes(cidTerm)) ||
        (p.cid_list && p.cid_list.some((c) => c.toUpperCase().includes(cidTerm)))
      );

      // Filtro por Município
      const munTerm = filterMunicipio.toUpperCase().trim();
      const matchMun = !munTerm || (p.municipio && p.municipio.toUpperCase().includes(munTerm));

      // Busca Geral
      const search = searchTerm.toUpperCase().trim();
      const matchSearch = !search || (
        (p.nome && p.nome.toUpperCase().includes(search)) ||
        (p.cpf && p.cpf.includes(search)) ||
        (p.nome_mae && p.nome_mae.toUpperCase().includes(search)) ||
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

    return [...filtrados].sort((a, b) => {
      switch (ordenacao) {
        case 'alfabetica_za':
          return (b.nome || '').localeCompare(a.nome || '', 'pt-BR', { sensitivity: 'base' });
        case 'entrada_recente': {
          const diff =
            parseDataTimestamp(b.data_entrada || b.dataEntrada) -
            parseDataTimestamp(a.data_entrada || a.dataEntrada);
          if (diff !== 0) return diff;
          return (
            new Date(b.createdAt || b.updatedAt || 0).getTime() -
            new Date(a.createdAt || a.updatedAt || 0).getTime()
          );
        }
        case 'entrada_antiga':
          return (
            parseDataTimestamp(a.data_entrada || a.dataEntrada) -
            parseDataTimestamp(b.data_entrada || b.dataEntrada)
          );
        case 'municipio_az': {
          const ma = (a.municipio || '').trim();
          const mb = (b.municipio || '').trim();
          if (!ma && !mb) return (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' });
          if (!ma) return 1;
          if (!mb) return -1;
          const cmp = ma.localeCompare(mb, 'pt-BR', { sensitivity: 'base' });
          return cmp !== 0 ? cmp : (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' });
        }
        case 'cadastro_recente':
          return (
            new Date(b.createdAt || b.updatedAt || 0).getTime() -
            new Date(a.createdAt || a.updatedAt || 0).getTime()
          );
        case 'alfabetica_az':
        default:
          return (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' });
      }
    });
  }, [pacientesBase, currentServico, filterCid, filterMunicipio, searchTerm, ordenacao]);

  // Contagens dinâmicas para a exibição atual
  const totalServicosExibidos = useMemo(() => {
    return filteredPacientes.reduce((acc, p) => acc + (p.totalServicos || p.registros?.length || 1), 0);
  }, [filteredPacientes]);

  const totalOpmsExibidas = useMemo(() => {
    return contarOpmsSolicitadas(filteredPacientes);
  }, [filteredPacientes]);

  const handleResetFilters = () => {
    setFilterServico('');
    setFilterCid('');
    setFilterMunicipio('');
    setSearchTerm('');
    setOrdenacao('entrada_recente');
    if (onSelectServicoFilter) {
      onSelectServicoFilter('todos');
    }
  };

  return (
    <div className="space-y-4 no-print">
      
      {/* Barra de Filtros e Ordenação */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          
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
              <option value="Reab. Visual">REAB. VISUAL</option>
              <option value="Neonato de Risco">NEONATO DE RISCO</option>
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
            <select
              value={filterMunicipio}
              onChange={(e) => setFilterMunicipio(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            >
              <option value="">TODOS OS MUNICÍPIOS</option>
              {MUNICIPIOS_SUGERIDOS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Ordenação (Padrão: Alfabética A-Z) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-blue-600" />
              <span>Ordenar por</span>
            </label>
            <select
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="entrada_recente">Data de Entrada (Mais recente)</option>
              <option value="entrada_antiga">Data de Entrada (Mais antiga)</option>
              <option value="alfabetica_az">Ordem Alfabética (A → Z)</option>
              <option value="alfabetica_za">Ordem Alfabética (Z → A)</option>
              <option value="municipio_az">Município (A → Z)</option>
              <option value="cadastro_recente">Cadastro (Mais recente)</option>
            </select>
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
            placeholder="Pesquisa rápida por nome, CPF, telefone, município, OPM ou observações..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tabela de Pacientes Agrupados por Pessoa */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        
        {/* Barra com contagem separada de pacientes/solicitações e Switch de visualização */}
        <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-medium">
          <div className="flex flex-wrap items-center gap-2">
            {agruparPorPaciente ? (
              <>
                <span>
                  Listando <strong className="text-blue-700 font-bold">{filteredPacientes.length}</strong> {filteredPacientes.length === 1 ? 'paciente' : 'pacientes'}
                </span>
                <span className="text-slate-300">•</span>
                <span>
                  <strong className="text-slate-800 font-bold">{totalServicosExibidos}</strong> {totalServicosExibidos === 1 ? 'serviço registrado' : 'serviços registrados'}
                </span>
              </>
            ) : (
              <span>
                Listando <strong className="text-blue-700 font-bold">{filteredPacientes.length}</strong> {filteredPacientes.length === 1 ? 'solicitação' : 'solicitações'}
              </span>
            )}
            <span className="text-slate-300">•</span>
            <span>
              <strong className="text-indigo-700 font-bold">{totalOpmsExibidas}</strong> {totalOpmsExibidas === 1 ? 'OPM solicitada' : 'OPMs solicitadas'}
            </span>
            {currentServico && (
              <>
                <span className="text-slate-300">•</span>
                <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-[11px] text-slate-600 font-semibold shadow-2xs">
                  Filtro: <strong className="text-blue-700 uppercase">{currentServico}</strong>
                </span>
              </>
            )}
          </div>

          {/* Switch Unificado vs Separado por Solicitação */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
            <span
              onClick={() => setAgruparPorPaciente(false)}
              className={`text-[11px] font-bold cursor-pointer transition ${
                !agruparPorPaciente ? 'text-blue-700' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Por solicitação
            </span>

            <button
              type="button"
              role="switch"
              aria-checked={agruparPorPaciente}
              onClick={() => setAgruparPorPaciente((prev) => !prev)}
              title={agruparPorPaciente ? 'Alternar para exibição separada por solicitação' : 'Alternar para exibição unificada por paciente'}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                agruparPorPaciente ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  agruparPorPaciente ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>

            <span
              onClick={() => setAgruparPorPaciente(true)}
              className={`text-[11px] font-bold cursor-pointer flex items-center gap-1 transition ${
                agruparPorPaciente ? 'text-blue-700' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Unificado</span>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4">Data Ent.</th>
                <th className="p-4">Nome do Paciente</th>
                <th className="p-4">DN / Idade</th>
                <th className="p-4">Município</th>
                <th className="p-4">CID / Diagnóstico</th>
                <th className="p-4">Serviço(s)</th>
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
                  const servicos = Array.isArray(p.servicos) && p.servicos.length > 0
                    ? p.servicos
                    : [p.servico_especializado || 'OPM'];

                  const opms = p.opm_list || [];
                  const dataEntrada = p.data_entrada || p.dataEntrada || '-';
                  const dn = p.dn || p.dataNascimento || '-';
                  const idadeText = p.idade ? `${p.idade}a` : '-';
                  const cids = p.cid_list && p.cid_list.length > 0
                    ? p.cid_list
                    : p.cid ? p.cid.split(/[;]/).map((c) => c.trim()).filter(Boolean) : [];
                  const hasMotorizada = isMotorizadaSolicitada(opms, p.tipoOpm);
                  const statusMotorizada = hasMotorizada ? verificarCompatibilidadeMotorizada(cids) : null;

                  return (
                    <tr 
                      key={agruparPorPaciente ? (p.chaveIdentificacao || p.id) : p.id} 
                      className="hover:bg-slate-50/80 transition border-b border-slate-100 cursor-pointer group"
                      onClick={() => onSelectPatient(getProntuarioUnificado(p))}
                    >
                      {/* Data de Entrada */}
                      <td className="p-4 font-medium text-slate-600 whitespace-nowrap">
                        {dataEntrada}
                      </td>

                      {/* Nome do Paciente, Mãe e CPF */}
                      <td className="p-4 font-bold text-slate-900 group-hover:text-blue-600 transition">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{p.nome}</span>
                          {p.totalServicos > 1 && (
                            <span 
                              className="text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full"
                              title={`${p.totalServicos} serviços/solicitações registradas para este paciente`}
                            >
                              {p.totalServicos} serviços
                            </span>
                          )}
                        </div>
                        {(p.nome_mae || p.nomeMae) && (
                          <div className="text-[11px] text-slate-500 font-medium truncate max-w-[220px]">
                            Mãe: {p.nome_mae || p.nomeMae}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 font-normal flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {p.cpf && <span className="font-mono bg-slate-100 px-1 py-0.2 rounded text-slate-600">CPF: {p.cpf}</span>}
                          {p.telefone && <span className="text-slate-500">{p.telefone}</span>}
                        </div>
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
                      <td className="p-4 text-slate-700 font-medium max-w-[240px]">
                        {(() => {
                          if (cids.length === 0) return <span className="text-slate-400">-</span>;
                          return (
                            <div className="space-y-1">
                              {cids.map((c, i) => (
                                <div key={i} className="text-xs truncate font-semibold text-slate-800" title={c}>
                                  {c}
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Serviço Especializado (Unificado) */}
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {servicos.map((s, sIdx) => (
                            <span 
                              key={sIdx} 
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${getBadgeColorServico(s)}`}
                            >
                              {s}
                            </span>
                          ))}
                        </div>
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
                                {o.tipo}: {o.solicitada}{o.data ? ` (${o.data})` : ''}
                              </span>
                            ))}
                          </div>
                        ) : (temOpmSolicitada(p) && p.tipoOpm) ? (
                          <span className="inline-block bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-semibold border border-blue-100">
                            {p.tipoOpm}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}

                        {/* Indicação de Compatibilidade para Cadeira Motorizada */}
                        {hasMotorizada && (
                          <div className="mt-1">
                            {statusMotorizada?.isCompativel ? (
                              <span 
                                className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[9px] font-bold border border-emerald-300"
                                title={`Compatível com Motorizada pelo CID: ${statusMotorizada.compativeis.join('; ')}`}
                              >
                                ✓ Motorizada Compatível
                              </span>
                            ) : (
                              <span 
                                className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[9px] font-bold border border-amber-300"
                                title="CID não compatível com o protocolo de Cadeira Motorizada"
                              >
                                ⚠ Motorizada Não Compatível
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Ações */}
                      <td 
                        className="p-4 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Ver Prontuário Completo (sempre unificado) */}
                          <button
                            onClick={() => onSelectPatient(getProntuarioUnificado(p))}
                            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition flex items-center justify-center"
                            title="Ver Prontuário & Histórico Unificado"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Adicionar Prontuário Médico */}
                          <button
                            onClick={() => onOpenEvolutionModal(getProntuarioUnificado(p))}
                            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-600 transition flex items-center justify-center"
                            title="Registrar Prontuário Médico"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>

                          {/* Imprimir */}
                          <button
                            onClick={() => onPrintPatient(getProntuarioUnificado(p))}
                            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition flex items-center justify-center"
                            title="Imprimir Prontuário Completo"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Editar */}
                          <button
                            onClick={() => onEditPatient(p)}
                            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition flex items-center justify-center"
                            title="Editar Cadastro do Paciente"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Mover para Arquivo Morto (sempre preserva histórico unificado) */}
                          {onArchivePatient && (
                            <button
                              onClick={() => onArchivePatient(getProntuarioUnificado(p))}
                              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700 transition flex items-center justify-center"
                              title="Mover para Arquivo Morto"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )}

                          {/* Excluir */}
                          <button
                            onClick={() => {
                              const qtd = p.ids?.length || 1;
                              const msg = qtd > 1
                                ? `Tem certeza que deseja excluir o cadastro completo de ${p.nome}? (${qtd} registros de serviços associados serão excluídos)`
                                : `Tem certeza que deseja excluir o registro de ${p.nome}?`;
                              if (confirm(msg)) {
                                onDeletePatient(p.ids || p.id);
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

        {/* Rodapé da tabela com contagem separada de pacientes e serviços */}
        <div className="p-4 bg-slate-50/70 border-t border-slate-100 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Mostrando <strong>{filteredPacientes.length}</strong> {filteredPacientes.length === 1 ? 'paciente' : 'pacientes'} ({totalServicosExibidos} {totalServicosExibidos === 1 ? 'serviço' : 'serviços'}) de <strong>{totalPacientesGeral}</strong> pacientes cadastrados ({totalServicosGeral} serviços no total)
          </span>
          <span className="text-[11px] text-slate-400">
            Clique em qualquer paciente para abrir o prontuário unificado e histórico de evolução clínica.
          </span>
        </div>
      </div>

    </div>
  );
}
