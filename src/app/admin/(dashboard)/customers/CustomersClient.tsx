'use client';

import React, { useState, useMemo } from 'react';
import { WhatsAppCTA } from '@/components/common/WhatsAppCTA';
import { Icon } from '@/components/common/Icons';
import styles from './customers.module.css';

export interface CustomerItem {
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
  const [filterTab, setFilterTab] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
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

  // ── Metrics Calculation ──
  const metrics = useMemo(() => {
    const total = customers.length;
    const totalVehicles = customers.reduce((sum, c) => sum + (c.vehicleCount || 0), 0);
    const totalLeads = customers.reduce((sum, c) => sum + (c.leadCount || 0), 0);
    const multiCar = customers.filter((c) => (c.vehicleCount || 0) >= 2).length;
    const withLeads = customers.filter((c) => (c.leadCount || 0) > 0).length;
    const singleCar = customers.filter((c) => (c.vehicleCount || 0) === 1).length;
    return { total, totalVehicles, totalLeads, multiCar, withLeads, singleCar };
  }, [customers]);

  // ── Segment Filter Tabs ──
  const filterTabs = [
    { key: 'ALL', label: 'All Clients', count: metrics.total },
    { key: 'MULTI_GARAGE', label: 'Fleet Garages (2+ Cars)', count: metrics.multiCar },
    { key: 'ACTIVE_LEADS', label: 'Active Inquiries', count: metrics.withLeads },
    { key: 'SINGLE_CAR', label: 'Single Vehicle', count: metrics.singleCar },
  ];

  // ── Filtered Customers ──
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      // Tab filter
      if (filterTab === 'MULTI_GARAGE' && c.vehicleCount < 2) return false;
      if (filterTab === 'ACTIVE_LEADS' && c.leadCount === 0) return false;
      if (filterTab === 'SINGLE_CAR' && c.vehicleCount !== 1) return false;

      // Search query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchPhone = c.phone.includes(q);
        const matchEmail = c.email ? c.email.toLowerCase().includes(q) : false;
        if (!matchName && !matchPhone && !matchEmail) return false;
      }

      return true;
    });
  }, [customers, filterTab, searchTerm]);

  // ── Client Initials Generator ──
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return (name[0] || 'C').toUpperCase();
  };

  // ── Open Customer Detail Modal ──
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
      // Ignore fallback
    } finally {
      setDetailLoading(false);
    }
  };

  // ── Handle Registering New Vehicle ──
  const handleAddVehicle = async () => {
    if (!vBrand.trim() || !vModel.trim() || !selectedCustomerId) {
      alert('Please specify vehicle brand and model.');
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
            brand: vBrand.trim(),
            model: vModel.trim(),
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
        alert(data.error || 'Failed to register vehicle.');
      }
    } catch {
      alert('Error registering vehicle to customer profile.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Export CSV Handler ──
  const handleExportCSV = () => {
    const headers = ['Client Name', 'Phone Number', 'Email', 'Vehicles in Garage', 'Total Leads', 'Client Since'];
    const rows = filteredCustomers.map((c) => [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.phone}"`,
      `"${c.email || ''}"`,
      c.vehicleCount,
      c.leadCount,
      `"${new Date(c.createdAt).toISOString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smokecustoms_clients_${new Date().toISOString().slice(0, 10)}.csv`);
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
            <span>STUDIO CLIENT REGISTRY</span>
            <span className={styles.eyebrowDot} />
            <span>RELATIONSHIP MANAGEMENT</span>
          </div>
          <h1 className={styles.pageTitle}>Customer Directory & CRM</h1>
          <p className={styles.pageSubtitle}>
            Unified registry of studio clients, customer garages, and detailing service history.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button type="button" onClick={handleExportCSV} className={styles.exportBtn} title="Download CSV spreadsheet of current customer list">
            <Icon.FileText size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ── Executive Metric KPI Cards ── */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Total Clients</span>
            <span className={styles.metricValue}>{metrics.total}</span>
            <span className={styles.metricSubtext}>Registered customer profiles</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconNeutral}`}>
            <Icon.Users size={20} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Garage Vehicles</span>
            <span className={styles.metricValue} style={{ color: '#B45309' }}>
              {metrics.totalVehicles}
            </span>
            <span className={styles.metricSubtext}>Total enrolled vehicles</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconGarage}`}>
            <Icon.Car size={20} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Pipeline Inquiries</span>
            <span className={styles.metricValue} style={{ color: '#2563EB' }}>
              {metrics.totalLeads}
            </span>
            <span className={styles.metricSubtext}>Total client requests</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconLead}`}>
            <Icon.Inbox size={20} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Fleet Garages</span>
            <span className={styles.metricValue} style={{ color: '#16A34A' }}>
              {metrics.multiCar}
            </span>
            <span className={styles.metricSubtext}>Clients with 2+ vehicles</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconVIP}`}>
            <Icon.Crown size={20} />
          </div>
        </div>
      </div>

      {/* ── Filter & Search Controls Panel ── */}
      <div className={styles.controlsCard}>
        {/* Segmented Filter Tabs */}
        <div className={styles.tabsScroll}>
          <div className={styles.segmentTabs}>
            {filterTabs.map((tab) => {
              const isActive = filterTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  className={`${styles.tabBtn} ${isActive ? styles.activeTab : ''}`}
                  onClick={() => setFilterTab(tab.key)}
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
              placeholder="Search by customer name, mobile number, email..."
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
              Showing <strong>{filteredCustomers.length}</strong> of {customers.length} registered clients
            </span>
          </div>
        </div>
      </div>

      {/* ── Customers Table Card ── */}
      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '240px' }}>Customer Profile</th>
                <th style={{ width: '160px' }}>Phone Number</th>
                <th style={{ width: '220px' }}>Email Address</th>
                <th style={{ width: '160px' }}>Garage Fleet</th>
                <th style={{ width: '140px' }}>Inquiries</th>
                <th style={{ width: '130px' }}>Client Since</th>
                <th style={{ width: '160px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c, idx) => {
                const isLast = idx === filteredCustomers.length - 1;
                return (
                  <tr key={c.id} className={`${styles.tableRow} ${isLast ? styles.tableRowLast : ''}`}>
                    {/* 1. Customer Profile */}
                    <td className={styles.clientCell}>
                      <div className={styles.clientWrapper} onClick={() => openCustomerDetail(c.id)}>
                        <div className={styles.clientAvatar}>
                          {getInitials(c.name)}
                        </div>
                        <div className={styles.clientDetails}>
                          <span className={styles.clientName}>{c.name}</span>
                          <span className={styles.clientMetaId}>ID: {c.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </td>

                    {/* 2. Phone */}
                    <td className={styles.phoneCell}>
                      <span className={styles.phoneText}>{c.phone}</span>
                    </td>

                    {/* 3. Email */}
                    <td className={styles.emailCell}>
                      {c.email ? (
                        <span className={styles.emailText}>{c.email}</span>
                      ) : (
                        <span className={styles.emailEmpty}>Not provided</span>
                      )}
                    </td>

                    {/* 4. Vehicles in Garage */}
                    <td className={styles.garageCell}>
                      {c.vehicleCount > 0 ? (
                        <span className={styles.garageBadge}>
                          <Icon.Car size={13} />
                          <span>{c.vehicleCount} Vehicle{c.vehicleCount > 1 ? 's' : ''}</span>
                        </span>
                      ) : (
                        <span className={styles.garageEmpty}>
                          <Icon.Car size={13} />
                          <span>0 registered</span>
                        </span>
                      )}
                    </td>

                    {/* 5. Leads / Inquiries */}
                    <td className={styles.leadsCell}>
                      {c.leadCount > 0 ? (
                        <span className={styles.leadsBadgeActive}>
                          <Icon.Inbox size={12} />
                          <span>{c.leadCount} Inquir{c.leadCount > 1 ? 'ies' : 'y'}</span>
                        </span>
                      ) : (
                        <span className={styles.leadsBadgeZero}>0 Inquiries</span>
                      )}
                    </td>

                    {/* 6. Client Since */}
                    <td className={styles.dateCell}>
                      {new Date(c.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* 7. Action */}
                    <td className={styles.actionCell}>
                      <div className={styles.actionBtns}>
                        <WhatsAppCTA
                          phone={c.phone}
                          message={`Hello ${c.name}, this is Smoke M Customs reaching out regarding your detailing inquiries.`}
                          iconOnly
                          size="sm"
                          variant="icon"
                          ariaLabel={`WhatsApp ${c.name}`}
                          logCommunication={{
                            customerId: c.id,
                            summary: `Outbound WhatsApp chat opened from customer directory for ${c.name}`,
                          }}
                        />

                        <a
                          href={`tel:${c.phone}`}
                          className={styles.callBtn}
                          title={`Call ${c.name}`}
                        >
                          <Icon.Phone size={13} />
                        </a>

                        <button
                          type="button"
                          className={styles.inspectBtn}
                          onClick={() => openCustomerDetail(c.id)}
                        >
                          <span>Inspect</span>
                          <Icon.ArrowRight size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className={styles.emptyCard}>
                      <div className={styles.emptyIconWrap}>
                        <Icon.Users size={24} />
                      </div>
                      <h4 className={styles.emptyTitle}>No matching clients found</h4>
                      <p className={styles.emptyDesc}>
                        Try adjusting your search criteria, clear keywords, or switch between segment filters.
                      </p>
                      {(searchTerm || filterTab !== 'ALL') && (
                        <button
                          type="button"
                          className={styles.emptyResetBtn}
                          onClick={() => {
                            setSearchTerm('');
                            setFilterTab('ALL');
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
        {filteredCustomers.length > 0 && (
          <div className={styles.tableFooter}>
            <span>
              Showing {filteredCustomers.length} of {customers.length} total client{customers.length !== 1 ? 's' : ''}
            </span>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
              Smoke M Customs • VIP Client Dossier
            </span>
          </div>
        )}
      </div>

      {/* ── Luxury Client Profile Dossier Drawer ── */}
      {selectedCustomerId && (
        <div className={styles.drawerOverlay} onClick={() => setSelectedCustomerId(null)}>
          <div className={styles.drawerContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div className={styles.drawerTitleWrap}>
                <span className={styles.drawerEyebrow}>VIP CLIENT PROFILE & GARAGE</span>
                <h2 className={styles.drawerTitle}>
                  {selectedCustomerDetail?.name || 'Client Profile'}
                </h2>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setSelectedCustomerId(null)}
                title="Close drawer"
              >
                <Icon.Cross size={16} />
              </button>
            </div>

            <div className={styles.drawerBody}>
              {detailLoading || !selectedCustomerDetail ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                  Loading client dossier, garage fleet & booking history...
                </div>
              ) : (
                <>
                  {/* Hero Dossier Card */}
                  <div className={styles.dossierHero}>
                    <div className={styles.dossierAvatar}>
                      {getInitials(selectedCustomerDetail.name)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 className={styles.dossierName}>{selectedCustomerDetail.name}</h3>
                      <div className={styles.dossierMeta}>
                        <span>{selectedCustomerDetail.phone}</span>
                        <span>•</span>
                        <span>{selectedCustomerDetail.vehicles?.length || 0} Registered Cars</span>
                      </div>
                    </div>
                    <WhatsAppCTA
                      phone={selectedCustomerDetail.phone}
                      message={`Hello ${selectedCustomerDetail.name}, Smoke M Customs concierge following up regarding your garage detailing.`}
                      label="Chat WhatsApp"
                      variant="outline"
                      size="sm"
                      logCommunication={{
                        customerId: selectedCustomerDetail.id,
                        summary: `Outbound WhatsApp chat opened from client dossier for ${selectedCustomerDetail.name}`,
                      }}
                    />
                  </div>

                  {/* Contact & Preferences Section */}
                  <div className={styles.drawerSection}>
                    <div className={styles.sectionHeader}>
                      <h4 className={styles.sectionTitle}>Contact & Channel Preferences</h4>
                    </div>
                    <div className={styles.profileCard}>
                      <div className={styles.cardRow}>
                        <span className={styles.cardLabel}>Direct Mobile</span>
                        <span className={styles.cardVal}>{selectedCustomerDetail.phone}</span>
                      </div>
                      <div className={styles.cardRow}>
                        <span className={styles.cardLabel}>Email Address</span>
                        <span className={styles.cardVal}>{selectedCustomerDetail.email || 'Not provided'}</span>
                      </div>
                      <div className={styles.cardRow}>
                        <span className={styles.cardLabel}>Preferred Channel</span>
                        <span className={styles.cardVal}>{selectedCustomerDetail.preferredContactMethod || 'WHATSAPP'}</span>
                      </div>
                      <div className={styles.cardRow}>
                        <span className={styles.cardLabel}>Client Since</span>
                        <span className={styles.cardVal}>
                          {new Date(selectedCustomerDetail.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Registered Garage / Vehicles Section */}
                  <div className={styles.drawerSection}>
                    <div className={styles.sectionHeader}>
                      <h4 className={styles.sectionTitle}>
                        Customer Garage ({selectedCustomerDetail.vehicles?.length || 0})
                      </h4>
                      <button
                        type="button"
                        className={styles.addVehicleBtn}
                        onClick={() => setShowAddVehicle(!showAddVehicle)}
                      >
                        <Icon.Plus size={13} />
                        <span>{showAddVehicle ? 'Cancel' : 'Add Vehicle'}</span>
                      </button>
                    </div>

                    {showAddVehicle && (
                      <div className={styles.addVehicleBox}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F172A' }}>
                          Enroll New Vehicle to Client Garage
                        </span>
                        <div className={styles.formGrid}>
                          <input
                            type="text"
                            className={styles.formInput}
                            placeholder="Brand (e.g. Porsche, BMW)"
                            value={vBrand}
                            onChange={(e) => setVBrand(e.target.value)}
                          />
                          <input
                            type="text"
                            className={styles.formInput}
                            placeholder="Model (e.g. 911 GT3, M3)"
                            value={vModel}
                            onChange={(e) => setVModel(e.target.value)}
                          />
                          <input
                            type="number"
                            className={styles.formInput}
                            placeholder="Year"
                            value={vYear}
                            onChange={(e) => setVYear(parseInt(e.target.value) || 2024)}
                          />
                          <select
                            className={styles.formInput}
                            value={vType}
                            onChange={(e) => setVType(e.target.value)}
                          >
                            <option value="SEDAN">Sedan</option>
                            <option value="SUV">SUV</option>
                            <option value="HATCHBACK">Hatchback</option>
                            <option value="LUXURY">Supercar / Exotic</option>
                            <option value="MUV">MUV</option>
                            <option value="TWO_WHEELER">Superbike</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          className={styles.saveVehicleBtn}
                          disabled={actionLoading}
                          onClick={handleAddVehicle}
                        >
                          {actionLoading ? 'Enrolling...' : 'Save Vehicle to Garage'}
                        </button>
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {!selectedCustomerDetail.vehicles || selectedCustomerDetail.vehicles.length === 0 ? (
                        <p style={{ fontSize: '0.8125rem', color: '#94A3B8', margin: 0 }}>
                          No vehicles registered in this garage yet.
                        </p>
                      ) : (
                        selectedCustomerDetail.vehicles.map((v: any) => (
                          <div key={v.id} className={styles.vehicleCard}>
                            <div>
                              <div className={styles.vehicleTitle}>
                                {v.brand} {v.model} {v.variant ? `(${v.variant})` : ''}
                              </div>
                              <div className={styles.vehicleSub}>
                                Segment: {v.vehicleType} • Year: {v.manufactureYear || 'N/A'}
                              </div>
                            </div>
                            <span style={{ fontSize: '0.71875rem', color: '#16A34A', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                              <Icon.Check size={12} /> Verified
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Studio Appointment & Service History */}
                  <div className={styles.drawerSection}>
                    <div className={styles.sectionHeader}>
                      <h4 className={styles.sectionTitle}>Studio Appointment & Service History</h4>
                    </div>
                    {!selectedCustomerDetail.bookings || selectedCustomerDetail.bookings.length === 0 ? (
                      <p style={{ fontSize: '0.8125rem', color: '#94A3B8', margin: 0 }}>
                        No appointment history recorded yet.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {selectedCustomerDetail.bookings.map((b: any) => (
                          <div key={b.id} className={styles.bookingCard}>
                            <div>
                              <div style={{ fontSize: '0.84375rem', fontWeight: 700, color: '#0F172A' }}>
                                {b.serviceName}
                              </div>
                              <div style={{ fontSize: '0.71875rem', color: '#64748B', marginTop: 2 }}>
                                Scheduled: {new Date(b.startAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.84375rem', fontWeight: 700, color: '#0F172A', fontFeatureSettings: 'tnum' }}>
                                {b.priceQuoted ? `₹${Number(b.priceQuoted).toLocaleString('en-IN')}` : 'Standard'}
                              </div>
                              <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#2563EB', textTransform: 'uppercase' }}>
                                {b.status.replace(/_/g, ' ')}
                              </div>
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
