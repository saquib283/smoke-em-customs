/**
 * Content Module — Implementation
 * Manages gallery items, reviews, offers, and media.
 * Architecture §12
 */

import { db } from '@/prisma/db';

export interface GalleryListItem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  serviceCategory: string | null;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  tags: string[];
  isFeatured: boolean;
  isPublished: boolean;
  beforeImageUrl: string | null;
  afterImageUrl: string | null;
  videoUrl: string | null;
  serviceId: string | null;
}

export type GalleryItemDetail = GalleryListItem;

export interface CreateGalleryInput {
  title: string;
  slug: string;
  description?: string;
  serviceCategory?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  tags?: string[];
  isFeatured?: boolean;
  isPublished?: boolean;
  serviceId?: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  videoUrl?: string;
}

export type UpdateGalleryInput = Partial<CreateGalleryInput>;

export interface ListGalleryOptions {
  publishedOnly?: boolean;
  featured?: boolean;
  category?: string;
  page?: number;
  perPage?: number;
}

export interface ReviewListItem {
  id: string;
  customerName: string;
  rating: number;
  body: string;
  vehicleText: string | null;
  serviceName: string | null;
  reviewDate: string | null;
  isFeatured: boolean;
  isPublished: boolean;
}

export interface CreateReviewInput {
  customerName: string;
  rating: number;
  body: string;
  vehicleText?: string;
  serviceId?: string;
  reviewDate?: string;
  isFeatured?: boolean;
  isPublished?: boolean;
}

export type UpdateReviewInput = Partial<CreateReviewInput>;

export interface OfferListItem {
  id: string;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  isEnabled: boolean;
  serviceId?: string | null;
  serviceName: string | null;
  packageId?: string | null;
  packageName: string | null;
}

export interface CreateOfferInput {
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  isEnabled?: boolean;
  serviceId?: string;
  packageId?: string;
}

export type UpdateOfferInput = Partial<CreateOfferInput>;

export interface MediaDetail {
  id: string;
  url: string;
  type: string;
  altText: string | null;
  width: number | null;
  height: number | null;
}

export interface CreateMediaInput {
  url: string;
  type: 'IMAGE' | 'VIDEO';
  altText?: string;
  width?: number;
  height?: number;
  provider?: string;
  providerKey?: string;
}

export class ContentService {
  // ── Gallery ──

  async listGalleryItems(options?: ListGalleryOptions): Promise<GalleryListItem[]> {
    let query = db.orm.public.GalleryItem.where((g) => g.deletedAt.isNull());

    if (options?.publishedOnly) {
      query = query.where({ isPublished: true });
    }
    if (options?.featured) {
      query = query.where({ isFeatured: true });
    }
    if (options?.category) {
      query = query.where({ serviceCategory: options.category });
    }

    const items = await query.orderBy((g) => g.createdAt.desc()).all();

    const result: GalleryListItem[] = [];
    for (const item of items) {
      const beforeMedia = item.beforeMediaId
        ? await db.orm.public.Media.where({ id: item.beforeMediaId }).first()
        : null;
      const afterMedia = item.afterMediaId
        ? await db.orm.public.Media.where({ id: item.afterMediaId }).first()
        : null;
      const videoMedia = item.videoMediaId
        ? await db.orm.public.Media.where({ id: item.videoMediaId }).first()
        : null;

      result.push({
        id: item.id,
        title: item.title,
        slug: item.slug,
        description: item.description,
        serviceCategory: item.serviceCategory,
        vehicleBrand: item.vehicleBrand,
        vehicleModel: item.vehicleModel,
        tags: [...(item.tags ?? [])],
        isFeatured: item.isFeatured,
        isPublished: item.isPublished,
        beforeImageUrl: beforeMedia?.url ?? null,
        afterImageUrl: afterMedia?.url ?? null,
        videoUrl: videoMedia?.url ?? null,
        serviceId: item.serviceId,
      });
    }

    return result;
  }

  async getGalleryItem(slug: string): Promise<GalleryItemDetail | null> {
    const item = await db.orm.public.GalleryItem
      .where({ slug })
      .where((g) => g.deletedAt.isNull())
      .first();

    if (!item) return null;

    const beforeMedia = item.beforeMediaId
      ? await db.orm.public.Media.where({ id: item.beforeMediaId }).first()
      : null;
    const afterMedia = item.afterMediaId
      ? await db.orm.public.Media.where({ id: item.afterMediaId }).first()
      : null;
    const videoMedia = item.videoMediaId
      ? await db.orm.public.Media.where({ id: item.videoMediaId }).first()
      : null;

    return {
      id: item.id,
      title: item.title,
      slug: item.slug,
      description: item.description,
      serviceCategory: item.serviceCategory,
      vehicleBrand: item.vehicleBrand,
      vehicleModel: item.vehicleModel,
      tags: [...(item.tags ?? [])],
      isFeatured: item.isFeatured,
      isPublished: item.isPublished,
      beforeImageUrl: beforeMedia?.url ?? null,
      afterImageUrl: afterMedia?.url ?? null,
      videoUrl: videoMedia?.url ?? null,
      serviceId: item.serviceId,
    };
  }

  async createGalleryItem(data: CreateGalleryInput): Promise<GalleryItemDetail> {
    let beforeMediaId: string | null = null;
    let afterMediaId: string | null = null;
    let videoMediaId: string | null = null;

    if (data.beforeImageUrl) {
      const media = await this.createMedia({
        url: data.beforeImageUrl,
        type: 'IMAGE',
        altText: `${data.title} Before`,
      });
      beforeMediaId = media.id;
    }
    if (data.afterImageUrl) {
      const media = await this.createMedia({
        url: data.afterImageUrl,
        type: 'IMAGE',
        altText: `${data.title} After`,
      });
      afterMediaId = media.id;
    }
    if (data.videoUrl) {
      const media = await this.createMedia({
        url: data.videoUrl,
        type: 'VIDEO',
        altText: `${data.title} Video`,
      });
      videoMediaId = media.id;
    }

    const created = await db.orm.public.GalleryItem.create({
      title: data.title,
      slug: data.slug,
      description: data.description ?? null,
      serviceCategory: data.serviceCategory ?? null,
      vehicleBrand: data.vehicleBrand ?? null,
      vehicleModel: data.vehicleModel ?? null,
      tags: data.tags ?? [],
      isFeatured: data.isFeatured ?? false,
      isPublished: data.isPublished ?? true,
      serviceId: data.serviceId ?? null,
      beforeMediaId,
      afterMediaId,
      videoMediaId,
    });

    return (await this.getGalleryItem(created.slug))!;
  }

  async updateGalleryItem(id: string, data: UpdateGalleryInput): Promise<GalleryItemDetail> {
    const item = await db.orm.public.GalleryItem.where({ id }).first();
    if (!item) throw new Error(`Gallery item ${id} not found`);

    const updatePayload: Record<string, any> = {};
    if (data.title !== undefined) updatePayload['title'] = data.title;
    if (data.slug !== undefined) updatePayload['slug'] = data.slug;
    if (data.description !== undefined) updatePayload['description'] = data.description;
    if (data.serviceCategory !== undefined) updatePayload['serviceCategory'] = data.serviceCategory;
    if (data.vehicleBrand !== undefined) updatePayload['vehicleBrand'] = data.vehicleBrand;
    if (data.vehicleModel !== undefined) updatePayload['vehicleModel'] = data.vehicleModel;
    if (data.tags !== undefined) updatePayload['tags'] = data.tags;
    if (data.isFeatured !== undefined) updatePayload['isFeatured'] = data.isFeatured;
    if (data.isPublished !== undefined) updatePayload['isPublished'] = data.isPublished;
    if (data.serviceId !== undefined) updatePayload['serviceId'] = data.serviceId;

    if (data.beforeImageUrl) {
      const m = await this.createMedia({ url: data.beforeImageUrl, type: 'IMAGE' });
      updatePayload['beforeMediaId'] = m.id;
    }
    if (data.afterImageUrl) {
      const m = await this.createMedia({ url: data.afterImageUrl, type: 'IMAGE' });
      updatePayload['afterMediaId'] = m.id;
    }
    if (data.videoUrl) {
      const m = await this.createMedia({ url: data.videoUrl, type: 'VIDEO' });
      updatePayload['videoMediaId'] = m.id;
    }

    await db.orm.public.GalleryItem.where({ id }).update(updatePayload);
    const updated = await db.orm.public.GalleryItem.where({ id }).first();
    return (await this.getGalleryItem(updated!.slug))!;
  }

  async deleteGalleryItem(id: string): Promise<void> {
    await db.orm.public.GalleryItem.where({ id }).update({
      deletedAt: new Date().toISOString(),
      isPublished: false,
    });
  }

  // ── Reviews ──

  async listReviews(options?: { publishedOnly?: boolean; featured?: boolean }): Promise<ReviewListItem[]> {
    let query = db.orm.public.Review.where((r) => r.deletedAt.isNull());

    if (options?.publishedOnly) {
      query = query.where({ isPublished: true });
    }
    if (options?.featured) {
      query = query.where({ isFeatured: true });
    }

    const reviews = await query.orderBy((r) => r.createdAt.desc()).all();

    const result: ReviewListItem[] = [];
    for (const r of reviews) {
      const service = r.serviceId
        ? await db.orm.public.Service.where({ id: r.serviceId }).first()
        : null;

      result.push({
        id: r.id,
        customerName: r.customerName,
        rating: r.rating,
        body: r.body,
        vehicleText: r.vehicleText,
        serviceName: service?.name ?? null,
        reviewDate: r.reviewDate,
        isFeatured: r.isFeatured,
        isPublished: r.isPublished,
      });
    }

    return result;
  }

  async createReview(data: CreateReviewInput): Promise<ReviewListItem> {
    const created = await db.orm.public.Review.create({
      customerName: data.customerName.trim(),
      rating: Math.min(5, Math.max(1, data.rating)),
      body: data.body.trim(),
      vehicleText: data.vehicleText ?? null,
      serviceId: data.serviceId ?? null,
      reviewDate: data.reviewDate ?? new Date().toISOString(),
      isFeatured: data.isFeatured ?? false,
      isPublished: data.isPublished ?? true,
    });

    return {
      id: created.id,
      customerName: created.customerName,
      rating: created.rating,
      body: created.body,
      vehicleText: created.vehicleText,
      serviceName: null,
      reviewDate: created.reviewDate,
      isFeatured: created.isFeatured,
      isPublished: created.isPublished,
    };
  }

  async updateReview(id: string, data: UpdateReviewInput): Promise<ReviewListItem> {
    const updatePayload: Record<string, any> = {};
    if (data.customerName !== undefined) updatePayload['customerName'] = data.customerName.trim();
    if (data.rating !== undefined) updatePayload['rating'] = Math.min(5, Math.max(1, data.rating));
    if (data.body !== undefined) updatePayload['body'] = data.body.trim();
    if (data.vehicleText !== undefined) updatePayload['vehicleText'] = data.vehicleText;
    if (data.serviceId !== undefined) updatePayload['serviceId'] = data.serviceId;
    if (data.isFeatured !== undefined) updatePayload['isFeatured'] = data.isFeatured;
    if (data.isPublished !== undefined) updatePayload['isPublished'] = data.isPublished;

    await db.orm.public.Review.where({ id }).update(updatePayload);
    const r = await db.orm.public.Review.where({ id }).first();
    if (!r) throw new Error(`Review ${id} not found`);

    return {
      id: r.id,
      customerName: r.customerName,
      rating: r.rating,
      body: r.body,
      vehicleText: r.vehicleText,
      serviceName: null,
      reviewDate: r.reviewDate,
      isFeatured: r.isFeatured,
      isPublished: r.isPublished,
    };
  }

  async deleteReview(id: string): Promise<void> {
    await db.orm.public.Review.where({ id }).update({
      deletedAt: new Date().toISOString(),
      isPublished: false,
    });
  }

  // ── Offers ──

  async listOffers(options?: { activeOnly?: boolean }): Promise<OfferListItem[]> {
    let query = db.orm.public.Offer.where((o) => o.deletedAt.isNull());

    if (options?.activeOnly) {
      const nowIso = new Date().toISOString();
      query = query
        .where({ isEnabled: true })
        .where((o) => o.startAt.lte(nowIso))
        .where((o) => o.endAt.gte(nowIso));
    }

    const offers = await query.orderBy((o) => o.createdAt.desc()).all();

    const result: OfferListItem[] = [];
    for (const o of offers) {
      const service = o.serviceId
        ? await db.orm.public.Service.where({ id: o.serviceId }).first()
        : null;
      const pkg = o.packageId
        ? await db.orm.public.Package.where({ id: o.packageId }).first()
        : null;

      result.push({
        id: o.id,
        title: o.title,
        description: o.description,
        startAt: o.startAt,
        endAt: o.endAt,
        isEnabled: o.isEnabled,
        serviceId: o.serviceId,
        serviceName: service?.name ?? null,
        packageId: o.packageId,
        packageName: pkg?.name ?? null,
      });
    }

    return result;
  }

  async createOffer(data: CreateOfferInput): Promise<OfferListItem> {
    const created = await db.orm.public.Offer.create({
      title: data.title.trim(),
      description: data.description.trim(),
      startAt: data.startAt,
      endAt: data.endAt,
      isEnabled: data.isEnabled ?? true,
      serviceId: data.serviceId ?? null,
      packageId: data.packageId ?? null,
    });

    const service = created.serviceId
      ? await db.orm.public.Service.where({ id: created.serviceId }).first()
      : null;
    const pkg = created.packageId
      ? await db.orm.public.Package.where({ id: created.packageId }).first()
      : null;

    return {
      id: created.id,
      title: created.title,
      description: created.description,
      startAt: created.startAt,
      endAt: created.endAt,
      isEnabled: created.isEnabled,
      serviceId: created.serviceId,
      serviceName: service?.name ?? null,
      packageId: created.packageId,
      packageName: pkg?.name ?? null,
    };
  }

  async updateOffer(id: string, data: UpdateOfferInput): Promise<OfferListItem> {
    const updatePayload: Record<string, any> = {};
    if (data.title !== undefined) updatePayload['title'] = data.title.trim();
    if (data.description !== undefined) updatePayload['description'] = data.description.trim();
    if (data.startAt !== undefined) updatePayload['startAt'] = data.startAt;
    if (data.endAt !== undefined) updatePayload['endAt'] = data.endAt;
    if (data.isEnabled !== undefined) updatePayload['isEnabled'] = data.isEnabled;
    if (data.serviceId !== undefined) updatePayload['serviceId'] = data.serviceId;
    if (data.packageId !== undefined) updatePayload['packageId'] = data.packageId;

    await db.orm.public.Offer.where({ id }).update(updatePayload);
    const o = await db.orm.public.Offer.where({ id }).first();
    if (!o) throw new Error(`Offer ${id} not found`);

    const service = o.serviceId
      ? await db.orm.public.Service.where({ id: o.serviceId }).first()
      : null;
    const pkg = o.packageId
      ? await db.orm.public.Package.where({ id: o.packageId }).first()
      : null;

    return {
      id: o.id,
      title: o.title,
      description: o.description,
      startAt: o.startAt,
      endAt: o.endAt,
      isEnabled: o.isEnabled,
      serviceId: o.serviceId,
      serviceName: service?.name ?? null,
      packageId: o.packageId,
      packageName: pkg?.name ?? null,
    };
  }

  async deleteOffer(id: string): Promise<void> {
    await db.orm.public.Offer.where({ id }).update({
      deletedAt: new Date().toISOString(),
      isEnabled: false,
    });
  }

  // ── Media ──

  async createMedia(data: CreateMediaInput): Promise<MediaDetail> {
    const m = await db.orm.public.Media.create({
      url: data.url,
      type: data.type,
      altText: data.altText ?? null,
      width: data.width ?? null,
      height: data.height ?? null,
      provider: data.provider ?? 'local',
      providerKey: data.providerKey ?? null,
    });

    return {
      id: m.id,
      url: m.url,
      type: m.type,
      altText: m.altText,
      width: m.width,
      height: m.height,
    };
  }

  async deleteMedia(id: string): Promise<void> {
    await db.orm.public.Media.where({ id }).delete();
  }
}

export const contentService = new ContentService();
