'use client';

import React, { useState } from 'react';
import styles from '../services/services.module.css';

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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>Packages Catalogue</h1>
          <p className={styles.headerSubtitle}>
            Configure bundled treatment plans, many-to-many service associations, duration limits, and booking visibility.
          </p>
        </div>

        <button className={styles.addBtn} onClick={openCreateModal}>
          + Add New Package
        </button>
      </div>

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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((p) => (
                <tr key={p.id} className={styles.row}>
                  <td>
                    <strong>{p.name}</strong>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      slug: {p.slug}
                    </div>
                  </td>
                  <td>
                    <span className={styles.priceTag}>
                      ₹{Number(p.startingPrice || p.price || 0).toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td>{p.durationMinutes} mins</td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '260px' }}>
                      {p.serviceIds && p.serviceIds.length > 0 ? (
                        p.serviceIds.map((sId) => {
                          const svc = availableServices.find((s) => s.id === sId);
                          return (
                            <span
                              key={sId}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-full)',
                                fontSize: '11px',
                                background: 'var(--color-accent-subtle)',
                                color: 'var(--color-accent-text)',
                                border: '1px solid var(--color-border)',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {svc ? svc.name : 'Service'}
                            </span>
                          );
                        })
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
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
                    >
                      {p.isEnabled ? '✓ Enabled' : '✕ Disabled'}
                    </button>
                  </td>
                  <td>
                    <button
                      className={`${styles.toggleBtn} ${
                        p.isBookable ? styles.toggleActive : styles.toggleInactive
                      }`}
                      onClick={() => toggleStatus(p.id, 'isBookable', p.isBookable)}
                    >
                      {p.isBookable ? '✓ Bookable' : '✕ Hidden'}
                    </button>
                  </td>
                  <td>
                    <button className={styles.actionBtn} onClick={() => openEditModal(p)}>
                      Edit
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(p.id, p.name)}
                    >
                      Deactivate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div
            className={styles.modalBox}
            style={{ maxWidth: '640px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold' }}>
              {editingId ? 'Edit Package' : 'Create Detailing Package'}
            </h2>

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
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-accent-text)',
                        fontSize: '10px',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      Auto-sum ({selectedServiceIds.length} svcs)
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

              <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
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
            <div className={styles.formGroup} style={{ marginTop: 'var(--space-2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className={styles.formLabel} style={{ margin: 0 }}>
                  Bundled Services (Many-to-Many Association)
                </label>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                  {selectedServiceIds.length} of {availableServices.length} selected
                </span>
              </div>

              <div
                style={{
                  maxHeight: '160px',
                  overflowY: 'auto',
                  backgroundColor: 'var(--color-bg-primary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                {availableServices.length === 0 ? (
                  <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: 0 }}>
                    No services found in catalogue.
                  </p>
                ) : (
                  availableServices.map((svc) => {
                    const isSelected = selectedServiceIds.includes(svc.id);
                    return (
                      <label
                        key={svc.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: isSelected ? 'var(--color-bg-elevated)' : 'transparent',
                          border: isSelected ? '1px solid var(--color-accent-border)' : '1px solid transparent',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleService(svc.id)}
                            style={{ accentColor: 'var(--color-accent-primary)' }}
                          />
                          <span style={{ fontSize: '12px', fontWeight: isSelected ? 600 : 400, color: 'var(--color-text-primary)' }}>
                            {svc.name}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                          <span>{svc.durationMinutes}m</span>
                          <span style={{ color: 'var(--color-accent-text)' }}>
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
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
