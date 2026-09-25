'use client';

import React, { useState } from 'react';
import { Icon } from '@/components/common/Icons';
import styles from './reviews.module.css';

interface ReviewItem {
  id: string;
  customerName: string;
  rating: number;
  body: string;
  vehicleText: string | null;
  serviceName: string | null;
  reviewDate: string | null;
}

interface ReviewsClientProps {
  initialReviews: ReviewItem[];
}

export function ReviewsClient({ initialReviews }: ReviewsClientProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [showForm, setShowForm] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [rating, setRating] = useState(5);
  const [vehicleText, setVehicleText] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !body.trim()) {
      setError('Please provide your name and review text.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName, rating, vehicleText, body }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit review');

      setReviews([
        {
          id: data.review.id,
          customerName,
          rating,
          body,
          vehicleText: vehicleText || null,
          serviceName: null,
          reviewDate: new Date().toISOString(),
        },
        ...reviews,
      ]);

      setSuccess(true);
      setShowForm(false);
      setCustomerName('');
      setVehicleText('');
      setBody('');
    } catch (err: any) {
      setError(err.message || 'Error submitting review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* Rating Scorecard */}
      <div className={styles.scorecard}>
        <div className={styles.scoreLeft}>
          <span className={styles.scoreNumber}>4.9</span>
          <div className={styles.stars} style={{ display: 'flex', gap: 2 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Icon.Star key={i} size={16} color="var(--color-gold)" fill="var(--color-gold)" />
            ))}
          </div>
          <span className={styles.scoreLabel}>Overall Customer Rating</span>
        </div>
        <div className={styles.scoreDivider} />
        <div className={styles.scoreMiddle}>
          <div className={styles.metric}>
            <span className={styles.metricVal}>100%</span>
            <span className={styles.metricLabel}>Handover Satisfaction</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricVal}>500+</span>
            <span className={styles.metricLabel}>Vehicles Handcrafted</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricVal}>0%</span>
            <span className={styles.metricLabel}>Swirl Haze Tolerance</span>
          </div>
        </div>
        <div className={styles.scoreRight}>
          <button
            type="button"
            className="btn btn-secondary btn-md"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icon.Edit size={16} /> Write a Review
              </span>
            )}
          </button>
        </div>
      </div>

      {success && (
        <div className={styles.successBanner}>
          Thank you! Your verified review has been submitted and added to our wall of fame.
        </div>
      )}

      {/* Review Submission Form Drawer */}
      {showForm && (
        <form onSubmit={handleSubmit} className={styles.reviewForm}>
          <h3 className={styles.formTitle}>Submit Client Experience</h3>
          {error && <div className={styles.errorAlert}>{error}</div>}

          <div className={styles.ratingSelectRow}>
            <span className={styles.formLabel}>Rating:</span>
            <div className={styles.starButtons}>
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`${styles.starBtn} ${rating >= s ? styles.starFilled : ''}`}
                  onClick={() => setRating(s)}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Icon.Star
                    size={20}
                    color={rating >= s ? 'var(--color-gold)' : 'var(--color-border)'}
                    fill={rating >= s ? 'var(--color-gold)' : 'transparent'}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className={styles.twoCol}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Your Name *</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. Karan Kapoor"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Vehicle Model</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. BMW M340i, Thar, Fortuner"
                value={vehicleText}
                onChange={(e) => setVehicleText(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Your Review & Feedback *</label>
            <textarea
              className={styles.textarea}
              rows={3}
              placeholder="Tell others about the paint finish, customer service, or ceramic coating performance..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
          </div>

          <div className={styles.formActions}>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary btn-md"
            >
              {submitting ? 'Submitting...' : 'Post Verified Review'}
            </button>
          </div>
        </form>
      )}

      {/* Reviews Grid */}
      <div className={styles.reviewsGrid}>
        {reviews.map((r) => (
          <div key={r.id} className={styles.card}>
            <div className={styles.cardStars} style={{ display: 'flex', gap: 2 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Icon.Star
                  key={i}
                  size={14}
                  color={i < r.rating ? 'var(--color-gold)' : 'var(--color-border)'}
                  fill={i < r.rating ? 'var(--color-gold)' : 'transparent'}
                />
              ))}
            </div>
            <p className={styles.cardBody}>&ldquo;{r.body}&rdquo;</p>
            <div className={styles.cardFooter}>
              <div className={styles.avatar}>{r.customerName.charAt(0)}</div>
              <div>
                <h4 className={styles.authorName}>{r.customerName}</h4>
                <span className={styles.vehicleText}>{r.vehicleText ?? 'Verified Client'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
