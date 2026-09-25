import { NextRequest, NextResponse } from 'next/server';
import { contentService } from '@/modules/content';
import { logAudit } from '@/lib/audit';

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
    const { target, action, id, data, actorId } = body;

    // ── REVIEWS ──
    if (target === 'REVIEW') {
      if (action === 'CREATE') {
        const created = await contentService.createReview(data);
        await logAudit({
          actorId: actorId ?? null,
          action: 'REVIEW_CREATED',
          entityType: 'SERVICE', // or general content
          entityId: created.id,
          after: created,
        });
        return NextResponse.json({ success: true, review: created });
      }
      if (action === 'UPDATE') {
        const updated = await contentService.updateReview(id, data);
        await logAudit({
          actorId: actorId ?? null,
          action: 'REVIEW_UPDATED',
          entityType: 'SERVICE',
          entityId: id,
          after: updated,
        });
        return NextResponse.json({ success: true, review: updated });
      }
      if (action === 'DELETE') {
        await contentService.deleteReview(id);
        await logAudit({
          actorId: actorId ?? null,
          action: 'REVIEW_DELETED',
          entityType: 'SERVICE',
          entityId: id,
        });
        return NextResponse.json({ success: true });
      }
    }

    // ── GALLERY ──
    if (target === 'GALLERY') {
      if (action === 'CREATE') {
        const created = await contentService.createGalleryItem(data);
        await logAudit({
          actorId: actorId ?? null,
          action: 'GALLERY_CREATED',
          entityType: 'SERVICE',
          entityId: created.id,
          after: created,
        });
        return NextResponse.json({ success: true, gallery: created });
      }
      if (action === 'UPDATE') {
        const updated = await contentService.updateGalleryItem(id, data);
        await logAudit({
          actorId: actorId ?? null,
          action: 'GALLERY_UPDATED',
          entityType: 'SERVICE',
          entityId: id,
          after: updated,
        });
        return NextResponse.json({ success: true, gallery: updated });
      }
      if (action === 'DELETE') {
        await contentService.deleteGalleryItem(id);
        await logAudit({
          actorId: actorId ?? null,
          action: 'GALLERY_DELETED',
          entityType: 'SERVICE',
          entityId: id,
        });
        return NextResponse.json({ success: true });
      }
    }

    // ── OFFERS ──
    if (target === 'OFFER' || target === 'OFFERS') {
      if (action === 'CREATE') {
        const created = await contentService.createOffer(data);
        await logAudit({
          actorId: actorId ?? null,
          action: 'OFFER_CREATED',
          entityType: 'SETTING',
          entityId: created.id,
          after: created,
        });
        return NextResponse.json({ success: true, offer: created });
      }
      if (action === 'UPDATE') {
        const updated = await contentService.updateOffer(id, data);
        await logAudit({
          actorId: actorId ?? null,
          action: 'OFFER_UPDATED',
          entityType: 'SETTING',
          entityId: id,
          after: updated,
        });
        return NextResponse.json({ success: true, offer: updated });
      }
      if (action === 'DELETE') {
        await contentService.deleteOffer(id);
        await logAudit({
          actorId: actorId ?? null,
          action: 'OFFER_DELETED',
          entityType: 'SETTING',
          entityId: id,
        });
        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ error: 'Invalid target or action' }, { status: 400 });
  } catch (err: any) {
    console.error('Error in content admin API:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
