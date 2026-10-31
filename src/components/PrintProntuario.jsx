import React from 'react';
import { 
  formatarDataHoraBR,
  isMotorizadaSolicitada,
  verificarCompatibilidadeMotorizada
} from '../types';

export default function PrintProntuario({ patient, onClose }) {
  if (!patient) return null;

  const evolucoes = patient.evolucoes || [];
  const servico = patient.servico_especializado || 'OPM';
  const opms = patient.opm_list || [];
  const dataEntrada = patient.data_entrada || patient.dataEntrada || '-';
  const dn = patient.dn || patient.dataNascimento || '-';
  const nomeMae = patient.nome_mae || patient.nomeMae || '-';
  const cidsList = patient.cid_list && patient.cid_list.length > 0
    ? patient.cid_list
    : patient.cid
    ? patient.cid.split(';').map((c) => c.trim()).filter(Boolean)
    : [];

  const hasMotorizada = isMotorizadaSolicitada(opms, patient.tipoOpm);
  const statusMotorizada = hasMotorizada ? verificarCompatibilidadeMotorizada(cidsList) : null;

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
              JRRPCD • PRONTUÁRIO CLÍNICO & GESTÃO DE OPM
            </h1>
            <p className="text-[11px] text-slate-600 font-medium">
              Rede de Cuidados à Pessoa com Deficiência • Reabilitação e Tecnologia Assistiva
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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div className="col-span-2">
              <span className="text-slate-500 block text-[10px]">Nome do Paciente:</span>
              <strong className="text-sm font-bold text-slate-900">{patient.nome}</strong>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px]">CPF:</span>
              <span className="text-slate-800 font-mono font-bold">{patient.cpf || 'Não informado'}</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px]">Data de Entrada:</span>
              <strong className="text-slate-800">{dataEntrada}</strong>
            </div>

            <div className="col-span-2">
              <span className="text-slate-500 block text-[10px]">Nome da Mãe:</span>
              <strong className="text-slate-800">{nomeMae}</strong>
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

            <div>
              <span className="text-slate-500 block text-[10px]">ESF de Referência:</span>
              <span className="text-slate-800">{patient.esf || patient.esfReferencia || '-'}</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px]">Serviço Especializado:</span>
              <span className="font-bold text-blue-800">{servico}</span>
            </div>
          </div>
        </div>

        {/* Bloco 2: Diagnóstico e OPMs Solicitadas */}
        <div className="mb-5">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-300 pb-1 mb-2.5">
            2. Diagnóstico Clínico e OPMs Solicitadas
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-500 block font-semibold uppercase">CID(s) / Diagnóstico(s):</span>
              {cidsList.length > 0 ? (
                <div className="space-y-1 mt-1">
                  {cidsList.map((c, idx) => (
                    <div key={idx} className="text-xs font-bold text-slate-900">
                      • {c}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-bold text-slate-900 mt-0.5">{patient.cid || 'Não informado'}</p>
              )}
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

          {/* Avaliação de Protocolo para Cadeira Motorizada */}
          {hasMotorizada && (
            <div className="mt-2.5 p-2.5 rounded-lg border text-xs flex items-center justify-between">
              <div>
                <span className="font-bold uppercase tracking-wider text-[11px] block">
                  Avaliação de Protocolo • Cadeira de Rodas Motorizada
                </span>
                <span className="text-slate-600 text-[11px]">
                  {statusMotorizada?.isCompativel
                    ? `Patologia compatível pelo protocolo oficial: ${statusMotorizada.compativeis.join('; ')}`
                    : 'CID(s) cadastrado(s) não constam na relação de patologias compatíveis do protocolo oficial.'}
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded font-black text-[10px] uppercase tracking-wider border ${
                statusMotorizada?.isCompativel
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}>
                {statusMotorizada?.isCompativel ? '✓ Protocolo Compatível' : '⚠ Não Compatível'}
              </span>
            </div>
          )}
        </div>

        {/* Bloco 3: Observações e Prontuário */}
        {(patient.observacoes || patient.prontuarioObservacoes) && (
          <div className="mb-5">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-300 pb-1 mb-1.5">
              3. Prontuário e Observações Clínicas
            </h2>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-800 whitespace-pre-wrap">
              {patient.observacoes || patient.prontuarioObservacoes}
            </div>
          </div>
        )}

        {/* Bloco 4: Histórico de Evoluções Clínicas */}
        <div className="mb-8">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-300 pb-1 mb-2.5">
            4. Histórico de Evoluções Clínicas ({evolucoes.length})
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
            <span className="text-[10px] text-slate-500">Equipe Multidisciplinar</span>
          </div>
        </div>

      </div>
    </div>
  );
}
