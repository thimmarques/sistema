
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
  doc.text(`RELATÓRIO FINANCEIRO GERADO EM ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - margin, 20, { align: 'right' });

  doc.save(`Relatorio_Financeiro_${new Date().getTime()}.pdf`);
};
