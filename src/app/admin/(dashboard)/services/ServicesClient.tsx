'use client';

import React, { useState, useMemo } from 'react';
import { Icon } from '@/components/common/Icons';
import styles from './services.module.css';

interface ServiceItem {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  startingPrice: string;
  durationMinutes: number;
  isEnabled: boolean;
  isBookable: boolean;
  sortOrder: number;
}

interface ServicesClientProps {
  initialServices: ServiceItem[];
}

export function ServicesClient({ initialServices }: ServicesClientProps) {
  const [services, setServices] = useState<ServiceItem[]>(initialServices);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('Paint Protection');
  const [startingPrice, setStartingPrice] = useState('15000');
  const [durationMinutes, setDurationMinutes] = useState(180);
  const [warrantyText, setWarrantyText] = useState('5 Years Comprehensive');
  const [benefits, setBenefits] = useState('Self-healing topcoat, UV resistance, Hydrophobic barrier');
  const [description, setDescription] = useState('');

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
    return services.filter((s) => {
      if (selectedCategory !== 'ALL' && s.category !== selectedCategory) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchSlug = s.slug.toLowerCase().includes(q);
        const matchCat = s.category ? s.category.toLowerCase().includes(q) : false;
        if (!matchName && !matchSlug && !matchCat) return false;
      }
      return true;
    });
  }, [services, selectedCategory, searchTerm]);

  // ── Duration Formatter (480 mins -> 8 hrs) ──
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
    setShowModal(true);
  };

  const openEditModal = (s: ServiceItem) => {
    setEditingServiceId(s.id);
    setName(s.name);
    setSlug(s.slug);
    setCategory(s.category || 'Paint Protection');
    setStartingPrice(s.startingPrice);
    setDurationMinutes(s.durationMinutes);
    setWarrantyText('5 Years Comprehensive');
    setBenefits('Self-healing topcoat, UV resistance, Hydrophobic barrier');
    setDescription('');
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
        category,
        startingPrice: String(startingPrice),
        durationMinutes: Number(durationMinutes),
        warrantyText,
        benefits: benefits.split(',').map((b) => b.trim()).filter(Boolean),
        description: description || `${name} premium service executed at Smoke M Customs.`,
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

  const toggleStatus = async (id: string, field: 'isEnabled' | 'isBookable', currentVal: boolean) => {
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
      if (data.success) {
        setServices((prev) =>
          prev.map((s) => (s.id === id ? { ...s, [field]: !currentVal } : s))
        );
      }
    } catch {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id: string, sName: string) => {
    if (!confirm(`Are you sure you want to deactivate "${sName}"?`)) return;
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
      }
    } catch {
      alert('Failed to delete service');
    }
  };

  // ── Export CSV Handler ──
  const handleExportCSV = () => {
    const headers = ['Service Name', 'URL Slug', 'Category', 'Starting Price (INR)', 'Duration (mins)', 'Status', 'Online Bookable'];
    const rows = filteredServices.map((s) => [
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.slug}"`,
      `"${(s.category || 'General').replace(/"/g, '""')}"`,
      s.startingPrice,
      s.durationMinutes,
      s.isEnabled ? 'Enabled' : 'Disabled',
      s.isBookable ? 'Bookable' : 'Hidden',
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
            <span>STUDIO CATALOGUE & INVENTORY</span>
            <span className={styles.eyebrowDot} />
            <span>DETAILING OFFERINGS</span>
          </div>
          <h1 className={styles.pageTitle}>Services Catalogue</h1>
          <p className={styles.pageSubtitle}>
            Configure studio detailing offerings, bay duration allocations, and online booking toggles.
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
            <span className={styles.metricLabel}>Bookable Online</span>
            <span className={styles.metricValue} style={{ color: '#16A34A' }}>
              {metrics.bookableOnline}
            </span>
            <span className={styles.metricSubtext}>Direct client self-serve booking</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconActive}`}>
            <Icon.Sparkles size={20} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Average Ticket</span>
            <span className={styles.metricValue} style={{ color: '#B45309' }}>
              ₹{metrics.avgPrice.toLocaleString('en-IN')}
            </span>
            <span className={styles.metricSubtext}>Mean starting price</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconGold}`}>
            <Icon.FileText size={20} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Disciplines</span>
            <span className={styles.metricValue} style={{ color: '#8B5CF6' }}>
              {metrics.categoryCount}
            </span>
            <span className={styles.metricSubtext}>Protection & craft categories</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconPurple}`}>
            <Icon.Wrench size={20} />
          </div>
        </div>
      </div>

      {/* ── Filter & Search Controls Panel ── */}
      <div className={styles.controlsCard}>
        {/* Category Tabs */}
        <div className={styles.tabsScroll}>
          <div className={styles.statusTabs}>
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

        {/* Search Row */}
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
                <th style={{ width: '280px' }}>Service Name</th>
                <th style={{ width: '180px' }}>Category</th>
                <th style={{ width: '150px' }}>Starting Price</th>
                <th style={{ width: '140px' }}>Bay Duration</th>
                <th style={{ width: '150px' }}>Studio Status</th>
                <th style={{ width: '150px' }}>Online Intake</th>
                <th style={{ width: '160px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className={styles.emptyCard}>
                      <div className={styles.emptyIconWrap}>
                        <Icon.Tag size={24} />
                      </div>
                      <h4 className={styles.emptyTitle}>No matching services found</h4>
                      <p className={styles.emptyDesc}>
                        Try adjusting your search query, selecting another category, or add a new service.
                      </p>
                      {(searchTerm || selectedCategory !== 'ALL') && (
                        <button
                          type="button"
                          className={styles.emptyResetBtn}
                          onClick={() => {
                            setSearchTerm('');
                            setSelectedCategory('ALL');
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

                  return (
                    <tr key={s.id} className={`${styles.tableRow} ${isLast ? styles.tableRowLast : ''}`}>
                      {/* 1. Name & Slug */}
                      <td>
                        <div className={styles.serviceNameWrap}>
                          <span className={styles.serviceName}>{s.name}</span>
                          <span className={styles.serviceSlug}>slug: {s.slug}</span>
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

                      {/* 5. Studio Status (Active Toggle) */}
                      <td>
                        <button
                          type="button"
                          className={`${styles.toggleBtn} ${
                            s.isEnabled ? styles.toggleActive : styles.toggleInactive
                          }`}
                          onClick={() => toggleStatus(s.id, 'isEnabled', s.isEnabled)}
                          title="Click to toggle studio active state"
                        >
                          <span className={styles.toggleDot} />
                          <span>{s.isEnabled ? 'Enabled' : 'Disabled'}</span>
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
                          title="Click to toggle online booking availability"
                        >
                          <span className={styles.toggleDot} />
                          <span>{s.isBookable ? 'Bookable' : 'Hidden'}</span>
                        </button>
                      </td>

                      {/* 7. Action Hub */}
                      <td>
                        <div className={styles.actionBtns}>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => openEditModal(s)}
                          >
                            <Icon.Edit size={13} />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            className={styles.deleteBtn}
                            onClick={() => handleDelete(s.id, s.name)}
                          >
                            <Icon.Cross size={13} />
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

        {/* Table Footer */}
        {filteredServices.length > 0 && (
          <div className={styles.tableFooter}>
            <span>
              Showing {filteredServices.length} of {services.length} total detailing treatment{services.length !== 1 ? 's' : ''}
            </span>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
              Smoke M Customs • Studio Detailing Catalogue
            </span>
          </div>
        )}
      </div>

      {/* ── CREATE / EDIT MODAL ── */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingServiceId ? 'Edit Detailing Service' : 'Add New Detailing Service'}
              </h2>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setShowModal(false)}
                title="Close"
              >
                <Icon.Cross size={16} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Service Name</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="e.g. Paint Protection Film (Full Body)"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>URL Slug</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="e.g. ppf-full-body"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Category</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="e.g. Paint Protection, Ceramic, Detailing"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Starting Price (₹)</label>
                  <input
                    type="number"
                    className={styles.inputField}
                    placeholder="15000"
                    value={startingPrice}
                    onChange={(e) => setStartingPrice(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Bay Duration (Minutes)</label>
                  <input
                    type="number"
                    className={styles.inputField}
                    placeholder="180"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Warranty Details</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="e.g. 5 Years Studio Warranty"
                    value={warrantyText}
                    onChange={(e) => setWarrantyText(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Key Benefits (Comma Separated)</label>
                <input
                  type="text"
                  className={styles.inputField}
                  placeholder="Self-healing topcoat, Scratch resistance, High gloss"
                  value={benefits}
                  onChange={(e) => setBenefits(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description</label>
                <textarea
                  className={styles.inputField}
                  rows={3}
                  placeholder="Full description of the craft and techniques..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
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
                {actionLoading
                  ? 'Saving...'
                  : editingServiceId
                  ? 'Save Changes'
                  : 'Create Service'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
