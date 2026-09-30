'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Icon } from '@/components/common/Icons';
import styles from './packages.module.css';

export interface PackageItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: string | null;
  startingPrice: string | null;
  durationMinutes: number;
  benefits: string[];
  warrantyText: string | null;
  validityText: string | null;
  terms: string | null;
  isEnabled: boolean;
  isBookable: boolean;
  sortOrder: number;
  serviceIds: string[];
  imageUrl: string | null;
}

interface ServiceOption {
  id: string;
  name: string;
  durationMinutes: number;
  startingPrice: string;
}

interface PackagesClientProps {
  initialPackages: PackageItem[];
  availableServices: ServiceOption[];
}

export function PackagesClient({ initialPackages, availableServices }: PackagesClientProps) {
  const [packages, setPackages] = useState<PackageItem[]>(initialPackages);
  const [selectedTab, setSelectedTab] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [startingPrice, setStartingPrice] = useState('24999');
  const [durationMinutes, setDurationMinutes] = useState(240);
  const [benefits, setBenefits] = useState('Complete interior detailing, Exterior paint correction, 1-year ceramic coat');
  const [warrantyText, setWarrantyText] = useState('1 Year Package Warranty');
  const [validityText, setValidityText] = useState('Annual Coverage');
  const [terms, setTerms] = useState('Requires 24h curing in positive pressure bay.');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [isBookable, setIsBookable] = useState(true);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  // ── Executive KPI Metrics ──
  const metrics = useMemo(() => {
    const total = packages.length;
    const bookableOnline = packages.filter((p) => p.isBookable).length;
    const activeCount = packages.filter((p) => p.isEnabled).length;
    const avgPrice =
      total > 0
        ? Math.round(
            packages.reduce(
              (acc, p) => acc + (parseFloat(p.price || p.startingPrice || '0') || 0),
              0
            ) / total
          )
        : 0;
    return { total, bookableOnline, activeCount, avgPrice };
  }, [packages]);

  // ── Filter Tabs ──
  const filterTabs = useMemo(
    () => [
      { key: 'ALL', label: 'All Packages', count: packages.length },
      { key: 'ACTIVE', label: 'Live on Public Site', count: packages.filter((p) => p.isEnabled).length },
      { key: 'DISABLED', label: 'Hidden from Public', count: packages.filter((p) => !p.isEnabled).length },
      { key: 'BOOKABLE', label: 'Bookable Online', count: packages.filter((p) => p.isBookable).length },
    ],
    [packages]
  );

  // ── Filtered Packages ──
  const filteredPackages = useMemo(() => {
    return packages
      .filter((p) => {
        if (selectedTab === 'BOOKABLE' && !p.isBookable) return false;
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
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [packages, selectedTab, searchTerm, availableServices]);

  // ── Duration Formatter ──
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
    setValidityText('Annual Coverage');
    setTerms('Requires 24h curing in positive pressure bay.');
    setDescription('');
    setSortOrder(packages.length + 1);
    setImageUrl('/ppf-install.jpg');
    setIsEnabled(true);
    setIsBookable(true);
    setSelectedServiceIds([]);
    setShowModal(true);
  };

  const openEditModal = (p: PackageItem) => {
    setEditingId(p.id);
    setName(p.name);
    setSlug(p.slug);
    setStartingPrice(p.startingPrice || p.price || '24999');
    setDurationMinutes(p.durationMinutes);
    setBenefits((p.benefits || []).join(', '));
    setWarrantyText(p.warrantyText || '');
    setValidityText(p.validityText || '');
    setTerms(p.terms || '');
    setDescription(p.description || '');
    setSortOrder(p.sortOrder || 0);
    setImageUrl(p.imageUrl || '/ppf-install.jpg');
    setIsEnabled(p.isEnabled);
    setIsBookable(p.isBookable);
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

  // Direct Image Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'packages');

      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setImageUrl(data.url);
      } else {
        alert(data.error || 'Failed to upload image');
      }
    } catch {
      alert('Error during image transmission');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !slug.trim()) {
      alert('Name and slug are required');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        startingPrice: String(startingPrice),
        price: String(startingPrice),
        durationMinutes: Number(durationMinutes),
        benefits: benefits
          .split(',')
          .map((b) => b.trim())
          .filter(Boolean),
        warrantyText: warrantyText.trim() || null,
        validityText: validityText.trim() || null,
        terms: terms.trim() || null,
        description: description.trim() || `${name} bespoke treatment package suite.`,
        serviceIds: selectedServiceIds,
        sortOrder: Number(sortOrder) || 0,
        imageUrl: imageUrl.trim() || null,
        isEnabled,
        isBookable,
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
            prev.map((p) => (p.id === editingId ? { ...p, ...data.package } : p))
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
          setPackages((prev) => [...prev, data.package]);
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

  // 1-Click Toggle Status (Live / Hidden / Bookable)
  const toggleStatus = async (id: string, field: 'isEnabled' | 'isBookable', currentVal: boolean) => {
    // Optimistic UI update
    setPackages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: !currentVal } : p))
    );

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
      if (!data.success) {
        setPackages((prev) =>
          prev.map((p) => (p.id === id ? { ...p, [field]: currentVal } : p))
        );
        alert(data.error || 'Failed to update status');
      }
    } catch {
      setPackages((prev) =>
        prev.map((p) => (p.id === id ? { ...p, [field]: currentVal } : p))
      );
      alert('Failed to update status');
    }
  };

  // Reorder Item
  const handleReorder = async (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filteredPackages.length) return;

    const currentItem = filteredPackages[index];
    const targetItem = filteredPackages[targetIndex];

    const currentOrder = currentItem.sortOrder;
    const targetOrder = targetItem.sortOrder === currentOrder
      ? (direction === 'UP' ? currentOrder - 1 : currentOrder + 1)
      : targetItem.sortOrder;

    const updatedPackages = packages.map((p) => {
      if (p.id === currentItem.id) return { ...p, sortOrder: targetOrder };
      if (p.id === targetItem.id) return { ...p, sortOrder: currentOrder };
      return p;
    });

    setPackages(updatedPackages);

    try {
      await fetch('/api/admin/catalogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: 'PACKAGE',
          action: 'REORDER',
          items: [
            { id: currentItem.id, sortOrder: targetOrder },
            { id: targetItem.id, sortOrder: currentOrder },
          ],
        }),
      });
    } catch {
      alert('Failed to sync reorder');
    }
  };

  const handleDelete = async (id: string, pName: string) => {
    if (!confirm(`Are you sure you want to deactivate and remove "${pName}" from the public website?`)) return;
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
      } else {
        alert(data.error || 'Failed to delete package');
      }
    } catch {
      alert('Failed to delete package');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Order', 'Package Name', 'Slug', 'Price (INR)', 'Duration (mins)', 'Status', 'Online Bookable', 'Included Services Count'];
    const rows = filteredPackages.map((p) => [
      p.sortOrder,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.slug}"`,
      p.price || p.startingPrice || '0',
      p.durationMinutes,
      p.isEnabled ? 'Live on Public Site' : 'Hidden',
      p.isBookable ? 'Bookable' : 'Inquire Only',
      (p.serviceIds || []).length,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smokecustoms_packages_${new Date().toISOString().slice(0, 10)}.csv`);
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
            <span>STUDIO CATALOGUE & INVENTORY</span>
            <span className={styles.eyebrowDot} />
            <span>FULL SUITES MANAGEMENT</span>
          </div>
          <h1 className={styles.pageTitle}>Treatment Packages</h1>
          <p className={styles.pageSubtitle}>
            Configure bundled detailing packages, link services, manage public visibility, and reorder suites.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.exportBtn}
            onClick={handleExportCSV}
            title="Download CSV spreadsheet of packages"
          >
            <Icon.FileText size={15} />
            <span>Export CSV</span>
          </button>
          <button type="button" className={styles.addBtn} onClick={openCreateModal}>
            <Icon.Plus size={15} />
            <span>Add New Package</span>
          </button>
        </div>
      </div>

      {/* ── Executive KPI Metric Cards ── */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Total Packages</span>
            <span className={styles.metricValue}>{metrics.total}</span>
            <span className={styles.metricSubtext}>Curated multi-treatment suites</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconNeutral}`}>
            <Icon.Package size={20} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Live on Public Site</span>
            <span className={styles.metricValue} style={{ color: '#16A34A' }}>
              {metrics.activeCount} / {metrics.total}
            </span>
            <span className={styles.metricSubtext}>Visible on packages page</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconActive}`}>
            <Icon.Check size={20} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Bookable Online</span>
            <span className={styles.metricValue} style={{ color: '#2563EB' }}>
              {metrics.bookableOnline}
            </span>
            <span className={styles.metricSubtext}>Direct self-serve client booking</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconActive}`}>
            <Icon.Sparkles size={20} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Average Suite Price</span>
            <span className={styles.metricValue} style={{ color: '#B45309' }}>
              ₹{metrics.avgPrice.toLocaleString('en-IN')}
            </span>
            <span className={styles.metricSubtext}>Mean bundled investment</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconGold}`}>
            <Icon.FileText size={20} />
          </div>
        </div>
      </div>

      {/* ── Filter & Search Controls Panel ── */}
      <div className={styles.controlsCard}>
        {/* Status Tabs */}
        <div className={styles.tabsScroll}>
          <div className={styles.statusTabs}>
            {filterTabs.map((tab) => {
              const isActive = selectedTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  className={`${styles.tabBtn} ${isActive ? styles.activeTab : ''}`}
                  onClick={() => setSelectedTab(tab.key)}
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
              placeholder="Search by package name, slug, or included service..."
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
            <span>
              Showing <strong>{filteredPackages.length}</strong> of {packages.length} packages
            </span>
          </div>
        </div>
      </div>

      {/* ── Packages Table Card ── */}
      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Order</th>
                <th style={{ width: '320px' }}>Package Suite & Media</th>
                <th style={{ width: '150px' }}>Starting Price</th>
                <th style={{ width: '130px' }}>Bay Duration</th>
                <th style={{ width: '220px' }}>Included Services</th>
                <th style={{ width: '160px' }}>Public Website</th>
                <th style={{ width: '150px' }}>Online Intake</th>
                <th style={{ width: '160px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPackages.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className={styles.emptyCard}>
                      <div className={styles.emptyIconWrap}>
                        <Icon.Package size={24} />
                      </div>
                      <h4 className={styles.emptyTitle}>No matching packages found</h4>
                      <p className={styles.emptyDesc}>
                        Try adjusting your search query, selecting another filter, or create a new package.
                      </p>
                      {(searchTerm || selectedTab !== 'ALL') && (
                        <button
                          type="button"
                          className={styles.emptyResetBtn}
                          onClick={() => {
                            setSearchTerm('');
                            setSelectedTab('ALL');
                          }}
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPackages.map((p, idx) => {
                  const isLast = idx === filteredPackages.length - 1;
                  const isFirst = idx === 0;
                  const linkedServices = (p.serviceIds || [])
                    .map((sId) => availableServices.find((s) => s.id === sId)?.name)
                    .filter(Boolean);

                  return (
                    <tr key={p.id} className={`${styles.tableRow} ${isLast ? styles.tableRowLast : ''}`}>
                      {/* 0. Order & Quick Reorder */}
                      <td>
                        <div className={styles.orderCell}>
                          <span className={styles.orderBadge}>#{p.sortOrder}</span>
                          <div className={styles.reorderBtns}>
                            <button
                              type="button"
                              className={styles.reorderBtn}
                              disabled={isFirst}
                              onClick={() => handleReorder(idx, 'UP')}
                              title="Move package up"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              className={styles.reorderBtn}
                              disabled={isLast}
                              onClick={() => handleReorder(idx, 'DOWN')}
                              title="Move package down"
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* 1. Name & Media Thumbnail */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <img
                            src={p.imageUrl || '/ppf-install.jpg'}
                            alt={p.name}
                            className={styles.packageThumb}
                          />
                          <div className={styles.serviceNameWrap}>
                            <span className={styles.serviceName}>{p.name}</span>
                            <span className={styles.serviceSlug}>slug: {p.slug}</span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Price */}
                      <td>
                        <span className={styles.priceTag}>
                          ₹{Number(p.price || p.startingPrice || 0).toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* 3. Duration */}
                      <td>
                        <span className={styles.durationBadge}>
                          <Icon.Clock size={12} />
                          <span>{formatDuration(p.durationMinutes)}</span>
                        </span>
                      </td>

                      {/* 4. Included Services */}
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '240px' }}>
                          {linkedServices.length === 0 ? (
                            <span style={{ fontSize: '11px', color: '#94A3B8' }}>No linked services</span>
                          ) : (
                            linkedServices.map((sName, sIdx) => (
                              <span key={sIdx} className={styles.serviceTag}>
                                {sName}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      {/* 5. Public Website Visibility (1-Click Toggle) */}
                      <td>
                        <button
                          type="button"
                          className={`${styles.toggleBtn} ${
                            p.isEnabled ? styles.toggleActive : styles.toggleInactive
                          }`}
                          onClick={() => toggleStatus(p.id, 'isEnabled', p.isEnabled)}
                          title="Click to Hide or Show this package on the live website"
                        >
                          <span className={styles.toggleDot} />
                          <span>{p.isEnabled ? 'Live on Site' : 'Hidden'}</span>
                        </button>
                      </td>

                      {/* 6. Online Intake (Bookable Toggle) */}
                      <td>
                        <button
                          type="button"
                          className={`${styles.toggleBtn} ${
                            p.isBookable ? styles.toggleActive : styles.toggleInactive
                          }`}
                          onClick={() => toggleStatus(p.id, 'isBookable', p.isBookable)}
                          title="Click to toggle online self-serve booking"
                        >
                          <span className={styles.toggleDot} />
                          <span>{p.isBookable ? 'Bookable' : 'Inquire Only'}</span>
                        </button>
                      </td>

                      {/* 7. Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div className={styles.actionsWrap}>
                          <button
                            type="button"
                            className={styles.actionBtnEdit}
                            onClick={() => openEditModal(p)}
                            title="Edit full package parameters"
                          >
                            <Icon.FileText size={14} />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            className={styles.actionBtnDelete}
                            onClick={() => handleDelete(p.id, p.name)}
                            title="Deactivate and remove package"
                          >
                            <Icon.Trash size={14} />
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
      </div>

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard} style={{ maxWidth: '680px' }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingId ? 'Edit Detailing Package' : 'Create Treatment Package'}
              </h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setShowModal(false)}
                title="Close modal"
              >
                <Icon.Cross size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Row 1: Name and Slug */}
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Package Name *</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="e.g. Signature Armor Suite"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>URL Slug *</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="e.g. signature-armor-suite"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                </div>
              </div>

              {/* Row 2: Price and Duration */}
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Package Price (₹) *</label>
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
                    <label className={styles.formLabel}>Bay Duration (Mins) *</label>
                    {selectedServiceIds.length > 0 && (
                      <button
                        type="button"
                        className={styles.calcDurationBtn}
                        onClick={calculateSumDuration}
                        title="Sum up durations of all selected services"
                      >
                        Sum from services
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    className={styles.inputField}
                    placeholder="240"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  />
                  <span style={{ fontSize: '11px', color: '#64748B' }}>
                    ~{formatDuration(durationMinutes)} in workshop bay
                  </span>
                </div>
              </div>

              {/* Row 3: Display Order & Media */}
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Display Priority Order</label>
                  <input
                    type="number"
                    className={styles.inputField}
                    placeholder="1"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                  />
                  <span style={{ fontSize: '11px', color: '#64748B' }}>
                    Lowest numbers appear first on public packages page
                  </span>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Warranty Coverage</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="e.g. 3 Years Warranty"
                    value={warrantyText}
                    onChange={(e) => setWarrantyText(e.target.value)}
                  />
                </div>
              </div>

              {/* Row 4: Package Image */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Package Cover Image</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    className={styles.inputField}
                    style={{ flex: 1 }}
                    placeholder="/ppf-install.jpg or https://..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                  <button
                    type="button"
                    className={styles.uploadFileBtn}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadLoading}
                  >
                    <Icon.Upload size={14} />
                    <span>{uploadLoading ? 'Uploading...' : 'Upload Image'}</span>
                  </button>
                </div>

                {imageUrl && (
                  <div className={styles.imagePreviewBox}>
                    <img src={imageUrl} alt="Preview" className={styles.previewThumb} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>
                        Image Preview
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>
                        Rendered on public packages page and package detail card
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Row 5: Link Services */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Included Detailing Services</label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.5rem',
                    maxHeight: '140px',
                    overflowY: 'auto',
                    padding: '0.5rem',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    backgroundColor: '#F8FAFC',
                  }}
                >
                  {availableServices.map((svc) => {
                    const isSelected = selectedServiceIds.includes(svc.id);
                    return (
                      <label
                        key={svc.id}
                        className={`${styles.serviceItemLabel} ${
                          isSelected ? styles.serviceItemSelected : ''
                        }`}
                        onClick={() => toggleService(svc.id)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            style={{ cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>
                            {svc.name}
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', color: '#64748B' }}>
                          ~{formatDuration(svc.durationMinutes)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Row 6: Benefits */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Included Suite Benefits (Comma Separated)</label>
                <input
                  type="text"
                  className={styles.inputField}
                  placeholder="Interior detailing, Exterior paint correction, 1-year ceramic coat"
                  value={benefits}
                  onChange={(e) => setBenefits(e.target.value)}
                />
              </div>

              {/* Row 7: Description */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Full Package Scope Description</label>
                <textarea
                  className={styles.inputField}
                  rows={2}
                  placeholder="Comprehensive description of what is included in this suite..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Row 8: Visibility & Intake Toggles */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => setIsEnabled(e.target.checked)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
                      Visible on Public Website
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      Show on Home, Packages & Booking pages
                    </div>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isBookable}
                    onChange={(e) => setIsBookable(e.target.checked)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
                      Bookable Online
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      Allow self-serve bay scheduling
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.exportBtn}
                onClick={() => setShowModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.addBtn}
                onClick={handleSave}
                disabled={actionLoading}
              >
                {actionLoading ? 'Saving Package...' : editingId ? 'Update Package' : 'Create Package'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
