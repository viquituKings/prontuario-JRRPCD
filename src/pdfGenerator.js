import { jsPDF } from 'jspdf';
import {
  formatarDataHoraBR,
  formatarDataBR,
  isMotorizadaSolicitada,
  verificarCompatibilidadeMotorizada,
  temOpmSolicitada,
  extrairDispositivosDeferidos,
  getLabelIdentificacaoEvolucao
} from './types';

function loadLogoDataUrl() {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.9));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = '/logo.jpg';
    } catch {
      resolve(null);
    }
  });
}

function extrairTextoObservacao(evo) {
  let obsTexto = (evo.observacao || '').trim();
  const descTexto = (typeof evo.descricao === 'string' ? evo.descricao : '').trim();
  if (!obsTexto && descTexto.includes('Observação:')) {
    obsTexto = descTexto.split('Observação:')[1]?.trim() || '';
  }
  if (
    !obsTexto &&
    descTexto &&
    !evo.opcaoIntelectual &&
    !descTexto.startsWith('Dispositivo(s) Deferido(s):') &&
    extrairDispositivosDeferidos(evo).length === 0
  ) {
    obsTexto = descTexto;
  }
  return obsTexto;
}

/**
 * Gera um documento PDF A4 estruturado com todos os dados e atualizações do prontuário
 */
export async function gerarProntuarioPdf(patient) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const logoDataUrl = await loadLogoDataUrl();
  const dataEmissao = new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const ensureSpace = (neededHeight) => {
    if (y + neededHeight > pageHeight - 18) {
      doc.addPage();
      y = margin;
    }
  };

  const drawSectionTitle = (title) => {
    ensureSpace(10);
    doc.setFillColor(241, 245, 249); // slate-100
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.roundedRect(margin, y, contentWidth, 7, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(title.toUpperCase(), margin + 3, y + 4.8);
    y += 10;
  };

  const drawWrappedText = (text, x, maxWidth, fontSize = 9, style = 'normal', color = [30, 41, 59], lineHeight = 4.3) => {
    if (!text) return;
    doc.setFont('helvetica', style);
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(String(text), maxWidth);
    for (const line of lines) {
      ensureSpace(lineHeight + 1);
      doc.text(line, x, y);
      y += lineHeight;
    }
  };

  // ==========================================
  // CABEÇALHO INSTITUCIONAL
  // ==========================================
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'JPEG', margin, y, 14, 14);
    } catch {
      // ignora erro de imagem
    }
  }

  const titleX = logoDataUrl ? margin + 18 : margin;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('JRRPCD • PRONTUÁRIO CLÍNICO & GESTÃO DE OPM', titleX, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Rede de Cuidados à Pessoa com Deficiência • Reabilitação e Tecnologia Assistiva', titleX, y + 10.5);

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Emitido em: ${dataEmissao}`, pageWidth - margin, y + 5.5, { align: 'right' });

  y += 17;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setLineWidth(0.2);
  y += 5;

  // ==========================================
  // FAIXA DE ARQUIVO MORTO (SE APLICÁVEL)
  // ==========================================
  const isArchived = Boolean(patient.dataSaida || patient.arquivadoEm || patient.origem);
  if (isArchived) {
    ensureSpace(16);
    doc.setFillColor(254, 243, 199); // amber-100
    doc.setDrawColor(217, 119, 6); // amber-600
    const obsArq = patient.observacoes && patient.observacoes !== patient.prontuarioObservacoes ? patient.observacoes : '';
    const arqLines = [
      `REGISTRO EM ARQUIVO MORTO • Data de Saída: ${patient.dataSaida || '-'}${patient.pasta ? ` • Pasta Física: ${patient.pasta}` : ''}`
    ];
    if (obsArq) {
      arqLines.push(`Motivo / Observações do Arquivo: ${obsArq}`);
    }
    const boxH = 5 + arqLines.length * 4.5;
    doc.roundedRect(margin, y, contentWidth, boxH, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(146, 64, 14);
    let innerY = y + 5;
    arqLines.forEach((line, idx) => {
      doc.setFont('helvetica', idx === 0 ? 'bold' : 'normal');
      const wrapped = doc.splitTextToSize(line, contentWidth - 6);
      doc.text(wrapped[0] || '', margin + 3, innerY);
      innerY += 4.5;
    });
    y += boxH + 4;
  }

  // ==========================================
  // IDENTIFICAÇÃO DO PACIENTE
  // ==========================================
  drawSectionTitle('Identificação do Paciente');

  const telefonesTexto = Array.isArray(patient.telefones) && patient.telefones.length > 0
    ? patient.telefones.join(' / ')
    : patient.telefone || 'Não informado';

  const servicosTexto = Array.isArray(patient.servicos) && patient.servicos.length > 0
    ? patient.servicos.join(', ')
    : patient.servico_especializado || 'OPM';

  const col1X = margin;
  const col2X = margin + contentWidth / 2 + 2;
  const colW = contentWidth / 2 - 4;

  const drawField = (label, value, x, yPos, maxW) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(label.toUpperCase(), x, yPos);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    const lines = doc.splitTextToSize(String(value || '-'), maxW);
    doc.text(lines, x, yPos + 4);
    return lines.length * 4.2 + 5;
  };

  ensureSpace(32);
  let h1 = drawField('Nome Completo do Paciente', patient.nome || '-', col1X, y, colW);
  let h2 = drawField('Data de Entrada', patient.data_entrada || patient.dataEntrada || '-', col2X, y, colW);
  y += Math.max(h1, h2);

  ensureSpace(14);
  h1 = drawField(
    'Data de Nascimento / Idade',
    `${patient.dn || patient.dataNascimento || '-'}${patient.idade ? ` (${patient.idade} anos)` : ''}`,
    col1X,
    y,
    colW
  );
  h2 = drawField('CPF', patient.cpf || 'Não informado', col2X, y, colW);
  y += Math.max(h1, h2);

  ensureSpace(14);
  h1 = drawField('Nome da Mãe', patient.nome_mae || patient.nomeMae || 'Não informado', col1X, y, colW);
  h2 = drawField('Telefone(s) / Contato', telefonesTexto, col2X, y, colW);
  y += Math.max(h1, h2);

  ensureSpace(14);
  h1 = drawField(
    'Município / ESF de Referência',
    `${patient.municipio || '-'}${patient.esf || patient.esfReferencia ? ` • ${patient.esf || patient.esfReferencia}` : ''}`,
    col1X,
    y,
    colW
  );
  h2 = drawField('Serviço(s) Especializado(s)', servicosTexto, col2X, y, colW);
  y += Math.max(h1, h2) + 2;

  // ==========================================
  // DIAGNÓSTICO (CIDs) & OPMs SOLICITADAS
  // ==========================================
  const cidsList =
    Array.isArray(patient.cid_list) && patient.cid_list.length > 0
      ? patient.cid_list
      : patient.cid
        ? patient.cid.split(';').map((c) => c.trim()).filter(Boolean)
        : [];

  const opms = Array.isArray(patient.opm_list) ? patient.opm_list : [];
  const hasMotorizada = isMotorizadaSolicitada(opms, patient.tipoOpm);
  const statusMotorizada = hasMotorizada ? verificarCompatibilidadeMotorizada(cidsList) : null;

  drawSectionTitle('Diagnósticos (CIDs) & OPMs Solicitadas');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 64, 175);
  ensureSpace(8);
  doc.text('CIDs / Diagnósticos:', margin, y);
  y += 4.2;
  if (cidsList.length === 0) {
    drawWrappedText('Nenhum CID informado.', margin, contentWidth, 8.5, 'normal', [100, 116, 139]);
  } else {
    for (const cidItem of cidsList) {
      drawWrappedText(`• ${cidItem}`, margin + 2, contentWidth - 4, 8.5, 'normal', [15, 23, 42]);
    }
  }
  y += 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 64, 175);
  ensureSpace(8);
  doc.text('OPMs Solicitadas:', margin, y);
  y += 4.2;
  if (opms.length > 0) {
    for (const o of opms) {
      const textoOpm = `• ${o.tipo || 'OPM'}: ${o.solicitada || '-'}${o.data ? ` (Data: ${o.data})` : ''}`;
      drawWrappedText(textoOpm, margin + 2, contentWidth - 4, 8.5, 'normal', [15, 23, 42]);
    }
  } else if (temOpmSolicitada(patient) && patient.tipoOpm) {
    drawWrappedText(`• ${patient.tipoOpm}`, margin + 2, contentWidth - 4, 8.5, 'normal', [15, 23, 42]);
  } else {
    drawWrappedText('Nenhuma OPM solicitada neste cadastro.', margin + 2, contentWidth - 4, 8.5, 'normal', [100, 116, 139]);
  }

  if (hasMotorizada) {
    y += 1;
    const msgMoto = statusMotorizada?.isCompativel
      ? `Protocolo Cadeira Motorizada: COMPATÍVEL (${statusMotorizada.compativeis.join('; ')})`
      : 'Protocolo Cadeira Motorizada: CID NÃO COMPATÍVEL COM O PROTOCOLO SUS';
    drawWrappedText(
      msgMoto,
      margin + 2,
      contentWidth - 4,
      8.5,
      'bold',
      statusMotorizada?.isCompativel ? [5, 150, 105] : [180, 83, 9]
    );
  }
  y += 3;

  // ==========================================
  // OBSERVAÇÕES DO CADASTRO
  // ==========================================
  const obsCadastro = isArchived
    ? patient.prontuarioObservacoes || ''
    : patient.observacoes || patient.prontuarioObservacoes || '';

  if (obsCadastro) {
    drawSectionTitle('Observações Clínicas do Cadastro');
    drawWrappedText(obsCadastro, margin + 1, contentWidth - 2, 8.8, 'normal', [30, 41, 59]);
    y += 3;
  }

  // ==========================================
  // HISTÓRICO DE PRONTUÁRIO & EVOLUÇÕES
  // ==========================================
  const evolucoes = Array.isArray(patient.evolucoes) ? patient.evolucoes : [];
  drawSectionTitle(`Prontuário & Atualizações Clínicas (${evolucoes.length})`);

  if (evolucoes.length === 0) {
    drawWrappedText(
      'Nenhuma atualização ou evolução clínica registrada até o momento.',
      margin + 1,
      contentWidth - 2,
      8.8,
      'italic',
      [100, 116, 139]
    );
    y += 3;
  } else {
    for (let i = 0; i < evolucoes.length; i++) {
      const evo = evolucoes[i];
      ensureSpace(22);

      // Cabeçalho da evolução
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, 6.5, 1, 1, 'FD');

      const tipoReg = getLabelIdentificacaoEvolucao(evo);
      const dataEvo = formatarDataBR(evo.data || evo.dataHora);
      const cabecalhoEsq = `${i + 1}. ${tipoReg}${evo.tipoAtendimento ? ` • ${evo.tipoAtendimento}` : ''}`;
      const cabecalhoDir = `${dataEvo}${evo.profissional ? ` • Prof.: ${evo.profissional}` : ''}`;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(cabecalhoEsq, margin + 2.5, y + 4.4);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(cabecalhoDir, pageWidth - margin - 2.5, y + 4.4, { align: 'right' });

      y += 8.5;

      // Registrado por
      if (evo.criadoPorNome || evo.criadoPor) {
        drawWrappedText(
          `Registrado por: ${evo.criadoPorNome || evo.criadoPor}`,
          margin + 2,
          contentWidth - 4,
          7.5,
          'italic',
          [100, 116, 139],
          3.8
        );
      }

      // Dispositivos Deferidos
      const dispositivos = extrairDispositivosDeferidos(evo);
      if (dispositivos.length > 0) {
        drawWrappedText('Dispositivo(s) Deferido(s):', margin + 2, contentWidth - 4, 8, 'bold', [5, 150, 105], 4);
        for (const d of dispositivos) {
          drawWrappedText(
            `• ${d.dispositivo}${d.data ? ` (Deferido em: ${d.data})` : ''}`,
            margin + 4,
            contentWidth - 6,
            8.3,
            'normal',
            [15, 23, 42],
            4
          );
        }
      }

      // Opção Intelectual
      if (evo.opcaoIntelectual) {
        drawWrappedText(
          `Modalidade Reab. Intelectual: ${evo.opcaoIntelectual}${evo.data ? ` (Data: ${formatarDataBR(evo.data)})` : ''}`,
          margin + 2,
          contentWidth - 4,
          8.3,
          'bold',
          [109, 40, 217],
          4.2
        );
      }

      // Observação
      const obsTexto = extrairTextoObservacao(evo);
      if (obsTexto) {
        drawWrappedText(`Observação: ${obsTexto}`, margin + 2, contentWidth - 4, 8.5, 'normal', [30, 41, 59], 4.2);
      }

      // Conduta
      if (evo.conduta) {
        drawWrappedText(`Conduta / Orientações: ${evo.conduta}`, margin + 2, contentWidth - 4, 8.3, 'normal', [51, 65, 85], 4.2);
      }

      y += 3;
    }
  }

  // ==========================================
  // CARIMBO DE AUDITORIA E ASSINATURA
  // ==========================================
  ensureSpace(26);
  y += 4;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  if (patient.criadoPor || patient.atualizadoPor) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    const criadoTxt = `Cadastrado por: ${patient.criadoPorNome || patient.criadoPor || 'Sistema'} em ${formatarDataHoraBR(patient.criadoEm || patient.createdAt)}`;
    const attTxt = `Última alteração: ${patient.atualizadoPorNome || patient.atualizadoPor || 'Sistema'} em ${formatarDataHoraBR(patient.atualizadoEm || patient.updatedAt)}`;
    doc.text(criadoTxt, margin, y);
    y += 3.8;
    doc.text(attTxt, margin, y);
    y += 10;
  } else {
    y += 8;
  }

  // Linha de assinatura
  ensureSpace(16);
  const sigWidth = 80;
  const sigX = (pageWidth - sigWidth) / 2;
  doc.setDrawColor(71, 85, 105);
  doc.line(sigX, y, sigX + sigWidth, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Assinatura e Carimbo do Profissional Responsável', pageWidth / 2, y + 4.5, { align: 'center' });

  // ==========================================
  // RODAPÉ PAGINADO EM TODAS AS PÁGINAS
  // ==========================================
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Prontuário JRRPCD • ${patient.nome || ''}`,
      margin,
      pageHeight - 8
    );
    doc.text(
      `Página ${p} de ${totalPages}`,
      pageWidth - margin,
      pageHeight - 8,
      { align: 'right' }
    );
  }

  return doc;
}
