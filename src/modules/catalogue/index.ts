/**
 * Catalogue Module — Implementation
 * Manages services, packages, and their media.
 * Architecture §8
 */

import { db } from '@/prisma/db';

export interface ServiceListItem {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  startingPrice: string;
  durationMinutes: number;
  isEnabled: boolean;
  isBookable: boolean;
  sortOrder: number;
}

export interface ServiceDetail extends ServiceListItem {
  description: string;
  warrantyText: string | null;
  benefits: string[];
  bufferMinutesOverride: number | null;
}

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
}

export type UpdateServiceInput = Partial<CreateServiceInput>;

export interface PackageListItem {
  id: string;
  slug: string;
  name: string;
  price: string | null;
  startingPrice: string | null;
  durationMinutes: number;
  benefits: string[];
  warrantyText: string | null;
  isEnabled: boolean;
  isBookable: boolean;
  sortOrder: number;
  serviceIds: string[];
}

export interface PackageDetail extends PackageListItem {
  description: string;
  benefits: string[];
  warrantyText: string | null;
  validityText: string | null;
  terms: string | null;
  serviceIds: string[];
}

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
  serviceIds?: string[];
}

export type UpdatePackageInput = Partial<CreatePackageInput>;

export class CatalogueService {
  // ── Services ──

  async listServices(options?: { enabledOnly?: boolean }): Promise<ServiceListItem[]> {
    let query = db.orm.public.Service
      .select('id', 'slug', 'name', 'category', 'startingPrice', 'durationMinutes', 'isEnabled', 'isBookable', 'sortOrder')
      .where((s) => s.deletedAt.isNull());

    if (options?.enabledOnly) {
      query = query.where((s) => s.isEnabled.eq(true));
    }

    const services = await query.orderBy((s) => s.sortOrder.asc()).all();

    return services.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      category: s.category,
      startingPrice: String(s.startingPrice),
      durationMinutes: s.durationMinutes,
      isEnabled: s.isEnabled,
      isBookable: s.isBookable,
      sortOrder: s.sortOrder,
    }));
  }

  async getServiceBySlug(slug: string): Promise<ServiceDetail | null> {
    const s = await db.orm.public.Service
      .where((s) => s.slug.eq(slug))
      .where((s) => s.deletedAt.isNull())
      .first();

    if (!s) return null;

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
    };
  }

  async getServiceById(id: string): Promise<ServiceDetail | null> {
    const s = await db.orm.public.Service
      .where({ id })
      .where((s) => s.deletedAt.isNull())
      .first();

    if (!s) return null;

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
    });

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

    await db.orm.public.Service.where({ id }).update(updatePayload);
    const updated = await this.getServiceById(id);
    if (!updated) throw new Error(`Service ${id} not found after update`);
    return updated;
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
      .select('id', 'slug', 'name', 'price', 'startingPrice', 'durationMinutes', 'benefits', 'warrantyText', 'isEnabled', 'isBookable', 'sortOrder')
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

    return packages.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: p.price ? String(p.price) : null,
      startingPrice: p.startingPrice ? String(p.startingPrice) : null,
      durationMinutes: p.durationMinutes,
      benefits: [...(p.benefits ?? [])],
      warrantyText: p.warrantyText,
      isEnabled: p.isEnabled,
      isBookable: p.isBookable,
      sortOrder: p.sortOrder,
      serviceIds: linkMap.get(p.id) ?? [],
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
    });

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

    await db.orm.public.Package.where({ id }).update(updatePayload);

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
