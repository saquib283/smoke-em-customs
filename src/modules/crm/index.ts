/**
 * CRM Module — Implementation
 * Manages customers, vehicles, leads, and the lead pipeline.
 * Architecture §9 & §11
 */

import { db } from '@/prisma/db';
import { notificationsService } from '@/modules/notifications';

export interface CustomerListItem {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  vehicleCount: number;
  leadCount: number;
  createdAt: string;
}

export interface CustomerDetail extends CustomerListItem {
  preferredContactMethod: string;
  vehicles: VehicleDetail[];
}

export interface FindOrCreateCustomerInput {
  name: string;
  phone: string;
  email?: string;
  preferredContactMethod?: 'CALL' | 'WHATSAPP' | 'EMAIL';
}

export type UpdateCustomerInput = Partial<FindOrCreateCustomerInput>;

export interface VehicleDetail {
  id: string;
  customerId: string;
  brand: string;
  model: string;
  variant: string | null;
  manufactureYear: number | null;
  vehicleType: string | null;
}

export interface VehicleWithRelations extends VehicleDetail {
  customerName: string;
  customerPhone: string;
  leadCount: number;
  bookingCount: number;
  createdAt: string;
}

export interface CreateVehicleInput {
  brand: string;
  model: string;
  variant?: string;
  manufactureYear?: number;
  vehicleType?: 'HATCHBACK' | 'SEDAN' | 'SUV' | 'MUV' | 'LUXURY' | 'TWO_WHEELER' | 'OTHER';
}

export type UpdateVehicleInput = Partial<CreateVehicleInput>;

export interface LeadListItem {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  vehicleId: string | null;
  vehicleText: string | null;
  status: string;
  source: string | null;
  assignedToName: string | null;
  serviceInterestName: string | null;
  needsFollowUp: boolean;
  isDuplicate: boolean;
  photosCount: number;
  createdAt: string;
}

export interface LeadDetail extends LeadListItem {
  vehicleCondition: string | null;
  existingScratches: boolean | null;
  paintCondition: string | null;
  existingCoatingOrPpf: string | null;
  desiredResult: string | null;
  budgetRangeMin: string | null;
  budgetRangeMax: string | null;
  preferredDate: string | null;
  additionalNotes: string | null;
  possibleDuplicateOfId: string | null;
  customer: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    preferredContactMethod: string;
  };
  vehicle: VehicleDetail | null;
  serviceInterest: {
    id: string;
    name: string;
    slug: string;
  } | null;
  photos: Array<{
    id: string;
    url: string;
    altText: string | null;
  }>;
  notes: Array<{
    id: string;
    authorName: string;
    body: string;
    createdAt: string;
  }>;
  statusHistory: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    changedAt: string;
  }>;
  quotes?: any[];
}

export interface CreateLeadInput {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  preferredContactMethod?: 'CALL' | 'WHATSAPP' | 'EMAIL';
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleType?: 'HATCHBACK' | 'SEDAN' | 'SUV' | 'MUV' | 'LUXURY' | 'TWO_WHEELER' | 'OTHER';
  vehicleYear?: number;
  serviceInterestId?: string;
  vehicleCondition?: string;
  existingScratches?: boolean;
  paintCondition?: string;
  existingCoatingOrPpf?: string;
  desiredResult?: string;
  budgetRangeMin?: string;
  budgetRangeMax?: string;
  preferredDate?: string;
  additionalNotes?: string;
  photoMediaIds?: string[];
  source?: string;
}

export interface ListLeadsOptions {
  status?: string;
  assignedToId?: string;
  search?: string;
  needsFollowUpOnly?: boolean;
  duplicatesOnly?: boolean;
  page?: number;
  perPage?: number;
}

export interface ListCustomersOptions {
  search?: string;
  page?: number;
  perPage?: number;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingCustomerId?: string;
  existingLeadIds?: string[];
}

export class CRMService {
  // ── Customer Management ──

  async findOrCreateCustomer(data: FindOrCreateCustomerInput): Promise<CustomerDetail> {
    const cleanPhone = data.phone.trim().replace(/\s+/g, '');
    const digits = data.phone.replace(/\D/g, '');

    let existing = await db.orm.public.Customer.where({ phone: cleanPhone }).first();

    if (!existing && digits.length === 10) {
      existing = await db.orm.public.Customer.where({ phone: `91${digits}` }).first();
    }
    if (!existing && digits.length === 12 && digits.startsWith('91')) {
      existing = await db.orm.public.Customer.where({ phone: digits.substring(2) }).first();
    }

    if (existing) {
      if (data.email && !existing.email) {
        await db.orm.public.Customer.where({ id: existing.id }).update({ email: data.email });
      }
      return this.getCustomer(existing.id) as Promise<CustomerDetail>;
    }

    const created = await db.orm.public.Customer.create({
      name: data.name.trim(),
      phone: cleanPhone,
      email: data.email ?? null,
      preferredContactMethod: data.preferredContactMethod ?? 'WHATSAPP',
    });

    return {
      id: created.id,
      name: created.name,
      phone: created.phone,
      email: created.email,
      preferredContactMethod: created.preferredContactMethod,
      vehicleCount: 0,
      leadCount: 0,
      createdAt: created.createdAt,
      vehicles: [],
    };
  }

  async getCustomer(id: string): Promise<CustomerDetail | null> {
    const c = await db.orm.public.Customer.where({ id }).first();
    if (!c) return null;

    const vehicles = await db.orm.public.Vehicle
      .where({ customerId: id })
      .all();

    const leads = await db.orm.public.Lead
      .where({ customerId: id })
      .all();

    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      preferredContactMethod: c.preferredContactMethod,
      vehicleCount: vehicles.length,
      leadCount: leads.length,
      createdAt: c.createdAt,
      vehicles: vehicles.map((v) => ({
        id: v.id,
        customerId: v.customerId,
        brand: v.brand,
        model: v.model,
        variant: v.variant,
        manufactureYear: v.manufactureYear,
        vehicleType: v.vehicleType,
      })),
    };
  }

  async getCustomerByPhone(rawPhone: string): Promise<CustomerDetail | null> {
    const digits = rawPhone.replace(/\D/g, '');
    const cleanPhone = rawPhone.trim().replace(/\s+/g, '');

    let customer = await db.orm.public.Customer.where({ phone: cleanPhone }).first();

    if (!customer && digits.length === 10) {
      customer = await db.orm.public.Customer.where({ phone: `91${digits}` }).first();
    }
    if (!customer && digits.length === 12 && digits.startsWith('91')) {
      customer = await db.orm.public.Customer.where({ phone: digits.substring(2) }).first();
    }

    if (!customer) return null;
    return this.getCustomer(customer.id);
  }

  async listCustomers(options?: ListCustomersOptions): Promise<CustomerListItem[]> {
    const query = db.orm.public.Customer;

    const customers = await query.orderBy((c) => c.createdAt.desc()).all();

    const result: CustomerListItem[] = [];
    for (const c of customers) {
      if (options?.search) {
        const q = options.search.toLowerCase();
        if (!c.name.toLowerCase().includes(q) && !c.phone.includes(q) && !(c.email && c.email.toLowerCase().includes(q))) {
          continue;
        }
      }

      const vehicles = await db.orm.public.Vehicle.where({ customerId: c.id }).all();
      const leads = await db.orm.public.Lead.where({ customerId: c.id }).all();

      result.push({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        vehicleCount: vehicles.length,
        leadCount: leads.length,
        createdAt: c.createdAt,
      });
    }

    return result;
  }

  async updateCustomer(id: string, data: UpdateCustomerInput): Promise<CustomerDetail> {
    const updatePayload: Record<string, any> = {};
    if (data.name !== undefined) updatePayload['name'] = data.name.trim();
    if (data.phone !== undefined) updatePayload['phone'] = data.phone.trim().replace(/\s+/g, '');
    if (data.email !== undefined) updatePayload['email'] = data.email;
    if (data.preferredContactMethod !== undefined) updatePayload['preferredContactMethod'] = data.preferredContactMethod;

    await db.orm.public.Customer.where({ id }).update(updatePayload);
    const updated = await this.getCustomer(id);
    if (!updated) throw new Error(`Customer ${id} not found after update`);
    return updated;
  }

  // ── Vehicle Management ──

  async addVehicle(customerId: string, data: CreateVehicleInput): Promise<VehicleDetail> {
    const created = await db.orm.public.Vehicle.create({
      customerId,
      brand: data.brand.trim(),
      model: data.model.trim(),
      variant: data.variant ?? null,
      manufactureYear: data.manufactureYear ?? null,
      vehicleType: data.vehicleType ?? null,
    });

    return {
      id: created.id,
      customerId: created.customerId,
      brand: created.brand,
      model: created.model,
      variant: created.variant,
      manufactureYear: created.manufactureYear,
      vehicleType: created.vehicleType,
    };
  }

  async updateVehicle(id: string, data: UpdateVehicleInput): Promise<VehicleDetail> {
    const updatePayload: Record<string, any> = {};
    if (data.brand !== undefined) updatePayload['brand'] = data.brand.trim();
    if (data.model !== undefined) updatePayload['model'] = data.model.trim();
    if (data.variant !== undefined) updatePayload['variant'] = data.variant;
    if (data.manufactureYear !== undefined) updatePayload['manufactureYear'] = data.manufactureYear;
    if (data.vehicleType !== undefined) updatePayload['vehicleType'] = data.vehicleType;

    await db.orm.public.Vehicle.where({ id }).update(updatePayload);
    const v = await db.orm.public.Vehicle.where({ id }).first();
    if (!v) throw new Error(`Vehicle ${id} not found after update`);
    return {
      id: v.id,
      customerId: v.customerId,
      brand: v.brand,
      model: v.model,
      variant: v.variant,
      manufactureYear: v.manufactureYear,
      vehicleType: v.vehicleType,
    };
  }

  async deleteVehicle(id: string): Promise<void> {
    await db.orm.public.Vehicle.where({ id }).delete();
  }

  async listVehicles(customerId: string): Promise<VehicleDetail[]> {
    const list = await db.orm.public.Vehicle.where({ customerId }).all();
    return list.map((v) => ({
      id: v.id,
      customerId: v.customerId,
      brand: v.brand,
      model: v.model,
      variant: v.variant,
      manufactureYear: v.manufactureYear,
      vehicleType: v.vehicleType,
    }));
  }

  async listAllVehicles(options?: { search?: string; type?: string }): Promise<VehicleWithRelations[]> {
    let query = db.orm.public.Vehicle;
    if (options?.type) {
      query = query.where({ vehicleType: options.type as any });
    }

    const vehicles = await query.orderBy((v) => v.createdAt.desc()).all();
    const result: VehicleWithRelations[] = [];

    for (const v of vehicles) {
      const customer = await db.orm.public.Customer.where({ id: v.customerId }).first();
      const customerName = customer?.name ?? 'Unknown';
      const customerPhone = customer?.phone ?? '';

      if (options?.search) {
        const q = options.search.toLowerCase();
        const matches =
          v.brand.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q) ||
          (v.variant && v.variant.toLowerCase().includes(q)) ||
          customerName.toLowerCase().includes(q) ||
          customerPhone.includes(q);
        if (!matches) continue;
      }

      const leads = await db.orm.public.Lead.where({ vehicleId: v.id }).all();
      const bookings = await db.orm.public.Booking.where({ vehicleId: v.id }).all();

      result.push({
        id: v.id,
        customerId: v.customerId,
        brand: v.brand,
        model: v.model,
        variant: v.variant,
        manufactureYear: v.manufactureYear,
        vehicleType: v.vehicleType,
        customerName,
        customerPhone,
        leadCount: leads.length,
        bookingCount: bookings.length,
        createdAt: v.createdAt,
      });
    }

    return result;
  }

  async getVehicle(id: string) {
    const v = await db.orm.public.Vehicle.where({ id }).first();
    if (!v) return null;

    const customer = await db.orm.public.Customer.where({ id: v.customerId }).first();
    const leads = await db.orm.public.Lead
      .where({ vehicleId: id })
      .orderBy((l) => l.createdAt.desc())
      .all();
    const bookings = await db.orm.public.Booking
      .where({ vehicleId: id })
      .orderBy((b) => b.startAt.desc())
      .all();

    const formattedLeads = [];
    for (const l of leads) {
      const svc = l.serviceInterestId
        ? await db.orm.public.Service.where({ id: l.serviceInterestId }).first()
        : null;
      formattedLeads.push({
        id: l.id,
        status: l.status,
        serviceName: svc?.name ?? 'General Inquiry',
        createdAt: l.createdAt,
      });
    }

    const formattedBookings = [];
    for (const b of bookings) {
      const svc = b.serviceId
        ? await db.orm.public.Service.where({ id: b.serviceId }).first()
        : null;
      formattedBookings.push({
        id: b.id,
        status: b.status,
        serviceName: svc?.name ?? 'Studio Session',
        startAt: b.startAt,
      });
    }

    return {
      id: v.id,
      customerId: v.customerId,
      brand: v.brand,
      model: v.model,
      variant: v.variant,
      manufactureYear: v.manufactureYear,
      vehicleType: v.vehicleType,
      createdAt: v.createdAt,
      customer: customer ? {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
      } : null,
      leads: formattedLeads,
      bookings: formattedBookings,
    };
  }

  // ── Lead Management ──

  async checkDuplicate(phone: string, vehicleBrand?: string, vehicleModel?: string): Promise<DuplicateCheckResult> {
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const digits = phone.replace(/\D/g, '');

    let customer = await db.orm.public.Customer.where({ phone: cleanPhone }).first();

    if (!customer && digits.length === 10) {
      customer = await db.orm.public.Customer.where({ phone: `91${digits}` }).first();
    }
    if (!customer && digits.length === 12 && digits.startsWith('91')) {
      customer = await db.orm.public.Customer.where({ phone: digits.substring(2) }).first();
    }

    if (!customer) {
      return { isDuplicate: false };
    }

    // 24-hour threshold window
    const now = Date.now();
    const twentyFourHoursAgoIso = new Date(now - 24 * 60 * 60 * 1000).toISOString();

    const recentLeads = await db.orm.public.Lead
      .where({ customerId: customer.id })
      .where((l) => l.createdAt.gte(twentyFourHoursAgoIso))
      .orderBy((l) => l.createdAt.desc())
      .all();

    if (recentLeads.length === 0) {
      return { isDuplicate: false, existingCustomerId: customer.id };
    }

    // If vehicle parameters are provided, match vehicle brand and model
    if (vehicleBrand && vehicleModel) {
      for (const rl of recentLeads) {
        if (rl.vehicleId) {
          const v = await db.orm.public.Vehicle.where({ id: rl.vehicleId }).first();
          if (
            v &&
            v.brand.toLowerCase().trim() === vehicleBrand.toLowerCase().trim() &&
            v.model.toLowerCase().trim() === vehicleModel.toLowerCase().trim()
          ) {
            return {
              isDuplicate: true,
              existingCustomerId: customer.id,
              existingLeadIds: [rl.id],
            };
          }
        }
      }
    }

    return {
      isDuplicate: true,
      existingCustomerId: customer.id,
      existingLeadIds: recentLeads.map((l) => l.id),
    };
  }

  async createLead(data: CreateLeadInput): Promise<LeadDetail> {
    // 1. Find or create Customer
    const customer = await this.findOrCreateCustomer({
      name: data.customerName,
      phone: data.customerPhone,
      email: data.customerEmail,
      preferredContactMethod: data.preferredContactMethod,
    });

    // 2. Add or find Vehicle if brand and model are present
    let vehicleId: string | null = null;
    if (data.vehicleBrand && data.vehicleModel) {
      const existingVehicle = await db.orm.public.Vehicle
        .where({ customerId: customer.id })
        .where((v) => v.brand.ilike(data.vehicleBrand!.trim()))
        .where((v) => v.model.ilike(data.vehicleModel!.trim()))
        .first();

      if (existingVehicle) {
        vehicleId = existingVehicle.id;
      } else {
        const newVehicle = await this.addVehicle(customer.id, {
          brand: data.vehicleBrand,
          model: data.vehicleModel,
          manufactureYear: data.vehicleYear,
          vehicleType: data.vehicleType,
        });
        vehicleId = newVehicle.id;
      }
    }

    // 3. 24-hour Duplicate check
    const dupCheck = await this.checkDuplicate(data.customerPhone, data.vehicleBrand, data.vehicleModel);
    const possibleDuplicateOfId = dupCheck.isDuplicate ? (dupCheck.existingLeadIds?.[0] ?? null) : null;

    // 4. Create Lead
    const lead = await db.orm.public.Lead.create({
      customerId: customer.id,
      vehicleId,
      status: 'NEW',
      serviceInterestId: data.serviceInterestId ?? null,
      vehicleCondition: data.vehicleCondition ?? null,
      existingScratches: data.existingScratches ?? null,
      paintCondition: data.paintCondition ?? null,
      existingCoatingOrPpf: data.existingCoatingOrPpf ?? null,
      desiredResult: data.desiredResult ?? null,
      budgetRangeMin: data.budgetRangeMin ?? null,
      budgetRangeMax: data.budgetRangeMax ?? null,
      preferredDate: data.preferredDate ?? null,
      additionalNotes: data.additionalNotes ?? null,
      possibleDuplicateOfId,
      source: data.source ?? 'public_web',
    });

    // 5. Link uploaded photos if provided
    if (data.photoMediaIds && data.photoMediaIds.length > 0) {
      for (const mediaId of data.photoMediaIds) {
        try {
          await db.orm.public.LeadPhoto.create({
            leadId: lead.id,
            mediaId,
          });
        } catch {
          // Continue if already linked
        }
      }
    }

    // 6. Initial status history
    await db.orm.public.LeadStatusHistory.create({
      leadId: lead.id,
      fromStatus: null,
      toStatus: 'NEW',
    });

    // 7. Dispatch event through notification event bus (Architecture §13)
    try {
      await notificationsService.emitEvent({
        type: 'lead.created',
        leadId: lead.id,
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        vehicleText: data.vehicleBrand
          ? `${data.vehicleBrand} ${data.vehicleModel ?? ''}`.trim()
          : null,
        serviceInterest: data.serviceInterestId ?? null,
      });
    } catch (err) {
      console.warn('Note: Event emission failed for lead creation:', err);
    }

    return (await this.getLead(lead.id))!;
  }

  async getLead(id: string): Promise<LeadDetail | null> {
    const lead = await db.orm.public.Lead.where({ id }).first();
    if (!lead) return null;

    const customer = await db.orm.public.Customer.where({ id: lead.customerId }).first();
    const vehicle = lead.vehicleId
      ? await db.orm.public.Vehicle.where({ id: lead.vehicleId }).first()
      : null;

    const service = lead.serviceInterestId
      ? await db.orm.public.Service.where({ id: lead.serviceInterestId }).first()
      : null;

    const assignee = lead.assignedToId
      ? await db.orm.public.AdminUser.where({ id: lead.assignedToId }).first()
      : null;

    const notes = await db.orm.public.LeadNote
      .where({ leadId: id })
      .orderBy((n) => n.createdAt.desc())
      .all();

    const statusHistory = await db.orm.public.LeadStatusHistory
      .where({ leadId: id })
      .orderBy((h) => h.changedAt.asc())
      .all();

    const formattedNotes = [];
    for (const note of notes) {
      const author = await db.orm.public.AdminUser.where({ id: note.authorId }).first();
      formattedNotes.push({
        id: note.id,
        authorName: author?.name ?? 'Admin',
        body: note.body,
        createdAt: note.createdAt,
      });
    }

    // Fetch linked photos
    const leadPhotos = await db.orm.public.LeadPhoto.where({ leadId: id }).all();
    const photos: Array<{ id: string; url: string; altText: string | null }> = [];
    for (const lp of leadPhotos) {
      const media = await db.orm.public.Media.where({ id: lp.mediaId }).first();
      if (media) {
        photos.push({
          id: media.id,
          url: media.url,
          altText: media.altText,
        });
      }
    }

    // Fetch linked quotes
    const dbQuotes = await db.orm.public.Quote
      .where({ leadId: id })
      .orderBy((q) => q.createdAt.desc())
      .all();

    const quotes = [];
    for (const q of dbQuotes) {
      const items = await db.orm.public.QuoteItem.where({ quoteId: q.id }).all();
      quotes.push({
        id: q.id,
        customerId: q.customerId,
        customerName: customer?.name ?? 'Client',
        customerPhone: customer?.phone ?? '',
        customerEmail: customer?.email ?? null,
        vehicleId: q.vehicleId ?? null,
        vehicleText: vehicle ? `${vehicle.brand} ${vehicle.model}` : null,
        status: q.status,
        total: String(q.total),
        subtotal: String(q.subtotal),
        discount: String(q.discount),
        tax: String(q.tax),
        itemCount: items.length,
        validUntil: q.validUntil,
        createdAt: q.createdAt,
        notes: q.notes ?? null,
        terms: q.terms ?? null,
        items: items.map((it) => ({
          id: it.id,
          serviceId: it.serviceId ?? null,
          packageId: it.packageId ?? null,
          description: it.description,
          quantity: it.quantity,
          unitPrice: String(it.unitPrice),
          lineTotal: String(it.lineTotal),
        })),
        linkedBookingId: null,
      });
    }

    // Follow-up & duplicate flags
    const isClosed = ['BOOKED', 'COMPLETED', 'LOST'].includes(lead.status);
    const lastActivity = new Date(lead.updatedAt || lead.createdAt).getTime();
    const diffDays = (Date.now() - lastActivity) / (1000 * 60 * 60 * 24);
    const needsFollowUp = !isClosed && diffDays >= 3;
    const isDuplicate = Boolean(lead.possibleDuplicateOfId);

    return {
      id: lead.id,
      customerId: lead.customerId,
      customerName: customer?.name ?? 'Unknown',
      customerPhone: customer?.phone ?? '',
      vehicleId: lead.vehicleId,
      vehicleText: vehicle ? `${vehicle.brand} ${vehicle.model}` : null,
      status: lead.status,
      source: lead.source,
      assignedToName: assignee?.name ?? null,
      serviceInterestName: service?.name ?? null,
      needsFollowUp,
      isDuplicate,
      photosCount: photos.length,
      createdAt: lead.createdAt,
      vehicleCondition: lead.vehicleCondition,
      existingScratches: lead.existingScratches,
      paintCondition: lead.paintCondition,
      existingCoatingOrPpf: lead.existingCoatingOrPpf,
      desiredResult: lead.desiredResult,
      budgetRangeMin: lead.budgetRangeMin ? String(lead.budgetRangeMin) : null,
      budgetRangeMax: lead.budgetRangeMax ? String(lead.budgetRangeMax) : null,
      preferredDate: lead.preferredDate,
      additionalNotes: lead.additionalNotes,
      possibleDuplicateOfId: lead.possibleDuplicateOfId,
      photos,
      customer: {
        id: customer?.id ?? '',
        name: customer?.name ?? 'Unknown',
        phone: customer?.phone ?? '',
        email: customer?.email ?? null,
        preferredContactMethod: customer?.preferredContactMethod ?? 'WHATSAPP',
      },
      vehicle: vehicle
        ? {
            id: vehicle.id,
            customerId: vehicle.customerId,
            brand: vehicle.brand,
            model: vehicle.model,
            variant: vehicle.variant,
            manufactureYear: vehicle.manufactureYear,
            vehicleType: vehicle.vehicleType,
          }
        : null,
      serviceInterest: service
        ? {
            id: service.id,
            name: service.name,
            slug: service.slug,
          }
        : null,
      notes: formattedNotes,
      statusHistory: statusHistory.map((h) => ({
        id: h.id,
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        changedAt: h.changedAt,
      })),
      quotes,
    };
  }

  async listLeads(options?: ListLeadsOptions): Promise<LeadListItem[]> {
    let query = db.orm.public.Lead;

    if (options?.status && options.status !== 'ALL') {
      query = query.where({ status: options.status as any });
    }
    if (options?.assignedToId) {
      query = query.where({ assignedToId: options.assignedToId });
    }

    const leads = await query.orderBy((l) => l.createdAt.desc()).all();

    const result: LeadListItem[] = [];
    for (const lead of leads) {
      const isClosed = ['BOOKED', 'COMPLETED', 'LOST'].includes(lead.status);
      const lastActivity = new Date(lead.updatedAt || lead.createdAt).getTime();
      const diffDays = (Date.now() - lastActivity) / (1000 * 60 * 60 * 24);
      const needsFollowUp = !isClosed && diffDays >= 3;
      const isDuplicate = Boolean(lead.possibleDuplicateOfId);

      if (options?.needsFollowUpOnly && !needsFollowUp) continue;
      if (options?.duplicatesOnly && !isDuplicate) continue;

      const customer = await db.orm.public.Customer.where({ id: lead.customerId }).first();
      const vehicle = lead.vehicleId
        ? await db.orm.public.Vehicle.where({ id: lead.vehicleId }).first()
        : null;
      const service = lead.serviceInterestId
        ? await db.orm.public.Service.where({ id: lead.serviceInterestId }).first()
        : null;
      const assignee = lead.assignedToId
        ? await db.orm.public.AdminUser.where({ id: lead.assignedToId }).first()
        : null;

      const customerName = customer?.name ?? 'Unknown';
      const customerPhone = customer?.phone ?? '';

      if (options?.search) {
        const q = options.search.toLowerCase();
        const matches =
          customerName.toLowerCase().includes(q) ||
          customerPhone.includes(q) ||
          (vehicle && `${vehicle.brand} ${vehicle.model}`.toLowerCase().includes(q));
        if (!matches) continue;
      }

      const leadPhotos = await db.orm.public.LeadPhoto.where({ leadId: lead.id }).all();

      result.push({
        id: lead.id,
        customerId: lead.customerId,
        customerName,
        customerPhone,
        vehicleId: lead.vehicleId,
        vehicleText: vehicle ? `${vehicle.brand} ${vehicle.model}` : null,
        status: lead.status,
        source: lead.source,
        assignedToName: assignee?.name ?? null,
        serviceInterestName: service?.name ?? null,
        needsFollowUp,
        isDuplicate,
        photosCount: leadPhotos.length,
        createdAt: lead.createdAt,
      });
    }

    return result;
  }

  async updateLeadStatus(id: string, status: string, notes?: string): Promise<LeadDetail> {
    const lead = await db.orm.public.Lead.where({ id }).first();
    if (!lead) throw new Error(`Lead ${id} not found`);

    const oldStatus = lead.status;
    await db.orm.public.Lead.where({ id }).update({ status: status as any });

    await db.orm.public.LeadStatusHistory.create({
      leadId: id,
      fromStatus: oldStatus,
      toStatus: status as any,
    });

    if (notes) {
      const admin = await db.orm.public.AdminUser.first();
      if (admin) {
        await this.addLeadNote(id, admin.id, `[Status -> ${status}] ${notes}`);
      }
    }

    try {
      const customer = await db.orm.public.Customer.where({ id: lead.customerId }).first();
      await notificationsService.emitEvent({
        type: 'lead.status_changed',
        leadId: id,
        customerId: lead.customerId,
        customerName: customer?.name ?? 'Client',
        fromStatus: oldStatus,
        toStatus: status,
      });
    } catch {
      // Non-blocking
    }

    return (await this.getLead(id))!;
  }

  async assignLead(id: string, assigneeId: string): Promise<LeadDetail> {
    await db.orm.public.Lead.where({ id }).update({ assignedToId: assigneeId });
    return (await this.getLead(id))!;
  }

  async addLeadNote(leadId: string, authorId: string, body: string): Promise<void> {
    await db.orm.public.LeadNote.create({
      leadId,
      authorId,
      body: body.trim(),
    });
  }
}

export const crmService = new CRMService();
