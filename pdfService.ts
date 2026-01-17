
import { jsPDF } from "jspdf";
import { Client, UserSettings } from "./types";

/**
 * Generates professional legal PDFs with Luxury Branding (Black & Gold).
 */
export const generateClientPDF = (type: 'contract' | 'procuration' | 'declaration', client: Client, settings: UserSettings) => {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 25; // Margem padrão (2,5 cm)
  const contentWidth = pageWidth - (margin * 2);
  let y = 15;

  // --- CABEÇALHO LUXURY (Preto e Ouro) ---
  const headerHeight = 35;
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');
  doc.setFillColor(245, 158, 11);
  doc.rect(0, headerHeight - 1, pageWidth, 1, 'F');

  if (settings.logo && settings.logo.startsWith('data:image')) {
    try {
      const format = settings.logo.split(';')[0].split('/')[1].toUpperCase();
      const imgProps = doc.getImageProperties(settings.logo);
      const logoRatio = imgProps.width / imgProps.height;
      const maxH = 22;
      const maxW = 70;
      let logoW = maxW;
      let logoH = logoW / logoRatio;
      if (logoH > maxH) {
        logoH = maxH;
        logoW = logoH * logoRatio;
      }
      const centerY = 5 + (maxH - logoH) / 2;
      doc.addImage(settings.logo, format, margin, centerY, logoW, logoH, undefined, 'FAST');
    } catch (e) {
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text(settings.name || "ADVOGADO", margin, headerHeight - 15);
    }
  } else {
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(settings.name || "ADVOGADO", margin, headerHeight - 15);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(settings.role || "ADVOCACIA", margin, headerHeight - 10);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  const addr = settings.address || '';
  doc.text(addr.toUpperCase(), pageWidth - margin, headerHeight - 18, { align: 'right' });
  doc.text(`OAB: ${settings.oab || '...'} | ${settings.email || '...'}`, pageWidth - margin, headerHeight - 13, { align: 'right' });

  y = headerHeight + 25;
  doc.setTextColor(30, 41, 59);

  // Título do Documento
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  let title = "";
  let fileLabel = "";

  if (type === 'procuration') {
    title = "PROCURAÇÃO";
    fileLabel = "PROCURACAO";
  } else if (type === 'contract') {
    title = "CONTRATO DE PRESTAÇÃO DE SERVIÇOS JURÍDICOS";
    fileLabel = "CONTRATO_HONORARIOS";
  } else if (type === 'declaration') {
    title = "DECLARAÇÃO DE HIPOSSUFICIÊNCIA";
    fileLabel = "DECLARACAO";
  }

  doc.text(title, pageWidth / 2, y, { align: "center" });

  y += 3;
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.8);
  doc.line(pageWidth / 2 - 20, y, pageWidth / 2 + 20, y);
  y += 20;

  // Função para construir a qualificação completa padrão
  const getFullQualification = (c: Client) => {
    return `${c.name.toUpperCase()}, ${c.nationality || 'brasileiro(a)'}, ${c.maritalStatus || 'solteiro(a)'}, ${c.profession || 'profissional'}, portador(a) do RG nº ${c.rg || '...'} ${c.rgIssuingBody ? `(${c.rgIssuingBody})` : ''} e inscrito(a) no CPF sob o nº ${c.cpf_cnpj}, endereço eletrônico ${c.email || 'não informado'}, residente e domiciliado(a) na ${c.address || '...'}, nº ${c.addressNumber || ''}, ${c.neighborhood || ''}, na cidade de ${c.city || '...'} - ${c.state || '...'}, CEP: ${c.zipCode || '...'}`;
  };

  const drawSection = (label: string | null, content: string, startY: number) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);

    if (label) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin - 1, startY - 4, contentWidth + 2, 6, 'F');
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(180, 83, 9);
      doc.text(label.toUpperCase(), margin, startY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      startY += 10;
    }

    doc.text(content, margin, startY, {
      align: 'justify',
      lineHeightFactor: 1.5,
      maxWidth: contentWidth
    });

    const splitContent = doc.splitTextToSize(content, contentWidth);
    return startY + (splitContent.length * (11 * 0.3527 * 1.5)) + 10;
  };

  if (type === 'procuration') {
    const outorganteInfo = `${getFullQualification(client)}.`;
    y = drawSection("Outorgante", outorganteInfo, y);
    const outorgadoInfo = `${settings.name.toUpperCase()}, brasileiro, advogado devidamente inscrito nos quadros da Ordem dos Advogados do Brasil, sob o nº ${settings.oab}, e inscrito no CPF sob o nº ${settings.cpf}, com escritório profissional localizado à ${settings.address}.`;
    y = drawSection("Outorgado", outorgadoInfo, y);
    const poderesText = "Pelo presente instrumento, o outorgante nomeia e constitui o outorgado seu procurador, a quem confere os amplos poderes contidos na cláusula 'ad judicia et extra', para o foro em geral, em qualquer Instância, Tribunal ou Juízo, bem como os poderes especiais para transigir, desistir, firmar compromissos, receber e dar quitação, reconhecer procedência de pedido, renunciar a direito sobre o qual se funda a ação, e praticar todos os demais atos necessários ao bom e fiel desempenho deste mandato, inclusive substabelecer, com ou sem reserva de poderes.";
    y = drawSection("Poderes", poderesText, y);
  } else if (type === 'contract') {
    const contratanteInfo = `${getFullQualification(client)}, doravante denominado CONTRATANTE.`;
    y = drawSection("Contratante", contratanteInfo, y);
    const contratadoInfo = `${settings.name.toUpperCase()}, OAB ${settings.oab}, com endereço profissional à ${settings.address}, doravante denominado CONTRATADO.`;
    y = drawSection("Contratado", contratadoInfo, y);
    const honorariosText = `Pelos serviços ora pactuados, o CONTRATANTE pagará ao CONTRATADO o valor total de R$ ${client.financials?.totalAgreed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, sendo R$ ${client.financials?.initialPayment?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'} pago a título de entrada/sinal no ato da assinatura.`;
    y = drawSection("Dos Honorários", honorariosText, y);
  } else if (type === 'declaration') {
    const rendaStr = client.monthlyIncome ? client.monthlyIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00';
    const declarationText = `${getFullQualification(client)}, declara, sob as penas da lei, e nos termos do artigo 1º da Lei 7.115 de 29.08.1983 e artigos 2º e 4º da Lei 1.060 de 05.01.1950 que é pessoa pobre no sentido legal do termo, não tendo condições de prover as despesas do processo sem privar-se dos recursos indispensáveis ao próprio sustento e de sua família, estando percebendo a quantia de R$ ${rendaStr} mensais.\n\nResponsabiliza-se o(a) infra-assinado(a) pelo teor da presente declaração, ciente de que poderá se sujeitar as sanções civis e criminais no caso de não ser a presente declaração verdadeira.\n\nPara maior clareza e os devidos fins de Direito, firma-se a presente Declaração.`;

    y = drawSection(null, declarationText, y);
  }

  // --- RODAPÉ ---
  y += 20;
  if (y > pageHeight - 60) { doc.addPage(); y = 40; }

  const dataExtenso = `${client.city || 'Sertãozinho'}, ${new Date().getDate()} de ${new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date())} de ${new Date().getFullYear()}.`;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(dataExtenso, pageWidth / 2, y, { align: "center" });

  y += 35;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(pageWidth / 2 - 45, y, pageWidth / 2 + 45, y);

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("REQUERENTE", pageWidth / 2, y, { align: "center" });

  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(client.name.toUpperCase(), pageWidth / 2, y, { align: "center" });

  const fileName = `${fileLabel}_${client.name.replace(/\s/g, '_')}.pdf`;
  doc.save(fileName);
};

export const generateFinancialReport = (clients: Client[], settings: UserSettings) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = 15;

  const headerHeight = 30;
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');
  doc.setFillColor(245, 158, 11);
  doc.rect(0, headerHeight - 1, pageWidth, 1, 'F');

  if (settings.logo && settings.logo.startsWith('data:image')) {
    try {
      const format = settings.logo.split(';')[0].split('/')[1].toUpperCase();
      const imgProps = doc.getImageProperties(settings.logo);
      const logoRatio = imgProps.width / imgProps.height;
      const maxH = 18;
      const maxW = 50;
      let logoW = maxW;
      let logoH = logoW / logoRatio;
      if (logoH > maxH) {
        logoH = maxH;
        logoW = logoH * logoRatio;
      }
      const centerY = 5 + (maxH - logoH) / 2;
      doc.addImage(settings.logo, format, margin, centerY, logoW, logoH, undefined, 'FAST');
    } catch (e) {
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(settings.name?.toUpperCase() || "RELATÓRIO JURÍDICO", margin, 18);
    }
  } else {
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(settings.name?.toUpperCase() || "RELATÓRIO JURÍDICO", margin, 18);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(`RELATÓRIO FINANCEIRO GERADO EM ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - margin, 18, { align: 'right' });

  y = headerHeight + 20;

  // --- CÁLCULOS ---
  let totalAgreed = 0;
  let totalPaid = 0;
  let totalPending = 0;
  const areaGroups: Record<string, { count: number; value: number }> = {};

  clients.forEach(c => {
    const agreed = c.financials?.totalAgreed || 0;
    const initial = (c.financials?.initialPaymentStatus === 'paid') ? (c.financials?.initialPayment || 0) : 0;

    // Installments paid
    const instPaid = (c.financials?.installments || [])
      .filter(i => i.status === 'paid')
      .reduce((acc, curr) => acc + curr.value, 0);

    // Labor/Success fees paid
    const isLaborPaid = c.financials?.successFeeStatus === 'paid' ||
      (c.financials?.laborPaymentDate && new Date(c.financials?.laborPaymentDate + 'T23:59:59') <= new Date());
    const laborPaid = isLaborPaid ? (c.financials?.laborFinalValue || 0) : 0;

    const totalClientPaid = initial + instPaid + laborPaid;

    totalAgreed += agreed;
    totalPaid += totalClientPaid;

    // Area Grouping
    const area = c.caseType || 'Outros';
    if (!areaGroups[area]) areaGroups[area] = { count: 0, value: 0 };
    areaGroups[area].count++;
    areaGroups[area].value += agreed;
  });

  totalPending = totalAgreed - totalPaid;

  // --- RESUMO EXECUTIVO ---
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("RESUMO EXECUTIVO", margin, y);
  y += 10;

  // Cards de Resumo (Simulados com Retângulos)
  const cardWidth = (pageWidth - (margin * 2) - 10) / 3;
  const cardHeight = 25;

  const drawCard = (label: string, value: number, x: number, color: [number, number, number]) => {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'D');

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(label.toUpperCase(), x + 5, y + 8);

    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFontSize(11);
    doc.text(`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, x + 5, y + 18);
  };

  drawCard("Volume Contratado", totalAgreed, margin, [15, 23, 42]);
  drawCard("Receita Realizada", totalPaid, margin + cardWidth + 5, [16, 185, 129]);
  drawCard("Projeção a Receber", totalPending, margin + (cardWidth * 2) + 10, [79, 70, 229]);

  y += cardHeight + 25;

  // --- TABELA DE ÁREAS ---
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("DISTRIBUIÇÃO POR ÁREA JURÍDICA", margin, y);
  y += 10;

  // Header da Tabela
  const colWidths = [50, 30, 40, 40, 0]; // O último é Market Share (calculado)
  const availableWidth = pageWidth - (margin * 2);
  const tableHeaderColor = [15, 23, 42];

  doc.setFillColor(tableHeaderColor[0], tableHeaderColor[1], tableHeaderColor[2]);
  doc.rect(margin, y, availableWidth, 10, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  const headers = ["ÁREA JURÍDICA", "Nº CASOS", "VOLUME (R$)", "MARKET SHARE (%)"];
  const xPositions = [margin + 5, margin + 60, margin + 90, margin + 140];

  headers.forEach((h, i) => doc.text(h, xPositions[i], y + 6.5));

  y += 10;

  // Linhas da Tabela
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);

  Object.entries(areaGroups)
    .sort((a, b) => b[1].value - a[1].value)
    .forEach(([area, data]) => {
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }

      const share = totalAgreed > 0 ? (data.value / totalAgreed) * 100 : 0;

      doc.setFont("helvetica", "bold");
      doc.text(area.toUpperCase(), xPositions[0], y + 7);
      doc.setFont("helvetica", "normal");
      doc.text(data.count.toString(), xPositions[1], y + 7);
      doc.text(data.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), xPositions[2], y + 7);
      doc.text(`${Math.round(share)}%`, xPositions[3], y + 7);

      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 10, margin + availableWidth, y + 10);
      y += 10;
    });

  // --- RODAPÉ ---
  const footerY = pageHeight - 15;
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Relatório gerado via Sistema de Gestão Inteligente - Todos os direitos reservados.`, pageWidth / 2, footerY, { align: 'center' });

  doc.save(`Relatorio_Financeiro_${new Date().getTime()}.pdf`);
};
