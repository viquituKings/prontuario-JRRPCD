import React from 'react';
import { formatarDataHoraBR } from '../types';

export default function PrintProntuario({ patient, onClose }) {
  if (!patient) return null;

  const evolucoes = patient.evolucoes || [];
  const servico = patient.servico_especializado || 'OPM';
  const opms = patient.opm_list || [];
  const dataEntrada = patient.data_entrada || patient.dataEntrada || '-';
  const dn = patient.dn || patient.dataNascimento || '-';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex flex-col items-center p-4">
      {/* Barra de controle no topo (não impressa) */}
      <div className="w-full max-w-4xl bg-slate-800 text-white p-3 rounded-t-xl flex items-center justify-between no-print shadow-lg">
        <span className="text-xs font-semibold">
          Visualização para Impressão / Salvar como PDF
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow transition"
          >
            🖨️ Imprimir Agora
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Documento A4 Formatado */}
      <div className="w-full max-w-4xl bg-white text-slate-900 p-8 sm:p-12 shadow-2xl rounded-b-xl border border-slate-200 min-h-[29.7cm] text-xs leading-normal">
        
        {/* Cabeçalho Institucional */}
        <div className="border-b-2 border-slate-900 pb-4 mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black tracking-wide text-slate-900 uppercase">
              GESTÃO JUNTA • PRONTUÁRIO & PROTOCOLO OPM
            </h1>
            <p className="text-[11px] text-slate-600 font-medium">
              Rede de Cuidados à Pessoa com Deficiência • Concessão de OPM e Reabilitação
            </p>
          </div>
          <div className="text-right text-[11px] text-slate-500">
            <div>Emissão: {new Date().toLocaleDateString('pt-BR')}</div>
            <div className="font-bold text-slate-800 uppercase">Ficha Cadastral e Evoluções</div>
          </div>
        </div>

        {/* Bloco 1: Dados de Identificação */}
        <div className="mb-5">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-300 pb-1 mb-2.5">
            1. Dados de Identificação do Paciente
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="col-span-2">
              <span className="text-slate-500 block text-[10px]">Nome do Paciente:</span>
              <strong className="text-sm font-bold text-slate-900">{patient.nome}</strong>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px]">Data de Entrada:</span>
              <strong className="text-slate-800">{dataEntrada}</strong>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px]">Serviço Especializado:</span>
              <span className="font-bold text-blue-800">{servico}</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px]">Data de Nascimento (DN):</span>
              <span className="text-slate-800 font-semibold">{dn}</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px]">Idade:</span>
              <strong className="text-slate-800">{patient.idade ? `${patient.idade} anos` : '-'}</strong>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px]">Telefone:</span>
              <span className="text-slate-800 font-semibold">{patient.telefone || '-'}</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px]">Município:</span>
              <span className="text-slate-800 font-semibold">{patient.municipio || '-'}</span>
            </div>

            <div className="col-span-2">
              <span className="text-slate-500 block text-[10px]">ESF de Referência:</span>
              <span className="text-slate-800">{patient.esf || patient.esfReferencia || '-'}</span>
            </div>

            <div className="col-span-2">
              <span className="text-slate-500 block text-[10px]">Remetente:</span>
              <span className="text-slate-800">{patient.remetente || '-'}</span>
            </div>
          </div>
        </div>

        {/* Bloco 2: Avaliação da Junta e Status */}
        <div className="mb-5">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-300 pb-1 mb-2.5">
            2. Informações de Avaliação da Junta e Protocolo
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-500 block text-[10px]">Avaliação da Junta:</span>
              <strong className="text-slate-800">{patient.avaliacao_junta || '-'}</strong>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px]">Data de Avaliação/Envio:</span>
              <span className="text-slate-800 font-semibold">{patient.data_avaliacao || '-'}</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px]">Presença:</span>
              <span className="font-bold text-slate-800">{patient.presenca || '-'}</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px]">Status / Data da Alta:</span>
              <span className="font-bold text-slate-800">
                {patient.status || '-'} {patient.data_alta ? `(Alta: ${patient.data_alta})` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Bloco 3: Diagnóstico e OPMs Solicitadas */}
        <div className="mb-5">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-300 pb-1 mb-2.5">
            3. Diagnóstico Clínico e OPMs Solicitadas
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-500 block font-semibold uppercase">CID / Diagnóstico:</span>
              <p className="text-xs font-bold text-slate-900 mt-0.5">{patient.cid || 'Não informado'}</p>
            </div>

            <div className="p-3 border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-500 block font-semibold uppercase">OPMs Solicitadas:</span>
              {opms.length > 0 ? (
                <div className="space-y-1 mt-1">
                  {opms.map((o, idx) => (
                    <div key={idx} className="text-xs font-bold text-slate-800">
                      • {o.tipo}: <span className="text-blue-800">{o.solicitada}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-bold text-slate-900 mt-0.5">{patient.tipoOpm || '-'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Bloco 4: Observações e Prontuário */}
        {(patient.observacoes || patient.prontuarioObservacoes) && (
          <div className="mb-5">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-300 pb-1 mb-1.5">
              4. Prontuário e Observações Adicionais
            </h2>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-800 whitespace-pre-wrap">
              {patient.observacoes || patient.prontuarioObservacoes}
            </div>
          </div>
        )}

        {/* Bloco 5: Histórico de Evoluções Clínicas */}
        <div className="mb-8">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-300 pb-1 mb-2.5">
            5. Histórico de Evoluções Clínicas ({evolucoes.length})
          </h2>

          {evolucoes.length === 0 ? (
            <p className="text-slate-500 italic p-3 text-xs">Nenhuma evolução registrada até o momento.</p>
          ) : (
            <div className="space-y-3">
              {evolucoes.map((evo, idx) => (
                <div key={evo.id || idx} className="border border-slate-300 rounded-lg p-3 space-y-1.5">
                  <div className="flex justify-between items-center text-[11px] border-b border-slate-200 pb-1 font-semibold text-slate-700">
                    <span>
                      {formatarDataHoraBR(evo.dataHora)} • <strong className="text-blue-800">{evo.tipoAtendimento}</strong>
                    </span>
                    <span>{evo.profissional}</span>
                  </div>

                  <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {evo.descricao}
                  </p>

                  {evo.conduta && (
                    <div className="text-[11px] bg-slate-50 p-2 rounded border border-slate-200 text-slate-700">
                      <strong>Conduta:</strong> {evo.conduta}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé com Assinaturas */}
        <div className="mt-12 pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <div className="border-t border-slate-400 mx-auto w-3/4 mb-1"></div>
            <span className="font-semibold text-slate-700 block">Assinatura do Paciente / Responsável</span>
            <span className="text-[10px] text-slate-500">Ciência e recebimento</span>
          </div>

          <div>
            <div className="border-t border-slate-400 mx-auto w-3/4 mb-1"></div>
            <span className="font-semibold text-slate-700 block">Carimbo e Assinatura do Profissional</span>
            <span className="text-[10px] text-slate-500">Equipe Multidisciplinar / Junta</span>
          </div>
        </div>

      </div>
    </div>
  );
}
