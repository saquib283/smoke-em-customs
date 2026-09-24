'use client';

import React, { useState } from 'react';
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>Services Catalogue</h1>
          <p className={styles.headerSubtitle}>
            Configure studio detailing offerings, bay duration allocations, and online booking toggles.
          </p>
        </div>

        <button className={styles.addBtn} onClick={openCreateModal}>
          + Add New Service
        </button>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Service Name</th>
                <th>Category</th>
                <th>Starting Price</th>
                <th>Bay Duration</th>
                <th>Status (Active)</th>
                <th>Bookable Online</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id} className={styles.row}>
                  <td>
                    <strong>{s.name}</strong>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      slug: {s.slug}
                    </div>
                  </td>
                  <td>
                    <span className={styles.categoryTag}>{s.category || 'General'}</span>
                  </td>
                  <td>
                    <span className={styles.priceTag}>
                      ₹{Number(s.startingPrice).toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td>{s.durationMinutes} mins</td>
                  <td>
                    <button
                      className={`${styles.toggleBtn} ${
                        s.isEnabled ? styles.toggleActive : styles.toggleInactive
                      }`}
                      onClick={() => toggleStatus(s.id, 'isEnabled', s.isEnabled)}
                    >
                      {s.isEnabled ? '✓ Enabled' : '✕ Disabled'}
                    </button>
                  </td>
                  <td>
                    <button
                      className={`${styles.toggleBtn} ${
                        s.isBookable ? styles.toggleActive : styles.toggleInactive
                      }`}
                      onClick={() => toggleStatus(s.id, 'isBookable', s.isBookable)}
                    >
                      {s.isBookable ? '✓ Bookable' : '✕ Hidden'}
                    </button>
                  </td>
                  <td>
                    <button className={styles.actionBtn} onClick={() => openEditModal(s)}>
                      Edit
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(s.id, s.name)}
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
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold' }}>
              {editingServiceId ? 'Edit Service' : 'Add New Detailing Service'}
            </h2>

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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
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
                {editingServiceId ? 'Save Changes' : 'Create Service'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
