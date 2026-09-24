import { NextRequest, NextResponse } from 'next/server';
import { contentService } from '@/modules/content';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    if (type === 'REVIEWS') {
      const reviews = await contentService.listReviews();
      return NextResponse.json({ success: true, reviews });
    }

    if (type === 'GALLERY') {
      const gallery = await contentService.listGalleryItems();
      return NextResponse.json({ success: true, gallery });
    }

    if (type === 'OFFERS') {
      const offers = await contentService.listOffers();
      return NextResponse.json({ success: true, offers });
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { target, action, id, data } = body;

    if (target === 'REVIEW') {
      if (action === 'CREATE') {
        const created = await contentService.createReview(data);
        return NextResponse.json({ success: true, review: created });
      }
      if (action === 'UPDATE') {
        const updated = await contentService.updateReview(id, data);
        return NextResponse.json({ success: true, review: updated });
      }
      if (action === 'DELETE') {
        await contentService.deleteReview(id);
        return NextResponse.json({ success: true });
      }
    }

    if (target === 'GALLERY') {
      if (action === 'CREATE') {
        const created = await contentService.createGalleryItem(data);
        return NextResponse.json({ success: true, gallery: created });
      }
      if (action === 'UPDATE') {
        const updated = await contentService.updateGalleryItem(id, data);
        return NextResponse.json({ success: true, gallery: updated });
      }
      if (action === 'DELETE') {
        await contentService.deleteGalleryItem(id);
        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ error: 'Invalid target or action' }, { status: 400 });
  } catch (err: any) {
    console.error('Error in content admin API:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
