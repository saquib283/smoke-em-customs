import { describe, it } from 'node:test';
import assert from 'node:assert';

/* ─── Simulated CRM Matching Store ─── */

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  vehicles: Vehicle[];
}

interface Vehicle {
  id: string;
  customerId: string;
  brand: string;
  model: string;
  variant?: string;
}

interface Lead {
  id: string;
  customerId: string;
  vehicleId?: string;
  source: string;
  isDuplicate: boolean;
  createdAt: Date;
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  return digits;
}

class SimulatedCRMService {
  private customers: Customer[] = [];
  private leads: Lead[] = [];

  findOrCreateCustomer(input: { name: string; phone: string; email?: string }): { customer: Customer; isNew: boolean } {
    const normalized = normalizePhone(input.phone);
    const customer = this.customers.find((c) => c.phone === normalized);

    if (customer) {
      if (input.email && !customer.email) {
        customer.email = input.email.trim();
      }
      return { customer, isNew: false };
    }

    const newCustomer: Customer = {
      id: `cust-${this.customers.length + 1}`,
      name: input.name.trim(),
      phone: normalized,
      email: input.email?.trim(),
      vehicles: [],
    };
    this.customers.push(newCustomer);
    return { customer: newCustomer, isNew: true };
  }

  findOrAddVehicle(customerId: string, vehicleData: { brand: string; model: string; variant?: string }): Vehicle {
    const customer = this.customers.find((c) => c.id === customerId);
    if (!customer) throw new Error('Customer not found');

    const normBrand = vehicleData.brand.toLowerCase().trim();
    const normModel = vehicleData.model.toLowerCase().trim();

    const existing = customer.vehicles.find(
      (v) => v.brand.toLowerCase().trim() === normBrand && v.model.toLowerCase().trim() === normModel
    );

    if (existing) {
      return existing;
    }

    const newVehicle: Vehicle = {
      id: `veh-${customer.vehicles.length + 1}`,
      customerId,
      brand: vehicleData.brand.trim(),
      model: vehicleData.model.trim(),
      variant: vehicleData.variant?.trim(),
    };
    customer.vehicles.push(newVehicle);
    return newVehicle;
  }

  createLead(input: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    vehicleBrand?: string;
    vehicleModel?: string;
    source?: string;
    submittedAt?: Date;
  }): { lead: Lead; customer: Customer; vehicle?: Vehicle; isDuplicate: boolean } {
    const now = input.submittedAt || new Date();
    const { customer } = this.findOrCreateCustomer({
      name: input.customerName,
      phone: input.customerPhone,
      email: input.customerEmail,
    });

    let vehicle: Vehicle | undefined;
    if (input.vehicleBrand && input.vehicleModel) {
      vehicle = this.findOrAddVehicle(customer.id, {
        brand: input.vehicleBrand,
        model: input.vehicleModel,
      });
    }

    // Check duplicate within 24h for same customer and vehicle
    const isDuplicate = this.leads.some((l) => {
      if (l.customerId !== customer.id) return false;
      if (vehicle && l.vehicleId !== vehicle.id) return false;
      const diffHours = (now.getTime() - l.createdAt.getTime()) / (1000 * 60 * 60);
      return diffHours >= 0 && diffHours <= 24;
    });

    const lead: Lead = {
      id: `lead-${this.leads.length + 1}`,
      customerId: customer.id,
      vehicleId: vehicle?.id,
      source: input.source || 'web_quote',
      isDuplicate,
      createdAt: now,
    };
    this.leads.push(lead);

    return { lead, customer, vehicle, isDuplicate };
  }
}

describe('Lead Creation with Customer Matching Integration (PRD §8, §19 & Architecture §11)', () => {
  it('matches customer across different phone number formats (+91, spaces, 10 digits)', () => {
    const crm = new SimulatedCRMService();

    // First inquiry with formatted number
    const res1 = crm.createLead({
      customerName: 'Vikram Malhotra',
      customerPhone: '+91 98765 43210',
      vehicleBrand: 'Porsche',
      vehicleModel: '911 Carrera',
    });
    assert.strictEqual(res1.customer.id, 'cust-1');
    assert.strictEqual(res1.customer.phone, '919876543210');
    assert.strictEqual(res1.isDuplicate, false);

    // Second inquiry 2 days later with 10 digits
    const res2 = crm.createLead({
      customerName: 'Vikram M.',
      customerPhone: '9876543210',
      vehicleBrand: 'BMW',
      vehicleModel: 'M4 Competition',
      submittedAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    });

    // Re-uses customer-1
    assert.strictEqual(res2.customer.id, 'cust-1');
    // Garage now has 2 distinct vehicles
    assert.strictEqual(res2.customer.vehicles.length, 2);
  });

  it('detects duplicate lead submissions for the same customer & vehicle within 24 hours', () => {
    const crm = new SimulatedCRMService();
    const t0 = new Date('2026-10-15T09:00:00Z');
    const t4 = new Date('2026-10-15T13:00:00Z'); // 4 hours later

    const first = crm.createLead({
      customerName: 'Ananya Roy',
      customerPhone: '9123456789',
      vehicleBrand: 'Audi',
      vehicleModel: 'RS5',
      submittedAt: t0,
    });
    assert.strictEqual(first.isDuplicate, false);

    const duplicate = crm.createLead({
      customerName: 'Ananya Roy',
      customerPhone: '9123456789',
      vehicleBrand: 'Audi',
      vehicleModel: 'RS5',
      submittedAt: t4,
    });
    assert.strictEqual(duplicate.isDuplicate, true);
    assert.strictEqual(duplicate.customer.id, first.customer.id);
    assert.strictEqual(duplicate.vehicle?.id, first.vehicle?.id);
  });

  it('populates customer email when provided on subsequent inquiry without overwriting', () => {
    const crm = new SimulatedCRMService();

    // First inquiry: phone only
    const lead1 = crm.createLead({
      customerName: 'Dev Patel',
      customerPhone: '9811122233',
    });
    assert.strictEqual(lead1.customer.email, undefined);

    // Second inquiry: adds email
    const lead2 = crm.createLead({
      customerName: 'Dev Patel',
      customerPhone: '9811122233',
      customerEmail: 'dev.patel@luxury.com',
      submittedAt: new Date(Date.now() + 30 * 60 * 1000),
    });
    assert.strictEqual(lead2.customer.email, 'dev.patel@luxury.com');
  });
});
