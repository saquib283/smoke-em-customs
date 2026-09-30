import { jsPDF } from 'jspdf';
import type { QuoteDetail } from './types';

function formatCurrency(amount: string | number): string {
  const num = Number(amount) || 0;
  return 'INR ' + num.toLocaleString('en-IN');
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Builds an executive-tier, branded Smoke 'Em Customs quotation PDF document.
 */
export function buildQuotePDF(quote: QuoteDetail): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // ── 1. Top Header Banner ──
  doc.setFillColor(15, 23, 42); // #0F172A
  doc.rect(0, 0, pageWidth, 34, 'F');

  // Gold accent strip
  doc.setFillColor(180, 83, 9); // #B45309
  doc.rect(0, 34, pageWidth, 2.5, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text("SMOKE 'EM CUSTOMS", margin, 15);

  // Brand Subtitle
  doc.setTextColor(253, 230, 138); // #FDE68A
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('BESPOKE AUTOMOTIVE ATELIER & SURFACE PROTECTION', margin, 21);

  doc.setTextColor(203, 213, 225); // #CBD5E1
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Western Express Highway, Mumbai, MH - 400093 | +91 98765 43210', margin, 27);

  // Header Right: Quote Reference & Type
  const quoteRef = `QT-${quote.id.slice(-6).toUpperCase()}`;
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('ESTIMATE & QUOTATION', pageWidth - margin, 14, { align: 'right' });

  doc.setTextColor(253, 230, 138);
  doc.setFontSize(10);
  doc.text(`REF #${quoteRef}`, pageWidth - margin, 20, { align: 'right' });

  doc.setTextColor(203, 213, 225);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Status: ${(quote.status || 'DRAFT').toUpperCase()}`, pageWidth - margin, 26, { align: 'right' });

  let curY = 43;

  // ── 2. Metadata Columns (Atelier Studio & Client Dossier) ──
  const colWidth = (contentWidth - 6) / 2;

  // Left Box: Atelier Studio Info
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, curY, colWidth, 38, 2, 2, 'FD');

  doc.setTextColor(180, 83, 9);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('ISSUING ATELIER WORKSTATION', margin + 4, curY + 6);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.text("Smoke 'Em Customs Atelier Studio", margin + 4, curY + 12);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('42, Speed Bay Sanctuary, WEH', margin + 4, curY + 18);
  doc.text('Mumbai, Maharashtra - 400093', margin + 4, curY + 23);
  doc.text('GSTIN: 27AABCS1429B1Z8', margin + 4, curY + 28);
  doc.text('concierge@smokecustoms.com', margin + 4, curY + 33);

  // Right Box: Client & Vehicle Details
  const rightBoxX = margin + colWidth + 6;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightBoxX, curY, colWidth, 38, 2, 2, 'FD');

  doc.setTextColor(180, 83, 9);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('CLIENT & VEHICLE DOSSIER', rightBoxX + 4, curY + 6);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9.5);
  doc.text(quote.customerName || 'Valued Client', rightBoxX + 4, curY + 12);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Phone: ${quote.customerPhone || 'N/A'}`, rightBoxX + 4, curY + 18);
  doc.text(`Email: ${quote.customerEmail || 'On Record'}`, rightBoxX + 4, curY + 23);
  doc.text(`Vehicle: ${quote.vehicleText || 'Unspecified'}`, rightBoxX + 4, curY + 28);

  const datesLine = `Issued: ${formatDate(quote.createdAt)}  |  Valid: ${formatDate(quote.validUntil)}`;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(datesLine, rightBoxX + 4, curY + 33);

  curY += 44;

  // ── 3. Line Items Table ──
  const colX = {
    num: margin,
    desc: margin + 10,
    qty: margin + 108,
    rate: margin + 126,
    amount: margin + 154,
  };
  const tableTotalWidth = contentWidth;

  // Table Header
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, curY, tableTotalWidth, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('#', colX.num + 3, curY + 5.5);
  doc.text('SERVICE / TREATMENT DESCRIPTION', colX.desc, curY + 5.5);
  doc.text('QTY', colX.qty, curY + 5.5);
  doc.text('RATE (INR)', colX.rate, curY + 5.5);
  doc.text('AMOUNT (INR)', colX.amount, curY + 5.5);

  curY += 8;

  // Items Rows
  const items = quote.items && quote.items.length > 0
    ? quote.items
    : [
        {
          id: '1',
          description: 'Bespoke Detailing & Ceramic Protection Package',
          quantity: 1,
          unitPrice: quote.total || '0',
          lineTotal: quote.total || '0',
          serviceId: null,
          packageId: null,
        },
      ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  items.forEach((it, idx) => {
    const isAlt = idx % 2 === 1;
    const rowHeight = 9;

    if (isAlt) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, curY, tableTotalWidth, rowHeight, 'F');
    }

    doc.setDrawColor(241, 245, 249);
    doc.line(margin, curY + rowHeight, margin + tableTotalWidth, curY + rowHeight);

    doc.setTextColor(100, 116, 139);
    doc.text(String(idx + 1), colX.num + 3, curY + 6);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    const descText = it.description.length > 55 ? it.description.slice(0, 52) + '...' : it.description;
    doc.text(descText, colX.desc, curY + 6);

    doc.setFont('helvetica', 'normal');
    doc.text(String(it.quantity || 1), colX.qty + 2, curY + 6);
    doc.text(Number(it.unitPrice || 0).toLocaleString('en-IN'), colX.rate, curY + 6);

    doc.setFont('helvetica', 'bold');
    const lineTotal = Number(it.lineTotal || (Number(it.quantity || 1) * Number(it.unitPrice || 0))).toLocaleString('en-IN');
    doc.text(lineTotal, colX.amount, curY + 6);

    curY += rowHeight;
  });

  // Table Outer Border
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, curY - (items.length * 9) - 8, tableTotalWidth, (items.length * 9) + 8);

  curY += 5;

  // ── 4. Financial Calculations & Scope Summary ──
  const summaryBoxWidth = 85;
  const summaryX = margin + contentWidth - summaryBoxWidth;

  const subtotalNum = Number(quote.subtotal) || Number(quote.total) || 0;
  const discountNum = Number(quote.discount) || 0;
  const taxNum = Number(quote.tax) || 0;
  const totalNum = Number(quote.total) || 0;

  // Scope / Notes on left
  const notesWidth = contentWidth - summaryBoxWidth - 8;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, curY, notesWidth, 38, 2, 2, 'FD');

  doc.setTextColor(180, 83, 9);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('SCOPE OF TREATMENT & NOTES', margin + 4, curY + 6);

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const notesStr = quote.notes || 'Full vehicle exterior wash, clay bar surface decontamination, high-gloss dual-action machine paint correction, and premium ceramic protective seal application. Bay reserved upon deposit confirmation.';
  const splitNotes = doc.splitTextToSize(notesStr, notesWidth - 8);
  doc.text(splitNotes.slice(0, 5), margin + 4, curY + 12);

  // Financial Breakdown Box on right
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(summaryX, curY, summaryBoxWidth, 38, 2, 2, 'FD');

  let sY = curY + 7;
  doc.setFontSize(8);

  // Subtotal
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', summaryX + 4, sY);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(subtotalNum), summaryX + summaryBoxWidth - 4, sY, { align: 'right' });

  // Discount
  if (discountNum > 0) {
    sY += 6;
    doc.setTextColor(22, 163, 74);
    doc.setFont('helvetica', 'normal');
    doc.text('Privilege Discount:', summaryX + 4, sY);
    doc.setFont('helvetica', 'bold');
    doc.text(`- ${formatCurrency(discountNum)}`, summaryX + summaryBoxWidth - 4, sY, { align: 'right' });
  }

  // Tax
  sY += 6;
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('GST (18% Breakdown):', summaryX + 4, sY);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(taxNum), summaryX + summaryBoxWidth - 4, sY, { align: 'right' });

  // Total Contract Box
  sY += 6;
  doc.setFillColor(15, 23, 42);
  doc.rect(summaryX, sY, summaryBoxWidth, 13, 'F');

  doc.setTextColor(253, 230, 138);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('TOTAL CONTRACT VALUE', summaryX + 4, sY + 5);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text(formatCurrency(totalNum), summaryX + summaryBoxWidth - 4, sY + 9.5, { align: 'right' });

  curY += 44;

  // ── 5. Studio Terms & Booking Protocol ──
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, curY, contentWidth, 38, 2, 2, 'FD');

  doc.setTextColor(180, 83, 9);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('ATELIER PROTOCOL & TERMS OF SERVICE', margin + 4, curY + 6);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  const termsList = [
    '1. Quotation Validity: This estimate is valid for 7 calendar days from issue. Bay schedule slots are allocated on first-confirmed basis.',
    '2. Reservation Deposit: A 50% booking deposit locks detailing bay allocation, climate control, and technician hours.',
    '3. Vehicle Inspection: A comprehensive 360-degree paint depth and surface check is performed upon handover before work commences.',
    '4. Warranty Guarantee: Ceramic coating and PPF treatments include official digital warranty credentials and scheduled check-ups.',
    '5. Payment Modes: Studio accepts NEFT/RTGS, UPI, Corporate Credit Cards, and Studio Debit. Balance due upon delivery.',
  ];

  termsList.forEach((t, i) => {
    doc.text(t, margin + 4, curY + 12 + i * 5);
  });

  curY += 43;

  // ── 6. Sign-off & Verification ──
  const sigColWidth = contentWidth / 2;

  // Left: Digital Verification
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Generated via Smoke Em Customs Atelier OS', margin, curY + 5);
  doc.text(`Digital Verification Code: SEC-${quote.id.slice(0, 8).toUpperCase()}`, margin, curY + 9);
  doc.text('Customer Acceptance: _______________________', margin, curY + 16);

  // Right: Studio Sign-off
  const sigRightX = margin + sigColWidth + 20;
  doc.text('Authorized Atelier Concierge:', sigRightX, curY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(quote.issuedByName || 'Smoke Em Lead Concierge', sigRightX, curY + 10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 83, 9);
  doc.text('Verified Atelier Seal & Quality Stamp [SIGNED]', sigRightX, curY + 15);

  // ── 7. Bottom Footer ──
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text("Smoke 'Em Customs Atelier | Precision Automotive Craftsmanship | www.smokecustoms.com", margin, pageHeight - 8);
  doc.text('Page 1 of 1', pageWidth - margin, pageHeight - 8, { align: 'right' });

  return doc;
}

/**
 * Directly downloads the generated quotation PDF in the browser.
 */
export function downloadQuotePDF(quote: QuoteDetail): void {
  const doc = buildQuotePDF(quote);
  const ref = `QT-${quote.id.slice(-6).toUpperCase()}`;
  const filename = `Smoke_Em_Customs_Quote_${ref}.pdf`;
  doc.save(filename);
}
