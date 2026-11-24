import React, { useState, useEffect } from 'react';
import { X, Archive, AlertTriangle, Calendar, FileText, User, FolderOpen } from 'lucide-react';
import { formatarMascaraData, getHojeBR } from '../types';

export default function MoverParaArquivoMortoModal({
  isOpen,
  onClose,
  patient,
  onConfirm
}) {
  const [nome, setNome] = useState('');
  const [dn, setDn] = useState('');
  const [dataSaida, setDataSaida] = useState('');
  const [pasta, setPasta] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && patient) {
      setNome(patient.nome || '');
      setDn(patient.dn || patient.dataNascimento || '');
      setDataSaida(getHojeBR());
      setPasta('');
      setObservacoes('');
      setIsSubmitting(false);
    }
  }, [isOpen, patient]);

  if (!isOpen || !patient) return null;

  const totalServicos = patient.totalServicos || patient.registros?.length || 1;
  const totalEvolucoes = Array.isArray(patient.evolucoes) ? patient.evolucoes.length : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome.trim()) {
      alert('O nome do paciente é obrigatório.');
      return;
    }
    if (!dataSaida.trim() || dataSaida.trim().length < 10) {
      alert('Informe uma data de saída válida (DD/MM/AAAA).');
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirm(patient, {
        nome: nome.trim(),
        dn: dn.trim(),
        dataSaida: dataSaida.trim(),
        pasta: pasta.trim(),
        observacoes: observacoes.trim()
      });
      onClose();
    } catch (err) {
      console.error('Erro ao mover para arquivo morto:', err);
      alert('Erro ao mover paciente para o Arquivo Morto: ' + (err.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 no-print">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">

        {/* Cabeçalho */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-700 via-amber-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <Archive className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h2 className="text-base font-bold">Mover para Arquivo Morto</h2>
              <p className="text-[11px] text-amber-100/90">
                O paciente sairá da lista ativa mantendo todo o histórico salvo
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

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">

          {/* Aviso de Preservação de Histórico */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed">
              <p className="font-bold">Preservação integral do histórico clínico</p>
              <p className="text-[11px] text-amber-800">
                Serão arquivados e preservados <strong>{totalServicos}</strong> {totalServicos === 1 ? 'serviço registrado' : 'serviços registrados'} e <strong>{totalEvolucoes}</strong> {totalEvolucoes === 1 ? 'evolução clínica' : 'evoluções clínicas'}. Esta ação será registrada nos logs de auditoria.
              </p>
            </div>
          </div>

          {/* Nome do Paciente */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Nome do Paciente *</span>
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value.toUpperCase())}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Data de Nascimento, Data de Saída e Pasta */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Data de Nascimento</span>
              </label>
              <input
                type="text"
                value={dn}
                onChange={(e) => setDn(formatarMascaraData(e.target.value))}
                placeholder="DD/MM/AAAA"
                maxLength={10}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>Data de Saída *</span>
              </label>
              <input
                type="text"
                required
                value={dataSaida}
                onChange={(e) => setDataSaida(formatarMascaraData(e.target.value))}
                placeholder="DD/MM/AAAA"
                maxLength={10}
                className="w-full bg-white border border-amber-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1">
                <FolderOpen className="w-3.5 h-3.5 text-amber-600" />
                <span>Pasta / Arquivo Físico</span>
              </label>
              <input
                type="text"
                value={pasta}
                onChange={(e) => setPasta(e.target.value.toUpperCase())}
                placeholder="Ex: PASTA 12"
                className="w-full bg-white border border-amber-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Observações (Opcional) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Observações / Motivo (Opcional)</span>
            </label>
            <textarea
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Descreva o motivo do direcionamento ao arquivo morto (ex: alta clínica, óbito, mudança de município, abandono de tratamento, solicitação concluída...)"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>

          {/* Rodapé */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-sm transition"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Arquivando...' : 'Confirmar Arquivo Morto'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
