import { NextRequest, NextResponse } from 'next/server';
import { crmService } from '@/modules/crm';
import { catalogueService } from '@/modules/catalogue';
import { checkQuoteRequestLimit } from '@/lib/rate-limit';
import { getRecommendationEngine } from '@/modules/recommendation';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting (Architecture §14)
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimit = checkQuoteRequestLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment before trying again.' },
        { status: 429 }
      );
    }

    const body = await req.json();

    // 2. Validate mandatory minimum (PRD FR-10)
    if (!body.customerName?.trim() || !body.customerPhone?.trim()) {
      return NextResponse.json(
        { error: 'Customer name and phone number are required.' },
        { status: 400 }
      );
    }

    // 3. Compute rules-based estimate (Architecture §13.2 & §16)
    let estimateMin: number | null = null;
    let estimateMax: number | null = null;

    if (body.serviceInterestId) {
      const service = await catalogueService.getServiceById(body.serviceInterestId);
      if (service) {
        const basePrice = parseFloat(service.startingPrice) || 5000;
        let vehicleMultiplier = 1.0;

        switch (body.vehicleType) {
          case 'HATCHBACK':
            vehicleMultiplier = 1.0;
            break;
          case 'SEDAN':
            vehicleMultiplier = 1.15;
            break;
          case 'SUV':
          case 'MUV':
            vehicleMultiplier = 1.3;
            break;
          case 'LUXURY':
            vehicleMultiplier = 1.5;
            break;
          case 'TWO_WHEELER':
            vehicleMultiplier = 0.5;
            break;
          default:
            vehicleMultiplier = 1.1;
        }

        // Adjust for condition
        let conditionMultiplier = 1.0;
        if (body.vehicleCondition === 'Heavy Swirls & Scratches') {
          conditionMultiplier = 1.2;
        } else if (body.vehicleCondition === 'Paint Oxidation / Faded') {
          conditionMultiplier = 1.3;
        }

        const calculated = Math.round((basePrice * vehicleMultiplier * conditionMultiplier) / 500) * 500;
        estimateMin = calculated;
        estimateMax = Math.round(calculated * 1.25 / 500) * 500;
      }
    }

    // 3b. Compute intelligent recommendation (Architecture §16 & PRD §15)
    let recommendationResult = null;
    if (body.vehicleBrand || body.vehicleModel || body.vehicleType) {
      const engine = getRecommendationEngine();
      recommendationResult = await engine.recommend({
        vehicle: {
          brand: body.vehicleBrand?.trim() || 'Vehicle',
          model: body.vehicleModel?.trim() || '',
          year: body.vehicleYear ? parseInt(body.vehicleYear, 10) : undefined,
          type: body.vehicleType,
        },
        condition: {
          paintCondition: body.vehicleCondition,
        },
        desiredResult: body.desiredResult,
        budgetRange: estimateMin && estimateMax ? { min: estimateMin, max: estimateMax } : undefined,
      });
    }

    // 4. Create Lead + Customer + Vehicle
    const lead = await crmService.createLead({
      customerName: body.customerName.trim(),
      customerPhone: body.customerPhone.trim(),
      customerEmail: body.customerEmail?.trim() || undefined,
      preferredContactMethod: body.preferredContactMethod || 'WHATSAPP',
      vehicleBrand: body.vehicleBrand?.trim() || undefined,
      vehicleModel: body.vehicleModel?.trim() || undefined,
      vehicleType: body.vehicleType || undefined,
      vehicleYear: body.vehicleYear ? parseInt(body.vehicleYear, 10) : undefined,
      serviceInterestId: body.serviceInterestId || undefined,
      vehicleCondition: body.vehicleCondition || undefined,
      desiredResult: body.desiredResult || undefined,
      budgetRangeMin: estimateMin ? String(estimateMin) : (body.budgetRangeMin || undefined),
      budgetRangeMax: estimateMax ? String(estimateMax) : (body.budgetRangeMax || undefined),
      preferredDate: body.preferredDate || undefined,
      additionalNotes: body.additionalNotes || undefined,
      photoMediaIds: Array.isArray(body.photoMediaIds) ? body.photoMediaIds : undefined,
      source: body.source || 'public_web',
    });

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      referenceCode: `SMC-${lead.id.substring(0, 6).toUpperCase()}`,
      estimate: estimateMin && estimateMax ? {
        min: estimateMin,
        max: estimateMax,
      } : null,
      recommendation: recommendationResult,
      isDuplicate: lead.isDuplicate,
      message: 'Quote enquiry received. Our master detailer will reach out within 2 hours.',
    });
  } catch (err: any) {
    console.error('Error creating quote enquiry:', err);
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred while processing your quote.' },
      { status: 500 }
    );
  }
}
