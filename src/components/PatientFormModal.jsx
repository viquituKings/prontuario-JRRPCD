import React, { useState, useEffect } from 'react';
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
  Heart,
  CreditCard,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Zap,
  Info
} from 'lucide-react';
import FloatingSelectMenu from './FloatingSelectMenu';
import CidAutocompleteInput from './CidAutocompleteInput';
import { 
  SERVICOS_ESPECIALIZADOS, 
  TIPOS_OPM, 
  OPMS_SUGERIDAS, 
  MUNICIPIOS_SUGERIDOS, 
  ESFS_SUGERIDAS, 
  getHojeBR, 
  calcularIdade, 
  formatarTelefone, 
  formatarMascaraData,
  formatarCPF,
  validarCPF,
  removerAcentos,
  isMotorizadaSolicitada,
  verificarCompatibilidadeMotorizada
} from '../types';

export default function PatientFormModal({ isOpen, onClose, onSave, patientToEdit }) {
  const [formData, setFormData] = useState({
    data_entrada: getHojeBR(),
    nome: '',
    cpf: '',
    nome_mae: '',
    dn: '',
    idade: '',
    telefone: '',
    municipio: '',
    esf: '',
    cid_list: [''],
    servico_especializado: 'OPM',
    opm_list: [{ tipo: 'CADEIRA DE RODAS', solicitada: '' }],
    observacoes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [cpfValidationState, setCpfValidationState] = useState(null); // null | 'valid' | 'invalid'

  useEffect(() => {
    if (patientToEdit) {
      const initialCpf = patientToEdit.cpf || '';
      
      // Carrega CIDs múltiplos ou converte string existente
      let initialCids = [''];
      if (patientToEdit.cid_list && Array.isArray(patientToEdit.cid_list) && patientToEdit.cid_list.length > 0) {
        initialCids = patientToEdit.cid_list;
      } else if (patientToEdit.cid) {
        // Se já tiver CIDs separados por ponto-e-vírgula ou vírgula
        initialCids = patientToEdit.cid.split(/[;,]/).map((c) => c.trim()).filter(Boolean);
        if (initialCids.length === 0) initialCids = [''];
      }

      setFormData({
        data_entrada: patientToEdit.data_entrada || patientToEdit.dataEntrada || getHojeBR(),
        nome: removerAcentos(patientToEdit.nome || ''),
        cpf: initialCpf,
        nome_mae: removerAcentos(patientToEdit.nome_mae || patientToEdit.nomeMae || ''),
        dn: patientToEdit.dn || patientToEdit.dataNascimento || '',
        idade: patientToEdit.idade || '',
        telefone: patientToEdit.telefone || '',
        municipio: patientToEdit.municipio || '',
        esf: patientToEdit.esf || patientToEdit.esfReferencia || '',
        cid_list: initialCids,
        servico_especializado: patientToEdit.servico_especializado || 'OPM',
        opm_list: patientToEdit.opm_list && patientToEdit.opm_list.length > 0
          ? patientToEdit.opm_list 
          : patientToEdit.tipoOpm 
          ? [{ tipo: 'ÓRTESE', solicitada: patientToEdit.tipoOpm }]
          : [{ tipo: 'CADEIRA DE RODAS', solicitada: '' }],
        observacoes: patientToEdit.observacoes || patientToEdit.prontuarioObservacoes || ''
      });

      if (initialCpf.replace(/\D/g, '').length === 11) {
        setCpfValidationState(validarCPF(initialCpf) ? 'valid' : 'invalid');
      } else {
        setCpfValidationState(null);
      }
    } else {
      setFormData({
        data_entrada: getHojeBR(),
        nome: '',
        cpf: '',
        nome_mae: '',
        dn: '',
        idade: '',
        telefone: '',
        municipio: '',
        esf: '',
        cid_list: [''],
        servico_especializado: 'OPM',
        opm_list: [{ tipo: 'CADEIRA DE RODAS', solicitada: '' }],
        observacoes: ''
      });
      setCpfValidationState(null);
    }
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

  // Manipulação de CPF com máscara e validação
  const handleCpfChange = (e) => {
    const raw = e.target.value;
    const formatted = formatarCPF(raw);
    const digits = formatted.replace(/\D/g, '');

    setFormData((prev) => ({ ...prev, cpf: formatted }));

    if (digits.length === 0) {
      setCpfValidationState(null);
    } else if (digits.length === 11) {
      const isValid = validarCPF(formatted);
      setCpfValidationState(isValid ? 'valid' : 'invalid');
    } else {
      setCpfValidationState('incomplete');
    }
  };

  // Funções para múltiplos CIDs
  const handleAddCid = () => {
    setFormData((prev) => ({
      ...prev,
      cid_list: [...prev.cid_list, '']
    }));
  };

  const handleUpdateCid = (index, value) => {
    setFormData((prev) => {
      const updated = [...prev.cid_list];
      updated[index] = value;
      return { ...prev, cid_list: updated };
    });
  };

  const handleRemoveCid = (index) => {
    setFormData((prev) => {
      const updated = prev.cid_list.filter((_, i) => i !== index);
      return { ...prev, cid_list: updated.length > 0 ? updated : [''] };
    });
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
    if (!formData.nome_mae.trim()) {
      setErrorMsg('Por favor, informe o Nome da Mãe do paciente (obrigatório).');
      return;
    }
    if (!formData.data_entrada.trim()) {
      setErrorMsg('Por favor, informe a Data de Entrada.');
      return;
    }
    if (!formData.municipio.trim()) {
      setErrorMsg('Por favor, selecione ou informe o Município.');
      return;
    }

    // Filtra CIDs preenchidos
    const cleanCidList = formData.cid_list.map((c) => c.trim()).filter(Boolean);
    if (cleanCidList.length === 0) {
      setErrorMsg('Por favor, informe ao menos um CID / Diagnóstico para o paciente.');
      return;
    }

    // Validação do CPF se tiver sido preenchido
    const cpfDigits = formData.cpf.replace(/\D/g, '');
    if (cpfDigits.length > 0) {
      if (cpfDigits.length !== 11 || !validarCPF(formData.cpf)) {
        setErrorMsg('O CPF informado é inválido. Corrija o número ou deixe em branco.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      // Formata OPMs filtrando entradas vazias
      const cleanOpmList = formData.servico_especializado === 'OPM'
        ? formData.opm_list.filter((o) => o.tipo && o.solicitada.trim())
        : [];

      const joinedCid = cleanCidList.join('; ');

      const payload = {
        ...formData,
        id: patientToEdit?.id,
        nome: removerAcentos(formData.nome),
        cpf: formData.cpf,
        nome_mae: removerAcentos(formData.nome_mae),
        municipio: formData.municipio.toUpperCase(),
        esf: formData.esf.toUpperCase(),
        cid_list: cleanCidList,
        cid: joinedCid,
        observacoes: formData.observacoes.toUpperCase(),
        opm_list: cleanOpmList,
        // Compatibilidade legada
        nomeMae: removerAcentos(formData.nome_mae),
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

  const validCidsCount = formData.cid_list.filter((c) => c.trim()).length;
  const hasMotorizada = isMotorizadaSolicitada(formData.opm_list, formData.tipoOpm);
  const statusMotorizada = hasMotorizada ? verificarCompatibilidadeMotorizada(formData.cid_list) : null;

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
                {patientToEdit ? 'Editar Prontuário do Paciente' : 'Cadastro de Novo Paciente'}
              </h2>
              <p className="text-[11px] text-blue-100 font-medium">
                JRRPCD • Gestão de OPM e Reabilitação
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
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {/* Bloco 1: Data de Entrada, Nome Completo e CPF */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
            {/* Data de Entrada */}
            <div className="md:col-span-3">
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

            {/* Nome do Paciente */}
            <div className="md:col-span-6">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Nome do Paciente <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="NOME COMPLETO DO PACIENTE"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: removerAcentos(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold uppercase focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* CPF (Não obrigatório, com validação) */}
            <div className="md:col-span-3">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  CPF <span className="text-slate-400 font-normal text-[9px]">(Opcional)</span>
                </label>
                {cpfValidationState === 'valid' && (
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                    <CheckCircle className="w-3 h-3" /> Válido
                  </span>
                )}
                {cpfValidationState === 'invalid' && (
                  <span className="text-[10px] font-bold text-red-600 flex items-center gap-0.5">
                    <AlertCircle className="w-3 h-3" /> Inválido
                  </span>
                )}
              </div>
              <input
                type="text"
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChange={handleCpfChange}
                className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs uppercase focus:ring-2 outline-none font-mono ${
                  cpfValidationState === 'valid'
                    ? 'border-emerald-300 focus:ring-emerald-500 bg-emerald-50/30'
                    : cpfValidationState === 'invalid'
                    ? 'border-red-300 focus:ring-red-500 bg-red-50/30 text-red-700'
                    : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
            </div>
          </div>

          {/* Bloco 2: Nome da Mãe (Obrigatório) */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              Nome da Mãe do Paciente <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="NOME COMPLETO DA MÃE DO PACIENTE"
              value={formData.nome_mae}
              onChange={(e) => setFormData({ ...formData, nome_mae: removerAcentos(e.target.value) })}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold uppercase focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Bloco 3: DN, Idade e Telefone */}
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

          {/* Bloco 4: Município e ESF com Menu Flutuante */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Menu Flutuante de Municípios */}
            <FloatingSelectMenu
              label="Município"
              required={true}
              icon={MapPin}
              title="Municípios de Referência"
              placeholder="Selecione ou digite o município..."
              value={formData.municipio}
              options={MUNICIPIOS_SUGERIDOS}
              onChange={(city) => setFormData({ ...formData, municipio: city })}
            />

            {/* Menu Flutuante de ESFs (Não obrigatório) */}
            <FloatingSelectMenu
              label="ESF de Referência (Opcional)"
              required={false}
              icon={Building2}
              title="ESFs de Referência (67 Unidades)"
              placeholder="Selecione ou digite a ESF..."
              value={formData.esf}
              options={ESFS_SUGERIDAS}
              onChange={(unit) => setFormData({ ...formData, esf: unit })}
            />
          </div>

          {/* Bloco 5: Múltiplos CIDs com Autocomplete Oficial (14.349 CIDs da pasta cid/) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-blue-600" />
                  CID(s) / Diagnóstico(s) do Paciente <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-slate-500">
                  O paciente pode ter múltiplos diagnósticos. Busque por código (ex: F84, G12, I69) ou nome.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddCid}
                className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-blue-200 shadow-sm transition hover:scale-[1.02]"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Adicionar Outro CID</span>
              </button>
            </div>

            {/* Lista dinâmica de CIDs */}
            <div className="space-y-2.5">
              {formData.cid_list.map((cidItem, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <CidAutocompleteInput
                      value={cidItem}
                      index={idx}
                      required={idx === 0}
                      canRemove={formData.cid_list.length > 1}
                      onChange={(newCid) => handleUpdateCid(idx, newCid)}
                      onRemove={() => handleRemoveCid(idx)}
                    />
                  </div>
                </div>
              ))}
            </div>

            {validCidsCount > 1 && (
              <div className="text-[11px] text-blue-700 bg-blue-50/80 p-2 rounded-lg font-semibold flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                <span>{validCidsCount} diagnósticos registrados para este paciente.</span>
              </div>
            )}
          </div>

          {/* Bloco 6: Serviço Especializado */}
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

          {/* Bloco 7: Seção Dinâmica de OPM (Múltiplos Itens) */}
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

              {/* Alerta de Protocolo: Cadeira Motorizada COMPATÍVEL */}
              {hasMotorizada && statusMotorizada?.isCompativel && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-950 flex items-start gap-3 shadow-sm animate-in fade-in">
                  <div className="p-1.5 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold text-xs uppercase tracking-wide flex flex-wrap items-center gap-1.5">
                      <span className="text-emerald-900">CID Compatível com Cadeira Motorizada</span>
                      <span className="bg-emerald-600 text-white text-[9px] px-2 py-0.5 rounded-md font-bold">
                        Critério Protocolo SUS Atendido
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-normal">
                      O diagnóstico <strong>{statusMotorizada.compativeis.join('; ')}</strong> atende aos critérios oficiais de concessão de Cadeira de Rodas Motorizada.
                    </p>
                  </div>
                </div>
              )}

              {/* Alerta de Protocolo: Cadeira Motorizada NÃO COMPATÍVEL */}
              {hasMotorizada && !statusMotorizada?.isCompativel && (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl text-amber-950 flex items-start gap-3 shadow-sm animate-in fade-in">
                  <div className="p-1.5 bg-amber-600 text-white rounded-xl shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="font-bold text-xs uppercase tracking-wide flex flex-wrap items-center gap-1.5">
                      <span className="text-amber-950">Atenção: CID Não Compatível com Cadeira Motorizada</span>
                      <span className="bg-amber-600 text-white text-[9px] px-2 py-0.5 rounded-md font-bold">
                        Verificação de Protocolo
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-900 leading-normal">
                      {statusMotorizada?.totalCids > 0
                        ? 'O(s) CID(s) preenchido(s) no cadastro não constam na relação de patologias compatíveis com Cadeira Motorizada.'
                        : 'Preencha o campo de CID do paciente acima para checar a compatibilidade com a concessão da Cadeira de Rodas Motorizada.'}
                    </p>
                    <div className="text-[10px] text-amber-900/90 pt-1 border-t border-amber-200/80">
                      <span className="font-bold block mb-1">
                        CIDs compatíveis segundo protocolo (32 CIDs):
                      </span>
                      <div className="font-mono text-[9px] bg-white p-2 rounded-xl border border-amber-200 leading-relaxed text-slate-700 max-h-24 overflow-y-auto">
                        B91, E84.9, G11.2, G11.8, G12.0, G12.1, G12.2, G12.8, G12.9, G35, G37.9, G62.29, G71.0, G71.2, G72.9, G80.0, G80.3, G81.0, G81.1, G81.9, G82.3, G82.4, G82.5, I69.4, Q05.1, Q05.2, Q05.6, Q74.3, Q74.8, Q78.0, T09.3, Z89.9
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bloco 8: Prontuário / Observações */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Prontuário / Observações Clínicas
            </label>
            <textarea
              rows={3}
              placeholder="OBSERVAÇÕES CLÍNICAS, HISTÓRICO, QUEIXA PRINCIPAL, DETALHES DE RECEBIMENTO..."
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
              <span>{isSubmitting ? 'Salvando...' : 'Salvar Paciente'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
