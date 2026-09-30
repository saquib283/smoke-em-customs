import { NextResponse } from 'next/server';
import { quotingService } from '@/modules/quoting';
import { buildQuotePDF } from '@/modules/quoting/pdfGenerator';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const quote = await quotingService.getQuote(id);
    if (!quote) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    const doc = buildQuotePDF(quote);
    const pdfOutput = doc.output('arraybuffer');
    const ref = `QT-${quote.id.slice(-6).toUpperCase()}`;

    return new Response(pdfOutput, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Smoke_Em_Customs_Quote_${ref}.pdf"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to generate quotation PDF' },
      { status: 500 }
    );
  }
}
