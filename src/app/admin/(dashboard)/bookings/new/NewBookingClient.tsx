'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/common/Icons';
import { useToast } from '@/components/ui';
import styles from './newBooking.module.css';

interface CustomerOption {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  vehicleCount: number;
}

interface ServiceOption {
  id: string;
  slug: string;
  name: string;
  category: string;
  startingPrice: string;
  durationMinutes: number;
}

interface PackageOption {
  id: string;
  slug: string;
  name: string;
  startingPrice: string | null;
  price?: string | null;
  durationMinutes?: number | null;
}

interface ResourceOption {
  id: string;
  name: string;
  type: string;
}

interface VehicleItem {
  id: string;
  brand: string;
  model: string;
  variant?: string | null;
  manufactureYear?: number | null;
  vehicleType?: string | null;
}

interface NewBookingClientProps {
  customers: CustomerOption[];
  services: ServiceOption[];
  packages: PackageOption[];
  resources: ResourceOption[];
  initialCustomerId?: string;
  initialLeadId?: string;
  initialQuoteId?: string;
  initialVehicleId?: string;
  initialServiceId?: string;
  initialPackageId?: string;
  initialDate?: string;
}

const DEFAULT_TIME_SLOTS = [
  '09:30',
  '10:30',
  '11:30',
  '12:30',
  '14:00',
  '15:00',
  '16:30',
  '17:30',
];

export function NewBookingClient({
  customers,
  services,
  packages,
  resources,
  initialCustomerId,
  initialLeadId,
  initialQuoteId,
  initialVehicleId,
  initialServiceId,
  initialPackageId,
  initialDate,
}: NewBookingClientProps) {
  const router = useRouter();
  const { success, error: toastError, info } = useToast();

  // ── Customer State ──
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId || '');
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [showQuickAddCustomer, setShowQuickAddCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  // ── Vehicles State ──
  const [customerVehicles, setCustomerVehicles] = useState<VehicleItem[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(initialVehicleId || '');
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newVehicleBrand, setNewVehicleBrand] = useState('');
  const [newVehicleModel, setNewVehicleModel] = useState('');
  const [newVehicleYear, setNewVehicleYear] = useState('');
  const [creatingVehicle, setCreatingVehicle] = useState(false);

  // ── Service / Package State ──
  const [itemType, setItemType] = useState<'SERVICE' | 'PACKAGE'>(
    initialPackageId ? 'PACKAGE' : 'SERVICE'
  );
  const [selectedServiceId, setSelectedServiceId] = useState<string>(initialServiceId || (services[0]?.id ?? ''));
  const [selectedPackageId, setSelectedPackageId] = useState<string>(initialPackageId || (packages[0]?.id ?? ''));
  const [durationMinutes, setDurationMinutes] = useState<number>(120);
  const [priceQuoted, setPriceQuoted] = useState<string>('');

  // ── Bay & Schedule State ──
  const [selectedResourceId, setSelectedResourceId] = useState<string>(resources[0]?.id || '');
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [bookingDate, setBookingDate] = useState<string>(initialDate || todayStr);
  const [bookingTime, setBookingTime] = useState<string>('10:30');

  // ── Notes State ──
  const [customerNotes, setCustomerNotes] = useState<string>('');
  const [internalNotes, setInternalNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Find active customer object
  const activeCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  // Filter customer autocomplete
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return [];
    const q = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [customers, customerSearch]);

  // Load vehicles when customer changes
  useEffect(() => {
    if (!selectedCustomerId) {
      setCustomerVehicles([]);
      setSelectedVehicleId('');
      return;
    }
    setLoadingVehicles(true);
    fetch(`/api/admin/customers?id=${selectedCustomerId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.customer) {
          const vehs = data.customer.vehicles || [];
          setCustomerVehicles(vehs);
          if (vehs.length > 0 && !selectedVehicleId) {
            setSelectedVehicleId(vehs[0].id);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingVehicles(false));
  }, [selectedCustomerId]);

  // Sync default duration & price when service / package changes
  useEffect(() => {
    if (itemType === 'SERVICE') {
      const svc = services.find((s) => s.id === selectedServiceId);
      if (svc) {
        setDurationMinutes(svc.durationMinutes || 120);
        setPriceQuoted(svc.startingPrice || '');
      }
    } else {
      const pkg = packages.find((p) => p.id === selectedPackageId);
      if (pkg) {
        setDurationMinutes(pkg.durationMinutes || 180);
        setPriceQuoted(pkg.price || pkg.startingPrice || '');
      }
    }
  }, [itemType, selectedServiceId, selectedPackageId, services, packages]);

  // Handle Quick Add Customer
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim() || !newCustomerPhone.trim()) {
      toastError('Customer name and phone number are required');
      return;
    }
    setCreatingCustomer(true);
    try {
      const res = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_CUSTOMER',
          customerData: {
            name: newCustomerName.trim(),
            phone: newCustomerPhone.trim(),
            email: newCustomerEmail.trim() || undefined,
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.customer) {
        success('New customer profile created');
        setSelectedCustomerId(data.customer.id);
        setShowQuickAddCustomer(false);
        setCustomerSearch('');
      } else {
        toastError(data.error || 'Failed to create customer');
      }
    } catch {
      toastError('Network error creating customer');
    } finally {
      setCreatingCustomer(false);
    }
  };

  // Handle Add Vehicle
  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !newVehicleBrand.trim() || !newVehicleModel.trim()) {
      toastError('Brand and Model are required to register a vehicle');
      return;
    }
    setCreatingVehicle(true);
    try {
      const res = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_VEHICLE',
          customerId: selectedCustomerId,
          vehicleData: {
            brand: newVehicleBrand.trim(),
            model: newVehicleModel.trim(),
            manufactureYear: newVehicleYear ? parseInt(newVehicleYear, 10) : undefined,
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.vehicle) {
        success('Vehicle linked to client profile');
        setCustomerVehicles((prev) => [data.vehicle, ...prev]);
        setSelectedVehicleId(data.vehicle.id);
        setShowAddVehicle(false);
        setNewVehicleBrand('');
        setNewVehicleModel('');
        setNewVehicleYear('');
      } else {
        toastError(data.error || 'Failed to add vehicle');
      }
    } catch {
      toastError('Network error adding vehicle');
    } finally {
      setCreatingVehicle(false);
    }
  };

  // Submit Booking Reservation
  const handleSubmitBooking = async () => {
    if (!selectedCustomerId) {
      toastError('Please select or create a customer');
      return;
    }
    if (!selectedResourceId) {
      toastError('Please select an active detailing bay');
      return;
    }
    if (!bookingDate || !bookingTime) {
      toastError('Please specify appointment date and time');
      return;
    }

    setIsSubmitting(true);
    try {
      const startAtIso = new Date(`${bookingDate}T${bookingTime}:00.000Z`).toISOString();

      const bookingData = {
        customerId: selectedCustomerId,
        vehicleId: selectedVehicleId || undefined,
        leadId: initialLeadId || undefined,
        quoteId: initialQuoteId || undefined,
        serviceId: itemType === 'SERVICE' ? selectedServiceId : undefined,
        packageId: itemType === 'PACKAGE' ? selectedPackageId : undefined,
        resourceId: selectedResourceId,
        startAt: startAtIso,
        durationMinutes: Number(durationMinutes) || 120,
        priceQuoted: priceQuoted ? String(priceQuoted) : undefined,
        customerNotes: customerNotes.trim() || undefined,
        internalNotes: internalNotes.trim() || undefined,
      };

      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE',
          bookingData,
        }),
      });

      const data = await res.json();
      if (data.success && data.booking) {
        success('Bay reservation created successfully! Redirecting to dossier...');
        router.push(`/admin/bookings/${data.booking.id}`);
      } else {
        toastError(data.error || 'Failed to create booking reservation');
      }
    } catch (err: any) {
      toastError(err.message || 'Network error connecting to booking engine');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Computed summary values
  const activeResource = resources.find((r) => r.id === selectedResourceId);
  const activeService = services.find((s) => s.id === selectedServiceId);
  const activePackage = packages.find((p) => p.id === selectedPackageId);
  const activeVehicle = customerVehicles.find((v) => v.id === selectedVehicleId);

  const treatmentName = itemType === 'SERVICE' ? activeService?.name : activePackage?.name;

  return (
    <div className={styles.pageContainer}>
      {/* ── Top Navigation ── */}
      <div className={styles.topNav}>
        <Link href="/admin/bookings" className={styles.backBtn}>
          <Icon.ArrowLeft size={14} />
          <span>&larr; Back to Studio Bookings</span>
        </Link>
        <span className={styles.navBadge}>
          <Icon.Bay size={13} />
          <span>Atelier Bay Scheduling</span>
        </span>
      </div>

      {/* ── Page Header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>
            <span>Studio Detailing Bay Operations</span>
            <span className={styles.eyebrowDot} />
            <span>Work Order Composer</span>
          </div>
          <h1 className={styles.pageTitle}>Reserve Studio Detailing Bay</h1>
          <p className={styles.pageSubtitle}>
            Allocate bay resources, lock calendar slots, and log custom pricing and work orders.
          </p>
        </div>
      </div>

      {/* ── Content Grid (Main Form + Live Summary Sidebar) ── */}
      <div className={styles.contentGrid}>
        <div className={styles.formColumn}>
          {/* 1. Client Credentials & Vehicle */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <Icon.Users size={16} />
              </div>
              <div>
                <h2 className={styles.cardTitle}>1. Client & Vehicle Assignment</h2>
                <p className={styles.cardSubtitle}>
                  Select an existing studio client or register a new customer profile.
                </p>
              </div>
            </div>

            {/* Selected Client Card or Search */}
            {activeCustomer ? (
              <div className={styles.selectedClientCard}>
                <div className={styles.clientDetails}>
                  <div className={styles.clientAvatar}>
                    {activeCustomer.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className={styles.clientName}>{activeCustomer.name}</div>
                    <div className={styles.clientContact}>
                      <span>{activeCustomer.phone}</span>
                      {activeCustomer.email && <span>• {activeCustomer.email}</span>}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => {
                    setSelectedCustomerId('');
                    setCustomerVehicles([]);
                    setSelectedVehicleId('');
                  }}
                >
                  Change Client
                </button>
              </div>
            ) : (
              <div className={styles.searchWrapper}>
                <label className={styles.fieldLabel}>Search Client Profile</label>
                <div style={{ position: 'relative' }}>
                  <span className={styles.searchIcon}>
                    <Icon.Search size={15} />
                  </span>
                  <input
                    type="text"
                    className={`${styles.input} ${styles.searchInput}`}
                    placeholder="Search by name, phone number, or email..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setIsSearchingCustomers(true);
                    }}
                    onFocus={() => setIsSearchingCustomers(true)}
                  />
                </div>

                {isSearchingCustomers && filteredCustomers.length > 0 && (
                  <div className={styles.resultsDropdown}>
                    {filteredCustomers.map((c) => (
                      <div
                        key={c.id}
                        className={styles.dropdownItem}
                        onClick={() => {
                          setSelectedCustomerId(c.id);
                          setCustomerSearch('');
                          setIsSearchingCustomers(false);
                        }}
                      >
                        <div>
                          <div className={styles.dropdownName}>{c.name}</div>
                          <div className={styles.dropdownPhone}>{c.phone}</div>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          {c.vehicleCount} vehicle{c.vehicleCount === 1 ? '' : 's'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: '0.65rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#B45309',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    onClick={() => setShowQuickAddCustomer(!showQuickAddCustomer)}
                  >
                    {showQuickAddCustomer ? '— Close New Customer Form' : '+ Quick Register New Customer'}
                  </button>
                </div>

                {/* Inline Quick Add Customer Form */}
                {showQuickAddCustomer && (
                  <form onSubmit={handleCreateCustomer} className={styles.quickAddBox}>
                    <div className={styles.quickAddTitle}>Register New Customer Profile</div>
                    <div className={styles.rowTwo} style={{ marginBottom: '0.65rem' }}>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="Client Full Name *"
                        value={newCustomerName}
                        onChange={(e) => setNewCustomerName(e.target.value)}
                        required
                      />
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="Mobile Number *"
                        value={newCustomerPhone}
                        onChange={(e) => setNewCustomerPhone(e.target.value)}
                        required
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.65rem' }}>
                      <input
                        type="email"
                        className={styles.input}
                        placeholder="Email Address (Optional)"
                        value={newCustomerEmail}
                        onChange={(e) => setNewCustomerEmail(e.target.value)}
                      />
                      <button
                        type="submit"
                        className={styles.btnSubmit}
                        style={{ width: 'auto', padding: '0.5rem 1rem', whiteSpace: 'nowrap' }}
                        disabled={creatingCustomer}
                      >
                        {creatingCustomer ? 'Saving...' : 'Save & Select'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Vehicle Selection */}
            {selectedCustomerId && (
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label className={styles.fieldLabel}>Client Vehicle</label>
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#B45309',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    onClick={() => setShowAddVehicle(!showAddVehicle)}
                  >
                    {showAddVehicle ? 'Cancel' : '+ Add Another Vehicle'}
                  </button>
                </div>

                {loadingVehicles ? (
                  <div style={{ fontSize: '0.8125rem', color: '#64748B', padding: '0.5rem 0' }}>
                    Loading customer vehicles...
                  </div>
                ) : customerVehicles.length > 0 ? (
                  <div className={styles.vehicleGrid}>
                    {customerVehicles.map((v) => (
                      <div
                        key={v.id}
                        className={`${styles.vehicleOption} ${
                          selectedVehicleId === v.id ? styles.vehicleOptionActive : ''
                        }`}
                        onClick={() => setSelectedVehicleId(v.id)}
                      >
                        <div className={styles.vehicleTitle}>
                          {v.brand} {v.model}
                        </div>
                        <div className={styles.vehicleMeta}>
                          {v.variant || v.vehicleType || 'Personal Car'} {v.manufactureYear ? `(${v.manufactureYear})` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8125rem', color: '#64748B', padding: '0.5rem 0' }}>
                    No vehicle registered for this customer yet.
                  </div>
                )}

                {/* Inline Add Vehicle Form */}
                {showAddVehicle && (
                  <form onSubmit={handleAddVehicle} className={styles.quickAddBox} style={{ marginTop: '0.75rem' }}>
                    <div className={styles.quickAddTitle}>Add Vehicle to Client Garage</div>
                    <div className={styles.rowTwo} style={{ marginBottom: '0.65rem' }}>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="Brand (e.g. BMW, Porsche) *"
                        value={newVehicleBrand}
                        onChange={(e) => setNewVehicleBrand(e.target.value)}
                        required
                      />
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="Model (e.g. M4 Competition) *"
                        value={newVehicleModel}
                        onChange={(e) => setNewVehicleModel(e.target.value)}
                        required
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.65rem' }}>
                      <input
                        type="number"
                        className={styles.input}
                        placeholder="Year (e.g. 2024)"
                        value={newVehicleYear}
                        onChange={(e) => setNewVehicleYear(e.target.value)}
                      />
                      <button
                        type="submit"
                        className={styles.btnSubmit}
                        style={{ width: 'auto', padding: '0.5rem 1rem', whiteSpace: 'nowrap' }}
                        disabled={creatingVehicle}
                      >
                        {creatingVehicle ? 'Adding...' : 'Add Vehicle'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* 2. Service & Treatment Selection */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <Icon.Shield size={16} />
              </div>
              <div>
                <h2 className={styles.cardTitle}>2. Studio Treatment & Scope</h2>
                <p className={styles.cardSubtitle}>
                  Choose individual detailing service or comprehensive atelier package.
                </p>
              </div>
            </div>

            <div className={styles.typeTabs}>
              <button
                type="button"
                className={`${styles.typeTab} ${itemType === 'SERVICE' ? styles.typeTabActive : ''}`}
                onClick={() => setItemType('SERVICE')}
              >
                Individual Service ({services.length})
              </button>
              <button
                type="button"
                className={`${styles.typeTab} ${itemType === 'PACKAGE' ? styles.typeTabActive : ''}`}
                onClick={() => setItemType('PACKAGE')}
              >
                Bundled Package ({packages.length})
              </button>
            </div>

            {itemType === 'SERVICE' ? (
              <div className={styles.catalogGrid}>
                {services.map((s) => (
                  <div
                    key={s.id}
                    className={`${styles.catalogCard} ${
                      selectedServiceId === s.id ? styles.catalogCardActive : ''
                    }`}
                    onClick={() => setSelectedServiceId(s.id)}
                  >
                    <div>
                      <div className={styles.catalogName}>{s.name}</div>
                      <div className={styles.catalogCategory}>{s.category.replace(/_/g, ' ')}</div>
                    </div>
                    <div className={styles.catalogMeta}>
                      <span className={styles.catalogPrice}>
                        {s.startingPrice ? `₹${Number(s.startingPrice).toLocaleString('en-IN')}` : 'Custom'}
                      </span>
                      <span className={styles.catalogDuration}>
                        {Math.floor(s.durationMinutes / 60)}h {s.durationMinutes % 60 ? `${s.durationMinutes % 60}m` : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.catalogGrid}>
                {packages.map((p) => (
                  <div
                    key={p.id}
                    className={`${styles.catalogCard} ${
                      selectedPackageId === p.id ? styles.catalogCardActive : ''
                    }`}
                    onClick={() => setSelectedPackageId(p.id)}
                  >
                    <div>
                      <div className={styles.catalogName}>{p.name}</div>
                      <div className={styles.catalogCategory}>Atelier Package</div>
                    </div>
                    <div className={styles.catalogMeta}>
                      <span className={styles.catalogPrice}>
                        {p.price || p.startingPrice
                          ? `₹${Number(p.price || p.startingPrice).toLocaleString('en-IN')}`
                          : 'Custom'}
                      </span>
                      <span className={styles.catalogDuration}>
                        {p.durationMinutes ? `${Math.floor(p.durationMinutes / 60)}h` : '3h'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Duration and Price Override Row */}
            <div className={styles.rowTwo} style={{ marginTop: '1.25rem' }}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Bay Duration (Minutes)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="number"
                    step="15"
                    className={styles.input}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  />
                  <button
                    type="button"
                    className={styles.btnCancel}
                    style={{ width: 'auto', padding: '0.5rem 0.75rem' }}
                    onClick={() => setDurationMinutes((m) => Math.max(30, m + 30))}
                  >
                    +30m
                  </button>
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Agreed / Quoted Price (₹)</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. 15000"
                  value={priceQuoted}
                  onChange={(e) => setPriceQuoted(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 3. Detailing Bay & Schedule */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <Icon.Calendar size={16} />
              </div>
              <div>
                <h2 className={styles.cardTitle}>3. Bay Allocation & Schedule</h2>
                <p className={styles.cardSubtitle}>
                  Choose the physical detailing bay and lock the appointment time window.
                </p>
              </div>
            </div>

            {/* Bay Selection */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Studio Detailing Bay</label>
              <div className={styles.bayGrid}>
                {resources.map((r) => (
                  <div
                    key={r.id}
                    className={`${styles.bayCard} ${
                      selectedResourceId === r.id ? styles.bayCardActive : ''
                    }`}
                    onClick={() => setSelectedResourceId(r.id)}
                  >
                    <div className={styles.bayName}>{r.name}</div>
                    <div className={styles.bayType}>{r.type.replace(/_/g, ' ')}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Date & Time Picker */}
            <div className={styles.rowTwo} style={{ marginTop: '1.25rem' }}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Appointment Date</label>
                <input
                  type="date"
                  className={styles.input}
                  min={todayStr}
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Appointment Start Time</label>
                <input
                  type="time"
                  className={styles.input}
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                />
              </div>
            </div>

            {/* Quick Time Slots */}
            <div className={styles.slotsHeader}>
              <span className={styles.slotsTitle}>Quick Time Preset:</span>
            </div>
            <div className={styles.slotsGrid}>
              {DEFAULT_TIME_SLOTS.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`${styles.slotChip} ${bookingTime === t ? styles.slotChipActive : ''}`}
                  onClick={() => setBookingTime(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Instructions & Notes */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <Icon.FileText size={16} />
              </div>
              <div>
                <h2 className={styles.cardTitle}>4. Operational Notes</h2>
                <p className={styles.cardSubtitle}>
                  Add customer-specific requests and technician instructions.
                </p>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Client Requests / Specific Areas of Focus</label>
              <textarea
                className={styles.textarea}
                placeholder="e.g. Swirl marks on hood, deep leather conditioning on driver seat..."
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Internal Studio Instructions (Private)</label>
              <textarea
                className={styles.textarea}
                placeholder="e.g. Ensure IR lamp curing for 45 mins, inspect under 5000K lighting..."
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── Right Column: Summary Card ── */}
        <div className={styles.summaryColumn}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryHeader}>
              <span className={styles.summaryTitle}>Booking Summary</span>
              <span className={styles.summaryStatus}>Draft</span>
            </div>

            {/* Client Section */}
            <div className={styles.summarySection}>
              <span className={styles.summaryLabel}>Client</span>
              <div className={styles.summaryValue}>
                {activeCustomer ? activeCustomer.name : 'No client selected'}
              </div>
              {activeCustomer && (
                <div className={styles.summarySub}>{activeCustomer.phone}</div>
              )}
            </div>

            <div className={styles.summaryDivider} />

            {/* Vehicle Section */}
            <div className={styles.summarySection}>
              <span className={styles.summaryLabel}>Vehicle</span>
              <div className={styles.summaryValue}>
                {activeVehicle
                  ? `${activeVehicle.brand} ${activeVehicle.model}`
                  : 'No vehicle selected'}
              </div>
              {activeVehicle?.variant && (
                <div className={styles.summarySub}>{activeVehicle.variant}</div>
              )}
            </div>

            <div className={styles.summaryDivider} />

            {/* Treatment Section */}
            <div className={styles.summarySection}>
              <span className={styles.summaryLabel}>Treatment</span>
              <div className={styles.summaryValue}>{treatmentName || 'None selected'}</div>
              <div className={styles.summarySub}>
                Allocated Duration: {Math.floor(durationMinutes / 60)}h{' '}
                {durationMinutes % 60 ? `${durationMinutes % 60}m` : ''}
              </div>
            </div>

            <div className={styles.summaryDivider} />

            {/* Bay & Time Section */}
            <div className={styles.summarySection}>
              <span className={styles.summaryLabel}>Schedule</span>
              <div className={styles.summaryValue}>
                {bookingDate} @ {bookingTime}
              </div>
              <div className={styles.summarySub}>
                Bay: {activeResource?.name || 'Unassigned Bay'}
              </div>
            </div>

            <div className={styles.summaryDivider} />

            {/* Quoted Price */}
            <div className={styles.priceDisplay}>
              <span className={styles.priceLabel}>Agreed Amount:</span>
              <span className={styles.priceValue}>
                {priceQuoted ? `₹${Number(priceQuoted).toLocaleString('en-IN')}` : '—'}
              </span>
            </div>

            {/* Actions */}
            <button
              type="button"
              className={styles.btnSubmit}
              disabled={isSubmitting || !selectedCustomerId || !selectedResourceId}
              onClick={handleSubmitBooking}
            >
              <Icon.Check size={16} />
              <span>{isSubmitting ? 'Locking Bay Slot...' : 'Lock Bay & Create Booking'}</span>
            </button>

            <Link href="/admin/bookings" className={styles.btnCancel}>
              Discard Draft
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
