import React from 'react';
import { formatarDataBR, formatarDataHoraBR, STATUS_PACIENTE } from '../types';

export default function PrintProntuario({ patient, onClose }) {
  if (!patient) return null;

  const statusConfig = STATUS_PACIENTE.find((s) => s.id === patient.status) || STATUS_PACIENTE[0];
  const evolucoes = patient.evolucoes || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex flex-col items-center p-4">
      {/* Barra de controle no topo (não impressa) */}
      <div className="w-full max-w-4xl bg-slate-800 text-white p-3 rounded-t-xl flex items-center justify-between no-print shadow-lg">
        <span className="text-sm font-semibold">
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
      <div className="w-full max-w-4xl bg-white text-slate-900 p-8 sm:p-12 shadow-2xl rounded-b-xl border border-slate-200 min-h-[29.7cm] text-sm leading-normal">
        
        {/* Cabeçalho Institucional */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
              JRRPCD - Prontuário Clínico & OPM
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              Rede de Cuidados à Pessoa com Deficiência • Concessão e Adaptação de OPM
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div>Data de Emissão: {new Date().toLocaleDateString('pt-BR')}</div>
            <div className="font-semibold text-slate-800">Prontuário Individual</div>
          </div>
        </div>

        {/* Bloco 1: Dados Cadastrais */}
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-300 pb-1 mb-3">
            1. Dados de Identificação do Paciente
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
            <div className="col-span-2">
              <span className="text-slate-500 block">Nome Completo:</span>
              <strong className="text-sm font-bold text-slate-900">{patient.nome}</strong>
            </div>

            <div>
              <span className="text-slate-500 block">Data de Entrada:</span>
              <strong className="text-slate-800">{formatarDataBR(patient.dataEntrada)}</strong>
            </div>

            <div>
              <span className="text-slate-500 block">Status:</span>
              <span className="font-bold text-slate-800">{statusConfig.label}</span>
            </div>

            <div>
              <span className="text-slate-500 block">Data de Nascimento:</span>
              <span className="text-slate-800">{formatarDataBR(patient.dataNascimento)}</span>
            </div>

            <div>
              <span className="text-slate-500 block">Idade:</span>
              <strong className="text-slate-800">{patient.idade || '-'}</strong>
            </div>

            <div>
              <span className="text-slate-500 block">Telefone:</span>
              <span className="text-slate-800">{patient.telefone || '-'}</span>
            </div>

            <div>
              <span className="text-slate-500 block">Município:</span>
              <span className="text-slate-800">{patient.municipio || '-'}</span>
            </div>

            <div className="col-span-2">
              <span className="text-slate-500 block">ESF de Referência:</span>
              <span className="text-slate-800">{patient.esfReferencia || '-'}</span>
            </div>
          </div>
        </div>

        {/* Bloco 2: Diagnóstico e OPM */}
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-300 pb-1 mb-3">
            2. Diagnóstico Clínico e OPM
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 border border-slate-200 rounded-lg">
              <span className="text-xs text-slate-500 block font-medium">CID / Impressão Diagnóstica:</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{patient.cid || 'Não informado'}</p>
            </div>

            <div className="p-3 border border-slate-200 rounded-lg">
              <span className="text-xs text-slate-500 block font-medium">Tipo de OPM:</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{patient.tipoOpm || 'Não especificado'}</p>
            </div>
          </div>
        </div>

        {/* Bloco 3: Observações Iniciais */}
        {patient.prontuarioObservacoes && (
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-300 pb-1 mb-2">
              3. Histórico / Prontuário Inicial
            </h2>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-800 whitespace-pre-wrap">
              {patient.prontuarioObservacoes}
            </div>
          </div>
        )}

        {/* Bloco 4: Histórico de Evoluções */}
        <div className="mb-10">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-300 pb-1 mb-3">
            4. Histórico de Evoluções Clínicas ({evolucoes.length})
          </h2>

          {evolucoes.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-3">Nenhuma evolução registrada até o momento.</p>
          ) : (
            <div className="space-y-4">
              {evolucoes.map((evo, idx) => (
                <div key={evo.id || idx} className="border border-slate-300 rounded-lg p-3.5 space-y-2">
                  <div className="flex justify-between items-center text-xs border-b border-slate-200 pb-1 font-semibold text-slate-700">
                    <span>
                      {formatarDataHoraBR(evo.dataHora)} • <span className="text-blue-700 font-bold">{evo.tipoAtendimento}</span>
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

        {/* Rodapé com espaço para carimbo e assinatura */}
        <div className="mt-16 pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <div className="border-t border-slate-400 mx-auto w-3/4 mb-1"></div>
            <span className="font-semibold text-slate-700 block">Assinatura do Paciente / Responsável</span>
            <span className="text-[10px] text-slate-500">Ciência dos atendimentos</span>
          </div>

          <div>
            <div className="border-t border-slate-400 mx-auto w-3/4 mb-1"></div>
            <span className="font-semibold text-slate-700 block">Carimbo e Assinatura do Profissional</span>
            <span className="text-[10px] text-slate-500">Responsável pelo Atendimento</span>
          </div>
        </div>

      </div>
    </div>
  );
}
