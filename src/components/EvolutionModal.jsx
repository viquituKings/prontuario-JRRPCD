import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Stethoscope,
  Save,
  Accessibility,
  PlusCircle,
  Trash2,
  Brain,
  Sparkles,
  FileText
} from 'lucide-react';
import { OPMS_SUGERIDAS, formatarDataBR, temOpmSolicitada } from '../types';

export default function EvolutionModal({ isOpen, onClose, onSave, patient }) {
  const getHojeIsoDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Identificação do tipo de serviço do paciente
  const servico = patient?.servico_especializado || 'OPM';

  // Regra fundamental: o preenchimento de dispositivos deferidos deve estar disponível
  // EXCLUSIVAMENTE para pacientes com OPM solicitados
  const hasOpmSolicitada = temOpmSolicitada(patient);

  const isOPM = hasOpmSolicitada;
  const isIntelectual = !isOPM && servico === 'Reab. Intelectual';
  const isFisicaVisualNeonato = !isOPM && !isIntelectual;

  // Lista de OPMs solicitadas pelo paciente
  const opmsSolicitadasDoPaciente = [];
  if (Array.isArray(patient?.opm_list)) {
    patient.opm_list.forEach((o) => {
      if (o?.solicitada && o.solicitada.trim()) {
        opmsSolicitadasDoPaciente.push({ tipo: o.tipo, solicitada: o.solicitada.trim() });
      }
    });
  }
  if (opmsSolicitadasDoPaciente.length === 0 && typeof patient?.tipoOpm === 'string' && patient.tipoOpm.trim()) {
    const cleanTipo = patient.tipoOpm.trim();
    const servicosIgnorados = ['opm', 'reab. intelectual', 'reab. fisica', 'reab. visual', 'reabilitação visual', 'neonato de risco'];
    if (!servicosIgnorados.includes(cleanTipo.toLowerCase())) {
      opmsSolicitadasDoPaciente.push({ tipo: 'OPM', solicitada: cleanTipo });
    }
  }

  const initialFormState = () => ({
    // Caso 1: Pacientes OPM (lista de dispositivo deferido + data)
    dispositivos: [{
      dispositivo: (isOPM && opmsSolicitadasDoPaciente.length > 0) ? opmsSolicitadasDoPaciente[0].solicitada.toUpperCase() : '',
      data: getHojeIsoDate()
    }],
    // Caso 2: Categoria Intelectual (CER II ou CRTEA)
    opcaoIntelectual: '',
    // Caso 3: Reabilitação Física, Visual e Neonato de Risco
    data: getHojeIsoDate(),
    evolucao: ''
  });

  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Função que limpa os campos do formulário
  const resetForm = () => {
    setFormData(initialFormState());
    setErrorMsg('');
  };

  // Limpa os campos toda vez que a modal for aberta para um novo prontuário
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, patient?.id]);

  if (!isOpen || !patient) return null;

  // Manipulação dos dispositivos deferidos (Caso OPM)
  const handleAddDispositivo = () => {
    setFormData((prev) => ({
      ...prev,
      dispositivos: [...prev.dispositivos, { dispositivo: '', data: getHojeIsoDate() }]
    }));
  };

  const handleUpdateDispositivo = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.dispositivos];
      updated[index] = {
        ...updated[index],
        [field]: field === 'dispositivo' ? value.toUpperCase() : value
      };
      return { ...prev, dispositivos: updated };
    });
  };

  const handleRemoveDispositivo = (index) => {
    setFormData((prev) => {
      const updated = prev.dispositivos.filter((_, i) => i !== index);
      return {
        ...prev,
        dispositivos: updated.length > 0 ? updated : [{ dispositivo: '', data: getHojeIsoDate() }]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      if (isOPM) {
        // Validação Caso OPM
        const cleanDispositivos = formData.dispositivos
          .map((d) => ({ dispositivo: d.dispositivo.trim(), data: d.data }))
          .filter((d) => d.dispositivo);

        if (cleanDispositivos.length === 0) {
          setErrorMsg('Por favor, informe ao menos um dispositivo deferido e sua data.');
          setIsSubmitting(false);
          return;
        }

        const payload = {
          tipoRegistro: 'OPM',
          categoriaServico: 'OPM',
          dispositivosDeferidos: cleanDispositivos,
          dispositivoDeferido: cleanDispositivos.map((d) => d.dispositivo).join('; '),
          data: cleanDispositivos[0].data,
          dataHora: cleanDispositivos[0].data ? `${cleanDispositivos[0].data}T12:00:00` : new Date().toISOString(),
          descricaoDispositivo: cleanDispositivos.map((d) => `${d.dispositivo} (Deferido em: ${formatarDataBR(d.data)})`).join('; '),
          descricao: `Dispositivo(s) Deferido(s): ${cleanDispositivos.map((d) => `${d.dispositivo} (${formatarDataBR(d.data)})`).join('; ')}`
        };

        await onSave(patient.id, payload);
      } else if (isIntelectual) {
        // Validação Caso Intelectual
        if (!formData.opcaoIntelectual) {
          setErrorMsg('Por favor, selecione uma das opções: CER II ou (CRTEA).');
          setIsSubmitting(false);
          return;
        }

        const payload = {
          tipoRegistro: 'Intelectual',
          categoriaServico: 'Reab. Intelectual',
          opcaoIntelectual: formData.opcaoIntelectual,
          data: getHojeIsoDate(),
          dataHora: new Date().toISOString(),
          descricao: `Encaminhamento / Modalidade: ${formData.opcaoIntelectual}`
        };

        await onSave(patient.id, payload);
      } else {
        // Validação Caso Reabilitação Física, Visual e Neonato de Risco
        if (!formData.evolucao.trim()) {
          setErrorMsg('Por favor, preencha o campo de evolução.');
          setIsSubmitting(false);
          return;
        }

        const payload = {
          tipoRegistro: 'Evolucao',
          categoriaServico: servico,
          data: formData.data,
          dataHora: formData.data ? `${formData.data}T12:00:00` : new Date().toISOString(),
          descricao: formData.evolucao.trim()
        };

        await onSave(patient.id, payload);
      }

      // Limpa os campos do formulário após confirmação e salvamento
      resetForm();
      onClose();
    } catch (err) {
      setErrorMsg('Erro ao salvar prontuário: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 no-print">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">

        {/* Cabeçalho */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-emerald-200" />
              <span>Prontuário</span>
            </h2>
            <p className="text-xs text-teal-100 flex flex-wrap items-center gap-2 mt-0.5">
              <span>Paciente: <strong className="text-white">{patient.nome}</strong></span>
              <span>•</span>
              <span className="bg-white/20 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                {servico}
              </span>
              {hasOpmSolicitada && (
                <span className="bg-amber-400 text-amber-950 px-2 py-0.5 rounded text-[10px] font-bold">
                  OPM Solicitada
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          {/* ========================================================================= */}
          {/* CASO 1: PACIENTES COM OPM (Dispositivo Deferido e Data lado a lado) */}
          {/* ========================================================================= */}
          {isOPM && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Accessibility className="w-4 h-4 text-indigo-600" />
                    <span>Dispositivos Deferidos</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Cadastre o dispositivo deferido e a data correspondente.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddDispositivo}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-200 shadow-sm transition hover:scale-[1.02]"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Adicionar Outro Dispositivo</span>
                </button>
              </div>

              {/* Destaque das OPMs solicitadas no cadastro do paciente */}
              {opmsSolicitadasDoPaciente.length > 0 && (
                <div className="bg-indigo-50/80 border border-indigo-200 p-2.5 rounded-xl text-xs flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-indigo-900">
                    OPM(s) Solicitada(s) no cadastro:
                  </span>
                  {opmsSolicitadasDoPaciente.map((item, oIdx) => (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => {
                          const list = [...prev.dispositivos];
                          const emptyIdx = list.findIndex((d) => !d.dispositivo.trim());
                          if (emptyIdx !== -1) {
                            list[emptyIdx] = { ...list[emptyIdx], dispositivo: item.solicitada.toUpperCase() };
                          } else {
                            list.push({ dispositivo: item.solicitada.toUpperCase(), data: getHojeIsoDate() });
                          }
                          return { ...prev, dispositivos: list };
                        });
                      }}
                      className="bg-white hover:bg-indigo-600 hover:text-white text-indigo-800 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-indigo-300 shadow-2xs transition"
                      title="Clique para preencher como Dispositivo Deferido"
                    >
                      + {item.solicitada}
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                {formData.dispositivos.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl items-end relative shadow-sm"
                  >
                    {/* Dispositivo Deferido */}
                    <div className="md:col-span-7">
                      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Dispositivo Deferido {formData.dispositivos.length > 1 && `#${idx + 1}`} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        list={`sugestoes-opm-${idx}`}
                        placeholder="EX: CADEIRA DE RODAS MOTORIZADA..."
                        value={item.dispositivo}
                        onChange={(e) => handleUpdateDispositivo(idx, 'dispositivo', e.target.value)}
                        className="w-full text-xs font-bold uppercase bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <datalist id={`sugestoes-opm-${idx}`}>
                        {OPMS_SUGERIDAS.map((s) => (
                          <option key={s} value={s} />
                        ))}
                      </datalist>
                    </div>

                    {/* Data */}
                    <div className={formData.dispositivos.length > 1 ? "md:col-span-4" : "md:col-span-5"}>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Data <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={item.data}
                        onChange={(e) => handleUpdateDispositivo(idx, 'data', e.target.value)}
                        className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    {/* Botão Remover Dispositivo (se houver mais de 1) */}
                    {formData.dispositivos.length > 1 && (
                      <div className="md:col-span-1 flex justify-end pb-1">
                        <button
                          type="button"
                          onClick={() => handleRemoveDispositivo(idx)}
                          className="text-slate-400 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition"
                          title="Remover este dispositivo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CASO 2: CATEGORIA INTELECTUAL (Radio buttons: CER II e (CRTEA)) */}
          {/* ========================================================================= */}
          {isIntelectual && (
            <div className="p-5 bg-purple-50/60 border border-purple-200 rounded-2xl space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-purple-950 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-purple-600" />
                  <span>Encaminhamento / Modalidade <span className="text-red-500">*</span></span>
                </label>
                <p className="text-[11px] text-purple-700">
                  Selecione a modalidade de atendimento para este paciente:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {/* Opção CER II */}
                <label className={`p-4 rounded-2xl border-2 flex items-center gap-3.5 cursor-pointer transition select-none ${formData.opcaoIntelectual === 'CER II'
                    ? 'border-purple-600 bg-white shadow-md ring-2 ring-purple-500/20 text-purple-950'
                    : 'border-purple-200/80 bg-white/70 hover:bg-white text-slate-700 hover:border-purple-300'
                  }`}>
                  <input
                    type="radio"
                    name="opcaoIntelectual"
                    value="CER II"
                    checked={formData.opcaoIntelectual === 'CER II'}
                    onChange={(e) => setFormData({ ...formData, opcaoIntelectual: e.target.value })}
                    className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <span className="block text-sm font-black text-purple-950 tracking-wide">CER II</span>
                    <span className="text-[11px] text-slate-500 block">Centro Especializado em Reabilitação</span>
                  </div>
                </label>

                {/* Opção (CRTEA) */}
                <label className={`p-4 rounded-2xl border-2 flex items-center gap-3.5 cursor-pointer transition select-none ${formData.opcaoIntelectual === 'CRTEA'
                    ? 'border-purple-600 bg-white shadow-md ring-2 ring-purple-500/20 text-purple-950'
                    : 'border-purple-200/80 bg-white/70 hover:bg-white text-slate-700 hover:border-purple-300'
                  }`}>
                  <input
                    type="radio"
                    name="opcaoIntelectual"
                    value="CRTEA"
                    checked={formData.opcaoIntelectual === 'CRTEA'}
                    onChange={(e) => setFormData({ ...formData, opcaoIntelectual: e.target.value })}
                    className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <span className="block text-sm font-black text-purple-950 tracking-wide">(CRTEA)</span>
                    <span className="text-[11px] text-slate-500 block">Centro de Referência em Transtorno do Espectro Autista</span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CASO 3: REABILITAÇÃO FÍSICA, VISUAL E NEONATO DE RISCO (Data e Evolução) */}
          {/* ========================================================================= */}
          {isFisicaVisualNeonato && (
            <div className="space-y-4">
              {/* Data */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Data <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              {/* Evolução */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Evolução <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Descreva detalhadamente a evolução clínica, atendimento, procedimentos realizados e observações..."
                  value={formData.evolucao}
                  onChange={(e) => setFormData({ ...formData, evolucao: e.target.value })}
                  className="w-full text-xs rounded-xl border-slate-300 border p-3.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none resize-y text-slate-800 leading-relaxed font-medium"
                />
              </div>
            </div>
          )}

          {/* Rodapé com Ações */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50 hover:scale-[1.02]"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Salvando...' : 'Confirmar e Salvar Prontuário'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

