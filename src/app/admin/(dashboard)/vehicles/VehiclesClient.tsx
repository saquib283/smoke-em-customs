'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { WhatsAppCTA } from '@/components/common/WhatsAppCTA';
import { Icon } from '@/components/common/Icons';
import styles from './vehicles.module.css';

export interface VehicleItem {
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
  const [vehicles] = useState<VehicleItem[]>(initialVehicles);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedVehicleDetail, setSelectedVehicleDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ── Metrics Calculation ──
  const metrics = useMemo(() => {
    const total = vehicles.length;
    const luxury = vehicles.filter((v) => v.vehicleType === 'LUXURY').length;
    const sedans = vehicles.filter((v) => v.vehicleType === 'SEDAN').length;
    const suvs = vehicles.filter((v) => ['SUV', 'MUV'].includes(v.vehicleType || '')).length;
    const hatches = vehicles.filter((v) => v.vehicleType === 'HATCHBACK').length;
    const bikes = vehicles.filter((v) => v.vehicleType === 'TWO_WHEELER').length;
    return { total, luxury, sedans, suvs, hatches, bikes };
  }, [vehicles]);

  // ── Segment Tabs Definition ──
  const segmentTabs = [
    { key: 'ALL', label: 'All Fleet', count: metrics.total },
    { key: 'SEDAN', label: 'Sedans', count: metrics.sedans },
    { key: 'SUV', label: 'SUVs & MUVs', count: metrics.suvs },
    { key: 'LUXURY', label: 'Exotics & Luxury', count: metrics.luxury },
    { key: 'HATCHBACK', label: 'Hatchbacks', count: metrics.hatches },
    { key: 'TWO_WHEELER', label: 'Superbikes', count: metrics.bikes },
  ];

  // ── Filtered Vehicles ──
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      // Segment filter
      if (filterType === 'SUV') {
        if (v.vehicleType !== 'SUV' && v.vehicleType !== 'MUV') return false;
      } else if (filterType !== 'ALL') {
        if (v.vehicleType !== filterType) return false;
      }

      // Search query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchBrand = v.brand.toLowerCase().includes(q);
        const matchModel = v.model.toLowerCase().includes(q);
        const matchVariant = v.variant ? v.variant.toLowerCase().includes(q) : false;
        const matchOwner = v.customerName.toLowerCase().includes(q);
        const matchPhone = v.customerPhone.includes(q);
        if (!matchBrand && !matchModel && !matchVariant && !matchOwner && !matchPhone) return false;
      }

      return true;
    });
  }, [vehicles, filterType, searchTerm]);

  // ── Client Monogram Generator ──
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return (name[0] || 'C').toUpperCase();
  };

  // ── Open Vehicle Detail Drawer ──
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
      // Ignore fallback
    } finally {
      setDetailLoading(false);
    }
  };

  // ── Export CSV Handler ──
  const handleExportCSV = () => {
    const headers = ['Brand', 'Model', 'Trim / Variant', 'Body Segment', 'Year', 'Owner Name', 'Owner Phone', 'Studio Bookings', 'Inquiries'];
    const rows = filteredVehicles.map((v) => [
      `"${v.brand.replace(/"/g, '""')}"`,
      `"${v.model.replace(/"/g, '""')}"`,
      `"${(v.variant || 'Standard').replace(/"/g, '""')}"`,
      `"${v.vehicleType || 'SEDAN'}"`,
      v.manufactureYear || '',
      `"${v.customerName.replace(/"/g, '""')}"`,
      `"${v.customerPhone}"`,
      v.bookingCount,
      v.leadCount,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smokecustoms_garage_fleet_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.container}>
      {/* ── Page Header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>
            <span>STUDIO GARAGE FLEET</span>
            <span className={styles.eyebrowDot} />
            <span>AUTOMOBILE REGISTRY</span>
          </div>
          <h1 className={styles.pageTitle}>Studio Garage & Vehicles Registry</h1>
          <p className={styles.pageSubtitle}>
            Full database of automobiles registered with Smoke M Customs across all customer accounts.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button type="button" onClick={handleExportCSV} className={styles.exportBtn} title="Download CSV spreadsheet of current vehicles">
            <Icon.FileText size={15} />
            <span>Export CSV</span>
          </button>
          <Link href="/admin/customers" className={styles.primaryActionBtn}>
            <Icon.Users size={15} />
            <span>Client Directory</span>
          </Link>
        </div>
      </div>

      {/* ── Executive Metric KPI Cards ── */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Total Garage Fleet</span>
            <span className={styles.metricValue}>{metrics.total}</span>
            <span className={styles.metricSubtext}>Enrolled vehicles</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconNeutral}`}>
            <Icon.Car size={20} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Exotics & Luxury</span>
            <span className={styles.metricValue} style={{ color: '#B45309' }}>
              {metrics.luxury}
            </span>
            <span className={styles.metricSubtext}>Supercars & high-end luxury</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconExotic}`}>
            <Icon.Crown size={20} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Performance Sedans</span>
            <span className={styles.metricValue} style={{ color: '#2563EB' }}>
              {metrics.sedans}
            </span>
            <span className={styles.metricSubtext}>Executive & sport sedans</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconSedan}`}>
            <Icon.Shield size={20} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>SUVs & Utility</span>
            <span className={styles.metricValue} style={{ color: '#16A34A' }}>
              {metrics.suvs}
            </span>
            <span className={styles.metricSubtext}>Full-size & compact SUVs</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconSUV}`}>
            <Icon.Wrench size={20} />
          </div>
        </div>
      </div>

      {/* ── Filter & Search Controls Panel ── */}
      <div className={styles.controlsCard}>
        {/* Segmented Filter Tabs */}
        <div className={styles.tabsScroll}>
          <div className={styles.segmentTabs}>
            {segmentTabs.map((tab) => {
              const isActive = filterType === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  className={`${styles.tabBtn} ${isActive ? styles.activeTab : ''}`}
                  onClick={() => setFilterType(tab.key)}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`${styles.tabBadge} ${
                      isActive ? '' : styles.tabBadgeInactive
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Row */}
        <div className={styles.searchRow}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>
              <Icon.Search size={15} />
            </span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search make, model, trim, owner name, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className={styles.clearSearchBtn}
                onClick={() => setSearchTerm('')}
                title="Clear search"
              >
                <Icon.Cross size={13} />
              </button>
            )}
          </div>

          <div className={styles.filterMeta}>
            <span style={{ fontSize: '0.8125rem', color: '#64748B', whiteSpace: 'nowrap' }}>
              Showing <strong>{filteredVehicles.length}</strong> of {vehicles.length} enrolled vehicles
            </span>
          </div>
        </div>
      </div>

      {/* ── Vehicles Registry Table Card ── */}
      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '240px' }}>Vehicle Specification</th>
                <th style={{ width: '140px' }}>Body Segment</th>
                <th style={{ width: '100px' }}>Model Year</th>
                <th style={{ width: '220px' }}>Client Owner</th>
                <th style={{ width: '150px' }}>Studio Sessions</th>
                <th style={{ width: '140px' }}>Inquiries</th>
                <th style={{ width: '160px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((v, idx) => {
                const isLast = idx === filteredVehicles.length - 1;
                const segmentClass = `segment${v.vehicleType || 'SEDAN'}`;

                return (
                  <tr key={v.id} className={`${styles.tableRow} ${isLast ? styles.tableRowLast : ''}`}>
                    {/* 1. Vehicle & Specification */}
                    <td className={styles.vehicleCell}>
                      <div className={styles.vehicleWrapper} onClick={() => openVehicleDetail(v.id)}>
                        <div className={styles.vehicleAvatar}>
                          <Icon.Car size={18} />
                        </div>
                        <div className={styles.vehicleDetails}>
                          <span className={styles.vehicleTitle}>
                            {v.brand} {v.model}
                          </span>
                          <span className={styles.vehicleSub}>
                            {v.variant || 'Standard Trim'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 2. Body Segment */}
                    <td className={styles.segmentCell}>
                      <span className={`${styles.segmentBadge} ${styles[segmentClass] || styles.segmentSEDAN}`}>
                        {(v.vehicleType || 'SEDAN').replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* 3. Model Year */}
                    <td className={styles.yearCell}>
                      {v.manufactureYear || '—'}
                    </td>

                    {/* 4. Client Owner */}
                    <td className={styles.ownerCell}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            background: '#F1F5F9',
                            color: '#334155',
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {getInitials(v.customerName)}
                        </div>
                        <div className={styles.ownerCol}>
                          <span className={styles.ownerName}>{v.customerName}</span>
                          <span className={styles.ownerPhone}>{v.customerPhone}</span>
                        </div>
                      </div>
                    </td>

                    {/* 5. Studio Sessions */}
                    <td className={styles.sessionsCell}>
                      {v.bookingCount > 0 ? (
                        <span className={styles.sessionsBadge}>
                          <Icon.Calendar size={12} />
                          <span>{v.bookingCount} Session{v.bookingCount > 1 ? 's' : ''}</span>
                        </span>
                      ) : (
                        <span className={styles.sessionsZero}>
                          <Icon.Calendar size={12} />
                          <span>0 Sessions</span>
                        </span>
                      )}
                    </td>

                    {/* 6. Inquiries */}
                    <td className={styles.inquiriesCell}>
                      {v.leadCount > 0 ? (
                        <span className={styles.inquiriesBadge}>
                          <Icon.Inbox size={12} />
                          <span>{v.leadCount} Inquir{v.leadCount > 1 ? 'ies' : 'y'}</span>
                        </span>
                      ) : (
                        <span className={styles.inquiriesZero}>0 Inquiries</span>
                      )}
                    </td>

                    {/* 7. Action Hub */}
                    <td className={styles.actionCell}>
                      <div className={styles.actionBtns}>
                        <WhatsAppCTA
                          phone={v.customerPhone}
                          message={`Hello ${v.customerName}, Smoke M Customs checking in regarding your ${v.brand} ${v.model}.`}
                          iconOnly
                          size="sm"
                          variant="icon"
                          ariaLabel={`WhatsApp ${v.customerName}`}
                          logCommunication={{
                            customerId: v.customerId,
                            summary: `Outbound WhatsApp chat opened regarding ${v.brand} ${v.model}`,
                          }}
                        />

                        <a
                          href={`tel:${v.customerPhone}`}
                          className={styles.callBtn}
                          title={`Call ${v.customerName}`}
                        >
                          <Icon.Phone size={13} />
                        </a>

                        <button
                          type="button"
                          className={styles.inspectBtn}
                          onClick={() => openVehicleDetail(v.id)}
                        >
                          <span>Inspect</span>
                          <Icon.ArrowRight size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredVehicles.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className={styles.emptyCard}>
                      <div className={styles.emptyIconWrap}>
                        <Icon.Car size={24} />
                      </div>
                      <h4 className={styles.emptyTitle}>No matching vehicles found</h4>
                      <p className={styles.emptyDesc}>
                        Try adjusting your search query, clear filters, or switch between body segment tabs.
                      </p>
                      {(searchTerm || filterType !== 'ALL') && (
                        <button
                          type="button"
                          className={styles.emptyResetBtn}
                          onClick={() => {
                            setSearchTerm('');
                            setFilterType('ALL');
                          }}
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Summary Footer */}
        {filteredVehicles.length > 0 && (
          <div className={styles.tableFooter}>
            <span>
              Showing {filteredVehicles.length} of {vehicles.length} total vehicle{vehicles.length !== 1 ? 's' : ''}
            </span>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
              Smoke M Customs • Studio Garage Registry
            </span>
          </div>
        )}
      </div>

      {/* ── Vehicle Dossier Slide-over Drawer ── */}
      {selectedVehicleId && (
        <div className={styles.drawerBackdrop} onClick={() => setSelectedVehicleId(null)}>
          <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div>
                <span className={styles.drawerTag}>VEHICLE SPECIFICATION & DOSSIER</span>
                <h3 className={styles.drawerTitle}>
                  {selectedVehicleDetail
                    ? `${selectedVehicleDetail.brand} ${selectedVehicleDetail.model}`
                    : 'Vehicle Dossier'}
                </h3>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setSelectedVehicleId(null)}
                title="Close drawer"
              >
                <Icon.Cross size={16} />
              </button>
            </div>

            <div className={styles.drawerBody}>
              {detailLoading || !selectedVehicleDetail ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                  Loading vehicle technical profile & service logs...
                </div>
              ) : (
                <>
                  {/* Hero Dossier Banner */}
                  <div className={styles.vehicleHero}>
                    <div className={styles.heroIconWrap}>
                      <Icon.Car size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 className={styles.heroTitle}>
                        {selectedVehicleDetail.brand} {selectedVehicleDetail.model}
                      </h4>
                      <div className={styles.heroMeta}>
                        <span>{selectedVehicleDetail.variant || 'Standard Trim'}</span>
                        <span>•</span>
                        <span>{selectedVehicleDetail.vehicleType || 'SEDAN'}</span>
                        {selectedVehicleDetail.manufactureYear && (
                          <>
                            <span>•</span>
                            <span>{selectedVehicleDetail.manufactureYear}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {selectedVehicleDetail.customer && (
                      <WhatsAppCTA
                        phone={selectedVehicleDetail.customer.phone}
                        message={`Hello ${selectedVehicleDetail.customer.name}, Smoke M Customs checking in regarding your ${selectedVehicleDetail.brand} ${selectedVehicleDetail.model}.`}
                        label="WhatsApp"
                        variant="outline"
                        size="sm"
                        logCommunication={{
                          customerId: selectedVehicleDetail.customer.id,
                          summary: `Outbound WhatsApp chat opened regarding ${selectedVehicleDetail.brand} ${selectedVehicleDetail.model}`,
                        }}
                      />
                    )}
                  </div>

                  {/* Technical Profile Section */}
                  <div className={styles.drawerSection}>
                    <div className={styles.sectionHeader}>
                      <span className={styles.sectionLabel}>Technical Profile</span>
                    </div>
                    <div className={styles.infoCard}>
                      <div className={styles.cardRow}>
                        <span style={{ color: '#64748B', fontWeight: 500 }}>Automotive Brand</span>
                        <strong>{selectedVehicleDetail.brand}</strong>
                      </div>
                      <div className={styles.cardRow}>
                        <span style={{ color: '#64748B', fontWeight: 500 }}>Model</span>
                        <strong>{selectedVehicleDetail.model}</strong>
                      </div>
                      <div className={styles.cardRow}>
                        <span style={{ color: '#64748B', fontWeight: 500 }}>Trim / Variant</span>
                        <span>{selectedVehicleDetail.variant || 'Standard'}</span>
                      </div>
                      <div className={styles.cardRow}>
                        <span style={{ color: '#64748B', fontWeight: 500 }}>Body Style</span>
                        <span className={`${styles.segmentBadge} ${styles[`segment${selectedVehicleDetail.vehicleType || 'SEDAN'}`] || styles.segmentSEDAN}`}>
                          {selectedVehicleDetail.vehicleType || 'SEDAN'}
                        </span>
                      </div>
                      <div className={styles.cardRow}>
                        <span style={{ color: '#64748B', fontWeight: 500 }}>Model Year</span>
                        <span>{selectedVehicleDetail.manufactureYear || 'Unspecified'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Client Details Section */}
                  {selectedVehicleDetail.customer && (
                    <div className={styles.drawerSection}>
                      <div className={styles.sectionHeader}>
                        <span className={styles.sectionLabel}>Registered Owner</span>
                      </div>
                      <div className={styles.infoCard}>
                        <div className={styles.cardRow}>
                          <span style={{ color: '#64748B', fontWeight: 500 }}>Owner Name</span>
                          <strong>{selectedVehicleDetail.customer.name}</strong>
                        </div>
                        <div className={styles.cardRow}>
                          <span style={{ color: '#64748B', fontWeight: 500 }}>Direct Mobile</span>
                          <span style={{ fontFeatureSettings: 'tnum' }}>{selectedVehicleDetail.customer.phone}</span>
                        </div>
                        <div className={styles.cardRow}>
                          <span style={{ color: '#64748B', fontWeight: 500 }}>Email Address</span>
                          <span>{selectedVehicleDetail.customer.email || 'None on file'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Studio Sessions History */}
                  <div className={styles.drawerSection}>
                    <div className={styles.sectionHeader}>
                      <span className={styles.sectionLabel}>
                        Studio Sessions ({selectedVehicleDetail.bookings?.length || 0})
                      </span>
                    </div>
                    {(!selectedVehicleDetail.bookings || selectedVehicleDetail.bookings.length === 0) ? (
                      <p style={{ fontSize: '0.8125rem', color: '#94A3B8', margin: 0 }}>
                        No appointments booked for this vehicle yet.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {selectedVehicleDetail.bookings.map((b: any) => (
                          <div key={b.id} className={styles.infoCard}>
                            <div className={styles.cardRow}>
                              <strong>{b.serviceName}</strong>
                              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase' }}>
                                {b.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <div className={styles.cardRow} style={{ color: '#64748B' }}>
                              <span>Date: {new Date(b.startAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              <span style={{ fontWeight: 600, color: '#0F172A' }}>
                                {b.priceQuoted ? `₹${Number(b.priceQuoted).toLocaleString('en-IN')}` : 'Standard'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Lead & Quote Requests */}
                  <div className={styles.drawerSection}>
                    <div className={styles.sectionHeader}>
                      <span className={styles.sectionLabel}>
                        Quote Requests & Leads ({selectedVehicleDetail.leads?.length || 0})
                      </span>
                    </div>
                    {(!selectedVehicleDetail.leads || selectedVehicleDetail.leads.length === 0) ? (
                      <p style={{ fontSize: '0.8125rem', color: '#94A3B8', margin: 0 }}>
                        No quote inquiries on record for this vehicle.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {selectedVehicleDetail.leads.map((l: any) => (
                          <div key={l.id} className={styles.infoCard}>
                            <div className={styles.cardRow}>
                              <strong>{l.serviceName || 'Custom Detailing'}</strong>
                              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#B45309', textTransform: 'uppercase' }}>
                                {l.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <div className={styles.cardRow} style={{ color: '#64748B' }}>
                              <span>Received: {new Date(l.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              <Link href={`/admin/leads/${l.id}`} style={{ color: '#B45309', fontWeight: 600, textDecoration: 'none' }}>
                                View Lead Profile &rarr;
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
