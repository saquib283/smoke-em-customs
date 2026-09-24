'use client';

import React, { useState } from 'react';
import styles from '../services/services.module.css';

interface ReviewItem {
  id: string;
  customerName: string;
  rating: number;
  body: string;
  vehicleText: string | null;
  serviceName: string | null;
  reviewDate: string | null;
  isFeatured: boolean;
  isPublished: boolean;
}

interface ReviewsClientProps {
  initialReviews: ReviewItem[];
}

export function ReviewsClient({ initialReviews }: ReviewsClientProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form Fields
  const [customerName, setCustomerName] = useState('');
  const [vehicleText, setVehicleText] = useState('');
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const [isFeatured, setIsFeatured] = useState(true);
  const [isPublished, setIsPublished] = useState(true);

  const handleCreateReview = async () => {
    if (!customerName.trim() || !body.trim()) {
      alert('Customer name and review text are required');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: 'REVIEW',
          action: 'CREATE',
          data: {
            customerName,
            vehicleText,
            rating,
            body,
            isFeatured,
            isPublished,
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.review) {
        setReviews((prev) => [data.review, ...prev]);
        setShowModal(false);
        setCustomerName('');
        setVehicleText('');
        setBody('');
      } else {
        alert(data.error || 'Failed to create review');
      }
    } catch {
      alert('Error creating review');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleReviewField = async (id: string, field: 'isPublished' | 'isFeatured', currentVal: boolean) => {
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: 'REVIEW',
          action: 'UPDATE',
          id,
          data: { [field]: !currentVal },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, [field]: !currentVal } : r))
        );
      }
    } catch {
      alert('Failed to update review status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this review?')) return;
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: 'REVIEW',
          action: 'DELETE',
          id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
      }
    } catch {
      alert('Failed to delete review');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>Customer Testimonials & Reviews</h1>
          <p className={styles.headerSubtitle}>
            Moderate customer feedback, feature top reviews on homepage, and verify ratings.
          </p>
        </div>

        <button className={styles.addBtn} onClick={() => setShowModal(true)}>
          + Add Verified Review
        </button>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Vehicle</th>
                <th>Rating</th>
                <th>Feedback</th>
                <th>Home Featured</th>
                <th>Published</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.id} className={styles.row}>
                  <td>
                    <strong>{r.customerName}</strong>
                  </td>
                  <td>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                      {r.vehicleText || '—'}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: '#F59E0B', fontWeight: 'bold' }}>
                      {'★'.repeat(r.rating)}
                    </span>
                  </td>
                  <td style={{ fontSize: 'var(--text-xs)', maxWidth: '320px' }}>
                    "{r.body}"
                  </td>
                  <td>
                    <button
                      className={`${styles.toggleBtn} ${
                        r.isFeatured ? styles.toggleActive : styles.toggleInactive
                      }`}
                      onClick={() => toggleReviewField(r.id, 'isFeatured', r.isFeatured)}
                    >
                      {r.isFeatured ? '★ Featured' : '☆ Standard'}
                    </button>
                  </td>
                  <td>
                    <button
                      className={`${styles.toggleBtn} ${
                        r.isPublished ? styles.toggleActive : styles.toggleInactive
                      }`}
                      onClick={() => toggleReviewField(r.id, 'isPublished', r.isPublished)}
                    >
                      {r.isPublished ? '✓ Live' : '✕ Hidden'}
                    </button>
                  </td>
                  <td>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(r.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE REVIEW MODAL */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold' }}>Add Verified Customer Review</h2>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Customer Name</label>
                <input
                  type="text"
                  className={styles.inputField}
                  placeholder="e.g. Vikramaditya S."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Vehicle Details</label>
                <input
                  type="text"
                  className={styles.inputField}
                  placeholder="e.g. Porsche 911 GT3"
                  value={vehicleText}
                  onChange={(e) => setVehicleText(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Rating (1 - 5 Stars)</label>
                <select
                  className={styles.inputField}
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                >
                  <option value={5}>★★★★★ (5 Stars - Exceptional)</option>
                  <option value={4}>★★★★☆ (4 Stars - Great)</option>
                  <option value={3}>★★★☆☆ (3 Stars - Average)</option>
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Customer Testimonial Text</label>
              <textarea
                className={styles.inputField}
                rows={3}
                placeholder="Details of the craftsmanship, gloss levels, service quality..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
              <label style={{ fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                />
                Feature on Homepage Carousel
              </label>

              <label style={{ fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                />
                Publish Immediately to Reviews Page
              </label>
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
                onClick={handleCreateReview}
                disabled={actionLoading}
              >
                Save Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
