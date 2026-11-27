import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  Archive,
  Search,
  Plus,
  Eye,
  Edit3,
  RotateCcw,
  Calendar,
  FileText,
  User,
  History,
  CheckCircle2,
  Download,
  Upload,
  AlertCircle,
  FolderOpen,
  ArrowUpDown,
  RotateCw
} from 'lucide-react';
import {
  formatarMascaraData,
  formatarDataHoraBR,
  formatarDataBR,
  getHojeBR,
  normalizarTexto,
  SERVICOS_ESPECIALIZADOS,
  getBadgeColorServico
} from '../types';

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

function parseCsvLine(line, delimiter) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function normalizarDataCsv(valor) {
  const v = (valor || '').trim();
  if (!v) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return formatarDataBR(v);
  }
  return v;
}

function parseArquivoMortoCsv(text) {
  const cleanText = text.replace(/^\uFEFF/, '');
  const lines = cleanText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error('O arquivo CSV precisa ter a linha de cabeçalho e pelo menos uma linha de dados.');
  }

  const headerLine = lines[0];
  const semicolonCount = (headerLine.match(/;/g) || []).length;
  const commaCount = (headerLine.match(/,/g) || []).length;
  const delimiter = semicolonCount >= commaCount ? ';' : ',';

  const headers = parseCsvLine(headerLine, delimiter).map((h) =>
    normalizarTexto(h).replace(/[^A-Z0-9]/g, '_')
  );

  const findColIndex = (candidates) =>
    headers.findIndex((h) => candidates.some((c) => h === c || h.includes(c)));

  const idxNome = findColIndex(['NOME_PACIENTE', 'NOME', 'PACIENTE']);
  const idxDn = findColIndex(['DATA_NASCIMENTO', 'NASCIMENTO', 'DN', 'DT_NASC']);
  const idxSaida = findColIndex(['DATA_SAIDA', 'SAIDA', 'DT_SAIDA']);
  const idxPasta = findColIndex(['PASTA', 'ARQUIVO_FISICO', 'LOCALIZACAO', 'CAIXA']);
  const idxServ = findColIndex(['TIPO_SOLICITACAO', 'SOLICITACAO', 'SERVICO', 'SERVICOS']);
  const idxObs = findColIndex(['OBSERVACOES', 'OBSERVACAO', 'MOTIVO', 'OBS', 'DETALHES']);

  if (idxNome === -1) {
    throw new Error(
      'Coluna de nome do paciente não encontrada. Use o modelo CSV com a coluna "nome_paciente".'
    );
  }

  const mapearServico = (raw) => {
    const norm = normalizarTexto(raw);
    if (!norm) return null;
    const match = SERVICOS_ESPECIALIZADOS.find((s) => normalizarTexto(s) === norm);
    return match || raw.trim();
  };

  const validos = [];
  const avisos = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i], delimiter);
    const nome = (cols[idxNome] || '').trim().toUpperCase();
    const dn = idxDn >= 0 ? normalizarDataCsv(cols[idxDn]) : '';
    const dataSaidaRaw = idxSaida >= 0 ? normalizarDataCsv(cols[idxSaida]) : '';
    const dataSaida = dataSaidaRaw || getHojeBR();
    const pasta = idxPasta >= 0 ? (cols[idxPasta] || '').trim().toUpperCase() : '';
    const servRaw = idxServ >= 0 ? (cols[idxServ] || '').trim() : '';
    const servicos = servRaw
      ? Array.from(new Set(servRaw.split(/[,|/]/).map(mapearServico).filter(Boolean)))
      : [];
    const observacoes = idxObs >= 0 ? (cols[idxObs] || '').trim() : '';

    if (!nome) {
      avisos.push(`Linha ${i + 1}: ignorada porque o nome do paciente está vazio.`);
      continue;
    }

    validos.push({
      nome,
      dn,
      dataSaida,
      pasta,
      servicos,
      observacoes
    });
  }

  return { validos, avisos };
}

export default function ArquivoMortoModal({
  isOpen,
  onClose,
  arquivoMorto,
  onSaveManual,
  onRestore,
  onImportCsv,
  onViewHistory
}) {
  const csvInputRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroPasta, setFiltroPasta] = useState('todas');
  const [filtroServico, setFiltroServico] = useState('todos');
  const [filtroOrigem, setFiltroOrigem] = useState('todos');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [ordenacao, setOrdenacao] = useState('alfabetica_az');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [csvPreview, setCsvPreview] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  // Campos do formulário (manual ou edição)
  const [nome, setNome] = useState('');
  const [dn, setDn] = useState('');
  const [dataSaida, setDataSaida] = useState('');
  const [pasta, setPasta] = useState('');
  const [servicosSelecionados, setServicosSelecionados] = useState([]);
  const [observacoes, setObservacoes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const pastasDisponiveis = useMemo(() => {
    const set = new Set();
    arquivoMorto.forEach((item) => {
      const p = (item.pasta || '').trim().toUpperCase();
      if (p) set.add(p);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true, sensitivity: 'base' }));
  }, [arquivoMorto]);

  const temHistoricoCompleto = (item) => {
    return (
      item?.origem === 'paciente_ativo' ||
      (Array.isArray(item?.historico?.registrosOriginais) && item.historico.registrosOriginais.length > 0) ||
      (Array.isArray(item?.evolucoes) && item.evolucoes.length > 0)
    );
  };

  const listaFiltrada = useMemo(() => {
    const term = searchTerm.toUpperCase().trim();

    const filtrados = arquivoMorto.filter((item) => {
      const matchSearch =
        !term ||
        (item.nome && item.nome.toUpperCase().includes(term)) ||
        (item.dn && item.dn.includes(term)) ||
        (item.dataSaida && item.dataSaida.includes(term)) ||
        (item.pasta && item.pasta.toUpperCase().includes(term)) ||
        (item.observacoes && item.observacoes.toUpperCase().includes(term)) ||
        (item.cpf && item.cpf.includes(term)) ||
        (item.municipio && item.municipio.toUpperCase().includes(term));

      const pastaItem = (item.pasta || '').trim().toUpperCase();
      const matchPasta =
        filtroPasta === 'todas' ||
        (filtroPasta === 'sem_pasta' ? !pastaItem : pastaItem === filtroPasta);

      const itemServicos = Array.isArray(item.servicos) && item.servicos.length > 0
        ? item.servicos
        : item.servico_especializado
          ? [item.servico_especializado]
          : [];
      const matchServico =
        filtroServico === 'todos' ||
        (filtroServico === 'sem_servico' ? itemServicos.length === 0 : itemServicos.includes(filtroServico));

      const possuiHist = temHistoricoCompleto(item);
      const matchOrigem =
        filtroOrigem === 'todos' ||
        (filtroOrigem === 'com_historico' ? possuiHist : !possuiHist);

      let matchPeriodo = true;
      if (filtroDataInicio || filtroDataFim) {
        const tsSaida = parseDataTimestamp(item.dataSaida);
        if (!tsSaida) {
          matchPeriodo = false;
        } else {
          if (filtroDataInicio) {
            const [y, m, d] = filtroDataInicio.split('-').map(Number);
            const tsIni = new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
            if (tsSaida < tsIni) matchPeriodo = false;
          }
          if (filtroDataFim && matchPeriodo) {
            const [y, m, d] = filtroDataFim.split('-').map(Number);
            const tsFim = new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
            if (tsSaida > tsFim) matchPeriodo = false;
          }
        }
      }

      return matchSearch && matchPasta && matchServico && matchOrigem && matchPeriodo;
    });

    return [...filtrados].sort((a, b) => {
      switch (ordenacao) {
        case 'alfabetica_za':
          return (b.nome || '').localeCompare(a.nome || '', 'pt-BR', { sensitivity: 'base' });
        case 'saida_recente':
          return parseDataTimestamp(b.dataSaida) - parseDataTimestamp(a.dataSaida);
        case 'saida_antiga':
          return parseDataTimestamp(a.dataSaida) - parseDataTimestamp(b.dataSaida);
        case 'arquivamento_recente':
          return (
            new Date(b.arquivadoEm || b.createdAt || 0).getTime() -
            new Date(a.arquivadoEm || a.createdAt || 0).getTime()
          );
        case 'pasta_az': {
          const pa = (a.pasta || '').trim();
          const pb = (b.pasta || '').trim();
          if (!pa && !pb) return (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' });
          if (!pa) return 1;
          if (!pb) return -1;
          const cmp = pa.localeCompare(pb, 'pt-BR', { numeric: true, sensitivity: 'base' });
          return cmp !== 0 ? cmp : (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' });
        }
        case 'alfabetica_az':
        default:
          return (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' });
      }
    });
  }, [arquivoMorto, searchTerm, filtroPasta, filtroServico, filtroOrigem, filtroDataInicio, filtroDataFim, ordenacao]);

  if (!isOpen) return null;

  const abrirNovoCadastro = () => {
    setEditingItem(null);
    setNome('');
    setDn('');
    setDataSaida(getHojeBR());
    setPasta('');
    setServicosSelecionados([]);
    setObservacoes('');
    setShowForm(true);
  };

  const abrirEdicao = (item) => {
    setEditingItem(item);
    setNome(item.nome || '');
    setDn(item.dn || item.dataNascimento || '');
    setDataSaida(item.dataSaida || '');
    setPasta(item.pasta || '');
    const servs = Array.isArray(item.servicos) && item.servicos.length > 0
      ? item.servicos
      : item.servico_especializado
        ? [item.servico_especializado]
        : [];
    setServicosSelecionados(servs);
    setObservacoes(item.observacoes || '');
    setShowForm(true);
  };

  const toggleServicoSelecionado = (servico) => {
    setServicosSelecionados((prev) =>
      prev.includes(servico) ? prev.filter((s) => s !== servico) : [...prev, servico]
    );
  };

  const fecharFormulario = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!nome.trim()) {
      alert('Informe o nome do paciente.');
      return;
    }
    if (!dataSaida.trim() || dataSaida.trim().length < 10) {
      alert('Informe uma data de saída válida (DD/MM/AAAA).');
      return;
    }

    try {
      setIsSaving(true);
      await onSaveManual({
        ...(editingItem || {}),
        nome: nome.trim(),
        dn: dn.trim(),
        dataSaida: dataSaida.trim(),
        pasta: pasta.trim(),
        servicos: servicosSelecionados,
        observacoes: observacoes.trim()
      });
      fecharFormulario();
    } catch (err) {
      console.error('Erro ao salvar no arquivo morto:', err);
      alert('Erro ao salvar registro no Arquivo Morto: ' + (err.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLimparFiltros = () => {
    setSearchTerm('');
    setFiltroPasta('todas');
    setFiltroServico('todos');
    setFiltroOrigem('todos');
    setFiltroDataInicio('');
    setFiltroDataFim('');
    setOrdenacao('alfabetica_az');
  };

  const temFiltroAtivo =
    searchTerm.trim() !== '' ||
    filtroPasta !== 'todas' ||
    filtroServico !== 'todos' ||
    filtroOrigem !== 'todos' ||
    filtroDataInicio !== '' ||
    filtroDataFim !== '' ||
    ordenacao !== 'alfabetica_az';

  const handleDownloadModeloCsv = () => {
    const linhas = [
      'nome_paciente;data_nascimento;data_saida;pasta;tipo_solicitacao;observacoes',
      `MARIA DA SILVA SANTOS;15/03/1980;${getHojeBR()};PASTA 01;Reab. Fisica;Alta clínica concluída (linha de exemplo - substitua pelos seus dados)`
    ];
    const csvContent = '\uFEFF' + linhas.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modelo_arquivo_morto_jrrpcd.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleCsvFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = String(event.target?.result || '');
        const parsed = parseArquivoMortoCsv(text);
        if (parsed.validos.length === 0) {
          alert('Nenhum registro válido encontrado na planilha CSV.');
          return;
        }
        setShowForm(false);
        setCsvPreview({
          fileName: file.name,
          ...parsed
        });
      } catch (err) {
        alert('Erro ao ler arquivo CSV: ' + (err.message || err));
      }
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  const handleConfirmCsvImport = async () => {
    if (!csvPreview || csvPreview.validos.length === 0 || !onImportCsv) return;
    try {
      setIsImporting(true);
      await onImportCsv(csvPreview.validos);
      const total = csvPreview.validos.length;
      setCsvPreview(null);
      alert(`${total} ${total === 1 ? 'registro importado' : 'registros importados'} com sucesso para o Arquivo Morto!`);
    } catch (err) {
      console.error('Erro ao importar CSV para arquivo morto:', err);
      alert('Erro ao importar registros: ' + (err.message || err));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 lg:p-6 no-print">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">

        {/* Cabeçalho */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center">
              <Archive className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>Gestão de Arquivo Morto</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-200 border border-amber-400/30">
                  {arquivoMorto.length} {arquivoMorto.length === 1 ? 'registro' : 'registros'}
                </span>
              </h2>
              <p className="text-[11px] text-slate-300">
                Controle de pacientes direcionados ao arquivo morto com preservação de histórico clínico
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Busca, Filtros, Ordenação e Ações */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome do paciente, DN, data de saída, pasta ou observações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={handleDownloadModeloCsv}
                title="Baixar planilha modelo em CSV para preenchimento"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl transition"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Baixar Modelo CSV</span>
              </button>

              <button
                type="button"
                onClick={() => csvInputRef.current?.click()}
                title="Importar planilha CSV preenchida"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span>Importar CSV</span>
              </button>
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={handleCsvFileChange}
              />

              <button
                type="button"
                onClick={abrirNovoCadastro}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Registro</span>
              </button>
            </div>
          </div>

          {/* Linha de Filtros e Ordenação (Padrão: Alfabética A-Z) */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/80 text-xs">
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <select
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value)}
                title="Ordenar registros do arquivo morto"
                className="text-xs bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="alfabetica_az">Ordem Alfabética (A → Z)</option>
                <option value="alfabetica_za">Ordem Alfabética (Z → A)</option>
                <option value="pasta_az">Pasta Física (A → Z)</option>
                <option value="saida_recente">Data de Saída (Mais recente)</option>
                <option value="saida_antiga">Data de Saída (Mais antiga)</option>
                <option value="arquivamento_recente">Arquivamento (Mais recente)</option>
              </select>
            </div>

            <select
              value={filtroPasta}
              onChange={(e) => setFiltroPasta(e.target.value)}
              title="Filtrar por pasta física"
              className="text-xs bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="todas">Todas as Pastas</option>
              <option value="sem_pasta">Sem pasta informada</option>
              {pastasDisponiveis.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <select
              value={filtroServico}
              onChange={(e) => setFiltroServico(e.target.value)}
              title="Filtrar por tipo de solicitação"
              className="text-xs bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="todos">Todas as Solicitações</option>
              <option value="sem_servico">Sem solicitação informada</option>
              {SERVICOS_ESPECIALIZADOS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={filtroOrigem}
              onChange={(e) => setFiltroOrigem(e.target.value)}
              title="Filtrar por tipo de registro"
              className="text-xs bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="todos">Todos os Tipos</option>
              <option value="com_historico">Com histórico clínico salvo</option>
              <option value="sem_historico">Registro manual / Planilha CSV</option>
            </select>

            {/* Filtro por Período (Data de Saída) */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Saída:</span>
              <input
                type="date"
                value={filtroDataInicio}
                onChange={(e) => setFiltroDataInicio(e.target.value)}
                title="Data de saída inicial"
                className="text-xs font-semibold text-slate-700 bg-transparent outline-none"
              />
              <span className="text-[10px] text-slate-400">até</span>
              <input
                type="date"
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
                title="Data de saída final"
                className="text-xs font-semibold text-slate-700 bg-transparent outline-none"
              />
            </div>

            {temFiltroAtivo && (
              <button
                type="button"
                onClick={handleLimparFiltros}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition"
              >
                <RotateCw className="w-3 h-3" />
                <span>Restaurar padrão</span>
              </button>
            )}
          </div>
        </div>

        {/* Pré-visualização de Importação CSV */}
        {csvPreview && (
          <div className="p-5 bg-emerald-50/70 border-b border-emerald-200 space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-emerald-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-emerald-700" />
                  <span>Prévia da Importação CSV: {csvPreview.fileName}</span>
                </h3>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  <strong>{csvPreview.validos.length}</strong> {csvPreview.validos.length === 1 ? 'registro válido encontrado' : 'registros válidos encontrados'} para importação no Arquivo Morto.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCsvPreview(null)}
                  disabled={isImporting}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-white rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCsvImport}
                  disabled={isImporting}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isImporting ? 'Importando...' : `Confirmar Importação (${csvPreview.validos.length})`}</span>
                </button>
              </div>
            </div>

            {csvPreview.avisos.length > 0 && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>{csvPreview.avisos.length} aviso(s):</strong> {csvPreview.avisos.slice(0, 3).join(' ')}
                  {csvPreview.avisos.length > 3 && ` (+${csvPreview.avisos.length - 3} linhas ignoradas)`}
                </div>
              </div>
            )}

            <div className="bg-white border border-emerald-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                  <tr>
                    <th className="px-3 py-2">Nome do Paciente</th>
                    <th className="px-3 py-2">Data Nasc.</th>
                    <th className="px-3 py-2">Data Saída</th>
                    <th className="px-3 py-2">Pasta</th>
                    <th className="px-3 py-2">Solicitação</th>
                    <th className="px-3 py-2">Observações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {csvPreview.validos.slice(0, 5).map((row, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 font-bold text-slate-800">{row.nome}</td>
                      <td className="px-3 py-2 text-slate-600">{row.dn || '-'}</td>
                      <td className="px-3 py-2 text-amber-800 font-semibold">{row.dataSaida || '-'}</td>
                      <td className="px-3 py-2 text-slate-700 font-semibold">{row.pasta || '-'}</td>
                      <td className="px-3 py-2 text-slate-700">{row.servicos?.join(', ') || '-'}</td>
                      <td className="px-3 py-2 text-slate-600 truncate max-w-[180px]">{row.observacoes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {csvPreview.validos.length > 5 && (
                <div className="px-3 py-1.5 bg-slate-50 text-[10px] text-slate-500 border-t border-slate-100">
                  ... e mais {csvPreview.validos.length - 5} registro(s) que serão importados.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Formulário Inline para Cadastro Manual / Edição */}
        {showForm && (
          <form onSubmit={handleSubmitForm} className="p-5 bg-amber-50/70 border-b border-amber-200 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-amber-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Archive className="w-4 h-4 text-amber-700" />
                <span>{editingItem ? 'Editar Registro do Arquivo Morto' : 'Cadastrar Paciente no Arquivo Morto'}</span>
              </h3>
              <button
                type="button"
                onClick={fecharFormulario}
                className="text-slate-500 hover:text-slate-800 text-xs font-semibold"
              >
                Cancelar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Nome do Paciente *
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value.toUpperCase())}
                  placeholder="NOME COMPLETO DO PACIENTE"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Data de Nascimento
                </label>
                <input
                  type="text"
                  value={dn}
                  onChange={(e) => setDn(formatarMascaraData(e.target.value))}
                  placeholder="DD/MM/AAAA"
                  maxLength={10}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Data de Saída *
                </label>
                <input
                  type="text"
                  required
                  value={dataSaida}
                  onChange={(e) => setDataSaida(formatarMascaraData(e.target.value))}
                  placeholder="DD/MM/AAAA"
                  maxLength={10}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Pasta / Arquivo Físico
                </label>
                <input
                  type="text"
                  value={pasta}
                  onChange={(e) => setPasta(e.target.value.toUpperCase())}
                  placeholder="EX: PASTA 12"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Tipo de Solicitação / Serviço */}
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                Tipo de Solicitação / Serviço
              </label>
              <div className="flex flex-wrap gap-2">
                {SERVICOS_ESPECIALIZADOS.map((servico) => {
                  const ativo = servicosSelecionados.includes(servico);
                  return (
                    <button
                      key={servico}
                      type="button"
                      onClick={() => toggleServicoSelecionado(servico)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition ${
                        ativo
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {ativo ? `✓ ${servico}` : servico}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Observações / Motivo (Opcional)
              </label>
              <textarea
                rows={2}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Detalhes sobre o porquê o paciente foi direcionado ao arquivo morto..."
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={fecharFormulario}
                className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-white rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-sm transition"
              >
                {isSaving ? 'Salvando...' : editingItem ? 'Salvar Alterações' : 'Salvar no Arquivo Morto'}
              </button>
            </div>
          </form>
        )}

        {/* Lista de Registros */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3 text-xs">
          {listaFiltrada.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Archive className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-semibold text-slate-500">
                {arquivoMorto.length === 0
                  ? 'Nenhum paciente no Arquivo Morto até o momento.'
                  : 'Nenhum registro encontrado para a busca aplicada.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {listaFiltrada.map((item) => {
                const possuiHistorico = temHistoricoCompleto(item);
                const totalServ = item.historico?.totalServicos || item.historico?.registrosOriginais?.length || (item.servicos?.length || 0);
                const totalEvo = Array.isArray(item.evolucoes) ? item.evolucoes.length : 0;

                return (
                  <div
                    key={item.id}
                    className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-amber-300 transition shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                          <User className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>{item.nome}</span>
                        </span>

                        {possuiHistorico ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Histórico salvo ({totalServ} serv. / {totalEvo} evol.)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Registro Manual
                          </span>
                        )}

                        {(() => {
                          const servs = Array.isArray(item.servicos) && item.servicos.length > 0
                            ? item.servicos
                            : item.servico_especializado
                              ? [item.servico_especializado]
                              : [];
                          return servs.map((s, sIdx) => (
                            <span
                              key={sIdx}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getBadgeColorServico(s)}`}
                            >
                              {s}
                            </span>
                          ));
                        })()}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <strong>DN:</strong> {item.dn || item.dataNascimento || 'Não informada'}
                        </span>
                        <span className="flex items-center gap-1 text-amber-800 font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-amber-600" />
                          <strong>Data de Saída:</strong> {item.dataSaida || '-'}
                        </span>
                        {item.pasta && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 font-bold">
                            <FolderOpen className="w-3.5 h-3.5 text-amber-600" />
                            <span>Pasta: {item.pasta}</span>
                          </span>
                        )}
                        {item.cpf && (
                          <span className="font-mono text-slate-500">CPF: {item.cpf}</span>
                        )}
                      </div>

                      {item.observacoes && (
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex items-start gap-2 mt-1">
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <p className="text-xs whitespace-pre-wrap leading-relaxed">
                            <strong className="text-slate-800">Observações: </strong>
                            {item.observacoes}
                          </p>
                        </div>
                      )}

                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 pt-0.5">
                        <History className="w-3 h-3" />
                        <span>
                          Arquivado por <strong>{item.arquivadoPorNome || item.arquivadoPor || 'Sistema'}</strong> em {formatarDataHoraBR(item.arquivadoEm || item.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end lg:self-center">
                      {possuiHistorico && (
                        <button
                          type="button"
                          onClick={() => onViewHistory(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] border border-blue-200 transition"
                          title="Visualizar prontuário e histórico completo salvo"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Histórico</span>
                        </button>
                      )}

                      {Array.isArray(item?.historico?.registrosOriginais) && item.historico.registrosOriginais.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Deseja restaurar "${item.nome}" do Arquivo Morto para a lista de pacientes ativos?`)) {
                              onRestore(item);
                            }
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] border border-emerald-200 transition"
                          title="Restaurar paciente para a lista ativa"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restaurar</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => abrirEdicao(item)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
                        title="Editar dados do Arquivo Morto"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Mostrando <strong>{listaFiltrada.length}</strong> de <strong>{arquivoMorto.length}</strong> {arquivoMorto.length === 1 ? 'registro' : 'registros'} no Arquivo Morto
          </span>
          <button
            type="button"
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
