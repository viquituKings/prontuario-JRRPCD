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
  Heart,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Brain
} from 'lucide-react';
import { 
  formatarDataHoraBR, 
  formatarDataBR,
  isMotorizadaSolicitada, 
  verificarCompatibilidadeMotorizada,
  getBadgeColorServico
} from '../types';

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
  const cidsList = patient.cid_list && patient.cid_list.length > 0
    ? patient.cid_list
    : patient.cid
    ? patient.cid.split(';').map((c) => c.trim()).filter(Boolean)
    : [];

  const hasMotorizada = isMotorizadaSolicitada(opms, patient.tipoOpm);
  const statusMotorizada = hasMotorizada ? verificarCompatibilidadeMotorizada(cidsList) : null;

  const cleanPhone = patient.telefone ? patient.telefone.replace(/\D/g, '') : '';
  const whatsappUrl = cleanPhone.length >= 10 ? `https://wa.me/55${cleanPhone}` : null;

  const badgeColor = getBadgeColorServico(servico);

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
              </div>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                <span>Data Ent.: <strong className="text-white">{patient.data_entrada || patient.dataEntrada || '-'}</strong></span>
                <span>•</span>
                <span>DN: <strong className="text-white">{patient.dn || patient.dataNascimento || '-'}</strong></span>
                <span>•</span>
                <span>Idade: <strong className="text-white">{patient.idade ? `${patient.idade} anos` : '-'}</strong></span>
                {patient.cpf && (
                  <>
                    <span>•</span>
                    <span>CPF: <strong className="text-white font-mono">{patient.cpf}</strong></span>
                  </>
                )}
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

        {/* Informações Cadastrais (Mãe, CPF, Telefone, Município, ESF) */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Nome da Mãe */}
          <div className="sm:col-span-2">
            <span className="text-slate-500 block font-medium flex items-center gap-1">
              <Heart className="w-3 h-3 text-rose-500" /> Nome da Mãe
            </span>
            <div className="font-bold text-slate-800 mt-0.5 truncate" title={patient.nome_mae || patient.nomeMae}>
              {patient.nome_mae || patient.nomeMae || 'Não informado'}
            </div>
          </div>

          {/* Telefone */}
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

          {/* Município & ESF */}
          <div>
            <span className="text-slate-500 block font-medium">Município / ESF</span>
            <div className="font-semibold text-slate-800 mt-0.5">
              <span>{patient.municipio || '-'}</span>
              {(patient.esf || patient.esfReferencia) && (
                <span className="text-slate-500 block text-[11px] truncate">
                  {patient.esf || patient.esfReferencia}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* CID e OPMs Solicitadas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CID(s) */}
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-blue-900 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-blue-600" />
                  <span>CID(s) / Diagnóstico(s) ({cidsList.length})</span>
                </span>
              </div>
              {cidsList.length > 0 ? (
                <div className="space-y-1.5 mt-2">
                  {cidsList.map((c, idx) => (
                    <div 
                      key={idx}
                      className="px-2.5 py-1.5 bg-white rounded-xl border border-blue-200 text-blue-950 font-bold text-xs shadow-sm flex items-center gap-2"
                    >
                      <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-800 text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="truncate">{c}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic mt-1">Não especificado</p>
              )}
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

              {/* Destaque de Protocolo para Cadeira Motorizada */}
              {hasMotorizada && (
                <div className="mt-3 pt-2.5 border-t border-indigo-200/60">
                  {statusMotorizada?.isCompativel ? (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 flex items-start gap-2 shadow-sm text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block text-emerald-900">
                          CID Compatível com Cadeira Motorizada
                        </span>
                        <span className="text-[11px] text-emerald-700">
                          Diagnóstico ({statusMotorizada.compativeis.join('; ')}) atende aos critérios oficiais de concessão.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 flex items-start gap-2 shadow-sm text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block text-amber-900">
                          CID Não Compatível c/ Cadeira Motorizada
                        </span>
                        <span className="text-[11px] text-amber-800">
                          {statusMotorizada?.totalCids > 0
                            ? 'O diagnóstico informado não consta no protocolo oficial de concessão.'
                            : 'Nenhum CID informado para validação do protocolo de concessão.'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Prontuário / Observações */}
          {(patient.observacoes || patient.prontuarioObservacoes) && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <FileText className="w-4 h-4 text-slate-500" />
                <span>Prontuário & Observações Clínicas</span>
              </div>
              <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
                {patient.observacoes || patient.prontuarioObservacoes}
              </p>
            </div>
          )}

          {/* Linha do Tempo: Prontuário Médico e Evoluções Clínicas */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-teal-600" />
                  <span>Prontuário Médico & Evoluções</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Registro de prontuários, atendimentos e condutas clínicas
                </p>
              </div>

              <button
                onClick={() => onOpenEvolutionModal(patient)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-sm transition hover:scale-[1.02]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Novo Prontuário Médico</span>
              </button>
            </div>

            {evolucoes.length === 0 ? (
              <div className="text-center py-10 px-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600">
                  Nenhum registro de prontuário médico adicionado para este paciente ainda.
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Clique no botão acima para registrar a primeira anotação no prontuário.
                </p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                {evolucoes.map((evo) => (
                  <div key={evo.id} className="relative group">
                    <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-teal-500 border-4 border-white shadow-sm" />

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2 hover:border-teal-200 transition">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-2">
                        <div className="flex items-center flex-wrap gap-1.5">
                          {evo.tipoRegistro && (
                            <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold uppercase rounded border border-slate-200">
                              {evo.tipoRegistro === 'OPM' ? 'Dispositivo OPM' : evo.tipoRegistro === 'Intelectual' ? 'Reab. Intelectual' : 'Evolução'}
                            </span>
                          )}
                          {evo.tipoAtendimento && (
                            <span className="inline-block px-2 py-0.5 bg-teal-50 text-teal-800 text-[11px] font-semibold rounded border border-teal-200">
                              {evo.tipoAtendimento}
                            </span>
                          )}
                          <span className="text-xs text-slate-600 font-semibold">
                            {formatarDataHoraBR(evo.dataHora || evo.data)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {evo.profissional && (
                            <span className="text-xs font-medium text-slate-700 flex items-center gap-1">
                              <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                              {evo.profissional}
                            </span>
                          )}
                          <button
                            onClick={() => {
                              if (confirm('Tem certeza que deseja excluir esta anotação do prontuário médico?')) {
                                onDeleteEvolution(patient.id, evo.id);
                              }
                            }}
                            className="text-slate-300 hover:text-red-500 p-1 rounded opacity-0 group-hover:opacity-100 transition"
                            title="Excluir anotação"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Caso 1: Dispositivos Deferidos (OPM) */}
                      {evo.dispositivosDeferidos && Array.isArray(evo.dispositivosDeferidos) && evo.dispositivosDeferidos.length > 0 ? (
                        <div className="bg-indigo-50/70 border border-indigo-200 p-3 rounded-xl space-y-2">
                          <strong className="text-indigo-950 text-xs font-bold flex items-center gap-1.5 uppercase tracking-wide">
                            <Accessibility className="w-4 h-4 text-indigo-600" />
                            Dispositivo(s) Deferido(s):
                          </strong>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {evo.dispositivosDeferidos.map((d, dIdx) => (
                              <div key={dIdx} className="bg-white border border-indigo-200/80 rounded-lg p-2.5 flex items-center justify-between shadow-xs">
                                <span className="font-bold text-xs text-slate-900 uppercase">
                                  {d.dispositivo}
                                </span>
                                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded border border-indigo-200">
                                  {formatarDataBR(d.data)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        evo.descricaoDispositivo && (
                          <div className="bg-indigo-50/70 border border-indigo-200 p-2.5 rounded-lg text-xs space-y-0.5">
                            <strong className="text-indigo-950 block font-bold flex items-center gap-1.5">
                              <Accessibility className="w-3.5 h-3.5 text-indigo-600" />
                              Descrição do Dispositivo:
                            </strong>
                            <p className="text-indigo-900 whitespace-pre-wrap font-medium">
                              {evo.descricaoDispositivo}
                            </p>
                          </div>
                        )
                      )}

                      {/* Caso 2: Categoria Intelectual (CER II ou CRTEA) */}
                      {evo.opcaoIntelectual && (
                        <div className="bg-purple-50/80 border border-purple-200 p-3 rounded-xl flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold shrink-0">
                            <Brain className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                              Encaminhamento / Modalidade:
                            </span>
                            <span className="text-sm font-black text-purple-950">
                              {evo.opcaoIntelectual === 'CRTEA' ? '(CRTEA) Centro de Referência em TEA' : 'CER II - Centro Especializado em Reabilitação'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Caso 3 / Texto da Evolução (apenas se não for OPM estruturado nem Intelectual) */}
                      {evo.descricao && !evo.dispositivosDeferidos && !evo.opcaoIntelectual && (
                        <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
                          {evo.descricao}
                        </p>
                      )}

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
