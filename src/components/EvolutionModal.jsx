import React, { useState } from 'react';
import { X, Calendar, Stethoscope, Save, FileText, Accessibility } from 'lucide-react';

export default function EvolutionModal({ isOpen, onClose, onSave, patient }) {
  const getNowLocalIso = () => {
    const now = new Date();
    // Offset local para formato YYYY-MM-DDTHH:mm
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now - tzOffset).toISOString().slice(0, 16);
    return localISOTime;
  };

  const [formData, setFormData] = useState({
    dataHora: getNowLocalIso(),
    descricaoDispositivo: '',
    descricao: '',
    conduta: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !patient) return null;

  const opms = patient.opm_list || [];
  const hasOpm = (opms.length > 0 && opms.some((o) => o.solicitada || o.tipo)) ||
    Boolean(patient.tipoOpm && patient.tipoOpm.trim()) ||
    patient.servico_especializado === 'OPM';

  const opmNomes = opms.length > 0
    ? opms.map((o) => `${o.tipo}: ${o.solicitada}`).join('; ')
    : patient.tipoOpm || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (hasOpm && !formData.descricaoDispositivo.trim()) {
      setErrorMsg('Por favor, informe a descrição do dispositivo.');
      return;
    }
    if (!formData.descricao.trim()) {
      setErrorMsg('Por favor, informe a descrição do prontuário médico.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await onSave(patient.id, formData);
      onClose();
    } catch (err) {
      setErrorMsg('Erro ao salvar prontuário médico: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 no-print">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabeçalho */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Stethoscope className="w-5 h-5" />
              <span>Prontuário Médico</span>
            </h2>
            <p className="text-xs text-teal-100">
              Paciente: <strong className="text-white">{patient.nome}</strong> {opmNomes ? `| OPM: ${opmNomes}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Data e Hora */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Data e Hora do Atendimento <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={formData.dataHora}
              onChange={(e) => setFormData({ ...formData, dataHora: e.target.value })}
              className="w-full text-sm rounded-lg border-slate-300 border px-3 py-2 bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
            />
          </div>

          {/* Campo Descrição do Dispositivo (Exibido caso o paciente possua solicitação de OPMs) */}
          {hasOpm && (
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3.5 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <label className="block text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Accessibility className="w-4 h-4 text-indigo-600" />
                  <span>Descrição do Dispositivo <span className="text-red-500">*</span></span>
                </label>
                {opmNomes && (
                  <span className="text-[10px] font-semibold text-indigo-800 bg-white px-2 py-0.5 rounded border border-indigo-200 truncate max-w-[280px]">
                    {opmNomes}
                  </span>
                )}
              </div>
              <textarea
                rows={3}
                required
                placeholder="Descreva as características técnicas, modelo, medidas, ajustes, adaptações, estado do dispositivo ou prescrição técnica..."
                value={formData.descricaoDispositivo}
                onChange={(e) => setFormData({ ...formData, descricaoDispositivo: e.target.value })}
                className="w-full text-xs rounded-lg border-indigo-200 border p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-y text-slate-800 font-medium"
              />
            </div>
          )}

          {/* Descrição do Prontuário Médico */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Descrição do Prontuário Médico / Procedimento Realizado <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={5}
              required
              placeholder="Descreva o estado clínico, evolução do paciente, exames, condições do coto, provas, queixas e testes realizados..."
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="w-full text-sm rounded-lg border-slate-300 border p-3 bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-y"
            />
          </div>

          {/* Conduta / Orientações */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Conduta Clínica, Orientações e Encaminhamentos
            </label>
            <textarea
              rows={3}
              placeholder="Ex: Orientado quanto aos cuidados higiênicos com a órtese; agendado retorno para nova prova; encaminhado ao serviço social..."
              value={formData.conduta}
              onChange={(e) => setFormData({ ...formData, conduta: e.target.value })}
              className="w-full text-sm rounded-lg border-slate-300 border p-3 bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-y"
            />
          </div>

          {/* Rodapé */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-sm transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Salvando...' : 'Salvar Prontuário Médico'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

