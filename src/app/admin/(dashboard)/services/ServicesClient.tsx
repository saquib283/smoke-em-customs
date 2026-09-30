'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Icon } from '@/components/common/Icons';
import styles from './services.module.css';

export interface ServiceItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string | null;
  startingPrice: string;
  durationMinutes: number;
  warrantyText: string | null;
  benefits: string[];
  isEnabled: boolean;
  isBookable: boolean;
  bufferMinutesOverride: number | null;
  sortOrder: number;
  imageUrl: string | null;
}

interface ServicesClientProps {
  initialServices: ServiceItem[];
}

export function ServicesClient({ initialServices }: ServicesClientProps) {
  const [services, setServices] = useState<ServiceItem[]>(initialServices);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LIVE' | 'HIDDEN' | 'BOOKABLE'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('Paint Protection');
  const [startingPrice, setStartingPrice] = useState('15000');
  const [durationMinutes, setDurationMinutes] = useState(180);
  const [warrantyText, setWarrantyText] = useState('5 Years Comprehensive');
  const [benefits, setBenefits] = useState('Self-healing topcoat, UV resistance, Hydrophobic barrier');
  const [description, setDescription] = useState('');
  const [bufferMinutesOverride, setBufferMinutesOverride] = useState<number | ''>('');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [isBookable, setIsBookable] = useState<boolean>(true);

  // ── Unique Categories & Stats ──
  const categories = useMemo(() => {
    const set = new Set<string>();
    services.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    return Array.from(set);
  }, [services]);

  const metrics = useMemo(() => {
    const total = services.length;
    const bookableOnline = services.filter((s) => s.isBookable).length;
    const enabledCount = services.filter((s) => s.isEnabled).length;
    const avgPrice =
      total > 0
        ? Math.round(
            services.reduce((acc, s) => acc + (parseFloat(s.startingPrice) || 0), 0) / total
          )
        : 0;
    return { total, bookableOnline, enabledCount, avgPrice, categoryCount: categories.length };
  }, [services, categories]);

  // ── Category Tabs ──
  const categoryTabs = useMemo(() => {
    const tabs = [{ key: 'ALL', label: 'All Services', count: services.length }];
    categories.forEach((cat) => {
      const count = services.filter((s) => s.category === cat).length;
      tabs.push({ key: cat, label: cat, count });
    });
    return tabs;
  }, [services, categories]);

  // ── Filtered Services ──
  const filteredServices = useMemo(() => {
    return services
      .filter((s) => {
        if (selectedCategory !== 'ALL' && s.category !== selectedCategory) return false;
        if (statusFilter === 'LIVE' && !s.isEnabled) return false;
        if (statusFilter === 'HIDDEN' && s.isEnabled) return false;
        if (statusFilter === 'BOOKABLE' && !s.isBookable) return false;
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchName = s.name.toLowerCase().includes(q);
          const matchSlug = s.slug.toLowerCase().includes(q);
          const matchCat = s.category ? s.category.toLowerCase().includes(q) : false;
          if (!matchName && !matchSlug && !matchCat) return false;
        }
        return true;
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [services, selectedCategory, statusFilter, searchTerm]);

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
    setEditingServiceId(null);
    setName('');
    setSlug('');
    setCategory('Paint Protection');
    setStartingPrice('15000');
    setDurationMinutes(180);
    setWarrantyText('5 Years Comprehensive');
    setBenefits('Self-healing topcoat, UV resistance, Hydrophobic barrier');
    setDescription('');
    setBufferMinutesOverride('');
    setSortOrder(services.length + 1);
    setImageUrl('/ceramic-detail.jpg');
    setIsEnabled(true);
    setIsBookable(true);
    setShowModal(true);
  };

  const openEditModal = (s: ServiceItem) => {
    setEditingServiceId(s.id);
    setName(s.name);
    setSlug(s.slug);
    setCategory(s.category || 'Paint Protection');
    setStartingPrice(s.startingPrice);
    setDurationMinutes(s.durationMinutes);
    setWarrantyText(s.warrantyText || '');
    setBenefits((s.benefits || []).join(', '));
    setDescription(s.description || '');
    setBufferMinutesOverride(s.bufferMinutesOverride ?? '');
    setSortOrder(s.sortOrder || 0);
    setImageUrl(s.imageUrl || '/ceramic-detail.jpg');
    setIsEnabled(s.isEnabled);
    setIsBookable(s.isBookable);
    setShowModal(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingServiceId) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      );
    }
  };

  // Direct Image Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'services');

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
        category,
        startingPrice: String(startingPrice),
        durationMinutes: Number(durationMinutes),
        warrantyText: warrantyText.trim() || null,
        benefits: benefits
          .split(',')
          .map((b) => b.trim())
          .filter(Boolean),
        description: description.trim() || `${name} premium bespoke detailing service.`,
        bufferMinutesOverride: bufferMinutesOverride === '' ? null : Number(bufferMinutesOverride),
        sortOrder: Number(sortOrder) || 0,
        imageUrl: imageUrl.trim() || null,
        isEnabled,
        isBookable,
      };

      if (editingServiceId) {
        const res = await fetch('/api/admin/catalogue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target: 'SERVICE',
            action: 'UPDATE',
            id: editingServiceId,
            data: payload,
          }),
        });
        const data = await res.json();
        if (data.success && data.service) {
          setServices((prev) =>
            prev.map((s) => (s.id === editingServiceId ? { ...s, ...data.service } : s))
          );
          setShowModal(false);
        } else {
          alert(data.error || 'Failed to update service');
        }
      } else {
        const res = await fetch('/api/admin/catalogue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target: 'SERVICE',
            action: 'CREATE',
            data: payload,
          }),
        });
        const data = await res.json();
        if (data.success && data.service) {
          setServices((prev) => [...prev, data.service]);
          setShowModal(false);
        } else {
          alert(data.error || 'Failed to create service');
        }
      }
    } catch {
      alert('Error saving service');
    } finally {
      setActionLoading(false);
    }
  };

  // 1-Click Toggle Status (Live / Hidden / Bookable)
  const toggleStatus = async (id: string, field: 'isEnabled' | 'isBookable', currentVal: boolean) => {
    // Optimistic UI update
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: !currentVal } : s))
    );

    try {
      const res = await fetch('/api/admin/catalogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: 'SERVICE',
          action: 'UPDATE',
          id,
          data: { [field]: !currentVal },
        }),
      });
      const data = await res.json();
      if (!data.success) {
        // Rollback on error
        setServices((prev) =>
          prev.map((s) => (s.id === id ? { ...s, [field]: currentVal } : s))
        );
        alert(data.error || 'Failed to update status');
      }
    } catch {
      setServices((prev) =>
        prev.map((s) => (s.id === id ? { ...s, [field]: currentVal } : s))
      );
      alert('Failed to update status');
    }
  };

  // Reorder Item (Move Up or Move Down)
  const handleReorder = async (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filteredServices.length) return;

    const currentItem = filteredServices[index];
    const targetItem = filteredServices[targetIndex];

    const currentOrder = currentItem.sortOrder;
    const targetOrder = targetItem.sortOrder === currentOrder
      ? (direction === 'UP' ? currentOrder - 1 : currentOrder + 1)
      : targetItem.sortOrder;

    // Swap sortOrders optimistically
    const updatedServices = services.map((s) => {
      if (s.id === currentItem.id) return { ...s, sortOrder: targetOrder };
      if (s.id === targetItem.id) return { ...s, sortOrder: currentOrder };
      return s;
    });

    setServices(updatedServices);

    try {
      await fetch('/api/admin/catalogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: 'SERVICE',
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

  const handleDelete = async (id: string, sName: string) => {
    if (!confirm(`Are you sure you want to deactivate and remove "${sName}" from the public website?`)) return;
    try {
      const res = await fetch('/api/admin/catalogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: 'SERVICE',
          action: 'DELETE',
          id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setServices((prev) => prev.filter((s) => s.id !== id));
      } else {
        alert(data.error || 'Failed to delete service');
      }
    } catch {
      alert('Failed to delete service');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Order', 'Service Name', 'URL Slug', 'Category', 'Starting Price (INR)', 'Duration (mins)', 'Status', 'Online Bookable'];
    const rows = filteredServices.map((s) => [
      s.sortOrder,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.slug}"`,
      `"${(s.category || 'General').replace(/"/g, '""')}"`,
      s.startingPrice,
      s.durationMinutes,
      s.isEnabled ? 'Live on Public Site' : 'Hidden',
      s.isBookable ? 'Bookable' : 'Inquire Only',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smokecustoms_services_${new Date().toISOString().slice(0, 10)}.csv`);
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
            <span>Studio Catalogue & Inventory</span>
            <span className={styles.eyebrowDot} />
            <span>Full Public Management</span>
          </div>
          <h1 className={styles.pageTitle}>Services Catalogue</h1>
          <p className={styles.pageSubtitle}>
            Directly manage, edit, hide/show, reorder, and upload media for all services rendered across the public website.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.exportBtn}
            onClick={handleExportCSV}
            title="Download CSV spreadsheet of services"
          >
            <Icon.FileText size={15} />
            <span>Export CSV</span>
          </button>
          <button type="button" className={styles.addBtn} onClick={openCreateModal}>
            <Icon.Plus size={15} />
            <span>Add New Service</span>
          </button>
        </div>
      </div>

      {/* ── Executive KPI Metric Cards ── */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Total Services</span>
            <span className={styles.metricValue}>{metrics.total}</span>
            <span className={styles.metricSubtext}>Studio detailing treatments</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconNeutral}`}>
            <Icon.Tag size={20} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Live on Public Site</span>
            <span className={styles.metricValue} style={{ color: '#059669' }}>
              {metrics.enabledCount} / {metrics.total}
            </span>
            <span className={styles.metricSubtext}>Visible to public visitors</span>
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
            <span className={styles.metricSubtext}>Direct client bay scheduling</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconBlue}`}>
            <Icon.Sparkles size={20} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Average Ticket</span>
            <span className={styles.metricValue} style={{ color: '#B45309' }}>
              ₹{metrics.avgPrice.toLocaleString('en-IN')}
            </span>
            <span className={styles.metricSubtext}>Starting price average</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconGold}`}>
            <Icon.FileText size={20} />
          </div>
        </div>
      </div>

      {/* ── Filter & Search Controls Panel ── */}
      <div className={styles.controlsCard}>
        {/* Category Tabs */}
        <div className={styles.tabsScroll}>
          <div className={styles.categoryTabs}>
            {categoryTabs.map((tab) => {
              const isActive = selectedCategory === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  className={`${styles.tabBtn} ${isActive ? styles.activeTab : ''}`}
                  onClick={() => setSelectedCategory(tab.key)}
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

        {/* Search Row & Status Pills */}
        <div className={styles.searchRow}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>
              <Icon.Search size={15} />
            </span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by service name, slug, or category..."
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

          <div className={styles.statusGroup}>
            <button
              type="button"
              className={`${styles.statusPill} ${statusFilter === 'ALL' ? styles.statusPillActive : ''}`}
              onClick={() => setStatusFilter('ALL')}
            >
              All
            </button>
            <button
              type="button"
              className={`${styles.statusPill} ${statusFilter === 'LIVE' ? styles.statusPillActive : ''}`}
              onClick={() => setStatusFilter('LIVE')}
            >
              Live Only
            </button>
            <button
              type="button"
              className={`${styles.statusPill} ${statusFilter === 'HIDDEN' ? styles.statusPillActive : ''}`}
              onClick={() => setStatusFilter('HIDDEN')}
            >
              Hidden Only
            </button>
            <button
              type="button"
              className={`${styles.statusPill} ${statusFilter === 'BOOKABLE' ? styles.statusPillActive : ''}`}
              onClick={() => setStatusFilter('BOOKABLE')}
            >
              Bookable
            </button>
          </div>

          <div className={styles.filterMeta}>
            <span>
              Showing <strong>{filteredServices.length}</strong> of {services.length} detailing services
            </span>
          </div>
        </div>
      </div>

      {/* ── Services Table Card ── */}
      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Order</th>
                <th style={{ minWidth: '280px' }}>Service & Media</th>
                <th style={{ width: '160px' }}>Category</th>
                <th style={{ width: '130px' }}>Starting Price</th>
                <th style={{ width: '130px' }}>Bay Duration</th>
                <th style={{ width: '150px' }}>Public Website</th>
                <th style={{ width: '150px' }}>Online Intake</th>
                <th style={{ width: '130px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className={styles.emptyCard}>
                      <div className={styles.emptyIconWrap}>
                        <Icon.Tag size={24} />
                      </div>
                      <h4 className={styles.emptyTitle}>No matching services found</h4>
                      <p className={styles.emptyDesc}>
                        Try adjusting your search query, selecting another category, or add a new service.
                      </p>
                      {(searchTerm || selectedCategory !== 'ALL' || statusFilter !== 'ALL') && (
                        <button
                          type="button"
                          className={styles.emptyResetBtn}
                          onClick={() => {
                            setSearchTerm('');
                            setSelectedCategory('ALL');
                            setStatusFilter('ALL');
                          }}
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredServices.map((s, idx) => {
                  const isLast = idx === filteredServices.length - 1;
                  const isFirst = idx === 0;

                  return (
                    <tr key={s.id} className={`${styles.tableRow} ${isLast ? styles.tableRowLast : ''}`}>
                      {/* 0. Order & Quick Reorder */}
                      <td>
                        <div className={styles.orderCell}>
                          <span className={styles.orderBadge}>#{s.sortOrder}</span>
                          <div className={styles.reorderBtns}>
                            <button
                              type="button"
                              className={styles.reorderBtn}
                              disabled={isFirst}
                              onClick={() => handleReorder(idx, 'UP')}
                              title="Move service up"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              className={styles.reorderBtn}
                              disabled={isLast}
                              onClick={() => handleReorder(idx, 'DOWN')}
                              title="Move service down"
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* 1. Name & Media Thumbnail */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <img
                            src={s.imageUrl || '/ceramic-detail.jpg'}
                            alt={s.name}
                            className={styles.serviceThumb}
                          />
                          <div className={styles.serviceNameWrap}>
                            <span className={styles.serviceName}>{s.name}</span>
                            <span className={styles.serviceSlug}>/services/{s.slug}</span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Category */}
                      <td>
                        <span className={styles.categoryBadge}>
                          <Icon.Wrench size={12} color="#64748B" />
                          <span>{s.category || 'General'}</span>
                        </span>
                      </td>

                      {/* 3. Starting Price */}
                      <td>
                        <span className={styles.priceTag}>
                          ₹{Number(s.startingPrice).toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* 4. Bay Duration */}
                      <td>
                        <span className={styles.durationBadge}>
                          <Icon.Clock size={12} />
                          <span>{formatDuration(s.durationMinutes)}</span>
                        </span>
                      </td>

                      {/* 5. Public Website Visibility (1-Click Toggle) */}
                      <td>
                        <button
                          type="button"
                          className={`${styles.toggleBtn} ${
                            s.isEnabled ? styles.toggleActive : styles.toggleInactive
                          }`}
                          onClick={() => toggleStatus(s.id, 'isEnabled', s.isEnabled)}
                          title="Click to toggle visibility on the live website"
                        >
                          <span className={styles.toggleDot} />
                          <span>{s.isEnabled ? 'Live on Site' : 'Hidden'}</span>
                        </button>
                      </td>

                      {/* 6. Online Intake (Bookable Toggle) */}
                      <td>
                        <button
                          type="button"
                          className={`${styles.toggleBtn} ${
                            s.isBookable ? styles.toggleActive : styles.toggleInactive
                          }`}
                          onClick={() => toggleStatus(s.id, 'isBookable', s.isBookable)}
                          title="Click to toggle self-serve booking online"
                        >
                          <span className={styles.toggleDot} />
                          <span>{s.isBookable ? 'Bookable' : 'Inquire Only'}</span>
                        </button>
                      </td>

                      {/* 7. Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div className={styles.actionsWrap}>
                          <button
                            type="button"
                            className={styles.actionBtnEdit}
                            onClick={() => openEditModal(s)}
                            title="Edit service details"
                          >
                            <Icon.FileText size={13} />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            className={styles.actionBtnDelete}
                            onClick={() => handleDelete(s.id, s.name)}
                            title="Deactivate and delete service"
                          >
                            <Icon.Trash size={13} />
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

      {/* ── Create / Edit Modal (Centered, Fixed Overlay) ── */}
      {showModal && (
        <div
          className={styles.modalBackdrop}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className={styles.modalCard} role="dialog" aria-modal="true">
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleWrap}>
                <span className={styles.modalEyebrow}>
                  {editingServiceId ? 'Studio Service Editor' : 'New Detailing Service'}
                </span>
                <h3 className={styles.modalTitle}>
                  {editingServiceId ? `Edit: ${name || 'Detailing Service'}` : 'Add New Detailing Service'}
                </h3>
              </div>
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
              {/* Row 1: Name and Category */}
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <span>Service Name *</span>
                  </label>
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="e.g. 9H Ceramic Shield Pro"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <span>Category</span>
                  </label>
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="e.g. Paint Protection, Detailing"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
              </div>

              {/* Row 2: Slug and Starting Price */}
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <span>URL Slug *</span>
                    <span className={styles.formHint}>auto-generated</span>
                  </label>
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="e.g. 9h-ceramic-shield"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <span>Starting Price (₹) *</span>
                  </label>
                  <input
                    type="number"
                    className={styles.inputField}
                    placeholder="15000"
                    value={startingPrice}
                    onChange={(e) => setStartingPrice(e.target.value)}
                  />
                </div>
              </div>

              {/* Row 3: Duration & Display Order */}
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <span>Bay Duration (Minutes) *</span>
                    <span className={styles.formHint}>~{formatDuration(durationMinutes)} in bay</span>
                  </label>
                  <input
                    type="number"
                    className={styles.inputField}
                    placeholder="180"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <span>Display Order Priority</span>
                    <span className={styles.formHint}>lowest appears first</span>
                  </label>
                  <input
                    type="number"
                    className={styles.inputField}
                    placeholder="1"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Row 4: Service Media / Image */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <span>Service Cover Image</span>
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    className={styles.inputField}
                    style={{ flex: 1 }}
                    placeholder="/ceramic-detail.jpg or https://..."
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
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
                        Image Preview
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>
                        Rendered on public services catalogue and detail card
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Row 5: Warranty Text */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <span>Warranty Coverage Specification</span>
                </label>
                <input
                  type="text"
                  className={styles.inputField}
                  placeholder="e.g. 5 Years Comprehensive National Warranty"
                  value={warrantyText}
                  onChange={(e) => setWarrantyText(e.target.value)}
                />
              </div>

              {/* Row 6: Key Benefits */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <span>Key Treatment Benefits (Comma Separated)</span>
                </label>
                <input
                  type="text"
                  className={styles.inputField}
                  placeholder="Self-healing topcoat, UV resistance, Hydrophobic barrier"
                  value={benefits}
                  onChange={(e) => setBenefits(e.target.value)}
                />
              </div>

              {/* Row 7: Description */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <span>Public Description</span>
                </label>
                <textarea
                  className={styles.inputField}
                  rows={3}
                  placeholder="Detailed technical description of this treatment..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Row 8: Luxury Switch Cards */}
              <div className={styles.toggleCardsGrid}>
                <div
                  className={`${styles.toggleCard} ${isEnabled ? styles.toggleCardActive : ''}`}
                  onClick={() => setIsEnabled(!isEnabled)}
                >
                  <div className={styles.toggleCardText}>
                    <span className={styles.toggleCardTitle}>Visible on Public Website</span>
                    <span className={styles.toggleCardDesc}>
                      Show on Home, Services & Booking pages
                    </span>
                  </div>
                  <div className={`${styles.switchTrack} ${isEnabled ? styles.switchTrackActive : ''}`}>
                    <div className={`${styles.switchThumb} ${isEnabled ? styles.switchThumbActive : ''}`} />
                  </div>
                </div>

                <div
                  className={`${styles.toggleCard} ${isBookable ? styles.toggleCardActive : ''}`}
                  onClick={() => setIsBookable(!isBookable)}
                >
                  <div className={styles.toggleCardText}>
                    <span className={styles.toggleCardTitle}>Bookable Online</span>
                    <span className={styles.toggleCardDesc}>
                      Allow clients to schedule bay directly
                    </span>
                  </div>
                  <div className={`${styles.switchTrack} ${isBookable ? styles.switchTrackActive : ''}`}>
                    <div className={`${styles.switchThumb} ${isBookable ? styles.switchThumbActive : ''}`} />
                  </div>
                </div>
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
                {actionLoading ? 'Saving Treatment...' : editingServiceId ? 'Update Service' : 'Create Service'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
