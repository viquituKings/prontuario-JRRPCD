import React, { useState } from 'react';
import { X, Calendar, UserCheck, Stethoscope, Save, FileText } from 'lucide-react';
import { TIPOS_ATENDIMENTO } from '../types';

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
    profissional: '',
    tipoAtendimento: 'Avaliação Fisioterapêutica',
    descricao: '',
    conduta: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !patient) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.profissional.trim()) {
      setErrorMsg('Informe o nome e conselho do profissional.');
      return;
    }
    if (!formData.descricao.trim()) {
      setErrorMsg('Descreva a evolução do atendimento.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await onSave(patient.id, formData);
      onClose();
    } catch (err) {
      setErrorMsg('Erro ao salvar evolução: ' + (err.message || 'Erro desconhecido'));
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
              <span>Registrar Evolução Clínica</span>
            </h2>
            <p className="text-xs text-teal-100">
              Paciente: <strong className="text-white">{patient.nome}</strong> | OPM: {patient.tipoOpm || 'Geral'}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
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

            {/* Tipo de Atendimento */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tipo de Atendimento <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.tipoAtendimento}
                onChange={(e) => setFormData({ ...formData, tipoAtendimento: e.target.value })}
                className="w-full text-sm rounded-lg border-slate-300 border px-3 py-2 bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              >
                {TIPOS_ATENDIMENTO.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Profissional Responsável */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Profissional Responsável (Nome e Registro de Conselho) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Dra. Camila Rocha (Fisioterapeuta - CREFITO 12345/SP)"
              value={formData.profissional}
              onChange={(e) => setFormData({ ...formData, profissional: e.target.value })}
              className="w-full text-sm rounded-lg border-slate-300 border px-3 py-2 bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
            />
          </div>

          {/* Descrição da Evolução */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Descrição da Evolução Clínica / Procedimento Realizado <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={5}
              required
              placeholder="Descreva detalhadamente o estado clínico, amplitude de movimento, condições do coto, provas, treino, queixas e testes realizados..."
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="w-full text-sm rounded-lg border-slate-300 border p-3 bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-y"
            />
          </div>

          {/* Conduta / Orientações */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Conduta Clínica, Orientações e Próximos Passos
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
              <span>{isSubmitting ? 'Registrando...' : 'Registrar Evolução'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
