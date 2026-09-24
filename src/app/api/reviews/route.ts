import { NextRequest, NextResponse } from 'next/server';
import { contentService } from '@/modules/content';
import { checkPublicFormLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimit = checkPublicFormLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many submissions. Please wait.' }, { status: 429 });
    }

    const body = await req.json();

    if (!body.customerName?.trim() || !body.body?.trim()) {
      return NextResponse.json({ error: 'Name and review text are required.' }, { status: 400 });
    }

    const review = await contentService.createReview({
      customerName: body.customerName.trim(),
      rating: Number(body.rating) || 5,
      body: body.body.trim(),
      vehicleText: body.vehicleText?.trim() || undefined,
      serviceId: body.serviceId || undefined,
      isFeatured: false,
      isPublished: true, // published by default or for admin moderation
    });

    return NextResponse.json({ success: true, review });
  } catch (err: any) {
    console.error('Error creating review:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to submit review' },
      { status: 500 }
    );
  }
}
