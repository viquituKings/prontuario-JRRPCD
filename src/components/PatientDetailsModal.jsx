import React from 'react';
import { 
  X, 
  Calendar, 
  Phone, 
  MapPin, 
  Building2, 
  Stethoscope, 
  Accessibility, 
  FileText, 
  Clock, 
  PlusCircle, 
  Printer, 
  Edit3, 
  Trash2,
  UserCheck,
  Hospital,
  CheckCircle2,
  ShieldCheck,
  Send
} from 'lucide-react';
import { formatarDataHoraBR } from '../types';

export default function PatientDetailsModal({
  isOpen,
  onClose,
  patient,
  onEditPatient,
  onOpenEvolutionModal,
  onDeleteEvolution,
  onPrintPatient
}) {
  if (!isOpen || !patient) return null;

  const evolucoes = patient.evolucoes || [];
  const servico = patient.servico_especializado || 'OPM';
  const opms = patient.opm_list || [];

  const cleanPhone = patient.telefone ? patient.telefone.replace(/\D/g, '') : '';
  const whatsappUrl = cleanPhone.length >= 10 ? `https://wa.me/55${cleanPhone}` : null;

  const badgeColor = 
    servico === 'OPM' 
      ? 'bg-blue-100 text-blue-800 border-blue-200' 
      : servico === 'Reab. Intelectual' 
      ? 'bg-purple-100 text-purple-800 border-purple-200' 
      : 'bg-emerald-100 text-emerald-800 border-emerald-200';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 no-print">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-100 flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Topo com Identificação */}
        <div className="p-6 bg-slate-900 text-white relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  {patient.nome}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeColor}`}>
                  {servico}
                </span>
                {patient.status && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-blue-300 border border-slate-700">
                    {patient.status}
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                <span>Data Ent.: <strong className="text-white">{patient.data_entrada || patient.dataEntrada || '-'}</strong></span>
                <span>•</span>
                <span>DN: <strong className="text-white">{patient.dn || patient.dataNascimento || '-'}</strong></span>
                <span>•</span>
                <span>Idade: <strong className="text-white">{patient.idade ? `${patient.idade} anos` : '-'}</strong></span>
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                onClick={() => onPrintPatient(patient)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition"
                title="Imprimir Prontuário Médico"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onEditPatient(patient);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition"
                title="Editar Cadastro"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>

              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Informações de Localização e Protocolo */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-500 block font-medium">Telefone / Contato</span>
            <div className="flex items-center gap-1.5 mt-0.5 font-semibold text-slate-800">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{patient.telefone || 'Não informado'}</span>
              {whatsappUrl && (
                <a 
                  href={whatsappUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  title="Abrir no WhatsApp"
                  className="text-emerald-600 hover:text-emerald-700 font-bold ml-1"
                >
                  (Zap)
                </a>
              )}
            </div>
          </div>

          <div>
            <span className="text-slate-500 block font-medium">Município</span>
            <div className="flex items-center gap-1.5 mt-0.5 font-semibold text-slate-800">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{patient.municipio || 'Não informado'}</span>
            </div>
          </div>

          <div>
            <span className="text-slate-500 block font-medium">ESF de Referência</span>
            <div className="flex items-center gap-1.5 mt-0.5 font-semibold text-slate-800">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{patient.esf || patient.esfReferencia || 'Não informado'}</span>
            </div>
          </div>

          <div>
            <span className="text-slate-500 block font-medium">Remetente</span>
            <div className="flex items-center gap-1.5 mt-0.5 font-semibold text-slate-800">
              <Send className="w-3.5 h-3.5 text-slate-400" />
              <span>{patient.remetente || '-'}</span>
            </div>
          </div>
        </div>

        {/* Dados da Junta e Avaliação */}
        <div className="bg-white border-b border-slate-100 px-6 py-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Avaliação da Junta</span>
            <span className="font-bold text-slate-800 mt-0.5 block">{patient.avaliacao_junta || '-'}</span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium">Data de Avaliação/Envio</span>
            <span className="font-bold text-slate-800 mt-0.5 block">{patient.data_avaliacao || '-'}</span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium">Presença</span>
            <span className="font-bold text-emerald-700 mt-0.5 block">{patient.presenca || '-'}</span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium">Data da Alta</span>
            <span className="font-bold text-slate-800 mt-0.5 block">{patient.data_alta || 'Em acompanhamento'}</span>
          </div>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* CID e OPMs Solicitadas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CID */}
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 uppercase tracking-wider">
                <Stethoscope className="w-4 h-4 text-blue-600" />
                <span>CID / Diagnóstico</span>
              </div>
              <p className="text-sm font-bold text-slate-900 mt-1">
                {patient.cid || 'Não especificado'}
              </p>
            </div>

            {/* OPMs Solicitadas */}
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 uppercase tracking-wider">
                <Accessibility className="w-4 h-4 text-indigo-600" />
                <span>OPMs Solicitadas ({opms.length})</span>
              </div>
              {opms.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {opms.map((o, idx) => (
                    <span 
                      key={idx}
                      className="px-2.5 py-1 bg-white rounded-lg border border-indigo-200 text-indigo-900 font-bold text-xs shadow-sm"
                    >
                      {o.tipo}: {o.solicitada}
                    </span>
                  ))}
                </div>
              ) : patient.tipoOpm ? (
                <p className="text-sm font-bold text-slate-900 mt-1">{patient.tipoOpm}</p>
              ) : (
                <p className="text-xs text-slate-400 italic mt-1">Nenhuma OPM vinculada.</p>
              )}
            </div>
          </div>

          {/* Prontuário / Observações */}
          {(patient.observacoes || patient.prontuarioObservacoes) && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <FileText className="w-4 h-4 text-slate-500" />
                <span>Prontuário & Observações do Pedido</span>
              </div>
              <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
                {patient.observacoes || patient.prontuarioObservacoes}
              </p>
            </div>
          )}

          {/* Linha do Tempo: Evoluções Clínicas */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-teal-600" />
                  <span>Histórico de Evolução Clínica</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Registro de atendimentos, consultas, medições e entregas
                </p>
              </div>

              <button
                onClick={() => onOpenEvolutionModal(patient)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-sm transition hover:scale-[1.02]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Nova Evolução</span>
              </button>
            </div>

            {evolucoes.length === 0 ? (
              <div className="text-center py-10 px-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600">
                  Nenhuma evolução registrada para este paciente ainda.
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Clique no botão acima para adicionar a primeira anotação clínica.
                </p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                {evolucoes.map((evo) => (
                  <div key={evo.id} className="relative group">
                    <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-teal-500 border-4 border-white shadow-sm" />

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2 hover:border-teal-200 transition">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-2">
                        <div>
                          <span className="inline-block px-2 py-0.5 bg-teal-50 text-teal-800 text-[11px] font-semibold rounded border border-teal-200 mr-2">
                            {evo.tipoAtendimento}
                          </span>
                          <span className="text-xs text-slate-500">
                            {formatarDataHoraBR(evo.dataHora)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-700 flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                            {evo.profissional}
                          </span>
                          <button
                            onClick={() => {
                              if (confirm('Tem certeza que deseja excluir esta anotação de evolução?')) {
                                onDeleteEvolution(patient.id, evo.id);
                              }
                            }}
                            className="text-slate-300 hover:text-red-500 p-1 rounded opacity-0 group-hover:opacity-100 transition"
                            title="Excluir evolução"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {evo.descricao}
                      </p>

                      {evo.conduta && (
                        <div className="mt-2 pt-2 border-t border-slate-100 bg-slate-50/70 p-2.5 rounded-lg text-xs">
                          <strong className="text-slate-700 block font-semibold mb-0.5">
                            Conduta / Orientações:
                          </strong>
                          <span className="text-slate-600 whitespace-pre-wrap">
                            {evo.conduta}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

        {/* Rodapé */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
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
