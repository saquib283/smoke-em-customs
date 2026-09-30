/**
 * Catalogue Module — Implementation
 * Manages services, packages, and their media.
 * Architecture §8
 */

import { db } from '@/prisma/db';

export const DEFAULT_SERVICE_IMAGES: Record<string, string> = {
  'ceramic-coating': '/ceramic-detail.jpg',
  'paint-protection-film': '/ppf-install.jpg',
  'interior-detailing': '/ppf-craft.jpg',
  'exterior-detailing': '/ceramic-macro.jpg',
  'paint-correction': '/hero-luxury-dark.jpg',
  'windshield-coating': '/ceramic-detail.jpg',
};

export interface ServiceListItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string | null;
  startingPrice: string;
  durationMinutes: number;
  warrantyText: string | null;
  benefits: string[];
  isEnabled: boolean;
  isBookable: boolean;
  bufferMinutesOverride: number | null;
  sortOrder: number;
  imageUrl: string | null;
}

export type ServiceDetail = ServiceListItem;

export interface CreateServiceInput {
  slug: string;
  name: string;
  description: string;
  category?: string;
  startingPrice: string;
  durationMinutes: number;
  warrantyText?: string;
  benefits?: string[];
  isEnabled?: boolean;
  isBookable?: boolean;
  bufferMinutesOverride?: number;
  sortOrder?: number;
  imageUrl?: string;
}

export type UpdateServiceInput = Partial<CreateServiceInput>;

export interface PackageListItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: string | null;
  startingPrice: string | null;
  durationMinutes: number;
  benefits: string[];
  warrantyText: string | null;
  validityText: string | null;
  terms: string | null;
  isEnabled: boolean;
  isBookable: boolean;
  sortOrder: number;
  serviceIds: string[];
  imageUrl: string | null;
}

export type PackageDetail = PackageListItem;

export interface CreatePackageInput {
  slug: string;
  name: string;
  description: string;
  price?: string;
  startingPrice?: string;
  durationMinutes: number;
  benefits?: string[];
  warrantyText?: string;
  validityText?: string;
  terms?: string;
  isEnabled?: boolean;
  isBookable?: boolean;
  sortOrder?: number;
  serviceIds?: string[];
  imageUrl?: string;
}

export type UpdatePackageInput = Partial<CreatePackageInput>;

export class CatalogueService {
  // ── Services ──

  async listServices(options?: { enabledOnly?: boolean }): Promise<ServiceListItem[]> {
    let query = db.orm.public.Service
      .where((s) => s.deletedAt.isNull());

    if (options?.enabledOnly) {
      query = query.where((s) => s.isEnabled.eq(true));
    }

    const services = await query.orderBy((s) => s.sortOrder.asc()).all();

    // Fetch media associated with services
    const mediaList = await db.orm.public.Media.all();
    const mediaMap = new Map<string, string>();
    for (const m of mediaList) {
      if (m.serviceId && !mediaMap.has(m.serviceId)) {
        mediaMap.set(m.serviceId, m.url);
      }
    }

    return services.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      description: s.description,
      category: s.category,
      startingPrice: String(s.startingPrice),
      durationMinutes: s.durationMinutes,
      warrantyText: s.warrantyText,
      benefits: [...(s.benefits ?? [])],
      isEnabled: s.isEnabled,
      isBookable: s.isBookable,
      bufferMinutesOverride: s.bufferMinutesOverride,
      sortOrder: s.sortOrder,
      imageUrl: mediaMap.get(s.id) || DEFAULT_SERVICE_IMAGES[s.slug] || '/ceramic-detail.jpg',
    }));
  }

  async getServiceBySlug(slug: string): Promise<ServiceDetail | null> {
    const s = await db.orm.public.Service
      .where((s) => s.slug.eq(slug))
      .where((s) => s.deletedAt.isNull())
      .first();

    if (!s) return null;

    const media = await db.orm.public.Media.where({ serviceId: s.id }).first();

    return {
      id: s.id,
      slug: s.slug,
      name: s.name,
      description: s.description,
      category: s.category,
      startingPrice: String(s.startingPrice),
      durationMinutes: s.durationMinutes,
      warrantyText: s.warrantyText,
      benefits: [...(s.benefits ?? [])],
      isEnabled: s.isEnabled,
      isBookable: s.isBookable,
      bufferMinutesOverride: s.bufferMinutesOverride,
      sortOrder: s.sortOrder,
      imageUrl: media?.url || DEFAULT_SERVICE_IMAGES[s.slug] || '/ceramic-detail.jpg',
    };
  }

  async getServiceById(id: string): Promise<ServiceDetail | null> {
    const s = await db.orm.public.Service
      .where({ id })
      .where((s) => s.deletedAt.isNull())
      .first();

    if (!s) return null;

    const media = await db.orm.public.Media.where({ serviceId: s.id }).first();

    return {
      id: s.id,
      slug: s.slug,
      name: s.name,
      description: s.description,
      category: s.category,
      startingPrice: String(s.startingPrice),
      durationMinutes: s.durationMinutes,
      warrantyText: s.warrantyText,
      benefits: [...(s.benefits ?? [])],
      isEnabled: s.isEnabled,
      isBookable: s.isBookable,
      bufferMinutesOverride: s.bufferMinutesOverride,
      sortOrder: s.sortOrder,
      imageUrl: media?.url || DEFAULT_SERVICE_IMAGES[s.slug] || '/ceramic-detail.jpg',
    };
  }

  async createService(data: CreateServiceInput): Promise<ServiceDetail> {
    const created = await db.orm.public.Service.create({
      slug: data.slug,
      name: data.name,
      description: data.description,
      category: data.category ?? null,
      startingPrice: data.startingPrice,
      durationMinutes: data.durationMinutes,
      warrantyText: data.warrantyText ?? null,
      benefits: data.benefits ?? [],
      isEnabled: data.isEnabled ?? true,
      isBookable: data.isBookable ?? true,
      bufferMinutesOverride: data.bufferMinutesOverride ?? null,
      sortOrder: data.sortOrder ?? 0,
    });

    if (data.imageUrl) {
      await db.orm.public.Media.create({
        url: data.imageUrl,
        type: 'IMAGE',
        provider: 'local',
        serviceId: created.id,
      });
    }

    return {
      id: created.id,
      slug: created.slug,
      name: created.name,
      description: created.description,
      category: created.category,
      startingPrice: String(created.startingPrice),
      durationMinutes: created.durationMinutes,
      warrantyText: created.warrantyText,
      benefits: [...(created.benefits ?? [])],
      isEnabled: created.isEnabled,
      isBookable: created.isBookable,
      bufferMinutesOverride: created.bufferMinutesOverride,
      sortOrder: created.sortOrder,
      imageUrl: data.imageUrl || DEFAULT_SERVICE_IMAGES[created.slug] || '/ceramic-detail.jpg',
    };
  }

  async updateService(id: string, data: UpdateServiceInput): Promise<ServiceDetail> {
    const updatePayload: Record<string, any> = {};
    if (data.slug !== undefined) updatePayload['slug'] = data.slug;
    if (data.name !== undefined) updatePayload['name'] = data.name;
    if (data.description !== undefined) updatePayload['description'] = data.description;
    if (data.category !== undefined) updatePayload['category'] = data.category;
    if (data.startingPrice !== undefined) updatePayload['startingPrice'] = data.startingPrice;
    if (data.durationMinutes !== undefined) updatePayload['durationMinutes'] = data.durationMinutes;
    if (data.warrantyText !== undefined) updatePayload['warrantyText'] = data.warrantyText;
    if (data.benefits !== undefined) updatePayload['benefits'] = data.benefits;
    if (data.isEnabled !== undefined) updatePayload['isEnabled'] = data.isEnabled;
    if (data.isBookable !== undefined) updatePayload['isBookable'] = data.isBookable;
    if (data.bufferMinutesOverride !== undefined) updatePayload['bufferMinutesOverride'] = data.bufferMinutesOverride;
    if (data.sortOrder !== undefined) updatePayload['sortOrder'] = data.sortOrder;

    if (Object.keys(updatePayload).length > 0) {
      await db.orm.public.Service.where({ id }).update(updatePayload);
    }

    if (data.imageUrl !== undefined) {
      const existingMedia = await db.orm.public.Media.where({ serviceId: id }).first();
      if (existingMedia) {
        if (data.imageUrl) {
          await db.orm.public.Media.where({ id: existingMedia.id }).update({ url: data.imageUrl });
        } else {
          await db.orm.public.Media.where({ id: existingMedia.id }).delete();
        }
      } else if (data.imageUrl) {
        await db.orm.public.Media.create({
          url: data.imageUrl,
          type: 'IMAGE',
          provider: 'local',
          serviceId: id,
        });
      }
    }

    const updated = await this.getServiceById(id);
    if (!updated) throw new Error(`Service ${id} not found after update`);
    return updated;
  }

  async reorderServices(items: Array<{ id: string; sortOrder: number }>): Promise<void> {
    for (const item of items) {
      await db.orm.public.Service.where({ id: item.id }).update({ sortOrder: item.sortOrder });
    }
  }

  async deleteService(id: string): Promise<void> {
    // Soft delete per PRD FR-34
    await db.orm.public.Service.where({ id }).update({
      deletedAt: new Date().toISOString(),
      isEnabled: false,
      isBookable: false,
    });
  }

  // ── Packages ──

  async listPackages(options?: { enabledOnly?: boolean }): Promise<PackageListItem[]> {
    let query = db.orm.public.Package
      .where((p) => p.deletedAt.isNull());

    if (options?.enabledOnly) {
      query = query.where((p) => p.isEnabled.eq(true));
    }

    const packages = await query.orderBy((p) => p.sortOrder.asc()).all();

    const packageIds = packages.map((p) => p.id);
    let links: Array<{ packageId: string; serviceId: string }> = [];
    if (packageIds.length > 0) {
      links = await db.orm.public.PackageService.all();
    }
    const linkMap = new Map<string, string[]>();
    for (const l of links) {
      const arr = linkMap.get(l.packageId) ?? [];
      arr.push(l.serviceId);
      linkMap.set(l.packageId, arr);
    }

    const mediaList = await db.orm.public.Media.all();
    const mediaMap = new Map<string, string>();
    for (const m of mediaList) {
      if (m.packageId && !mediaMap.has(m.packageId)) {
        mediaMap.set(m.packageId, m.url);
      }
    }

    return packages.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      price: p.price ? String(p.price) : null,
      startingPrice: p.startingPrice ? String(p.startingPrice) : null,
      durationMinutes: p.durationMinutes,
      benefits: [...(p.benefits ?? [])],
      warrantyText: p.warrantyText,
      validityText: p.validityText,
      terms: p.terms,
      isEnabled: p.isEnabled,
      isBookable: p.isBookable,
      sortOrder: p.sortOrder,
      serviceIds: linkMap.get(p.id) ?? [],
      imageUrl: mediaMap.get(p.id) || '/ppf-install.jpg',
    }));
  }

  async getPackageBySlug(slug: string): Promise<PackageDetail | null> {
    const p = await db.orm.public.Package
      .where((p) => p.slug.eq(slug))
      .where((p) => p.deletedAt.isNull())
      .first();

    if (!p) return null;

    const links = await db.orm.public.PackageService
      .where({ packageId: p.id })
      .all();

    const media = await db.orm.public.Media.where({ packageId: p.id }).first();

    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      price: p.price ? String(p.price) : null,
      startingPrice: p.startingPrice ? String(p.startingPrice) : null,
      durationMinutes: p.durationMinutes,
      benefits: [...(p.benefits ?? [])],
      warrantyText: p.warrantyText,
      validityText: p.validityText,
      terms: p.terms,
      isEnabled: p.isEnabled,
      isBookable: p.isBookable,
      sortOrder: p.sortOrder,
      serviceIds: links.map((l) => l.serviceId),
      imageUrl: media?.url || '/ppf-install.jpg',
    };
  }

  async getPackageById(id: string): Promise<PackageDetail | null> {
    const p = await db.orm.public.Package
      .where({ id })
      .where((p) => p.deletedAt.isNull())
      .first();

    if (!p) return null;

    const links = await db.orm.public.PackageService
      .where({ packageId: p.id })
      .all();

    const media = await db.orm.public.Media.where({ packageId: p.id }).first();

    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      price: p.price ? String(p.price) : null,
      startingPrice: p.startingPrice ? String(p.startingPrice) : null,
      durationMinutes: p.durationMinutes,
      benefits: [...(p.benefits ?? [])],
      warrantyText: p.warrantyText,
      validityText: p.validityText,
      terms: p.terms,
      isEnabled: p.isEnabled,
      isBookable: p.isBookable,
      sortOrder: p.sortOrder,
      serviceIds: links.map((l) => l.serviceId),
      imageUrl: media?.url || '/ppf-install.jpg',
    };
  }

  async createPackage(data: CreatePackageInput): Promise<PackageDetail> {
    const created = await db.orm.public.Package.create({
      slug: data.slug,
      name: data.name,
      description: data.description,
      price: data.price ?? null,
      startingPrice: data.startingPrice ?? null,
      durationMinutes: data.durationMinutes,
      benefits: data.benefits ?? [],
      warrantyText: data.warrantyText ?? null,
      validityText: data.validityText ?? null,
      terms: data.terms ?? null,
      isEnabled: data.isEnabled ?? true,
      isBookable: data.isBookable ?? true,
      sortOrder: data.sortOrder ?? 0,
    });

    if (data.imageUrl) {
      await db.orm.public.Media.create({
        url: data.imageUrl,
        type: 'IMAGE',
        provider: 'local',
        packageId: created.id,
      });
    }

    if (data.serviceIds && data.serviceIds.length > 0) {
      for (const serviceId of data.serviceIds) {
        await db.orm.public.PackageService.create({
          packageId: created.id,
          serviceId,
        });
      }
    }

    return {
      id: created.id,
      slug: created.slug,
      name: created.name,
      description: created.description,
      price: created.price ? String(created.price) : null,
      startingPrice: created.startingPrice ? String(created.startingPrice) : null,
      durationMinutes: created.durationMinutes,
      benefits: [...(created.benefits ?? [])],
      warrantyText: created.warrantyText,
      validityText: created.validityText,
      terms: created.terms,
      isEnabled: created.isEnabled,
      isBookable: created.isBookable,
      sortOrder: created.sortOrder,
      serviceIds: data.serviceIds ?? [],
      imageUrl: data.imageUrl || '/ppf-install.jpg',
    };
  }

  async updatePackage(id: string, data: UpdatePackageInput): Promise<PackageDetail> {
    const updatePayload: Record<string, any> = {};
    if (data.slug !== undefined) updatePayload['slug'] = data.slug;
    if (data.name !== undefined) updatePayload['name'] = data.name;
    if (data.description !== undefined) updatePayload['description'] = data.description;
    if (data.price !== undefined) updatePayload['price'] = data.price;
    if (data.startingPrice !== undefined) updatePayload['startingPrice'] = data.startingPrice;
    if (data.durationMinutes !== undefined) updatePayload['durationMinutes'] = data.durationMinutes;
    if (data.benefits !== undefined) updatePayload['benefits'] = data.benefits;
    if (data.warrantyText !== undefined) updatePayload['warrantyText'] = data.warrantyText;
    if (data.validityText !== undefined) updatePayload['validityText'] = data.validityText;
    if (data.terms !== undefined) updatePayload['terms'] = data.terms;
    if (data.isEnabled !== undefined) updatePayload['isEnabled'] = data.isEnabled;
    if (data.isBookable !== undefined) updatePayload['isBookable'] = data.isBookable;
    if (data.sortOrder !== undefined) updatePayload['sortOrder'] = data.sortOrder;

    if (Object.keys(updatePayload).length > 0) {
      await db.orm.public.Package.where({ id }).update(updatePayload);
    }

    if (data.imageUrl !== undefined) {
      const existingMedia = await db.orm.public.Media.where({ packageId: id }).first();
      if (existingMedia) {
        if (data.imageUrl) {
          await db.orm.public.Media.where({ id: existingMedia.id }).update({ url: data.imageUrl });
        } else {
          await db.orm.public.Media.where({ id: existingMedia.id }).delete();
        }
      } else if (data.imageUrl) {
        await db.orm.public.Media.create({
          url: data.imageUrl,
          type: 'IMAGE',
          provider: 'local',
          packageId: id,
        });
      }
    }

    if (data.serviceIds !== undefined) {
      // Re-link services
      await db.orm.public.PackageService.where({ packageId: id }).delete();
      for (const serviceId of data.serviceIds) {
        await db.orm.public.PackageService.create({
          packageId: id,
          serviceId,
        });
      }
    }

    const updated = await this.getPackageById(id);
    if (!updated) throw new Error(`Package ${id} not found after update`);
    return updated;
  }

  async reorderPackages(items: Array<{ id: string; sortOrder: number }>): Promise<void> {
    for (const item of items) {
      await db.orm.public.Package.where({ id: item.id }).update({ sortOrder: item.sortOrder });
    }
  }

  async deletePackage(id: string): Promise<void> {
    // Soft delete
    await db.orm.public.Package.where({ id }).update({
      deletedAt: new Date().toISOString(),
      isEnabled: false,
      isBookable: false,
    });
  }
}

export const catalogueService = new CatalogueService();
