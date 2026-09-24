'use client';

import React, { useState } from 'react';
import styles from '../services/services.module.css';

interface GalleryItem {
  id: string;
  title: string;
  slug: string;
  serviceCategory: string | null;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  isFeatured: boolean;
  beforeImageUrl: string | null;
  afterImageUrl: string | null;
}

interface GalleryClientProps {
  initialGallery: GalleryItem[];
}

export function GalleryClient({ initialGallery }: GalleryClientProps) {
  const [gallery, setGallery] = useState<GalleryItem[]>(initialGallery);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('BMW');
  const [vehicleModel, setVehicleModel] = useState('M4 Competition');
  const [serviceCategory, setServiceCategory] = useState('PPF');
  const [description, setDescription] = useState('Full body high-gloss self-healing PPF transformation.');
  const [beforeImageUrl, setBeforeImageUrl] = useState('/images/gallery/m4-before.jpg');
  const [afterImageUrl, setAfterImageUrl] = useState('/images/gallery/m4-after.jpg');
  const [isFeatured, setIsFeatured] = useState(true);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    );
  };

  const handleCreate = async () => {
    if (!title.trim() || !slug.trim()) {
      alert('Title and slug are required');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: 'GALLERY',
          action: 'CREATE',
          data: {
            title,
            slug,
            vehicleBrand,
            vehicleModel,
            serviceCategory,
            description,
            beforeImageUrl,
            afterImageUrl,
            isFeatured,
            isPublished: true,
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.gallery) {
        setGallery((prev) => [data.gallery, ...prev]);
        setShowModal(false);
        setTitle('');
        setSlug('');
      } else {
        alert(data.error || 'Failed to add gallery showcase');
      }
    } catch {
      alert('Error creating showcase');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleFeatured = async (id: string, currentVal: boolean) => {
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: 'GALLERY',
          action: 'UPDATE',
          id,
          data: { isFeatured: !currentVal },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGallery((prev) =>
          prev.map((g) => (g.id === id ? { ...g, isFeatured: !currentVal } : g))
        );
      }
    } catch {
      alert('Failed to update showcase status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this project?')) return;
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: 'GALLERY',
          action: 'DELETE',
          id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGallery((prev) => prev.filter((g) => g.id !== id));
      }
    } catch {
      alert('Failed to delete project');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>Studio Gallery & Transformations</h1>
          <p className={styles.headerSubtitle}>
            Manage before-and-after craft showcases and featured portfolio transformations.
          </p>
        </div>

        <button className={styles.addBtn} onClick={() => setShowModal(true)}>
          + Add Showcase Project
        </button>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Project Title</th>
                <th>Vehicle</th>
                <th>Category</th>
                <th>Homepage Featured</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {gallery.map((g) => (
                <tr key={g.id} className={styles.row}>
                  <td>
                    <strong>{g.title}</strong>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      slug: {g.slug}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>
                      {g.vehicleBrand} {g.vehicleModel}
                    </span>
                  </td>
                  <td>
                    <span className={styles.categoryTag}>{g.serviceCategory || 'Detailing'}</span>
                  </td>
                  <td>
                    <button
                      className={`${styles.toggleBtn} ${
                        g.isFeatured ? styles.toggleActive : styles.toggleInactive
                      }`}
                      onClick={() => toggleFeatured(g.id, g.isFeatured)}
                    >
                      {g.isFeatured ? '★ Featured' : '☆ Standard'}
                    </button>
                  </td>
                  <td>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(g.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold' }}>Add Showcase Transformation</h2>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Project Title</label>
                <input
                  type="text"
                  className={styles.inputField}
                  placeholder="e.g. BMW M4 Competition Stealth PPF"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>URL Slug</label>
                <input
                  type="text"
                  className={styles.inputField}
                  placeholder="e.g. bmw-m4-stealth-ppf"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Vehicle Brand</label>
                <input
                  type="text"
                  className={styles.inputField}
                  placeholder="BMW"
                  value={vehicleBrand}
                  onChange={(e) => setVehicleBrand(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Vehicle Model</label>
                <input
                  type="text"
                  className={styles.inputField}
                  placeholder="M4 Competition"
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Category</label>
                <input
                  type="text"
                  className={styles.inputField}
                  placeholder="PPF"
                  value={serviceCategory}
                  onChange={(e) => setServiceCategory(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Before Image URL</label>
                <input
                  type="text"
                  className={styles.inputField}
                  value={beforeImageUrl}
                  onChange={(e) => setBeforeImageUrl(e.target.value)}
                />
              </div>

              <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                <label className={styles.formLabel}>After Image URL</label>
                <input
                  type="text"
                  className={styles.inputField}
                  value={afterImageUrl}
                  onChange={(e) => setAfterImageUrl(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Description</label>
              <textarea
                className={styles.inputField}
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <label style={{ fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
              />
              Showcase on Homepage Transformation Spotlight
            </label>

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
                onClick={handleCreate}
                disabled={actionLoading}
              >
                Save Showcase Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
