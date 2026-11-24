import React, { useEffect, useRef, useState } from 'react';
import { Printer, Download, ExternalLink, X, FileText, Loader2 } from 'lucide-react';
import { gerarProntuarioPdf } from '../pdfGenerator';

export default function PrintProntuario({ patient, onClose }) {
  const iframeRef = useRef(null);
  const docRef = useRef(null);
  const autoPrintedRef = useRef(false);

  const [pdfUrl, setPdfUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!patient) return;

    let active = true;
    let objectUrl = null;
    autoPrintedRef.current = false;

    async function buildPdf() {
      try {
        setIsGenerating(true);
        setErrorMsg('');
        const doc = await gerarProntuarioPdf(patient);
        if (!active) return;

        docRef.current = doc;
        const blob = doc.output('blob');
        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
      } catch (err) {
        console.error('Erro ao gerar PDF do prontuário:', err);
        if (active) {
          setErrorMsg('Não foi possível gerar o PDF do prontuário.');
        }
      } finally {
        if (active) {
          setIsGenerating(false);
        }
      }
    }

    buildPdf();

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [patient]);

  if (!patient) return null;

  const handlePrintPdf = () => {
    try {
      const iframe = iframeRef.current;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        return;
      }
    } catch (err) {
      console.warn('Falha ao acionar impressão direta no iframe, abrindo em nova aba:', err);
    }

    if (pdfUrl) {
      window.open(pdfUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownloadPdf = () => {
    if (!docRef.current) return;
    const safeName = (patient.nome || 'paciente')
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, '_')
      .replace(/^_|_$/g, '');
    docRef.current.save(`prontuario_${safeName}.pdf`);
  };

  const handleIframeLoad = () => {
    if (autoPrintedRef.current) return;
    autoPrintedRef.current = true;
    setTimeout(() => {
      handlePrintPdf();
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/85 backdrop-blur-sm flex flex-col items-center p-2 sm:p-4 no-print">
      {/* Barra de controle do PDF */}
      <div className="w-full max-w-5xl bg-slate-900 text-white px-4 py-3 rounded-t-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white leading-tight">
              Relatório PDF do Prontuário — {patient.nome}
            </h3>
            <p className="text-[11px] text-slate-400">
              Documento A4 estruturado com todas as atualizações e sem cabeçalhos do navegador
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePrintPdf}
            disabled={!pdfUrl || isGenerating}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir PDF</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={!pdfUrl || isGenerating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar PDF</span>
          </button>

          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
              title="Abrir PDF em nova aba"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nova Aba</span>
            </a>
          )}

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
          >
            <X className="w-3.5 h-3.5" />
            <span>Fechar</span>
          </button>
        </div>
      </div>

      {/* Área de visualização do PDF */}
      <div className="w-full max-w-5xl flex-1 bg-slate-800 border-x border-b border-slate-700 rounded-b-2xl overflow-hidden flex items-center justify-center">
        {isGenerating ? (
          <div className="flex flex-col items-center gap-3 text-slate-300 text-xs p-8">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            <span>Gerando PDF estruturado com todas as atualizações do prontuário...</span>
          </div>
        ) : errorMsg ? (
          <div className="text-rose-300 text-xs p-8 text-center">{errorMsg}</div>
        ) : (
          <iframe
            ref={iframeRef}
            src={pdfUrl}
            onLoad={handleIframeLoad}
            title={`Prontuário PDF - ${patient.nome}`}
            className="w-full h-full min-h-[75vh] bg-white"
          />
        )}
      </div>
    </div>
  );
}
