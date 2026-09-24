'use client';

import React, { useState } from 'react';
import styles from './customers.module.css';

interface CustomerItem {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  vehicleCount: number;
  leadCount: number;
  createdAt: string;
}

interface CustomersClientProps {
  initialCustomers: CustomerItem[];
}

export function CustomersClient({ initialCustomers }: CustomersClientProps) {
  const [customers, setCustomers] = useState<CustomerItem[]>(initialCustomers);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // New vehicle form state
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [vBrand, setVBrand] = useState('');
  const [vModel, setVModel] = useState('');
  const [vYear, setVYear] = useState<number>(new Date().getFullYear());
  const [vType, setVType] = useState<string>('SEDAN');

  const filtered = customers.filter((c) => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match = c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.email && c.email.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const openCustomerDetail = async (id: string) => {
    setSelectedCustomerId(id);
    setDetailLoading(true);
    setShowAddVehicle(false);
    try {
      const res = await fetch(`/api/admin/customers?id=${id}`);
      const data = await res.json();
      if (data.success && data.customer) {
        setSelectedCustomerDetail(data.customer);
      }
    } catch {
      // Ignore
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAddVehicle = async () => {
    if (!vBrand || !vModel || !selectedCustomerId) {
      alert('Please enter vehicle brand and model');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_VEHICLE',
          customerId: selectedCustomerId,
          vehicleData: {
            brand: vBrand,
            model: vModel,
            manufactureYear: vYear,
            vehicleType: vType,
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.vehicle) {
        setSelectedCustomerDetail((prev: any) => ({
          ...prev,
          vehicles: [...(prev.vehicles || []), data.vehicle],
          vehicleCount: (prev.vehicleCount || 0) + 1,
        }));
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === selectedCustomerId ? { ...c, vehicleCount: c.vehicleCount + 1 } : c
          )
        );
        setShowAddVehicle(false);
        setVBrand('');
        setVModel('');
      } else {
        alert(data.error || 'Failed to add vehicle');
      }
    } catch {
      alert('Error registering vehicle');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>Customer Directory & CRM</h1>
          <p className={styles.headerSubtitle}>
            Unified registry of studio clients, customer garages, and detailing service history.
          </p>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by customer name, phone number, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Phone Number</th>
                <th>Email</th>
                <th>Vehicles in Garage</th>
                <th>Inquiries / Leads</th>
                <th>Client Since</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    No customer profiles found.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className={styles.row}>
                    <td>
                      <strong>{c.name}</strong>
                    </td>
                    <td>{c.phone}</td>
                    <td style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
                      {c.email || '—'}
                    </td>
                    <td>
                      <span style={{ fontWeight: 'bold', color: 'var(--color-accent-primary)' }}>
                        🚗 {c.vehicleCount}
                      </span>
                    </td>
                    <td>{c.leadCount}</td>
                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                      {new Date(c.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td>
                      <button className={styles.actionBtn} onClick={() => openCustomerDetail(c.id)}>
                        Inspect Profile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Profile Drawer */}
      {selectedCustomerId && (
        <div className={styles.drawerOverlay} onClick={() => setSelectedCustomerId(null)}>
          <div className={styles.drawerContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <h2 className={styles.drawerTitle}>Client Profile</h2>
              <button className={styles.closeBtn} onClick={() => setSelectedCustomerId(null)}>
                ✕
              </button>
            </div>

            <div className={styles.drawerBody}>
              {detailLoading || !selectedCustomerDetail ? (
                <p>Loading profile...</p>
              ) : (
                <>
                  {/* Basic Info */}
                  <div>
                    <h3 className={styles.sectionTitle}>Contact & Preferences</h3>
                    <div className={styles.profileCard}>
                      <div className={styles.cardRow}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Full Name:</span>
                        <strong>{selectedCustomerDetail.name}</strong>
                      </div>
                      <div className={styles.cardRow}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Phone:</span>
                        <span>{selectedCustomerDetail.phone}</span>
                      </div>
                      <div className={styles.cardRow}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Email:</span>
                        <span>{selectedCustomerDetail.email || 'Not provided'}</span>
                      </div>
                      <div className={styles.cardRow}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Contact Preference:</span>
                        <span>{selectedCustomerDetail.preferredContactMethod || 'WHATSAPP'}</span>
                      </div>
                    </div>

                    <div style={{ marginTop: 'var(--space-3)' }}>
                      <a
                        className={styles.btnWhatsApp}
                        target="_blank"
                        rel="noopener noreferrer"
                        href={`https://wa.me/${selectedCustomerDetail.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          `Hello ${selectedCustomerDetail.name}, this is Smoke M Customs reaching out!`
                        )}`}
                      >
                        💬 Open WhatsApp Chat
                      </a>
                    </div>
                  </div>

                  {/* Registered Garage / Vehicles */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                      <h3 className={styles.sectionTitle} style={{ marginBottom: 0 }}>
                        Garage ({selectedCustomerDetail.vehicles?.length || 0})
                      </h3>
                      <button
                        className={styles.actionBtn}
                        onClick={() => setShowAddVehicle(!showAddVehicle)}
                      >
                        {showAddVehicle ? 'Cancel' : '+ Add Vehicle'}
                      </button>
                    </div>

                    {showAddVehicle && (
                      <div className={styles.addVehicleBox}>
                        <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>Register New Vehicle</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                          <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Brand (e.g. BMW, Porsche)"
                            value={vBrand}
                            onChange={(e) => setVBrand(e.target.value)}
                          />
                          <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Model (e.g. M340i, Macan)"
                            value={vModel}
                            onChange={(e) => setVModel(e.target.value)}
                          />
                          <input
                            type="number"
                            className={styles.searchInput}
                            placeholder="Year"
                            value={vYear}
                            onChange={(e) => setVYear(parseInt(e.target.value) || 2024)}
                          />
                          <select
                            className={styles.searchInput}
                            value={vType}
                            onChange={(e) => setVType(e.target.value)}
                          >
                            <option value="SEDAN">Sedan</option>
                            <option value="SUV">SUV</option>
                            <option value="HATCHBACK">Hatchback</option>
                            <option value="LUXURY">Luxury / Exotics</option>
                            <option value="MUV">MUV</option>
                            <option value="TWO_WHEELER">Superbike</option>
                          </select>
                        </div>
                        <button
                          className={styles.actionBtn}
                          style={{ alignSelf: 'flex-start', background: 'var(--color-accent-primary)', color: '#000', fontWeight: 'bold' }}
                          disabled={actionLoading}
                          onClick={handleAddVehicle}
                        >
                          Save Vehicle to Profile
                        </button>
                      </div>
                    )}

                    <div style={{ marginTop: 'var(--space-2)' }}>
                      {!selectedCustomerDetail.vehicles || selectedCustomerDetail.vehicles.length === 0 ? (
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                          No vehicles registered for this client yet.
                        </p>
                      ) : (
                        selectedCustomerDetail.vehicles.map((v: any) => (
                          <div key={v.id} className={styles.vehiclePill}>
                            <div>
                              <div className={styles.vehicleTitle}>
                                {v.brand} {v.model} {v.variant ? `(${v.variant})` : ''}
                              </div>
                              <div className={styles.vehicleSub}>
                                Segment: {v.vehicleType} • Year: {v.manufactureYear || 'N/A'}
                              </div>
                            </div>
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent-primary)' }}>
                              🚗 Verified
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Appointment & Service History */}
                  <div>
                    <h3 className={styles.sectionTitle}>Studio Appointment History</h3>
                    {!selectedCustomerDetail.bookings || selectedCustomerDetail.bookings.length === 0 ? (
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                        No appointment history recorded yet.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {selectedCustomerDetail.bookings.map((b: any) => (
                          <div key={b.id} className={styles.profileCard}>
                            <div className={styles.cardRow}>
                              <strong>{b.serviceName}</strong>
                              <span style={{ fontWeight: 'bold', fontSize: '11px' }}>
                                {b.status.replace('_', ' ')}
                              </span>
                            </div>
                            <div className={styles.cardRow} style={{ color: 'var(--color-text-muted)' }}>
                              <span>Date: {new Date(b.startAt).toLocaleDateString('en-IN')}</span>
                              <span>
                                {b.priceQuoted ? `₹${Number(b.priceQuoted).toLocaleString('en-IN')}` : 'Standard'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
