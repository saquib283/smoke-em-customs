'use client';

import React, { useState, useMemo } from 'react';
import { Icon } from '@/components/common/Icons';
import { Select, type SelectOption } from '@/components/ui';
import styles from './offers.module.css';

export interface OfferItem {
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

interface ServiceOption {
  id: string;
  name: string;
}

interface PackageOption {
  id: string;
  name: string;
}

interface OffersClientProps {
  initialOffers: OfferItem[];
  services: ServiceOption[];
  packages: PackageOption[];
}

type TabType = 'ALL' | 'ACTIVE' | 'UPCOMING' | 'EXPIRED' | 'DISABLED';

export function OffersClient({ initialOffers, services, packages }: OffersClientProps) {
  const [offers, setOffers] = useState<OfferItem[]>(initialOffers);
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<OfferItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [packageId, setPackageId] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);

  const getOfferStatus = (offer: OfferItem): 'ACTIVE' | 'UPCOMING' | 'EXPIRED' | 'DISABLED' => {
    if (!offer.isEnabled) return 'DISABLED';
    const now = new Date();
    const start = new Date(offer.startAt);
    const end = new Date(offer.endAt);
    if (now < start) return 'UPCOMING';
    if (now > end) return 'EXPIRED';
    return 'ACTIVE';
  };

  // ── Executive KPI Metrics ──
  const metrics = useMemo(() => {
    const total = offers.length;
    const activeCount = offers.filter((o) => getOfferStatus(o) === 'ACTIVE').length;
    const upcomingCount = offers.filter((o) => getOfferStatus(o) === 'UPCOMING').length;
    const expiredCount = offers.filter((o) => getOfferStatus(o) === 'EXPIRED').length;
    const disabledCount = offers.filter((o) => getOfferStatus(o) === 'DISABLED').length;
    return { total, activeCount, upcomingCount, expiredCount, disabledCount };
  }, [offers]);

  // ── Segmented Filter Tabs ──
  const filterTabs = useMemo(
    () => [
      { id: 'ALL' as const, label: 'All Offers', count: offers.length },
      { id: 'ACTIVE' as const, label: 'Active Now', count: offers.filter((o) => getOfferStatus(o) === 'ACTIVE').length },
      { id: 'UPCOMING' as const, label: 'Upcoming', count: offers.filter((o) => getOfferStatus(o) === 'UPCOMING').length },
      { id: 'EXPIRED' as const, label: 'Expired', count: offers.filter((o) => getOfferStatus(o) === 'EXPIRED').length },
      { id: 'DISABLED' as const, label: 'Paused / Disabled', count: offers.filter((o) => getOfferStatus(o) === 'DISABLED').length },
    ],
    [offers]
  );

  const openCreateModal = () => {
    setEditingOffer(null);
    setTitle('');
    setDescription('');
    // Default start now, end in 30 days
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setStartAt(today);
    setEndAt(nextMonth);
    setServiceId('');
    setPackageId('');
    setIsEnabled(true);
    setShowModal(true);
  };

  const openEditModal = (offer: OfferItem) => {
    setEditingOffer(offer);
    setTitle(offer.title);
    setDescription(offer.description);
    setStartAt(new Date(offer.startAt).toISOString().split('T')[0]);
    setEndAt(new Date(offer.endAt).toISOString().split('T')[0]);
    setServiceId(offer.serviceId || '');
    setPackageId(offer.packageId || '');
    setIsEnabled(offer.isEnabled);
    setShowModal(true);
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Offer title and description are required');
      return;
    }
    if (!startAt || !endAt) {
      alert('Start and end dates are required');
      return;
    }
    if (new Date(endAt) <= new Date(startAt)) {
      alert('End date must be after the start date');
      return;
    }

    setActionLoading(true);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      startAt: new Date(`${startAt}T00:00:00.000Z`).toISOString(),
      endAt: new Date(`${endAt}T23:59:59.000Z`).toISOString(),
      serviceId: serviceId || null,
      packageId: packageId || null,
      isEnabled,
    };

    try {
      if (editingOffer) {
        // UPDATE
        const res = await fetch('/api/admin/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target: 'OFFER',
            action: 'UPDATE',
            id: editingOffer.id,
            data: payload,
          }),
        });
        const data = await res.json();
        if (data.success && data.offer) {
          const serviceObj = services.find((s) => s.id === serviceId);
          const pkgObj = packages.find((p) => p.id === packageId);
          const enrichedOffer = {
            ...data.offer,
            serviceName: serviceObj?.name ?? null,
            packageName: pkgObj?.name ?? null,
          };
          setOffers((prev) =>
            prev.map((o) => (o.id === editingOffer.id ? enrichedOffer : o))
          );
          setShowModal(false);
        } else {
          alert(data.error || 'Failed to update offer');
        }
      } else {
        // CREATE
        const res = await fetch('/api/admin/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target: 'OFFER',
            action: 'CREATE',
            data: payload,
          }),
        });
        const data = await res.json();
        if (data.success && data.offer) {
          const serviceObj = services.find((s) => s.id === serviceId);
          const pkgObj = packages.find((p) => p.id === packageId);
          const enrichedOffer = {
            ...data.offer,
            serviceName: serviceObj?.name ?? null,
            packageName: pkgObj?.name ?? null,
          };
          setOffers((prev) => [enrichedOffer, ...prev]);
          setShowModal(false);
        } else {
          alert(data.error || 'Failed to create offer');
        }
      }
    } catch {
      alert('Network error while saving offer');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleEnabled = async (id: string, currentVal: boolean) => {
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: 'OFFER',
          action: 'UPDATE',
          id,
          data: { isEnabled: !currentVal },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOffers((prev) =>
          prev.map((o) => (o.id === id ? { ...o, isEnabled: !currentVal } : o))
        );
      }
    } catch {
      alert('Failed to toggle offer activation');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this promotional offer?')) return;
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: 'OFFER',
          action: 'DELETE',
          id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOffers((prev) => prev.filter((o) => o.id !== id));
      } else {
        alert(data.error || 'Failed to delete offer');
      }
    } catch {
      alert('Error deleting offer');
    }
  };

  // ── Filtered Offers ──
  const filteredOffers = useMemo(() => {
    return offers.filter((o) => {
      const status = getOfferStatus(o);
      if (activeTab === 'ACTIVE' && status !== 'ACTIVE') return false;
      if (activeTab === 'UPCOMING' && status !== 'UPCOMING') return false;
      if (activeTab === 'EXPIRED' && status !== 'EXPIRED') return false;
      if (activeTab === 'DISABLED' && status !== 'DISABLED') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          o.title.toLowerCase().includes(q) ||
          o.description.toLowerCase().includes(q) ||
          (o.serviceName && o.serviceName.toLowerCase().includes(q)) ||
          (o.packageName && o.packageName.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [offers, activeTab, searchQuery]);

  // ── Export CSV Handler ──
  const handleExportCSV = () => {
    const headers = [
      'Offer Title',
      'Status',
      'Linked Service',
      'Linked Package',
      'Start Date',
      'End Date',
      'Enabled',
      'Description',
    ];
    const rows = filteredOffers.map((o) => [
      `"${o.title.replace(/"/g, '""')}"`,
      getOfferStatus(o),
      `"${(o.serviceName || '').replace(/"/g, '""')}"`,
      `"${(o.packageName || '').replace(/"/g, '""')}"`,
      o.startAt ? new Date(o.startAt).toISOString().slice(0, 10) : '',
      o.endAt ? new Date(o.endAt).toISOString().slice(0, 10) : '',
      o.isEnabled ? 'Yes' : 'No',
      `"${o.description.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `smokecustoms_offers_${new Date().toISOString().slice(0, 10)}.csv`
    );
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
            <span>Studio Control</span>
            <span className={styles.eyebrowDot} />
            <span>Marketing & Media</span>
            <span className={styles.eyebrowDot} />
            <span>Campaigns & Incentives</span>
          </div>
          <h1 className={styles.pageTitle}>Promotions, Offers & Seasonal Specials</h1>
          <p className={styles.pageSubtitle}>
            Manage promotional campaigns, limited-period incentives, and service package discount tags.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button className={styles.exportBtn} onClick={handleExportCSV} title="Export offers to CSV">
            <Icon.FileText size={15} />
            <span>Export CSV</span>
          </button>
          <button className={styles.addBtn} onClick={openCreateModal}>
            <Icon.Plus size={15} />
            <span>+ Create Promotional Offer</span>
          </button>
        </div>
      </div>

      {/* ── Executive KPI Metric Cards ── */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Total Promotions</span>
            <span className={styles.metricValue}>{metrics.total}</span>
            <span className={styles.metricSubtext}>Campaign offerings</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconGold}`}>
            <Icon.Tag size={22} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Active Right Now</span>
            <span className={styles.metricValue}>{metrics.activeCount}</span>
            <span className={styles.metricSubtext}>Live on public portal</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconGreen}`}>
            <Icon.Check size={22} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Upcoming Pipeline</span>
            <span className={styles.metricValue}>{metrics.upcomingCount}</span>
            <span className={styles.metricSubtext}>Scheduled campaigns</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconAmber}`}>
            <Icon.Calendar size={22} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Expired / Archived</span>
            <span className={styles.metricValue}>{metrics.expiredCount}</span>
            <span className={styles.metricSubtext}>Past incentives</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconPurple}`}>
            <Icon.Clock size={22} />
          </div>
        </div>
      </div>

      {/* ── Filter & Search Controls Panel ── */}
      <div className={styles.controlsCard}>
        <div className={styles.tabsScroll}>
          <div className={styles.filterTabs}>
            {filterTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`${styles.tabBtn} ${isActive ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span>{tab.label}</span>
                  <span className={`${styles.tabBadge} ${!isActive ? styles.tabBadgeInactive : ''}`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.searchRow}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>
              <Icon.Search size={15} />
            </span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search offer title, linked service, package, terms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className={styles.clearSearchBtn}
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                <Icon.Cross size={14} />
              </button>
            )}
          </div>
          <div className={styles.filterMeta}>
            Showing <strong>{filteredOffers.length}</strong> of {offers.length} offers
          </div>
        </div>
      </div>

      {/* ── Offers Grid ── */}
      <div className={styles.offersGrid}>
        {filteredOffers.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIconWrap}>
              <Icon.Tag size={24} />
            </div>
            <h4 className={styles.emptyTitle}>No promotional offers found</h4>
            <p className={styles.emptyDesc}>
              {searchQuery
                ? `No offers match "${searchQuery}". Try adjusting your search query or filters.`
                : 'Try clearing your filter or create a new seasonal promotion.'}
            </p>
            {(searchQuery || activeTab !== 'ALL') && (
              <button
                className={styles.emptyResetBtn}
                onClick={() => {
                  setSearchQuery('');
                  setActiveTab('ALL');
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          filteredOffers.map((offer) => {
            const status = getOfferStatus(offer);
            const statusClass = {
              ACTIVE: styles.statusActive,
              UPCOMING: styles.statusUpcoming,
              EXPIRED: styles.statusExpired,
              DISABLED: styles.statusDisabled,
            }[status];

            return (
              <div key={offer.id} className={styles.offerCard}>
                <div className={styles.cardHead}>
                  <h3 className={styles.offerTitle}>{offer.title}</h3>
                  <span className={`${styles.statusBadge} ${statusClass}`}>{status}</span>
                </div>

                <p className={styles.offerDesc}>{offer.description}</p>

                {(offer.serviceName || offer.packageName) && (
                  <div className={styles.linkageRow}>
                    {offer.serviceName && (
                      <span className={`${styles.linkagePill} ${styles.linkagePillAccent}`}>
                        <Icon.Wrench size={12} color="#B45309" />
                        <span>{offer.serviceName}</span>
                      </span>
                    )}
                    {offer.packageName && (
                      <span className={styles.linkagePill}>
                        <Icon.Package size={12} color="#64748B" />
                        <span>{offer.packageName}</span>
                      </span>
                    )}
                  </div>
                )}

                <div className={styles.validityRow}>
                  <Icon.Calendar size={13} color="#B45309" />
                  <span>
                    {new Date(offer.startAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    –{' '}
                    {new Date(offer.endAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div className={styles.cardFooter}>
                  <button
                    type="button"
                    className={`${styles.togglePill} ${offer.isEnabled ? styles.togglePillActive : styles.togglePillPaused}`}
                    onClick={() => toggleEnabled(offer.id, offer.isEnabled)}
                    title={offer.isEnabled ? 'Click to pause offer' : 'Click to activate offer'}
                  >
                    <span className={styles.toggleDot} />
                    <span>{offer.isEnabled ? 'Active' : 'Paused'}</span>
                  </button>

                  <div className={styles.actionsGroup}>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => openEditModal(offer)}
                      title="Edit offer details"
                    >
                      <Icon.Edit size={12} />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(offer.id)}
                      title="Delete offer"
                    >
                      <Icon.Trash size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingOffer ? 'Edit Promotional Offer' : 'Create Promotional Offer'}</h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setShowModal(false)}
                title="Close modal"
              >
                <Icon.Cross size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveOffer}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Offer Title *</label>
                  <input
                    type="text"
                    required
                    className={styles.formInput}
                    placeholder="e.g. Monsoon Hydrophobic Ceramic Upgrade"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Campaign Description *</label>
                  <textarea
                    required
                    className={styles.formTextarea}
                    placeholder="Detail the promotional value, complimentary add-ons, terms, and eligibility..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Start Date *</label>
                    <input
                      type="date"
                      required
                      className={styles.formInput}
                      value={startAt}
                      onChange={(e) => setStartAt(e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>End Date *</label>
                    <input
                      type="date"
                      required
                      className={styles.formInput}
                      value={endAt}
                      onChange={(e) => setEndAt(e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Link to Specific Service</label>
                    <Select
                      size="sm"
                      value={serviceId}
                      onChange={(val) => setServiceId(val)}
                      options={[
                        { value: '', label: 'No specific service (Global Studio Offer)', icon: <Icon.Sparkles size={15} /> },
                        ...services.map((s) => ({ value: s.id, label: s.name, icon: <Icon.Sparkles size={15} /> })),
                      ]}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Link to Specific Package</label>
                    <Select
                      size="sm"
                      value={packageId}
                      onChange={(val) => setPackageId(val)}
                      options={[
                        { value: '', label: 'No specific package', icon: <Icon.Package size={15} /> },
                        ...packages.map((p) => ({ value: p.id, label: p.name, icon: <Icon.Package size={15} /> })),
                      ]}
                    />
                  </div>
                </div>

                <div className={styles.checkboxRow}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={(e) => setIsEnabled(e.target.checked)}
                    />
                    <span>Active and Enabled for Customers</span>
                  </label>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={styles.btnPrimary}
                >
                  {actionLoading ? 'Saving...' : editingOffer ? 'Update Offer' : 'Launch Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
