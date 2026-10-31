import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  User, 
  Phone, 
  MapPin, 
  Building2, 
  Stethoscope, 
  Accessibility, 
  FileText, 
  Save, 
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { 
  OPMS_SUGERIDAS, 
  CIDS_COMUNS, 
  STATUS_PACIENTE, 
  calcularIdade, 
  formatarTelefone 
} from '../types';

export default function PatientFormModal({ isOpen, onClose, onSave, patientToEdit }) {
  const getTodayIso = () => new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    dataEntrada: getTodayIso(),
    nome: '',
    dataNascimento: '',
    idade: '',
    telefone: '',
    municipio: '',
    esfReferencia: '',
    cid: '',
    tipoOpm: '',
    status: 'triagem',
    prontuarioObservacoes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Carrega dados se estiver editando ou limpa se for novo
  useEffect(() => {
    if (patientToEdit) {
      setFormData({
        dataEntrada: patientToEdit.dataEntrada || getTodayIso(),
        nome: patientToEdit.nome || '',
        dataNascimento: patientToEdit.dataNascimento || '',
        idade: patientToEdit.idade || '',
        telefone: patientToEdit.telefone || '',
        municipio: patientToEdit.municipio || '',
        esfReferencia: patientToEdit.esfReferencia || '',
        cid: patientToEdit.cid || '',
        tipoOpm: patientToEdit.tipoOpm || '',
        status: patientToEdit.status || 'triagem',
        prontuarioObservacoes: patientToEdit.prontuarioObservacoes || '',
      });
    } else {
      setFormData({
        dataEntrada: getTodayIso(),
        nome: '',
        dataNascimento: '',
        idade: '',
        telefone: '',
        municipio: '',
        esfReferencia: '',
        cid: '',
        tipoOpm: '',
        status: 'triagem',
        prontuarioObservacoes: '',
      });
    }
    setErrorMsg('');
  }, [patientToEdit, isOpen]);

  if (!isOpen) return null;

  const handleNascimentoChange = (e) => {
    const dataNasc = e.target.value;
    const idadeCalculada = calcularIdade(dataNasc);
    setFormData((prev) => ({
      ...prev,
      dataNascimento: dataNasc,
      idade: idadeCalculada || prev.idade
    }));
  };

  const handleTelefoneChange = (e) => {
    const raw = e.target.value;
    setFormData((prev) => ({
      ...prev,
      telefone: formatarTelefone(raw)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      setErrorMsg('Por favor, informe o Nome do paciente.');
      return;
    }
    if (!formData.dataEntrada) {
      setErrorMsg('Por favor, informe a Data de Entrada.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await onSave({
        ...formData,
        id: patientToEdit?.id,
        evolucoes: patientToEdit?.evolucoes || []
      });
      onClose();
    } catch (err) {
      setErrorMsg('Erro ao salvar paciente: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 no-print">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabeçalho do Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-blue-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {patientToEdit ? 'Editar Prontuário do Paciente' : 'Cadastro de Novo Paciente'}
              </h2>
              <p className="text-xs text-blue-100">
                Preencha os dados de admissão e prontuário para o programa de OPM
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

        {/* Formulário com Scroll Interno */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Seção 1: Identificação Básica */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              Identificação do Paciente
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
              
              {/* Data de Entrada */}
              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Data de Entrada <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={formData.dataEntrada}
                    onChange={(e) => setFormData({ ...formData, dataEntrada: e.target.value })}
                    className="w-full text-sm rounded-lg border-slate-300 border px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="md:col-span-8">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status no Programa
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full text-sm rounded-lg border-slate-300 border px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium"
                >
                  {STATUS_PACIENTE.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nome */}
              <div className="md:col-span-12">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nome do paciente"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full text-sm rounded-lg border-slate-300 border px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Data de Nascimento */}
              <div className="md:col-span-5">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  value={formData.dataNascimento}
                  onChange={handleNascimentoChange}
                  className="w-full text-sm rounded-lg border-slate-300 border px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Idade (calculada com ajuste manual opcional) */}
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Idade</span>
                  <span className="text-[10px] text-blue-600 font-normal">Auto / Manual</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: 45 anos"
                  value={formData.idade}
                  onChange={(e) => setFormData({ ...formData, idade: e.target.value })}
                  className="w-full text-sm rounded-lg border-slate-300 border px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Telefone */}
              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={formData.telefone}
                  onChange={handleTelefoneChange}
                  className="w-full text-sm rounded-lg border-slate-300 border px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

            </div>
          </div>

          {/* Seção 2: Localização e Referência */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              Origem e Referência SUS
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Município */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Município
                </label>
                <input
                  type="text"
                  placeholder="Ex: São Paulo, Santo André, etc."
                  value={formData.municipio}
                  onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
                  className="w-full text-sm rounded-lg border-slate-300 border px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* ESF de Referência */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ESF de Referência / Unidade Básica
                </label>
                <input
                  type="text"
                  placeholder="Ex: ESF Jardim das Flores, UBS Centro"
                  value={formData.esfReferencia}
                  onChange={(e) => setFormData({ ...formData, esfReferencia: e.target.value })}
                  className="w-full text-sm rounded-lg border-slate-300 border px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Seção 3: Diagnóstico e OPM */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
              Dados Clínicos e OPM
            </h3>

            <div className="space-y-3.5">
              {/* CID / Impressão Diagnóstica */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    CID / Impressão Diagnóstica
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="Ex: G80 - Paralisia Cerebral, I69 - Sequela de AVC, etc."
                  value={formData.cid}
                  onChange={(e) => setFormData({ ...formData, cid: e.target.value })}
                  className="w-full text-sm rounded-lg border-slate-300 border px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />

                {/* Sugestões rápidas de CID */}
                <div className="mt-1.5 flex flex-wrap gap-1">
                  <span className="text-[11px] text-slate-400 self-center mr-1">Sugestões rápidas:</span>
                  {CIDS_COMUNS.slice(0, 5).map((c) => (
                    <button
                      key={c.codigo}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, cid: `${c.codigo} - ${c.descricao}` }))}
                      className="text-[11px] px-2 py-0.5 bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded text-slate-600 transition"
                    >
                      {c.codigo}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tipo de OPM */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo de OPM (Órtese, Prótese ou Meio Auxiliar)
                </label>
                <input
                  type="text"
                  list="opms-list"
                  placeholder="Selecione ou digite o tipo de OPM..."
                  value={formData.tipoOpm}
                  onChange={(e) => setFormData({ ...formData, tipoOpm: e.target.value })}
                  className="w-full text-sm rounded-lg border-slate-300 border px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium"
                />
                <datalist id="opms-list">
                  {OPMS_SUGERIDAS.map((opm) => (
                    <option key={opm} value={opm} />
                  ))}
                </datalist>

                {/* Atalhos de OPMs frequentes */}
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {['Cadeira de Rodas Padrão Adulto', 'Cadeira de Banho', 'AFO / Goteira', 'Andador', 'Prótese Transtibial'].map((opm) => (
                    <button
                      key={opm}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, tipoOpm: opm }))}
                      className="text-[11px] px-2 py-0.5 bg-white hover:bg-purple-50 hover:text-purple-700 border border-slate-200 rounded text-slate-600 transition"
                    >
                      + {opm}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Seção 4: Prontuário / Observações */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              Prontuário / Observações Iniciais
            </h3>
            <p className="text-xs text-slate-500">
              Descreva histórico clínico, queixa principal, condições do coto/membro, indicação clínica ou observações relevantes.
            </p>
            <textarea
              rows={4}
              placeholder="Digite aqui o prontuário e observações clínicas iniciais do paciente..."
              value={formData.prontuarioObservacoes}
              onChange={(e) => setFormData({ ...formData, prontuarioObservacoes: e.target.value })}
              className="w-full text-sm rounded-lg border-slate-300 border p-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
            />
          </div>

          {/* Botões do Rodapé */}
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
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-sm transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Salvando...' : 'Salvar Prontuário'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
