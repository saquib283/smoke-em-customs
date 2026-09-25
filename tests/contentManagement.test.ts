import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Content Management — Gallery & Showcase Rules (PRD §17 & Architecture §12)', () => {
  function generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  function parseTags(input: string): string[] {
    return input
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }

  it('generates clean, URL-safe slugs from project showcase titles', () => {
    assert.strictEqual(
      generateSlug('Matte Satin PPF on Porsche GT3 RS (Track Edition)!'),
      'matte-satin-ppf-on-porsche-gt3-rs-track-edition'
    );
    assert.strictEqual(
      generateSlug('BMW M340i — Multi-Stage Paint Correction & 9H Ceramic'),
      'bmw-m340i-multi-stage-paint-correction-9h-ceramic'
    );
  });

  it('correctly normalizes comma-separated tag input into clean unique arrays', () => {
    const raw = 'PPF, Self-Healing , Track Pack, , High-Gloss ';
    const tags = parseTags(raw);
    assert.deepStrictEqual(tags, ['PPF', 'Self-Healing', 'Track Pack', 'High-Gloss']);
  });

  it('validates gallery item showcase before/after pair representation', () => {
    const galleryShowcase = {
      title: 'Full SunTek Ultra PPF',
      slug: 'full-suntek-ultra-ppf',
      serviceCategory: 'Paint Protection Film',
      beforeImageUrl: '/uploads/gallery/gt3-before.jpg',
      afterImageUrl: '/uploads/gallery/gt3-after.jpg',
      videoUrl: 'https://cdn.smokecustoms.in/reels/gt3.mp4',
      isFeatured: true,
      isPublished: true,
    };

    assert.ok(galleryShowcase.beforeImageUrl.length > 0);
    assert.ok(galleryShowcase.afterImageUrl.length > 0);
    assert.strictEqual(galleryShowcase.isPublished, true);
    assert.strictEqual(galleryShowcase.isFeatured, true);
  });
});

describe('Content Management — Reviews & Testimonial Bounds (PRD §17)', () => {
  function boundRating(val: number): number {
    return Math.min(5, Math.max(1, Math.round(val)));
  }

  it('clamps review ratings strictly between 1 and 5 stars', () => {
    assert.strictEqual(boundRating(5), 5);
    assert.strictEqual(boundRating(1), 1);
    assert.strictEqual(boundRating(6), 5);
    assert.strictEqual(boundRating(0), 1);
    assert.strictEqual(boundRating(-3), 1);
    assert.strictEqual(boundRating(4.2), 4);
    assert.strictEqual(boundRating(4.8), 5);
  });

  it('formats customer testimonial metadata with service and vehicle info', () => {
    const review = {
      customerName: 'Rohit Balani',
      rating: boundRating(5),
      body: 'Incredible gloss and swirl removal on my Macan. Studio craftsmanship is unmatched in the city.',
      vehicleText: 'Porsche Macan GTS',
      serviceName: 'Ceramic Shield 9H & Stage 2 Correction',
      isPublished: true,
      isFeatured: true,
    };

    assert.strictEqual(review.rating, 5);
    assert.ok(review.body.includes('Macan'));
    assert.strictEqual(review.isPublished, true);
    assert.strictEqual(review.isFeatured, true);
  });
});

describe('Content Management — Promotional Offers & Campaign Validity Window', () => {
  type OfferStatus = 'ACTIVE' | 'UPCOMING' | 'EXPIRED' | 'DISABLED';

  function evaluateOfferStatus(
    offer: { startAt: string; endAt: string; isEnabled: boolean },
    referenceDate: Date = new Date()
  ): OfferStatus {
    if (!offer.isEnabled) return 'DISABLED';
    const start = new Date(offer.startAt);
    const end = new Date(offer.endAt);
    if (referenceDate < start) return 'UPCOMING';
    if (referenceDate > end) return 'EXPIRED';
    return 'ACTIVE';
  }

  it('accurately identifies active offers during validity window', () => {
    const refDate = new Date('2026-10-15T12:00:00Z');
    const offer = {
      title: 'Monsoon Ceramic Upgrade',
      startAt: '2026-10-01T00:00:00Z',
      endAt: '2026-10-31T23:59:59Z',
      isEnabled: true,
    };

    assert.strictEqual(evaluateOfferStatus(offer, refDate), 'ACTIVE');
  });

  it('accurately flags upcoming and expired offers', () => {
    const refDate = new Date('2026-10-15T12:00:00Z');

    const upcomingOffer = {
      startAt: '2026-11-01T00:00:00Z',
      endAt: '2026-11-30T23:59:59Z',
      isEnabled: true,
    };
    assert.strictEqual(evaluateOfferStatus(upcomingOffer, refDate), 'UPCOMING');

    const expiredOffer = {
      startAt: '2026-09-01T00:00:00Z',
      endAt: '2026-09-30T23:59:59Z',
      isEnabled: true,
    };
    assert.strictEqual(evaluateOfferStatus(expiredOffer, refDate), 'EXPIRED');
  });

  it('marks paused offers as disabled regardless of date window', () => {
    const refDate = new Date('2026-10-15T12:00:00Z');
    const pausedOffer = {
      startAt: '2026-10-01T00:00:00Z',
      endAt: '2026-10-31T23:59:59Z',
      isEnabled: false,
    };

    assert.strictEqual(evaluateOfferStatus(pausedOffer, refDate), 'DISABLED');
  });
});

describe('Media Upload Flow & Storage Signing Rules (Architecture §14)', () => {
  const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/avif',
    'video/mp4',
    'video/webm',
  ];
  const MAX_SIZE = 50 * 1024 * 1024;

  function validateUploadRequest(contentType: string, sizeBytes: number): { valid: boolean; error?: string } {
    if (!ALLOWED_MIME_TYPES.includes(contentType.toLowerCase())) {
      return { valid: false, error: 'Invalid file format' };
    }
    if (sizeBytes > MAX_SIZE) {
      return { valid: false, error: 'File size exceeds 50MB limit' };
    }
    return { valid: true };
  }

  it('approves valid image and video MIME types under 50MB', () => {
    assert.strictEqual(validateUploadRequest('image/webp', 5 * 1024 * 1024).valid, true);
    assert.strictEqual(validateUploadRequest('video/mp4', 35 * 1024 * 1024).valid, true);
    assert.strictEqual(validateUploadRequest('image/jpeg', 2 * 1024 * 1024).valid, true);
  });

  it('rejects disallowed file types and oversized files', () => {
    const invalidFormat = validateUploadRequest('application/pdf', 1024);
    assert.strictEqual(invalidFormat.valid, false);
    assert.strictEqual(invalidFormat.error, 'Invalid file format');

    const oversized = validateUploadRequest('video/mp4', 60 * 1024 * 1024);
    assert.strictEqual(oversized.valid, false);
    assert.strictEqual(oversized.error, 'File size exceeds 50MB limit');
  });
});
