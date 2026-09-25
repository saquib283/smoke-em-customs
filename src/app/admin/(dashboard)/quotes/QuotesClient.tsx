'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Icon } from '@/components/common/Icons';
import { WhatsAppCTA } from '@/components/common/WhatsAppCTA';
import styles from './quotes.module.css';

interface QuoteItem {
  id: string;
  customerName: string;
  customerPhone?: string;
  vehicleText?: string | null;
  leadId: string;
  status: string;
  total: string;
  itemCount: number;
  validUntil: string | null;
  createdAt: string;
  linkedBookingId?: string | null;
}

interface LeadOption {
  id: string;
  customerName: string;
  customerId: string;
  customerPhone: string;
  vehicleText: string | null;
  vehicleId?: string | null;
}

interface ServiceOption {
  id: string;
  name: string;
  startingPrice: string;
}

interface PackageOption {
  id: string;
  name: string;
  startingPrice: string | null;
  price: string | null;
}

interface ResourceOption {
  id: string;
  name: string;
}

interface QuoteStats {
  totalCount: number;
  draftCount: number;
  sentCount: number;
  acceptedCount: number;
  declinedCount: number;
  expiredCount: number;
  totalQuotedValue: number;
  acceptedRevenue: number;
}

interface QuotesClientProps {
  initialQuotes: QuoteItem[];
  leads?: LeadOption[];
  services?: ServiceOption[];
  packages?: PackageOption[];
  resources?: ResourceOption[];
  initialStats?: QuoteStats;
}

export function QuotesClient({
  initialQuotes,
  initialStats,
}: QuotesClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [quotes] = useState<QuoteItem[]>(initialQuotes);
  const [stats] = useState<QuoteStats | undefined>(initialStats);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Check URL query parameters for deep linking
  useEffect(() => {
    const leadIdParam = searchParams.get('leadId');
    const quoteIdParam = searchParams.get('quoteId') || searchParams.get('id');

    if (leadIdParam) {
      router.push(`/admin/quotes/new?leadId=${leadIdParam}`);
    } else if (quoteIdParam) {
      router.push(`/admin/quotes/${quoteIdParam}`);
    }
  }, [searchParams, router]);

  // Recalculate stats dynamically
  const computedStats: QuoteStats = useMemo(() => {
    return (
      stats || {
        totalCount: quotes.length,
        draftCount: quotes.filter((q) => q.status === 'DRAFT').length,
        sentCount: quotes.filter((q) => q.status === 'SENT').length,
        acceptedCount: quotes.filter((q) => q.status === 'ACCEPTED').length,
        declinedCount: quotes.filter((q) => q.status === 'DECLINED').length,
        expiredCount: quotes.filter((q) => q.status === 'EXPIRED').length,
        totalQuotedValue: quotes.reduce((acc, q) => acc + (parseFloat(q.total) || 0), 0),
        acceptedRevenue: quotes
          .filter((q) => q.status === 'ACCEPTED')
          .reduce((acc, q) => acc + (parseFloat(q.total) || 0), 0),
      }
    );
  }, [quotes, stats]);

  // Filter & Search
  const filtered = useMemo(() => {
    return quotes.filter((q) => {
      if (filterStatus !== 'ALL' && q.status !== filterStatus) return false;
      if (searchTerm.trim()) {
        const qNum = `#${q.id.slice(-6).toLowerCase()}`;
        const search = searchTerm.toLowerCase();
        const matchName = q.customerName.toLowerCase().includes(search);
        const matchRef = qNum.includes(search) || q.id.toLowerCase().includes(search);
        const matchVehicle = q.vehicleText?.toLowerCase().includes(search);
        const matchPhone = q.customerPhone?.includes(search);
        if (!matchName && !matchRef && !matchVehicle && !matchPhone) return false;
      }
      return true;
    });
  }, [quotes, filterStatus, searchTerm]);

  // Client Initials
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (name[0] || 'C').toUpperCase();
  };

  // Status Filter Tabs
  const statusTabs = [
    { key: 'ALL', label: 'All Quotes', count: computedStats.totalCount },
    { key: 'DRAFT', label: 'Drafts', count: computedStats.draftCount, alert: computedStats.draftCount > 0 },
    { key: 'SENT', label: 'Sent & In Review', count: computedStats.sentCount },
    { key: 'ACCEPTED', label: 'Accepted Deals', count: computedStats.acceptedCount },
    { key: 'DECLINED', label: 'Declined', count: computedStats.declinedCount },
    { key: 'EXPIRED', label: 'Expired', count: computedStats.expiredCount },
  ];

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Quote Ref', 'Customer Name', 'Phone', 'Vehicle', 'Items Count', 'Contract Total (INR)', 'Status', 'Valid Until', 'Created At'];
    const rows = filtered.map((q) => [
      `"#${q.id.slice(-6).toUpperCase()}"`,
      `"${q.customerName.replace(/"/g, '""')}"`,
      `"${q.customerPhone || ''}"`,
      `"${(q.vehicleText || 'Unspecified').replace(/"/g, '""')}"`,
      q.itemCount,
      q.total,
      `"${q.status}"`,
      `"${q.validUntil ? new Date(q.validUntil).toLocaleDateString('en-IN') : 'Open'}"`,
      `"${new Date(q.createdAt).toLocaleDateString('en-IN')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smokecustoms_quotes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.container}>
      {toastMessage && <div className={styles.toast}>{toastMessage}</div>}

      {/* ── Page Header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>
            <span>STUDIO FINANCIAL ENGINE</span>
            <span className={styles.eyebrowDot} />
            <span>CLIENT PROPOSALS</span>
          </div>
          <h1 className={styles.pageTitle}>Studio Formal Quotations</h1>
          <p className={styles.pageSubtitle}>
            Admin quotation engine — draft line items, live tax & discount computations, WhatsApp summaries, and booking linkage.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.exportBtn}
            onClick={handleExportCSV}
            title="Download CSV spreadsheet of current proposals"
          >
            <Icon.FileText size={15} />
            <span>Export CSV</span>
          </button>
          <Link
            href="/admin/quotes/new"
            className={styles.newQuoteBtn}
            id="btn-generate-quote-header"
          >
            <Icon.Plus size={15} />
            <span>Generate New Quotation</span>
          </Link>
        </div>
      </div>

      {/* ── Executive KPI Metric Cards ── */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Quoted Pipeline</span>
            <span className={styles.metricValue} style={{ color: '#B45309' }}>
              ₹{computedStats.totalQuotedValue.toLocaleString('en-IN')}
            </span>
            <span className={styles.metricSubtext}>Cumulative quote pipeline</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconGold}`}>
            <Icon.FileText size={20} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Accepted Revenue</span>
            <span
              className={styles.metricValue}
              style={{
                color: computedStats.acceptedRevenue > 0 ? '#16A34A' : '#0F172A',
              }}
            >
              ₹{computedStats.acceptedRevenue.toLocaleString('en-IN')}
            </span>
            <span className={styles.metricSubtext}>
              {computedStats.acceptedCount === 1 ? '1 deal locked into bays' : `${computedStats.acceptedCount} deals locked into bays`}
            </span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconGreen}`}>
            <Icon.Check size={20} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Active Proposals</span>
            <span className={styles.metricValue}>{computedStats.totalCount}</span>
            <span className={styles.metricSubtext}>
              {computedStats.draftCount} draft{computedStats.draftCount !== 1 ? 's' : ''} awaiting issuance
            </span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconNeutral}`}>
            <Icon.Tag size={20} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Dispatched to Clients</span>
            <span className={styles.metricValue} style={{ color: '#8B5CF6' }}>
              {computedStats.sentCount}
            </span>
            <span className={styles.metricSubtext}>Sent proposals in review</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconPurple}`}>
            <Icon.Send size={20} />
          </div>
        </div>
      </div>

      {/* ── Filter & Search Controls Panel ── */}
      <div className={styles.controlsCard}>
        {/* Status Category Tabs */}
        <div className={styles.tabsScroll}>
          <div className={styles.statusTabs}>
            {statusTabs.map((tab) => {
              const isActive = filterStatus === tab.key;
              const hasAlert = tab.alert && tab.count > 0;
              return (
                <button
                  key={tab.key}
                  type="button"
                  className={`${styles.tabBtn} ${isActive ? styles.activeTab : ''}`}
                  onClick={() => setFilterStatus(tab.key)}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`${styles.tabBadge} ${
                      isActive ? '' : hasAlert ? styles.tabBadgeAlert : styles.tabBadgeInactive
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
              placeholder="Search by client name, phone, ref (#A1B2), or vehicle..."
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
              Showing <strong>{filtered.length}</strong> of {quotes.length} quotations
            </span>
          </div>
        </div>
      </div>

      {/* ── Quotations Table Card ── */}
      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Quote Ref</th>
                <th style={{ width: '220px' }}>Client & Contact</th>
                <th style={{ width: '180px' }}>Vehicle</th>
                <th style={{ width: '120px' }}>Items</th>
                <th style={{ width: '140px' }}>Contract Total</th>
                <th style={{ width: '140px' }}>Status</th>
                <th style={{ width: '130px' }}>Valid Until</th>
                <th style={{ width: '180px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className={styles.emptyCard}>
                      <div className={styles.emptyIconWrap}>
                        <Icon.FileText size={24} />
                      </div>
                      <h4 className={styles.emptyTitle}>No matching quotations found</h4>
                      <p className={styles.emptyDesc}>
                        Try adjusting your search query, clear filters, or generate a new formal quotation.
                      </p>
                      {(searchTerm || filterStatus !== 'ALL') && (
                        <button
                          type="button"
                          className={styles.emptyResetBtn}
                          onClick={() => {
                            setSearchTerm('');
                            setFilterStatus('ALL');
                          }}
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((q, idx) => {
                  const isLast = idx === filtered.length - 1;
                  const statusClass = `status${q.status}`;

                  return (
                    <tr key={q.id} className={`${styles.tableRow} ${isLast ? styles.tableRowLast : ''}`}>
                      {/* 1. Quote Ref */}
                      <td className={styles.quoteRefCell}>
                        <Link
                          href={`/admin/quotes/${q.id}`}
                          className={styles.quoteRefBadge}
                          style={{ textDecoration: 'none' }}
                        >
                          #{q.id.slice(-6).toUpperCase()}
                        </Link>
                      </td>

                      {/* 2. Client & Contact */}
                      <td>
                        <Link
                          href={`/admin/quotes/${q.id}`}
                          className={styles.customerWrapper}
                          style={{ textDecoration: 'none' }}
                        >
                          <div className={styles.customerAvatar}>
                            {getInitials(q.customerName)}
                          </div>
                          <div className={styles.customerDetails}>
                            <span className={styles.customerName}>{q.customerName}</span>
                            <span className={styles.customerPhone}>{q.customerPhone || '—'}</span>
                          </div>
                        </Link>
                      </td>

                      {/* 3. Vehicle */}
                      <td className={styles.vehicleCell}>
                        {q.vehicleText ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <Icon.Car size={13} color="#64748B" />
                            <span>{q.vehicleText}</span>
                          </span>
                        ) : (
                          <span style={{ color: '#94A3B8' }}>Unspecified</span>
                        )}
                      </td>

                      {/* 4. Items */}
                      <td>
                        <span className={styles.itemsBadge}>
                          {q.itemCount} {q.itemCount === 1 ? 'item' : 'items'}
                        </span>
                      </td>

                      {/* 5. Total */}
                      <td>
                        <span className={styles.totalAmount}>
                          ₹{Number(q.total).toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* 6. Status */}
                      <td>
                        <span className={`${styles.statusPill} ${styles[statusClass] || styles.statusDRAFT}`}>
                          <span className={styles.statusDot} />
                          <span>{q.status}</span>
                        </span>
                      </td>

                      {/* 7. Valid Until */}
                      <td>
                        <span className={styles.validUntilText}>
                          {q.validUntil
                            ? new Date(q.validUntil).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                              })
                            : 'Open'}
                        </span>
                      </td>

                      {/* 8. Action Hub */}
                      <td>
                        <div className={styles.actionBtns}>
                          {q.customerPhone && (
                            <WhatsAppCTA
                              phone={q.customerPhone}
                              message={`Hello ${q.customerName}, Smoke M Customs checking in regarding your quotation #${q.id.slice(-6).toUpperCase()}.`}
                              iconOnly
                              size="sm"
                              variant="icon"
                              ariaLabel={`WhatsApp ${q.customerName}`}
                              logCommunication={{
                                customerId: q.id,
                                summary: `Outbound WhatsApp chat opened regarding quotation #${q.id.slice(-6).toUpperCase()}`,
                              }}
                            />
                          )}

                          <Link
                            href={`/quotes/${q.id}`}
                            target="_blank"
                            className={styles.actionBtn}
                            title="Open client-facing printable view"
                          >
                            <Icon.Printer size={13} />
                            <span>View</span>
                          </Link>

                          <Link
                            href={`/admin/quotes/${q.id}`}
                            className={`${styles.actionBtn} ${styles.primaryActionBtn}`}
                            id={`btn-manage-quote-${q.id}`}
                          >
                            <span>Manage</span>
                            <Icon.ArrowRight size={11} />
                          </Link>
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
        {filtered.length > 0 && (
          <div className={styles.tableFooter}>
            <span>
              Showing {filtered.length} of {quotes.length} total quotation{quotes.length !== 1 ? 's' : ''}
            </span>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
              Smoke M Customs • Financial Quotation Engine
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
