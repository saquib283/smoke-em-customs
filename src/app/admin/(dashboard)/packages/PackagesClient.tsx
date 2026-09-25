'use client';

import React, { useState, useMemo } from 'react';
import { Icon } from '@/components/common/Icons';
import styles from './packages.module.css';

interface ServiceItem {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  startingPrice: string;
  durationMinutes: number;
}

interface PackageItem {
  id: string;
  slug: string;
  name: string;
  price: string | null;
  startingPrice: string | null;
  durationMinutes: number;
  benefits: string[];
  warrantyText?: string | null;
  isEnabled: boolean;
  isBookable: boolean;
  sortOrder: number;
  serviceIds: string[];
}

interface PackagesClientProps {
  initialPackages: PackageItem[];
  availableServices: ServiceItem[];
}

export function PackagesClient({ initialPackages, availableServices }: PackagesClientProps) {
  const [packages, setPackages] = useState<PackageItem[]>(initialPackages);
  const [selectedTab, setSelectedTab] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [startingPrice, setStartingPrice] = useState('24999');
  const [durationMinutes, setDurationMinutes] = useState(240);
  const [benefits, setBenefits] = useState('Complete interior detailing, Exterior paint correction, 1-year ceramic coat');
  const [warrantyText, setWarrantyText] = useState('1 Year Package Warranty');
  const [description, setDescription] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  // ── Executive KPI Metrics ──
  const metrics = useMemo(() => {
    const total = packages.length;
    const bookableOnline = packages.filter((p) => p.isBookable).length;
    const enabledCount = packages.filter((p) => p.isEnabled).length;
    const avgPrice =
      total > 0
        ? Math.round(
            packages.reduce(
              (acc, p) => acc + (parseFloat(p.startingPrice || p.price || '0') || 0),
              0
            ) / total
          )
        : 0;
    const totalBundledServices = packages.reduce(
      (acc, p) => acc + (p.serviceIds?.length || 0),
      0
    );
    return { total, bookableOnline, enabledCount, avgPrice, totalBundledServices };
  }, [packages]);

  // ── Segmented Status Tabs ──
  const statusTabs = useMemo(
    () => [
      { key: 'ALL', label: 'All Packages', count: packages.length },
      { key: 'BOOKABLE', label: 'Bookable Online', count: packages.filter((p) => p.isBookable).length },
      { key: 'INTERNAL', label: 'Internal Only', count: packages.filter((p) => !p.isBookable).length },
      { key: 'ACTIVE', label: 'Active', count: packages.filter((p) => p.isEnabled).length },
      { key: 'DISABLED', label: 'Disabled', count: packages.filter((p) => !p.isEnabled).length },
    ],
    [packages]
  );

  // ── Filtered Packages ──
  const filteredPackages = useMemo(() => {
    return packages.filter((p) => {
      if (selectedTab === 'BOOKABLE' && !p.isBookable) return false;
      if (selectedTab === 'INTERNAL' && p.isBookable) return false;
      if (selectedTab === 'ACTIVE' && !p.isEnabled) return false;
      if (selectedTab === 'DISABLED' && p.isEnabled) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchSlug = p.slug.toLowerCase().includes(q);
        const matchService = (p.serviceIds || []).some((sId) => {
          const svc = availableServices.find((s) => s.id === sId);
          return svc?.name.toLowerCase().includes(q);
        });
        if (!matchName && !matchSlug && !matchService) return false;
      }
      return true;
    });
  }, [packages, selectedTab, searchTerm, availableServices]);

  // ── Duration Formatter (600 mins -> 10 hrs) ──
  const formatDuration = (mins: number) => {
    if (!mins) return '—';
    const hrs = Math.floor(mins / 60);
    const remainder = mins % 60;
    if (hrs > 0 && remainder > 0) return `${hrs}h ${remainder}m`;
    if (hrs > 0) return `${hrs} hr${hrs > 1 ? 's' : ''}`;
    return `${mins} mins`;
  };

  const openCreateModal = () => {
    setEditingId(null);
    setName('');
    setSlug('');
    setStartingPrice('24999');
    setDurationMinutes(240);
    setBenefits('Complete interior detailing, Exterior paint correction, 1-year ceramic coat');
    setWarrantyText('1 Year Package Warranty');
    setDescription('');
    setSelectedServiceIds([]);
    setShowModal(true);
  };

  const openEditModal = (p: PackageItem) => {
    setEditingId(p.id);
    setName(p.name);
    setSlug(p.slug);
    setStartingPrice(p.startingPrice || p.price || '24999');
    setDurationMinutes(p.durationMinutes);
    setBenefits(p.benefits.join(', '));
    setWarrantyText(p.warrantyText || '1 Year Package Warranty');
    setDescription('');
    setSelectedServiceIds(p.serviceIds || []);
    setShowModal(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingId) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      );
    }
  };

  const toggleService = (sId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(sId) ? prev.filter((id) => id !== sId) : [...prev, sId]
    );
  };

  const calculateSumDuration = () => {
    const total = selectedServiceIds.reduce((sum, sId) => {
      const s = availableServices.find((item) => item.id === sId);
      return sum + (s ? s.durationMinutes : 0);
    }, 0);
    if (total > 0) setDurationMinutes(total);
  };

  const handleSave = async () => {
    if (!name.trim() || !slug.trim()) {
      alert('Name and slug are required');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        name,
        slug,
        startingPrice: String(startingPrice),
        durationMinutes: Number(durationMinutes),
        benefits: benefits.split(',').map((b) => b.trim()).filter(Boolean),
        warrantyText,
        description: description || `Comprehensive ${name} detailing package at Smoke M Customs.`,
        serviceIds: selectedServiceIds,
      };

      if (editingId) {
        const res = await fetch('/api/admin/catalogue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target: 'PACKAGE',
            action: 'UPDATE',
            id: editingId,
            data: payload,
          }),
        });
        const data = await res.json();
        if (data.success && data.package) {
          setPackages((prev) =>
            prev.map((p) =>
              p.id === editingId
                ? { ...p, ...data.package, serviceIds: selectedServiceIds }
                : p
            )
          );
          setShowModal(false);
        } else {
          alert(data.error || 'Failed to update package');
        }
      } else {
        const res = await fetch('/api/admin/catalogue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target: 'PACKAGE',
            action: 'CREATE',
            data: payload,
          }),
        });
        const data = await res.json();
        if (data.success && data.package) {
          setPackages((prev) => [
            ...prev,
            { ...data.package, serviceIds: selectedServiceIds },
          ]);
          setShowModal(false);
        } else {
          alert(data.error || 'Failed to create package');
        }
      }
    } catch {
      alert('Error saving package');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleStatus = async (id: string, field: 'isEnabled' | 'isBookable', currentVal: boolean) => {
    try {
      const res = await fetch('/api/admin/catalogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: 'PACKAGE',
          action: 'UPDATE',
          id,
          data: { [field]: !currentVal },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPackages((prev) =>
          prev.map((p) => (p.id === id ? { ...p, [field]: !currentVal } : p))
        );
      }
    } catch {
      alert('Failed to update package status');
    }
  };

  const handleDelete = async (id: string, pName: string) => {
    if (!confirm(`Are you sure you want to deactivate package "${pName}"?`)) return;
    try {
      const res = await fetch('/api/admin/catalogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: 'PACKAGE',
          action: 'DELETE',
          id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPackages((prev) => prev.filter((p) => p.id !== id));
      }
    } catch {
      alert('Failed to delete package');
    }
  };

  // ── Export CSV Handler ──
  const handleExportCSV = () => {
    const headers = [
      'Package Name',
      'Slug',
      'Starting Price (INR)',
      'Duration (mins)',
      'Bundled Services',
      'Status',
      'Online Bookable',
    ];
    const rows = filteredPackages.map((p) => {
      const bundledNames = (p.serviceIds || [])
        .map((sId) => availableServices.find((s) => s.id === sId)?.name)
        .filter(Boolean)
        .join('; ');
      return [
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.slug}"`,
        p.startingPrice || p.price || 0,
        p.durationMinutes,
        `"${bundledNames.replace(/"/g, '""')}"`,
        p.isEnabled ? 'Enabled' : 'Disabled',
        p.isBookable ? 'Bookable' : 'Hidden',
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `smokecustoms_packages_${new Date().toISOString().slice(0, 10)}.csv`
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
            <span>Catalogue & Services</span>
            <span className={styles.eyebrowDot} />
            <span>Treatment Bundles</span>
          </div>
          <h1 className={styles.pageTitle}>Packages Catalogue</h1>
          <p className={styles.pageSubtitle}>
            Configure bundled treatment plans, many-to-many service associations, duration limits, and booking visibility.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button className={styles.exportBtn} onClick={handleExportCSV} title="Export packages to CSV">
            <Icon.FileText size={15} />
            <span>Export CSV</span>
          </button>
          <button className={styles.addBtn} onClick={openCreateModal}>
            <Icon.Plus size={15} />
            <span>+ Add New Package</span>
          </button>
        </div>
      </div>

      {/* ── Executive KPI Metric Cards ── */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Total Bundles</span>
            <span className={styles.metricValue}>{metrics.total}</span>
            <span className={styles.metricSubtext}>Active catalogue tier</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconGold}`}>
            <Icon.Package size={22} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Bookable Online</span>
            <span className={styles.metricValue}>{metrics.bookableOnline}</span>
            <span className={styles.metricSubtext}>Instant client checkout</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconGreen}`}>
            <Icon.Check size={22} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Avg Bundle Value</span>
            <span className={styles.metricValue}>₹{metrics.avgPrice.toLocaleString('en-IN')}</span>
            <span className={styles.metricSubtext}>Composite treatment ticket</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconNeutral}`}>
            <Icon.Tag size={22} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Bundled Services</span>
            <span className={styles.metricValue}>{metrics.totalBundledServices}</span>
            <span className={styles.metricSubtext}>Linked service modules</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconPurple}`}>
            <Icon.Sparkles size={22} />
          </div>
        </div>
      </div>

      {/* ── Controls Panel (Filter Tabs & Search) ── */}
      <div className={styles.controlsCard}>
        <div className={styles.tabsScroll}>
          <div className={styles.statusTabs}>
            {statusTabs.map((tab) => {
              const isActive = selectedTab === tab.key;
              return (
                <button
                  key={tab.key}
                  className={`${styles.tabBtn} ${isActive ? styles.activeTab : ''}`}
                  onClick={() => setSelectedTab(tab.key)}
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
              placeholder="Search by package name, slug, or bundled service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className={styles.clearSearchBtn}
                onClick={() => setSearchTerm('')}
                title="Clear search"
              >
                <Icon.Cross size={14} />
              </button>
            )}
          </div>
          <div className={styles.filterMeta}>
            Showing <strong>{filteredPackages.length}</strong> of {packages.length} packages
          </div>
        </div>
      </div>

      {/* ── Precision CRM Table Card ── */}
      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Package Name</th>
                <th>Starting Price</th>
                <th>Bay Duration</th>
                <th>Bundled Services</th>
                <th>Status (Active)</th>
                <th>Bookable Online</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPackages.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className={styles.emptyCard}>
                      <div className={styles.emptyIconWrap}>
                        <Icon.Package size={24} />
                      </div>
                      <h4 className={styles.emptyTitle}>No packages found</h4>
                      <p className={styles.emptyDesc}>
                        {searchTerm
                          ? `No packages match the query "${searchTerm}". Try resetting your search filters.`
                          : 'No packages found under the selected category.'}
                      </p>
                      {(searchTerm || selectedTab !== 'ALL') && (
                        <button
                          className={styles.emptyResetBtn}
                          onClick={() => {
                            setSearchTerm('');
                            setSelectedTab('ALL');
                          }}
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPackages.map((p, index) => {
                  const isLast = index === filteredPackages.length - 1;
                  return (
                    <tr key={p.id} className={`${styles.tableRow} ${isLast ? styles.tableRowLast : ''}`}>
                      <td>
                        <div className={styles.packageNameWrap}>
                          <span className={styles.packageName}>{p.name}</span>
                          <span className={styles.packageSlug}>slug: {p.slug}</span>
                        </div>
                      </td>
                      <td>
                        <span className={styles.priceTag}>
                          ₹{Number(p.startingPrice || p.price || 0).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td>
                        <span className={styles.durationBadge}>
                          <Icon.Clock size={12} />
                          {formatDuration(p.durationMinutes)}
                          <span style={{ color: '#94A3B8', fontSize: '10px', marginLeft: 2 }}>
                            ({p.durationMinutes}m)
                          </span>
                        </span>
                      </td>
                      <td>
                        <div className={styles.bundledWrap}>
                          {p.serviceIds && p.serviceIds.length > 0 ? (
                            p.serviceIds.map((sId) => {
                              const svc = availableServices.find((s) => s.id === sId);
                              return (
                                <span key={sId} className={styles.bundlePill}>
                                  <Icon.Check size={10} />
                                  {svc ? svc.name : 'Service'}
                                </span>
                              );
                            })
                          ) : (
                            <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                              No services linked
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <button
                          className={`${styles.toggleBtn} ${
                            p.isEnabled ? styles.toggleActive : styles.toggleInactive
                          }`}
                          onClick={() => toggleStatus(p.id, 'isEnabled', p.isEnabled)}
                          title={p.isEnabled ? 'Click to disable package' : 'Click to enable package'}
                        >
                          <span className={styles.toggleDot} />
                          {p.isEnabled ? 'Enabled' : 'Disabled'}
                        </button>
                      </td>
                      <td>
                        <button
                          className={`${styles.toggleBtn} ${
                            p.isBookable ? styles.toggleActive : styles.toggleInactive
                          }`}
                          onClick={() => toggleStatus(p.id, 'isBookable', p.isBookable)}
                          title={p.isBookable ? 'Click to hide from online booking' : 'Click to make bookable online'}
                        >
                          <span className={styles.toggleDot} />
                          {p.isBookable ? 'Bookable' : 'Hidden'}
                        </button>
                      </td>
                      <td>
                        <div className={styles.actionBtns}>
                          <button
                            className={styles.actionBtn}
                            onClick={() => openEditModal(p)}
                            title="Edit package details"
                          >
                            <Icon.Edit size={12} />
                            <span>Edit</span>
                          </button>
                          <button
                            className={styles.deleteBtn}
                            onClick={() => handleDelete(p.id, p.name)}
                            title="Deactivate package"
                          >
                            <Icon.Trash size={12} />
                            <span>Deactivate</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredPackages.length > 0 && (
          <div className={styles.tableFooter}>
            <div>
              Showing <strong>{filteredPackages.length}</strong> of {packages.length} active packages
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icon.Shield size={13} color="#B45309" />
              <span>Multi-service bundles automate detailing bay scheduling & workflow tracking.</span>
            </div>
          </div>
        )}
      </div>

      {/* ── CREATE / EDIT MODAL ── */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div
            className={styles.modalBox}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingId ? 'Edit Package' : 'Create Detailing Package'}
              </h2>
              <button
                className={styles.closeBtn}
                onClick={() => setShowModal(false)}
                title="Close modal"
              >
                <Icon.Cross size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Package Name</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="e.g. Signature Ceramic Revival"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>URL Slug</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="e.g. signature-ceramic-revival"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Starting Price (₹)</label>
                  <input
                    type="number"
                    className={styles.inputField}
                    placeholder="24999"
                    value={startingPrice}
                    onChange={(e) => setStartingPrice(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className={styles.formLabel}>Bay Duration (Mins)</label>
                    {selectedServiceIds.length > 0 && (
                      <button
                        type="button"
                        onClick={calculateSumDuration}
                        className={styles.calcDurationBtn}
                        title="Sum durations of all selected services"
                      >
                        ⚡ Auto-sum ({selectedServiceIds.length} svcs)
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    className={styles.inputField}
                    placeholder="240"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 120)}
                  />
                </div>

                <div className={styles.formGroupFull}>
                  <label className={styles.formLabel}>Warranty Coverage</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="e.g. 2 Years Studio Warranty with annual inspection"
                    value={warrantyText}
                    onChange={(e) => setWarrantyText(e.target.value)}
                  />
                </div>
              </div>

              {/* BUNDLED SERVICES MULTI-SELECT CHECKBOX LIST */}
              <div className={styles.formGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className={styles.formLabel}>
                    Bundled Services (Many-to-Many Association)
                  </label>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
                    {selectedServiceIds.length} of {availableServices.length} selected
                  </span>
                </div>

                <div className={styles.serviceCheckboxGrid}>
                  {availableServices.length === 0 ? (
                    <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0, gridColumn: '1 / -1' }}>
                      No services found in catalogue.
                    </p>
                  ) : (
                    availableServices.map((svc) => {
                      const isSelected = selectedServiceIds.includes(svc.id);
                      return (
                        <label
                          key={svc.id}
                          className={`${styles.serviceItemLabel} ${isSelected ? styles.serviceItemSelected : ''}`}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleService(svc.id)}
                              style={{ accentColor: '#B45309', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '12px', fontWeight: isSelected ? 700 : 500, color: '#0F172A' }}>
                              {svc.name}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748B' }}>
                            <span>{svc.durationMinutes}m</span>
                            <span style={{ color: '#B45309', fontWeight: 600 }}>
                              ₹{Number(svc.startingPrice).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Included Treatment Highlights (Comma Separated)</label>
                <input
                  type="text"
                  className={styles.inputField}
                  placeholder="Interior deep clean, Multi-stage correction, Hydrophobic glass coat"
                  value={benefits}
                  onChange={(e) => setBenefits(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description</label>
                <textarea
                  className={styles.inputField}
                  rows={2}
                  placeholder="Full details of this bundled package..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.actionBtn}
                onClick={() => setShowModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className={styles.addBtn}
                onClick={handleSave}
                disabled={actionLoading}
              >
                {editingId ? 'Save Package' : 'Create Package'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
