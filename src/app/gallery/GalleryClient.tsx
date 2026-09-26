'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ImageCompare } from '@/components/public/ImageCompare';
import styles from './gallery.module.css';

interface GalleryItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  serviceCategory: string | null;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  tags: string[];
  beforeImageUrl: string | null;
  afterImageUrl: string | null;
}

interface GalleryClientProps {
  items: GalleryItem[];
}

export function GalleryClient({ items }: GalleryClientProps) {
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  // Compute unique filters
  const filters = useMemo(() => {
    const categories = new Set<string>();
    items.forEach((item) => {
      if (item.serviceCategory) categories.add(item.serviceCategory);
    });
    return ['ALL', ...Array.from(categories)];
  }, [items]);

  const filteredItems = useMemo(() => {
    if (selectedFilter === 'ALL') return items;
    return items.filter((item) => item.serviceCategory === selectedFilter);
  }, [items, selectedFilter]);

  return (
    <>
      {/* Filter Tabs */}
      <div className={styles.filterBar} role="tablist" aria-label="Gallery categories">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            className={`${styles.filterBtn} ${selectedFilter === filter ? styles.activeFilterBtn : ''}`}
            onClick={() => setSelectedFilter(filter)}
            role="tab"
            aria-selected={selectedFilter === filter}
          >
            {filter === 'ALL' ? 'All Transformations' : filter}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className={styles.grid}>
        {filteredItems.map((item) => (
          <div key={item.id} className={styles.card}>
            {/* Interactive Before/After Split Slider */}
            <div className={styles.compareWrap}>
              {item.beforeImageUrl && item.afterImageUrl ? (
                <ImageCompare
                  beforeUrl={item.beforeImageUrl}
                  afterUrl={item.afterImageUrl}
                  beforeAlt={`${item.title} Before`}
                  afterAlt={`${item.title} After`}
                  title={item.title}
                />
              ) : null}
            </div>

            <div className={styles.info}>
              <div className={styles.metaRow}>
                <span className={styles.carBadge}>
                  {item.vehicleBrand} {item.vehicleModel}
                </span>
                <span className={styles.cat}>{item.serviceCategory}</span>
              </div>

              <h2 className={styles.itemTitle}>{item.title}</h2>

              {item.description && (
                <p className={styles.itemDesc}>{item.description}</p>
              )}

              <div className={styles.cardActions}>
                <Link href={`/gallery/${item.slug}`} className="btn btn-secondary btn-full">
                  Read Case Study & Scope &rarr;
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
