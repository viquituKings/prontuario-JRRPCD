import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Calendar, 
  User, 
  Phone, 
  MapPin, 
  Building2, 
  Stethoscope, 
  PlusCircle, 
  Trash2, 
  Save, 
  Sparkles,
  FileText,
  Hospital,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { 
  SERVICOS_ESPECIALIZADOS, 
  TIPOS_OPM, 
  OPMS_SUGERIDAS, 
  CIDS_DATABASE, 
  STATUS_SUGESTOES, 
  PRESENCA_SUGESTOES, 
  REMETENTE_SUGESTOES, 
  AVALIACAO_JUNTA_SUGESTOES, 
  getHojeBR, 
  calcularIdade, 
  formatarTelefone, 
  formatarMascaraData 
} from '../types';

export default function PatientFormModal({ isOpen, onClose, onSave, patientToEdit }) {
  const [formData, setFormData] = useState({
    data_entrada: getHojeBR(),
    nome: '',
    dn: '',
    idade: '',
    telefone: '',
    municipio: '',
    esf: '',
    cid: '',
    servico_especializado: 'OPM',
    opm_list: [{ tipo: 'CADEIRA DE RODAS', solicitada: '' }],
    remetente: '',
    avaliacao_junta: '',
    data_avaliacao: '',
    presenca: 'COMPARECEU',
    status: 'INSERIDO',
    data_alta: '',
    observacoes: ''
  });

  const [cidQuery, setCidQuery] = useState('');
  const [showCidSuggestions, setShowCidSuggestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const cidInputRef = useRef(null);

  useEffect(() => {
    if (patientToEdit) {
      setFormData({
        data_entrada: patientToEdit.data_entrada || patientToEdit.dataEntrada || getHojeBR(),
        nome: patientToEdit.nome || '',
        dn: patientToEdit.dn || patientToEdit.dataNascimento || '',
        idade: patientToEdit.idade || '',
        telefone: patientToEdit.telefone || '',
        municipio: patientToEdit.municipio || '',
        esf: patientToEdit.esf || patientToEdit.esfReferencia || '',
        cid: patientToEdit.cid || '',
        servico_especializado: patientToEdit.servico_especializado || 'OPM',
        opm_list: patientToEdit.opm_list && patientToEdit.opm_list.length > 0
          ? patientToEdit.opm_list 
          : patientToEdit.tipoOpm 
          ? [{ tipo: 'ÓRTESE', solicitada: patientToEdit.tipoOpm }]
          : [{ tipo: 'CADEIRA DE RODAS', solicitada: '' }],
        remetente: patientToEdit.remetente || '',
        avaliacao_junta: patientToEdit.avaliacao_junta || '',
        data_avaliacao: patientToEdit.data_avaliacao || '',
        presenca: patientToEdit.presenca || 'COMPARECEU',
        status: patientToEdit.status || 'INSERIDO',
        data_alta: patientToEdit.data_alta || '',
        observacoes: patientToEdit.observacoes || patientToEdit.prontuarioObservacoes || ''
      });
      setCidQuery(patientToEdit.cid || '');
    } else {
      setFormData({
        data_entrada: getHojeBR(),
        nome: '',
        dn: '',
        idade: '',
        telefone: '',
        municipio: '',
        esf: '',
        cid: '',
        servico_especializado: 'OPM',
        opm_list: [{ tipo: 'CADEIRA DE RODAS', solicitada: '' }],
        remetente: '',
        avaliacao_junta: '',
        data_avaliacao: '',
        presenca: 'COMPARECEU',
        status: 'INSERIDO',
        data_alta: '',
        observacoes: ''
      });
      setCidQuery('');
    }
    setShowCidSuggestions(false);
    setErrorMsg('');
  }, [patientToEdit, isOpen]);

  if (!isOpen) return null;

  // Atualiza nascimento e recalcula idade automaticamente
  const handleDnChange = (e) => {
    const masked = formatarMascaraData(e.target.value);
    const calculated = calcularIdade(masked);
    setFormData((prev) => ({
      ...prev,
      dn: masked,
      idade: calculated !== '' ? calculated : prev.idade
    }));
  };

  // Autocomplete de CID
  const handleCidChange = (e) => {
    const val = e.target.value.toUpperCase();
    setCidQuery(val);
    setFormData((prev) => ({ ...prev, cid: val }));
    setShowCidSuggestions(val.trim().length > 0);
  };

  const handleSelectCid = (cidValue) => {
    setCidQuery(cidValue);
    setFormData((prev) => ({ ...prev, cid: cidValue }));
    setShowCidSuggestions(false);
  };

  // Manipulação de lista dinâmica de OPMs
  const handleAddOpmField = () => {
    setFormData((prev) => ({
      ...prev,
      opm_list: [...prev.opm_list, { tipo: 'MEIO AUXILIAR DE LOCOMOÇÃO', solicitada: '' }]
    }));
  };

  const handleUpdateOpmField = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.opm_list];
      updated[index] = { ...updated[index], [field]: value.toUpperCase() };
      return { ...prev, opm_list: updated };
    });
  };

  const handleRemoveOpmField = (index) => {
    setFormData((prev) => {
      const updated = prev.opm_list.filter((_, i) => i !== index);
      return { ...prev, opm_list: updated.length > 0 ? updated : [{ tipo: 'MEIO AUXILIAR DE LOCOMOÇÃO', solicitada: '' }] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      setErrorMsg('Por favor, informe o Nome do paciente.');
      return;
    }
    if (!formData.data_entrada.trim()) {
      setErrorMsg('Por favor, informe a Data de Entrada.');
      return;
    }
    if (!formData.cid.trim()) {
      setErrorMsg('Por favor, informe o CID / Diagnóstico.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      // Formata OPMs filtrando entradas vazias
      const cleanOpmList = formData.servico_especializado === 'OPM'
        ? formData.opm_list.filter((o) => o.tipo && o.solicitada.trim())
        : [];

      // Monta objeto com compatibilidade para todos os campos do prontuario.example
      const payload = {
        ...formData,
        id: patientToEdit?.id,
        nome: formData.nome.toUpperCase(),
        municipio: formData.municipio.toUpperCase(),
        esf: formData.esf.toUpperCase(),
        remetente: formData.remetente.toUpperCase(),
        avaliacao_junta: formData.avaliacao_junta.toUpperCase(),
        presenca: formData.presenca.toUpperCase(),
        status: formData.status.toUpperCase(),
        observacoes: formData.observacoes.toUpperCase(),
        opm_list: cleanOpmList,
        // Campos de compatibilidade legada
        dataEntrada: formData.data_entrada,
        dataNascimento: formData.dn,
        esfReferencia: formData.esf,
        tipoOpm: cleanOpmList.map((o) => `${o.tipo}: ${o.solicitada}`).join('; ') || formData.servico_especializado,
        prontuarioObservacoes: formData.observacoes,
        evolucoes: patientToEdit?.evolucoes || []
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      setErrorMsg('Erro ao salvar paciente: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCids = CIDS_DATABASE.filter((c) =>
    c.toUpperCase().includes(cidQuery.toUpperCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 no-print">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-100 flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabeçalho */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Hospital className="w-5 h-5 text-blue-100" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                {patientToEdit ? 'Editar Paciente / Pedido' : 'Novo Paciente / Pedido'}
              </h2>
              <p className="text-[11px] text-blue-100 font-medium">
                Gestão Junta • Protocolo de OPM e Reabilitação
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

        {/* Formulário com Scroll */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
              <span>⚠️</span>
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {/* Bloco 1: Data de Entrada e Nome */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Data de Entrada <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="DD/MM/AAAA"
                value={formData.data_entrada}
                onChange={(e) => setFormData({ ...formData, data_entrada: formatarMascaraData(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold uppercase focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Nome do Paciente <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="NOME COMPLETO DO PACIENTE"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value.toUpperCase() })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold uppercase focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Bloco 2: DN, Idade e Telefone */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Data de Nascimento (DN) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="DD/MM/AAAA"
                value={formData.dn}
                onChange={handleDnChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs uppercase focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Idade</span>
                <span className="text-[9px] text-blue-600 font-normal">Cálculo Auto</span>
              </label>
              <input
                type="number"
                placeholder="EX: 45"
                value={formData.idade}
                onChange={(e) => setFormData({ ...formData, idade: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs uppercase focus:ring-2 focus:ring-blue-500 outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Telefone / Contato
              </label>
              <input
                type="text"
                placeholder="(00) 00000-0000"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: formatarTelefone(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs uppercase focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Bloco 3: Município e ESF */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Município <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="EX: SETE LAGOAS, FUNILANDIA, ETC."
                value={formData.municipio}
                onChange={(e) => setFormData({ ...formData, municipio: e.target.value.toUpperCase() })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs uppercase font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                ESF de Referência
              </label>
              <input
                type="text"
                placeholder="EX: ESF BELO VALE II, ESF MORRO DO CLARO"
                value={formData.esf}
                onChange={(e) => setFormData({ ...formData, esf: e.target.value.toUpperCase() })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs uppercase focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Bloco 4: CID e Serviço Especializado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CID com Autocomplete */}
            <div className="relative">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                CID / Diagnóstico <span className="text-red-500">*</span>
              </label>
              <input
                ref={cidInputRef}
                type="text"
                required
                placeholder="EX: F84 - TEA, G12.2 - ELA, I69 - AVC"
                value={formData.cid}
                onChange={handleCidChange}
                onFocus={() => setShowCidSuggestions(cidQuery.trim().length > 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs uppercase font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                autoComplete="off"
              />

              {/* Lista suspensa de sugestões */}
              {showCidSuggestions && filteredCids.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {filteredCids.map((c) => (
                    <div
                      key={c}
                      onMouseDown={() => handleSelectCid(c)}
                      className="px-3.5 py-2 hover:bg-blue-50 hover:text-blue-700 cursor-pointer font-medium uppercase text-[11px] transition"
                    >
                      {c}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Serviço Especializado */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Serviço Especializado <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.servico_especializado}
                onChange={(e) => setFormData({ ...formData, servico_especializado: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                required
              >
                <option value="OPM">OPM</option>
                <option value="Reab. Intelectual">REABILITAÇÃO INTELECTUAL</option>
                <option value="Reab. Fisica">REABILITAÇÃO FÍSICA</option>
              </select>
            </div>
          </div>

          {/* Bloco 5: Seção Dinâmica de OPM (Múltiplos Itens) */}
          {formData.servico_especializado === 'OPM' && (
            <div className="space-y-3 bg-blue-50/60 p-4 rounded-2xl border border-blue-200/80">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Tipos e OPMs Solicitadas (Múltiplos) *
                </label>
                <button
                  type="button"
                  onClick={handleAddOpmField}
                  className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-sm transition hover:scale-[1.02]"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Adicionar Outro OPM</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {formData.opm_list.map((opm, idx) => (
                  <div 
                    key={idx}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center bg-white p-3 rounded-xl border border-blue-200 shadow-sm"
                  >
                    {/* Tipo de OPM */}
                    <div className="md:col-span-5">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                        Tipo de OPM
                      </label>
                      <select
                        value={opm.tipo}
                        onChange={(e) => handleUpdateOpmField(idx, 'tipo', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold uppercase focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      >
                        {TIPOS_OPM.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* OPM Solicitada */}
                    <div className="md:col-span-6">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                        OPM Solicitada
                      </label>
                      <input
                        type="text"
                        list={`opm-suggestions-${idx}`}
                        value={opm.solicitada}
                        onChange={(e) => handleUpdateOpmField(idx, 'solicitada', e.target.value)}
                        placeholder="EX: CADEIRA MOTORIZADA, MULETA CANADENSE..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs uppercase focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                      <datalist id={`opm-suggestions-${idx}`}>
                        {OPMS_SUGERIDAS.map((s) => (
                          <option key={s} value={s} />
                        ))}
                      </datalist>
                    </div>

                    {/* Botão Remover */}
                    <div className="md:col-span-1 flex justify-end pt-3 sm:pt-4">
                      <button
                        type="button"
                        onClick={() => handleRemoveOpmField(idx)}
                        disabled={formData.opm_list.length === 1}
                        className="text-slate-400 hover:text-red-600 disabled:opacity-30 p-1.5 transition"
                        title="Remover OPM"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bloco 6: Remetente, Avaliação da Junta e Data */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Remetente
              </label>
              <input
                type="text"
                list="remetente-sugestoes"
                placeholder="EX: APS / MUNICIPIO"
                value={formData.remetente}
                onChange={(e) => setFormData({ ...formData, remetente: e.target.value.toUpperCase() })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs uppercase focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <datalist id="remetente-sugestoes">
                {REMETENTE_SUGESTOES.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Avaliação da Junta
              </label>
              <input
                type="text"
                list="junta-sugestoes"
                placeholder="EX: CER II, CENTRO DE AUTISMO"
                value={formData.avaliacao_junta}
                onChange={(e) => setFormData({ ...formData, avaliacao_junta: e.target.value.toUpperCase() })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs uppercase focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <datalist id="junta-sugestoes">
                {AVALIACAO_JUNTA_SUGESTOES.map((j) => (
                  <option key={j} value={j} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Data de Avaliação / Envio
              </label>
              <input
                type="text"
                placeholder="DD/MM/AAAA"
                value={formData.data_avaliacao}
                onChange={(e) => setFormData({ ...formData, data_avaliacao: formatarMascaraData(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs uppercase focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Bloco 7: Presença, Status e Data da Alta */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Presença
              </label>
              <input
                type="text"
                list="presenca-sugestoes"
                placeholder="EX: COMPARECEU"
                value={formData.presenca}
                onChange={(e) => setFormData({ ...formData, presenca: e.target.value.toUpperCase() })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs uppercase focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-emerald-800"
              />
              <datalist id="presenca-sugestoes">
                {PRESENCA_SUGESTOES.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Status
              </label>
              <input
                type="text"
                list="status-sugestoes"
                placeholder="EX: INSERIDO / AGUARDANDO OPM"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value.toUpperCase() })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs uppercase focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-blue-800"
              />
              <datalist id="status-sugestoes">
                {STATUS_SUGESTOES.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Data da Alta
              </label>
              <input
                type="text"
                placeholder="DD/MM/AAAA"
                value={formData.data_alta}
                onChange={(e) => setFormData({ ...formData, data_alta: formatarMascaraData(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs uppercase focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Bloco 8: Prontuário / Observações */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Prontuário / Observações Adicionais
            </label>
            <textarea
              rows={3}
              placeholder="OBSERVAÇÕES ADICIONAIS, HISTÓRICO CLÍNICO, DETALHES DE RECEBIMENTO..."
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value.toUpperCase() })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs uppercase focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed resize-y"
            />
          </div>

          {/* Rodapé com botões de ação */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-lg shadow-blue-500/20 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Salvando...' : 'Salvar Paciente/Pedido'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
