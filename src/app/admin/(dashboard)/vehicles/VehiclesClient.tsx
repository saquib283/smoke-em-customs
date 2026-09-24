'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './vehicles.module.css';

interface VehicleItem {
  id: string;
  customerId: string;
  brand: string;
  model: string;
  variant: string | null;
  manufactureYear: number | null;
  vehicleType: string | null;
  customerName: string;
  customerPhone: string;
  leadCount: number;
  bookingCount: number;
  createdAt: string;
}

interface VehiclesClientProps {
  initialVehicles: VehicleItem[];
}

export function VehiclesClient({ initialVehicles }: VehiclesClientProps) {
  const [vehicles, setVehicles] = useState<VehicleItem[]>(initialVehicles);
  const [filterType, setFilterType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedVehicleDetail, setSelectedVehicleDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const vehicleTypes = ['ALL', 'SEDAN', 'SUV', 'LUXURY', 'HATCHBACK', 'MUV', 'TWO_WHEELER'];

  const filtered = vehicles.filter((v) => {
    if (filterType !== 'ALL' && v.vehicleType !== filterType) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        v.brand.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        (v.variant && v.variant.toLowerCase().includes(q)) ||
        v.customerName.toLowerCase().includes(q) ||
        v.customerPhone.includes(q);
      if (!match) return false;
    }
    return true;
  });

  const openVehicleDetail = async (id: string) => {
    setSelectedVehicleId(id);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/vehicles?id=${id}`);
      const data = await res.json();
      if (data.success && data.vehicle) {
        setSelectedVehicleDetail(data.vehicle);
      }
    } catch {
      // Ignore
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>Studio Garage & Vehicles Registry</h1>
          <p className={styles.headerSubtitle}>
            Full database of automobiles registered with Smoke M Customs across all customer accounts.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.typeTabs}>
          {vehicleTypes.map((type) => (
            <button
              key={type}
              type="button"
              className={`${styles.tabBtn} ${filterType === type ? styles.activeTab : ''}`}
              onClick={() => setFilterType(type)}
            >
              {type === 'ALL' ? 'All Vehicles' : type.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className={styles.searchBox}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search make, model, owner name, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Body Segment</th>
                <th>Year</th>
                <th>Client Owner</th>
                <th>Studio Sessions</th>
                <th>Inquiries</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id} className={styles.tableRow}>
                  <td>
                    <div className={styles.vehicleTitle}>
                      {v.brand} {v.model}
                    </div>
                    {v.variant && <div className={styles.vehicleSub}>{v.variant}</div>}
                  </td>
                  <td>
                    <span className={styles.typeBadge}>{v.vehicleType ?? 'SEDAN'}</span>
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
                    {v.manufactureYear || '—'}
                  </td>
                  <td>
                    <div className={styles.ownerCol}>
                      <span className={styles.ownerName}>{v.customerName}</span>
                      <span className={styles.ownerPhone}>{v.customerPhone}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 'bold', color: 'var(--color-accent-primary)' }}>
                      📅 {v.bookingCount}
                    </span>
                  </td>
                  <td>
                    <span>📥 {v.leadCount}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => openVehicleDetail(v.id)}
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className={styles.emptyCell}>
                    No vehicles found matching current search or segment criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Slide-over Drawer */}
      {selectedVehicleId && (
        <div className={styles.drawerBackdrop} onClick={() => setSelectedVehicleId(null)}>
          <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div>
                <span className={styles.drawerTag}>VEHICLE SPECIFICATION</span>
                <h3 className={styles.drawerTitle}>
                  {selectedVehicleDetail
                    ? `${selectedVehicleDetail.brand} ${selectedVehicleDetail.model}`
                    : 'Vehicle Details'}
                </h3>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setSelectedVehicleId(null)}
              >
                ✕
              </button>
            </div>

            <div className={styles.drawerBody}>
              {detailLoading || !selectedVehicleDetail ? (
                <p>Loading vehicle profile & service history...</p>
              ) : (
                <>
                  {/* Specifications */}
                  <div className={styles.drawerSection}>
                    <label className={styles.sectionLabel}>Technical Profile</label>
                    <div className={styles.infoCard}>
                      <div className={styles.cardRow}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Make / Brand:</span>
                        <strong>{selectedVehicleDetail.brand}</strong>
                      </div>
                      <div className={styles.cardRow}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Model:</span>
                        <strong>{selectedVehicleDetail.model}</strong>
                      </div>
                      <div className={styles.cardRow}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Variant / Trim:</span>
                        <span>{selectedVehicleDetail.variant || 'Standard'}</span>
                      </div>
                      <div className={styles.cardRow}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Body Style:</span>
                        <span className={styles.typeBadge}>{selectedVehicleDetail.vehicleType || 'SEDAN'}</span>
                      </div>
                      <div className={styles.cardRow}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Model Year:</span>
                        <span>{selectedVehicleDetail.manufactureYear || 'Unspecified'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Owner Information */}
                  {selectedVehicleDetail.customer && (
                    <div className={styles.drawerSection}>
                      <label className={styles.sectionLabel}>Client Details</label>
                      <div className={styles.infoCard}>
                        <div className={styles.cardRow}>
                          <span style={{ color: 'var(--color-text-muted)' }}>Owner Name:</span>
                          <strong>{selectedVehicleDetail.customer.name}</strong>
                        </div>
                        <div className={styles.cardRow}>
                          <span style={{ color: 'var(--color-text-muted)' }}>Mobile Number:</span>
                          <span>{selectedVehicleDetail.customer.phone}</span>
                        </div>
                        <div className={styles.cardRow}>
                          <span style={{ color: 'var(--color-text-muted)' }}>Email:</span>
                          <span>{selectedVehicleDetail.customer.email || 'None'}</span>
                        </div>
                      </div>

                      <div style={{ marginTop: 'var(--space-2)' }}>
                        <a
                          href={`https://wa.me/${selectedVehicleDetail.customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                            `Hello ${selectedVehicleDetail.customer.name}, Smoke M Customs checking in on your ${selectedVehicleDetail.brand} ${selectedVehicleDetail.model}.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                        >
                          💬 WhatsApp Client
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Studio Sessions */}
                  <div className={styles.drawerSection}>
                    <label className={styles.sectionLabel}>
                      Completed & Scheduled Studio Sessions ({selectedVehicleDetail.bookings?.length || 0})
                    </label>
                    {(!selectedVehicleDetail.bookings || selectedVehicleDetail.bookings.length === 0) ? (
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                        No appointments booked for this vehicle yet.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {selectedVehicleDetail.bookings.map((b: any) => (
                          <div key={b.id} className={styles.infoCard}>
                            <div className={styles.cardRow}>
                              <strong>{b.serviceName}</strong>
                              <span style={{ fontSize: '11px', fontWeight: 'bold' }}>
                                {b.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <div className={styles.cardRow} style={{ color: 'var(--color-text-muted)' }}>
                              <span>Date: {new Date(b.startAt).toLocaleDateString('en-IN')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Lead / Inquiries */}
                  <div className={styles.drawerSection}>
                    <label className={styles.sectionLabel}>
                      Quote Requests & Leads ({selectedVehicleDetail.leads?.length || 0})
                    </label>
                    {(!selectedVehicleDetail.leads || selectedVehicleDetail.leads.length === 0) ? (
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                        No quote inquiries on record for this vehicle.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {selectedVehicleDetail.leads.map((l: any) => (
                          <div key={l.id} className={styles.infoCard}>
                            <div className={styles.cardRow}>
                              <strong>{l.serviceName}</strong>
                              <span style={{ fontSize: '11px', fontWeight: 'bold' }}>
                                {l.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <div className={styles.cardRow} style={{ color: 'var(--color-text-muted)' }}>
                              <span>Received: {new Date(l.createdAt).toLocaleDateString('en-IN')}</span>
                              <Link href={`/admin/leads`} style={{ color: 'var(--color-accent-primary)' }}>
                                View Lead &rarr;
                              </Link>
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
