'use client';

import React, { useState, useMemo } from 'react';
import { Icon } from '@/components/common/Icons';
import styles from './gallery.module.css';

export interface GalleryItem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  serviceCategory: string | null;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  tags: string[];
  isFeatured: boolean;
  isPublished: boolean;
  beforeImageUrl: string | null;
  afterImageUrl: string | null;
  videoUrl: string | null;
  serviceId: string | null;
}

interface GalleryClientProps {
  initialGallery: GalleryItem[];
}

export function GalleryClient({ initialGallery }: GalleryClientProps) {
  const [gallery, setGallery] = useState<GalleryItem[]>(initialGallery);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploadingBefore, setUploadingBefore] = useState(false);
  const [uploadingAfter, setUploadingAfter] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('Porsche');
  const [vehicleModel, setVehicleModel] = useState('911 GT3 RS');
  const [serviceCategory, setServiceCategory] = useState('Paint Protection Film');
  const [description, setDescription] = useState('');
  const [beforeImageUrl, setBeforeImageUrl] = useState('');
  const [afterImageUrl, setAfterImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('PPF, Self-Healing, Track Pack');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPublished, setIsPublished] = useState(true);

  // ── Executive KPI Metrics ──
  const metrics = useMemo(() => {
    const total = gallery.length;
    const featuredCount = gallery.filter((g) => g.isFeatured).length;
    const publishedCount = gallery.filter((g) => g.isPublished).length;
    const videoCount = gallery.filter((g) => Boolean(g.videoUrl)).length;
    return { total, featuredCount, publishedCount, videoCount };
  }, [gallery]);

  // ── Segmented Filter Tabs ──
  const filterTabs = useMemo(() => {
    const tabs = [
      { key: 'ALL', label: 'All Builds', count: gallery.length },
      { key: 'FEATURED', label: 'Spotlight', count: gallery.filter((g) => g.isFeatured).length },
      { key: 'PUBLISHED', label: 'Live Public', count: gallery.filter((g) => g.isPublished).length },
      { key: 'DRAFT', label: 'Drafts', count: gallery.filter((g) => !g.isPublished).length },
    ];

    const serviceCategories = [
      'Paint Protection Film',
      'Ceramic Coating',
      'Paint Correction',
      'Interior Detailing',
      'Custom Detailing',
    ];

    serviceCategories.forEach((cat) => {
      const count = gallery.filter((g) => g.serviceCategory === cat).length;
      if (count > 0 || gallery.length === 0) {
        tabs.push({ key: cat, label: cat, count });
      }
    });

    return tabs;
  }, [gallery]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingItem) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      );
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setTitle('');
    setSlug('');
    setVehicleBrand('');
    setVehicleModel('');
    setServiceCategory('Paint Protection Film');
    setDescription('');
    setBeforeImageUrl('');
    setAfterImageUrl('');
    setVideoUrl('');
    setTagsInput('');
    setIsFeatured(false);
    setIsPublished(true);
    setShowModal(true);
  };

  const openEditModal = (item: GalleryItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setSlug(item.slug);
    setVehicleBrand(item.vehicleBrand || '');
    setVehicleModel(item.vehicleModel || '');
    setServiceCategory(item.serviceCategory || 'Paint Protection Film');
    setDescription(item.description || '');
    setBeforeImageUrl(item.beforeImageUrl || '');
    setAfterImageUrl(item.afterImageUrl || '');
    setVideoUrl(item.videoUrl || '');
    setTagsInput((item.tags || []).join(', '));
    setIsFeatured(item.isFeatured);
    setIsPublished(item.isPublished);
    setShowModal(true);
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'before' | 'after'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const setLoader = type === 'before' ? setUploadingBefore : setUploadingAfter;
    const setUrl = type === 'before' ? setBeforeImageUrl : setAfterImageUrl;

    try {
      setLoader(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'gallery');

      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setUrl(data.url);
      } else {
        alert(data.error || 'Failed to upload photo');
      }
    } catch {
      alert('Error uploading file');
    } finally {
      setLoader(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) {
      alert('Title and slug are required');
      return;
    }
    setActionLoading(true);

    const tagsArray = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      vehicleBrand: vehicleBrand.trim() || null,
      vehicleModel: vehicleModel.trim() || null,
      serviceCategory,
      description: description.trim() || null,
      beforeImageUrl: beforeImageUrl.trim() || null,
      afterImageUrl: afterImageUrl.trim() || null,
      videoUrl: videoUrl.trim() || null,
      tags: tagsArray,
      isFeatured,
      isPublished,
    };

    try {
      if (editingItem) {
        // UPDATE
        const res = await fetch('/api/admin/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target: 'GALLERY',
            action: 'UPDATE',
            id: editingItem.id,
            data: payload,
          }),
        });
        const data = await res.json();
        if (data.success && data.gallery) {
          setGallery((prev) =>
            prev.map((g) => (g.id === editingItem.id ? data.gallery : g))
          );
          setShowModal(false);
        } else {
          alert(data.error || 'Failed to update showcase');
        }
      } else {
        // CREATE
        const res = await fetch('/api/admin/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target: 'GALLERY',
            action: 'CREATE',
            data: payload,
          }),
        });
        const data = await res.json();
        if (data.success && data.gallery) {
          setGallery((prev) => [data.gallery, ...prev]);
          setShowModal(false);
        } else {
          alert(data.error || 'Failed to create showcase');
        }
      }
    } catch {
      alert('Network error while saving showcase');
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
      alert('Failed to toggle featured status');
    }
  };

  const togglePublished = async (id: string, currentVal: boolean) => {
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: 'GALLERY',
          action: 'UPDATE',
          id,
          data: { isPublished: !currentVal },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGallery((prev) =>
          prev.map((g) => (g.id === id ? { ...g, isPublished: !currentVal } : g))
        );
      }
    } catch {
      alert('Failed to toggle publish status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this project from the showcase?')) return;
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
      } else {
        alert(data.error || 'Failed to delete');
      }
    } catch {
      alert('Error deleting project');
    }
  };

  // ── Filtered Gallery Items ──
  const filteredGallery = useMemo(() => {
    return gallery.filter((item) => {
      if (activeCategory === 'FEATURED' && !item.isFeatured) return false;
      if (activeCategory === 'PUBLISHED' && !item.isPublished) return false;
      if (activeCategory === 'DRAFT' && item.isPublished) return false;
      if (
        activeCategory !== 'ALL' &&
        activeCategory !== 'FEATURED' &&
        activeCategory !== 'PUBLISHED' &&
        activeCategory !== 'DRAFT' &&
        item.serviceCategory !== activeCategory
      ) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          item.title.toLowerCase().includes(q) ||
          (item.slug && item.slug.toLowerCase().includes(q)) ||
          (item.vehicleBrand && item.vehicleBrand.toLowerCase().includes(q)) ||
          (item.vehicleModel && item.vehicleModel.toLowerCase().includes(q)) ||
          (item.serviceCategory && item.serviceCategory.toLowerCase().includes(q)) ||
          (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)));
        if (!match) return false;
      }
      return true;
    });
  }, [gallery, activeCategory, searchQuery]);

  // ── Export CSV Handler ──
  const handleExportCSV = () => {
    const headers = [
      'Project Title',
      'Slug',
      'Vehicle Brand',
      'Vehicle Model',
      'Category',
      'Spotlight Featured',
      'Published Status',
      'Video Reel URL',
      'Tags',
    ];
    const rows = filteredGallery.map((g) => [
      `"${g.title.replace(/"/g, '""')}"`,
      `"${g.slug}"`,
      `"${(g.vehicleBrand || '').replace(/"/g, '""')}"`,
      `"${(g.vehicleModel || '').replace(/"/g, '""')}"`,
      `"${(g.serviceCategory || '').replace(/"/g, '""')}"`,
      g.isFeatured ? 'Yes' : 'No',
      g.isPublished ? 'Live' : 'Draft',
      `"${(g.videoUrl || '').replace(/"/g, '""')}"`,
      `"${(g.tags || []).join('; ').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `smokecustoms_gallery_${new Date().toISOString().slice(0, 10)}.csv`
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
            <span>Showcase Portfolio</span>
          </div>
          <h1 className={styles.pageTitle}>Studio Showcase & Detailing Gallery</h1>
          <p className={styles.pageSubtitle}>
            Curate before & after transformation cases, high-definition video reels, vehicle tags, and homepage spotlight builds.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button className={styles.exportBtn} onClick={handleExportCSV} title="Export gallery to CSV">
            <Icon.FileText size={15} />
            <span>Export CSV</span>
          </button>
          <button className={styles.addBtn} onClick={openCreateModal}>
            <Icon.Plus size={15} />
            <span>+ Add Showcase Build</span>
          </button>
        </div>
      </div>

      {/* ── Executive KPI Metric Cards ── */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Total Showcases</span>
            <span className={styles.metricValue}>{metrics.total}</span>
            <span className={styles.metricSubtext}>Active portfolio builds</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconGold}`}>
            <Icon.Camera size={22} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Homepage Spotlight</span>
            <span className={styles.metricValue}>{metrics.featuredCount}</span>
            <span className={styles.metricSubtext}>Featured hero showcases</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconAmber}`}>
            <Icon.Star size={22} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Published Live</span>
            <span className={styles.metricValue}>{metrics.publishedCount}</span>
            <span className={styles.metricSubtext}>Client-visible builds</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconGreen}`}>
            <Icon.Check size={22} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Video Reels</span>
            <span className={styles.metricValue}>{metrics.videoCount}</span>
            <span className={styles.metricSubtext}>Cinematic video assets</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconPurple}`}>
            <Icon.YouTube size={22} />
          </div>
        </div>
      </div>

      {/* ── Filter & Search Controls Panel ── */}
      <div className={styles.controlsCard}>
        <div className={styles.tabsScroll}>
          <div className={styles.filterTabs}>
            {filterTabs.map((tab) => {
              const isActive = activeCategory === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  className={`${styles.tabBtn} ${isActive ? styles.activeTab : ''}`}
                  onClick={() => setActiveCategory(tab.key)}
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
              placeholder="Search build title, vehicle brand, model, tags..."
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
            Showing <strong>{filteredGallery.length}</strong> of {gallery.length} showcase builds
          </div>
        </div>
      </div>

      {/* ── Gallery Cards Grid ── */}
      <div className={styles.grid}>
        {filteredGallery.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIconWrap}>
              <Icon.Camera size={24} />
            </div>
            <h4 className={styles.emptyTitle}>No gallery showcases found</h4>
            <p className={styles.emptyDesc}>
              {searchQuery
                ? `No showcase builds match "${searchQuery}". Try adjusting your search query or filters.`
                : 'Try selecting another category or add your first showcase build.'}
            </p>
            {(searchQuery || activeCategory !== 'ALL') && (
              <button
                className={styles.emptyResetBtn}
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('ALL');
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          filteredGallery.map((item) => (
            <div key={item.id} className={styles.card}>
              <div className={styles.previewArea}>
                <div className={styles.cardBadges}>
                  {item.serviceCategory && (
                    <span className={styles.badgeCategory}>{item.serviceCategory}</span>
                  )}
                  {item.isFeatured && (
                    <span className={styles.badgeFeatured}>
                      <Icon.Star size={11} fill="currentColor" /> Spotlight
                    </span>
                  )}
                  {item.videoUrl && (
                    <span className={styles.badgeVideo}>
                      <Icon.YouTube size={11} /> Reel
                    </span>
                  )}
                  {!item.isPublished && <span className={styles.badgeDraft}>Draft</span>}
                </div>

                <div className={styles.beforeAfterSplit}>
                  <div className={styles.splitHalf}>
                    {item.beforeImageUrl ? (
                      <img src={item.beforeImageUrl} alt={`${item.title} Before`} />
                    ) : (
                      <div className={styles.splitHalfEmpty}>
                        <Icon.Camera size={18} />
                        <span>No Before Image</span>
                      </div>
                    )}
                    <span className={`${styles.splitLabel} ${styles.labelBefore}`}>Before</span>
                  </div>

                  <div className={styles.splitHalf}>
                    {item.afterImageUrl ? (
                      <img src={item.afterImageUrl} alt={`${item.title} After`} />
                    ) : (
                      <div className={styles.splitHalfEmpty}>
                        <Icon.Sparkles size={18} />
                        <span>No After Image</span>
                      </div>
                    )}
                    <span className={`${styles.splitLabel} ${styles.labelAfter}`}>After</span>
                  </div>
                </div>
              </div>

              <div className={styles.cardBody}>
                {(item.vehicleBrand || item.vehicleModel) && (
                  <div className={styles.cardVehicle}>
                    <Icon.Car size={13} color="#B45309" />
                    <span>
                      {item.vehicleBrand} {item.vehicleModel}
                    </span>
                  </div>
                )}
                <h3 className={styles.cardTitle}>{item.title}</h3>
                {item.description && <p className={styles.cardDescription}>{item.description}</p>}

                {item.tags && item.tags.length > 0 && (
                  <div className={styles.tagsRow}>
                    {item.tags.map((tag, idx) => (
                      <span key={idx} className={styles.tagPill}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.toggleGroup}>
                  <button
                    type="button"
                    className={`${styles.togglePill} ${item.isFeatured ? styles.togglePillFeatured : ''}`}
                    onClick={() => toggleFeatured(item.id, item.isFeatured)}
                    title={item.isFeatured ? 'Featured on homepage' : 'Mark as featured showcase'}
                  >
                    <Icon.Star size={11} fill={item.isFeatured ? 'currentColor' : 'none'} />
                    <span>{item.isFeatured ? 'Spotlight' : 'Standard'}</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.togglePill} ${item.isPublished ? styles.togglePillLive : styles.togglePillDraft}`}
                    onClick={() => togglePublished(item.id, item.isPublished)}
                    title={item.isPublished ? 'Visible on public site' : 'Draft only (hidden)'}
                  >
                    <span className={styles.toggleDot} />
                    <span>{item.isPublished ? 'Live' : 'Draft'}</span>
                  </button>
                </div>

                <div className={styles.actionsGroup}>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={() => openEditModal(item)}
                    title="Edit showcase details"
                  >
                    <Icon.Edit size={12} />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(item.id)}
                    title="Delete showcase"
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
              <h2>{editingItem ? 'Edit Showcase Build' : 'Create New Showcase Build'}</h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setShowModal(false)}
                title="Close modal"
              >
                <Icon.Cross size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Project Title *</label>
                    <input
                      type="text"
                      required
                      className={styles.formInput}
                      placeholder="e.g. Matte Satin PPF on Porsche GT3 RS"
                      value={title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>URL Slug *</label>
                    <input
                      type="text"
                      required
                      className={styles.formInput}
                      placeholder="e.g. matte-satin-ppf-porsche-gt3-rs"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Vehicle Brand</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="e.g. Porsche, BMW, Mercedes"
                      value={vehicleBrand}
                      onChange={(e) => setVehicleBrand(e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Vehicle Model</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="e.g. 911 GT3 RS, M3 Competition"
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Service Category</label>
                    <select
                      className={styles.formSelect}
                      value={serviceCategory}
                      onChange={(e) => setServiceCategory(e.target.value)}
                    >
                      <option value="Paint Protection Film">Paint Protection Film</option>
                      <option value="Ceramic Coating">Ceramic Coating</option>
                      <option value="Paint Correction">Paint Correction</option>
                      <option value="Interior Detailing">Interior Detailing</option>
                      <option value="Custom Detailing">Custom Detailing</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Video Reel URL (Optional)</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="e.g. /uploads/video.mp4 or Instagram Reel URL"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroupFull}>
                    <label className={styles.formLabel}>Transformation Summary</label>
                    <textarea
                      className={styles.formTextarea}
                      placeholder="Detail the paint defects found, multi-stage polishing, ceramic layers applied..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  {/* Before Photo */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Before Condition Photo</label>
                    <div className={styles.uploadDropzone}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'before')}
                        style={{ display: 'none' }}
                        id="before-photo-upload"
                      />
                      <label htmlFor="before-photo-upload" style={{ cursor: 'pointer', display: 'block' }}>
                        {uploadingBefore ? (
                          <span style={{ fontSize: '12px', color: '#B45309', fontWeight: 600 }}>
                            Uploading image...
                          </span>
                        ) : (
                          <div>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>
                              <Icon.Camera size={15} color="#B45309" /> Click to upload Before photo
                            </span>
                            <div className={styles.uploadHelpText}>PNG, JPG, WebP up to 50MB</div>
                          </div>
                        )}
                      </label>
                      {beforeImageUrl && (
                        <img src={beforeImageUrl} alt="Before preview" className={styles.uploadPreview} />
                      )}
                    </div>
                  </div>

                  {/* After Photo */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>After Finish Photo</label>
                    <div className={styles.uploadDropzone}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'after')}
                        style={{ display: 'none' }}
                        id="after-photo-upload"
                      />
                      <label htmlFor="after-photo-upload" style={{ cursor: 'pointer', display: 'block' }}>
                        {uploadingAfter ? (
                          <span style={{ fontSize: '12px', color: '#B45309', fontWeight: 600 }}>
                            Uploading image...
                          </span>
                        ) : (
                          <div>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>
                              <Icon.Sparkles size={15} color="#B45309" /> Click to upload After photo
                            </span>
                            <div className={styles.uploadHelpText}>PNG, JPG, WebP up to 50MB</div>
                          </div>
                        )}
                      </label>
                      {afterImageUrl && (
                        <img src={afterImageUrl} alt="After preview" className={styles.uploadPreview} />
                      )}
                    </div>
                  </div>

                  <div className={styles.formGroupFull}>
                    <label className={styles.formLabel}>Tags (comma separated)</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="e.g. PPF, Self-Healing, Track Pack, High-Gloss"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
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
                        <span>Feature on Homepage Spotlight</span>
                      </label>

                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={isPublished}
                          onChange={(e) => setIsPublished(e.target.checked)}
                        />
                        <span>Publish Live to Public Gallery</span>
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
                  disabled={actionLoading || uploadingBefore || uploadingAfter}
                  className={styles.btnPrimary}
                >
                  {actionLoading ? 'Saving...' : editingItem ? 'Update Showcase' : 'Publish Showcase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
