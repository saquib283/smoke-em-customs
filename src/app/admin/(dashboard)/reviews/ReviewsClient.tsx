'use client';

import React, { useState, useMemo } from 'react';
import { Icon } from '@/components/common/Icons';
import styles from './reviews.module.css';

export interface ReviewItem {
  id: string;
  customerName: string;
  rating: number;
  body: string;
  vehicleText: string | null;
  serviceName: string | null;
  serviceId?: string | null;
  reviewDate: string | null;
  isFeatured: boolean;
  isPublished: boolean;
}

interface ServiceOption {
  id: string;
  name: string;
}

interface ReviewsClientProps {
  initialReviews: ReviewItem[];
  services: ServiceOption[];
}

type TabType = 'ALL' | 'FEATURED' | '5_STARS' | 'PUBLISHED' | 'DRAFTS';

export function ReviewsClient({ initialReviews, services }: ReviewsClientProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingReview, setEditingReview] = useState<ReviewItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form Fields
  const [customerName, setCustomerName] = useState('');
  const [vehicleText, setVehicleText] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const [reviewDate, setReviewDate] = useState(new Date().toISOString().split('T')[0]);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPublished, setIsPublished] = useState(true);

  // ── Executive KPI Metrics ──
  const metrics = useMemo(() => {
    const total = reviews.length;
    const featuredCount = reviews.filter((r) => r.isFeatured).length;
    const fiveStarCount = reviews.filter((r) => r.rating === 5).length;
    const avgRating =
      total > 0
        ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / total).toFixed(1)
        : '5.0';
    const publishedCount = reviews.filter((r) => r.isPublished).length;
    return { total, featuredCount, fiveStarCount, avgRating, publishedCount };
  }, [reviews]);

  // ── Segmented Filter Tabs ──
  const filterTabs = useMemo(
    () => [
      { id: 'ALL' as const, label: 'All Reviews', count: reviews.length },
      { id: 'FEATURED' as const, label: 'Spotlight', count: reviews.filter((r) => r.isFeatured).length },
      { id: '5_STARS' as const, label: '5 Stars', count: reviews.filter((r) => r.rating === 5).length },
      { id: 'PUBLISHED' as const, label: 'Live Published', count: reviews.filter((r) => r.isPublished).length },
      { id: 'DRAFTS' as const, label: 'Drafts / Hidden', count: reviews.filter((r) => !r.isPublished).length },
    ],
    [reviews]
  );

  const getInitials = (name: string) => {
    if (!name) return 'SC';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const openCreateModal = () => {
    setEditingReview(null);
    setCustomerName('');
    setVehicleText('');
    setServiceId(services[0]?.id || '');
    setRating(5);
    setBody('');
    setReviewDate(new Date().toISOString().split('T')[0]);
    setIsFeatured(false);
    setIsPublished(true);
    setShowModal(true);
  };

  const openEditModal = (review: ReviewItem) => {
    setEditingReview(review);
    setCustomerName(review.customerName);
    setVehicleText(review.vehicleText || '');
    setServiceId(review.serviceId || '');
    setRating(review.rating);
    setBody(review.body);
    setReviewDate(
      review.reviewDate
        ? new Date(review.reviewDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]
    );
    setIsFeatured(review.isFeatured);
    setIsPublished(review.isPublished);
    setShowModal(true);
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !body.trim()) {
      alert('Customer name and review testimonial are required');
      return;
    }
    setActionLoading(true);

    const payload = {
      customerName: customerName.trim(),
      vehicleText: vehicleText.trim() || null,
      serviceId: serviceId || null,
      rating: Number(rating),
      body: body.trim(),
      reviewDate: reviewDate ? new Date(reviewDate).toISOString() : new Date().toISOString(),
      isFeatured,
      isPublished,
    };

    try {
      if (editingReview) {
        // UPDATE
        const res = await fetch('/api/admin/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target: 'REVIEW',
            action: 'UPDATE',
            id: editingReview.id,
            data: payload,
          }),
        });
        const data = await res.json();
        if (data.success && data.review) {
          const serviceObj = services.find((s) => s.id === serviceId);
          const enrichedReview = {
            ...data.review,
            serviceName: serviceObj?.name ?? null,
            serviceId: serviceId || null,
          };
          setReviews((prev) =>
            prev.map((r) => (r.id === editingReview.id ? enrichedReview : r))
          );
          setShowModal(false);
        } else {
          alert(data.error || 'Failed to update review');
        }
      } else {
        // CREATE
        const res = await fetch('/api/admin/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target: 'REVIEW',
            action: 'CREATE',
            data: payload,
          }),
        });
        const data = await res.json();
        if (data.success && data.review) {
          const serviceObj = services.find((s) => s.id === serviceId);
          const enrichedReview = {
            ...data.review,
            serviceName: serviceObj?.name ?? null,
            serviceId: serviceId || null,
          };
          setReviews((prev) => [enrichedReview, ...prev]);
          setShowModal(false);
        } else {
          alert(data.error || 'Failed to create review');
        }
      }
    } catch {
      alert('Network error while saving review');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleReviewField = async (
    id: string,
    field: 'isPublished' | 'isFeatured',
    currentVal: boolean
  ) => {
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
    if (!confirm('Are you sure you want to delete this customer review?')) return;
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
      } else {
        alert(data.error || 'Failed to delete review');
      }
    } catch {
      alert('Error deleting review');
    }
  };

  // ── Filtered Reviews ──
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (activeTab === 'FEATURED' && !r.isFeatured) return false;
      if (activeTab === '5_STARS' && r.rating !== 5) return false;
      if (activeTab === 'PUBLISHED' && !r.isPublished) return false;
      if (activeTab === 'DRAFTS' && r.isPublished) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          r.customerName.toLowerCase().includes(q) ||
          (r.vehicleText && r.vehicleText.toLowerCase().includes(q)) ||
          (r.serviceName && r.serviceName.toLowerCase().includes(q)) ||
          r.body.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [reviews, activeTab, searchQuery]);

  // ── Export CSV Handler ──
  const handleExportCSV = () => {
    const headers = [
      'Client Name',
      'Vehicle',
      'Service',
      'Rating',
      'Review Date',
      'Spotlight Featured',
      'Published Status',
      'Testimonial',
    ];
    const rows = filteredReviews.map((r) => [
      `"${r.customerName.replace(/"/g, '""')}"`,
      `"${(r.vehicleText || '').replace(/"/g, '""')}"`,
      `"${(r.serviceName || '').replace(/"/g, '""')}"`,
      r.rating,
      r.reviewDate ? new Date(r.reviewDate).toISOString().slice(0, 10) : '',
      r.isFeatured ? 'Yes' : 'No',
      r.isPublished ? 'Live' : 'Draft',
      `"${r.body.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `smokecustoms_reviews_${new Date().toISOString().slice(0, 10)}.csv`
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
            <span>Client Reputation & NPS</span>
          </div>
          <h1 className={styles.pageTitle}>Customer Reviews & Testimonials</h1>
          <p className={styles.pageSubtitle}>
            Manage verified client experiences, 5-star ratings, homepage highlights, and service badges.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button className={styles.exportBtn} onClick={handleExportCSV} title="Export reviews to CSV">
            <Icon.FileText size={15} />
            <span>Export CSV</span>
          </button>
          <button className={styles.addBtn} onClick={openCreateModal}>
            <Icon.Plus size={15} />
            <span>+ Add Client Review</span>
          </button>
        </div>
      </div>

      {/* ── Executive KPI Metric Cards ── */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Total Testimonials</span>
            <span className={styles.metricValue}>{metrics.total}</span>
            <span className={styles.metricSubtext}>Verified customer reviews</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconGold}`}>
            <Icon.Users size={22} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>5-Star Ratings</span>
            <span className={styles.metricValue}>{metrics.fiveStarCount}</span>
            <span className={styles.metricSubtext}>Top satisfaction reviews</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconAmber}`}>
            <Icon.Star size={22} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Average Rating</span>
            <span className={styles.metricValue}>{metrics.avgRating} ★</span>
            <span className={styles.metricSubtext}>Reputation satisfaction</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconGreen}`}>
            <Icon.Shield size={22} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Homepage Spotlight</span>
            <span className={styles.metricValue}>{metrics.featuredCount}</span>
            <span className={styles.metricSubtext}>Featured hero quotes</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconPurple}`}>
            <Icon.Sparkles size={22} />
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
              placeholder="Search client name, vehicle, service, review text..."
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
            Showing <strong>{filteredReviews.length}</strong> of {reviews.length} reviews
          </div>
        </div>
      </div>

      {/* ── Reviews List ── */}
      <div className={styles.reviewsList}>
        {filteredReviews.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIconWrap}>
              <Icon.Star size={24} />
            </div>
            <h4 className={styles.emptyTitle}>No reviews found</h4>
            <p className={styles.emptyDesc}>
              {searchQuery
                ? `No testimonials match "${searchQuery}". Try adjusting your search query or filters.`
                : 'Try clearing your filter or add a verified customer testimonial.'}
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
          filteredReviews.map((r) => (
            <div key={r.id} className={styles.reviewCard}>
              <div className={styles.cardHead}>
                <div className={styles.clientMetaWrap}>
                  <div className={styles.avatarCircle}>{getInitials(r.customerName)}</div>
                  <div className={styles.clientMeta}>
                    <div className={styles.clientName}>{r.customerName}</div>
                    {(r.vehicleText || r.serviceName) && (
                      <div className={styles.vehicleAndService}>
                        {r.vehicleText && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Icon.Car size={13} color="#B45309" />
                            {r.vehicleText}
                          </span>
                        )}
                        {r.vehicleText && r.serviceName && <span style={{ color: '#CBD5E1' }}>•</span>}
                        {r.serviceName && (
                          <span className={styles.serviceBadge}>{r.serviceName}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.ratingDateSide}>
                  <div className={styles.starsRow}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Icon.Star
                        key={i}
                        size={15}
                        className={i < r.rating ? styles.starFilled : styles.starEmpty}
                        fill={i < r.rating ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                  {r.reviewDate && (
                    <div className={styles.reviewDate}>
                      {new Date(r.reviewDate).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.reviewBody}>“{r.body}”</div>

              <div className={styles.cardFooter}>
                <div className={styles.badgesGroup}>
                  <button
                    type="button"
                    className={`${styles.togglePill} ${r.isFeatured ? styles.togglePillFeatured : ''}`}
                    onClick={() => toggleReviewField(r.id, 'isFeatured', r.isFeatured)}
                    title={r.isFeatured ? 'Featured on homepage' : 'Mark as homepage spotlight'}
                  >
                    <Icon.Star size={11} fill={r.isFeatured ? 'currentColor' : 'none'} />
                    <span>{r.isFeatured ? 'Spotlight' : 'Standard'}</span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.togglePill} ${r.isPublished ? styles.togglePillLive : styles.togglePillDraft}`}
                    onClick={() => toggleReviewField(r.id, 'isPublished', r.isPublished)}
                    title={r.isPublished ? 'Visible publicly' : 'Draft / hidden from public site'}
                  >
                    <span className={styles.toggleDot} />
                    <span>{r.isPublished ? 'Live' : 'Draft'}</span>
                  </button>
                </div>

                <div className={styles.actionsGroup}>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={() => openEditModal(r)}
                    title="Edit review"
                  >
                    <Icon.Edit size={12} />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(r.id)}
                    title="Delete review"
                  >
                    <Icon.Trash size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingReview ? 'Edit Client Review' : 'Add Client Review'}</h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setShowModal(false)}
                title="Close modal"
              >
                <Icon.Cross size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveReview}>
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Client Name *</label>
                    <input
                      type="text"
                      required
                      className={styles.formInput}
                      placeholder="e.g. Vikramaditya Singhania"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Vehicle Details</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="e.g. Mercedes-AMG G63 or BMW M340i"
                      value={vehicleText}
                      onChange={(e) => setVehicleText(e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Studio Treatment / Service</label>
                    <select
                      className={styles.formSelect}
                      value={serviceId}
                      onChange={(e) => setServiceId(e.target.value)}
                    >
                      <option value="">General Detailing Inquiry</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Star Rating (1 - 5)</label>
                    <select
                      className={styles.formSelect}
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                    >
                      <option value={5}>★★★★★ 5 Stars (Exceptional)</option>
                      <option value={4}>★★★★☆ 4 Stars (Very Good)</option>
                      <option value={3}>★★★☆☆ 3 Stars (Average)</option>
                      <option value={2}>★★☆☆☆ 2 Stars (Below Average)</option>
                      <option value={1}>★☆☆☆☆ 1 Star (Poor)</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Review Date</label>
                    <input
                      type="date"
                      className={styles.formInput}
                      value={reviewDate}
                      onChange={(e) => setReviewDate(e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroupFull}>
                    <label className={styles.formLabel}>Testimonial Body *</label>
                    <textarea
                      required
                      className={styles.formTextarea}
                      placeholder="Describe client feedback on gloss, hydrophobics, craftsmanship, turnaround time..."
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroupFull}>
                    <div className={styles.checkboxRow}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={isFeatured}
                          onChange={(e) => setIsFeatured(e.target.checked)}
                        />
                        <span>Feature on Studio Homepage</span>
                      </label>

                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={isPublished}
                          onChange={(e) => setIsPublished(e.target.checked)}
                        />
                        <span>Publish Live Immediately</span>
                      </label>
                    </div>
                  </div>
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
                  {actionLoading ? 'Saving...' : editingReview ? 'Update Review' : 'Add Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
