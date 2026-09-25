'use client';

import React from 'react';
import styles from './ui.module.css';

/* ─── Base Skeleton ─── */

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({
  width = '100%',
  height = '16px',
  borderRadius,
  className = '',
  style,
}: SkeletonProps) {
  return (
    <div
      className={`skeleton ${styles.skeletonBase} ${className}`}
      style={{ width, height, borderRadius, ...style }}
      aria-hidden="true"
    />
  );
}

/* ─── Table Skeleton ─── */

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 5 }: TableSkeletonProps) {
  return (
    <div className={styles.tableSkeleton} role="status" aria-label="Loading table data">
      <span className="sr-only">Loading…</span>
      {/* Header row */}
      <div className={styles.tableSkeletonHeader}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`th-${i}`} height="12px" width={`${65 + ((i * 13) % 30)}%`} />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, ri) => (
        <div key={`tr-${ri}`} className={styles.tableSkeletonRow} style={{ animationDelay: `${ri * 50}ms` }}>
          {Array.from({ length: columns }).map((_, ci) => (
            <Skeleton key={`td-${ri}-${ci}`} height="14px" width={`${55 + (((ri + 1) * (ci + 3) * 17) % 40)}%`} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ─── Card Skeleton ─── */

export function CardSkeleton() {
  return (
    <div className={styles.cardSkeleton} aria-hidden="true">
      <Skeleton height="160px" borderRadius="var(--radius-lg) var(--radius-lg) 0 0" />
      <div className={styles.cardSkeletonBody}>
        <Skeleton width="70%" height="18px" />
        <Skeleton width="40%" height="14px" />
        <Skeleton width="90%" height="12px" />
        <Skeleton width="60%" height="12px" />
      </div>
    </div>
  );
}

/* ─── KPI Grid Skeleton ─── */

export function KpiGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={styles.kpiGridSkeleton} role="status" aria-label="Loading statistics">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.kpiCardSkeleton} style={{ animationDelay: `${i * 80}ms` }}>
          <Skeleton width="48px" height="48px" borderRadius="var(--radius-md)" />
          <div className={styles.kpiCardSkeletonInfo}>
            <Skeleton width="60px" height="28px" />
            <Skeleton width="100px" height="10px" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Detail Panel Skeleton ─── */

export function DetailPanelSkeleton() {
  return (
    <div className={styles.detailSkeleton} aria-hidden="true">
      <div className={styles.detailSkeletonHeader}>
        <Skeleton width="40%" height="24px" />
        <Skeleton width="80px" height="28px" borderRadius="var(--radius-full)" />
      </div>
      <div className={styles.detailSkeletonGrid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={styles.detailSkeletonField}>
            <Skeleton width="80px" height="10px" />
            <Skeleton width="140px" height="16px" />
          </div>
        ))}
      </div>
      <div className={styles.detailSkeletonActions}>
        <Skeleton width="120px" height="36px" borderRadius="var(--radius-md)" />
        <Skeleton width="120px" height="36px" borderRadius="var(--radius-md)" />
      </div>
    </div>
  );
}

/* ─── List Page Skeleton (full page) ─── */

interface PageSkeletonProps {
  variant?: 'table' | 'cards' | 'list';
  itemCount?: number;
}

export function PageSkeleton({ variant = 'table', itemCount = 6 }: PageSkeletonProps) {
  return (
    <div className={styles.pageSkeleton} role="status" aria-label="Loading page">
      <span className="sr-only">Loading…</span>
      {/* Page header */}
      <div className={styles.pageSkeletonHeader}>
        <div>
          <Skeleton width="240px" height="30px" />
          <Skeleton width="160px" height="14px" style={{ marginTop: 8 }} />
        </div>
        <div className={styles.pageSkeletonHeaderActions}>
          <Skeleton width="120px" height="36px" borderRadius="var(--radius-md)" />
          <Skeleton width="100px" height="36px" borderRadius="var(--radius-md)" />
        </div>
      </div>

      {/* Filter bar */}
      <div className={styles.pageSkeletonFilters}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} width="80px" height="30px" borderRadius="var(--radius-full)" />
        ))}
        <Skeleton width="200px" height="36px" borderRadius="var(--radius-md)" style={{ marginLeft: 'auto' }} />
      </div>

      {/* Content */}
      {variant === 'table' && <TableSkeleton rows={itemCount} />}
      {variant === 'cards' && (
        <div className={styles.cardGridSkeleton}>
          {Array.from({ length: itemCount }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}
      {variant === 'list' && (
        <div className={styles.listSkeleton}>
          {Array.from({ length: itemCount }).map((_, i) => (
            <div key={i} className={styles.listItemSkeleton} style={{ animationDelay: `${i * 60}ms` }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                <Skeleton width="50%" height="16px" />
                <Skeleton width="70%" height="12px" />
              </div>
              <Skeleton width="80px" height="24px" borderRadius="var(--radius-full)" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
