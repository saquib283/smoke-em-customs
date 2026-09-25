'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { WhatsAppCTA } from '@/components/common/WhatsAppCTA';
import { Icon } from '@/components/common/Icons';
import styles from './leads.module.css';

export interface LeadItem {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  vehicleText: string | null;
  status: string;
  source: string | null;
  assignedToName: string | null;
  serviceInterestName: string | null;
  needsFollowUp: boolean;
  isDuplicate: boolean;
  photosCount: number;
  createdAt: string;
}

interface LeadsClientProps {
  initialLeads: LeadItem[];
}

export function LeadsClient({ initialLeads }: LeadsClientProps) {
  const [leads] = useState<LeadItem[]>(initialLeads);
  const [filterTab, setFilterTab] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // ── Metrics Calculation ──
  const metrics = useMemo(() => {
    const total = leads.length;
    const followUpDue = leads.filter((l) => l.needsFollowUp).length;
    const duplicates = leads.filter((l) => l.isDuplicate).length;
    const active = leads.filter((l) =>
      ['NEW', 'CONTACTED', 'QUOTE_SENT', 'FOLLOW_UP'].includes(l.status)
    ).length;
    return { total, followUpDue, duplicates, active };
  }, [leads]);

  // ── Filter Tabs Definition ──
  const filterTabs = [
    { key: 'ALL', label: 'All Leads', count: metrics.total },
    { key: 'ATTENTION', label: 'Action Required', count: metrics.followUpDue + metrics.duplicates, alert: true },
    { key: 'NEW', label: 'New', count: leads.filter((l) => l.status === 'NEW').length },
    { key: 'CONTACTED', label: 'Contacted', count: leads.filter((l) => l.status === 'CONTACTED').length },
    { key: 'QUOTE_SENT', label: 'Quote Sent', count: leads.filter((l) => l.status === 'QUOTE_SENT').length },
    { key: 'FOLLOW_UP', label: 'Follow Up', count: leads.filter((l) => l.status === 'FOLLOW_UP').length },
    { key: 'BOOKED', label: 'Booked', count: leads.filter((l) => l.status === 'BOOKED').length },
    { key: 'COMPLETED', label: 'Completed', count: leads.filter((l) => l.status === 'COMPLETED').length },
    { key: 'LOST', label: 'Lost', count: leads.filter((l) => l.status === 'LOST').length },
  ];

  // ── Filtered Leads ──
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      // Tab filter
      if (filterTab === 'ATTENTION') {
        if (!l.needsFollowUp && !l.isDuplicate) return false;
      } else if (filterTab !== 'ALL') {
        if (l.status !== filterTab) return false;
      }

      // Source filter
      if (sourceFilter !== 'ALL') {
        const leadSrc = (l.source || '').toLowerCase();
        if (sourceFilter === 'public_web' && !leadSrc.includes('web')) return false;
        if (sourceFilter === 'CONTACT_FORM' && !leadSrc.includes('form') && !leadSrc.includes('contact')) return false;
        if (sourceFilter === 'WHATSAPP' && !leadSrc.includes('whatsapp')) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = l.customerName.toLowerCase().includes(q);
        const matchPhone = l.customerPhone.includes(q);
        const matchVehicle = l.vehicleText ? l.vehicleText.toLowerCase().includes(q) : false;
        const matchService = l.serviceInterestName ? l.serviceInterestName.toLowerCase().includes(q) : false;
        if (!matchName && !matchPhone && !matchVehicle && !matchService) return false;
      }

      return true;
    });
  }, [leads, filterTab, sourceFilter, searchTerm]);

  // ── Client Monogram Generator ──
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return (name[0] || 'L').toUpperCase();
  };

  // ── Source Formatter ──
  const formatSource = (source: string | null) => {
    if (!source) return 'Website';
    const s = source.toLowerCase();
    if (s.includes('contact')) return 'Contact Form';
    if (s.includes('web')) return 'Web Inquiry';
    if (s.includes('whatsapp')) return 'WhatsApp';
    if (s.includes('walk')) return 'Studio Walk-in';
    return source.replace(/_/g, ' ');
  };

  // ── Status Formatter ──
  const formatStatus = (st: string) => {
    switch (st) {
      case 'NEW':
        return 'New Lead';
      case 'CONTACTED':
        return 'Contacted';
      case 'QUOTE_SENT':
        return 'Quote Sent';
      case 'FOLLOW_UP':
        return 'Follow Up';
      case 'BOOKED':
        return 'Booked Bay';
      case 'COMPLETED':
        return 'Completed';
      case 'LOST':
        return 'Lost';
      default:
        return st.replace(/_/g, ' ');
    }
  };

  // ── Export CSV Handler ──
  const handleExportCSV = () => {
    const headers = ['Client Name', 'Phone', 'Vehicle', 'Service', 'Status', 'Follow-up Due', 'Duplicate', 'Source', 'Date'];
    const rows = filteredLeads.map((l) => [
      `"${l.customerName.replace(/"/g, '""')}"`,
      `"${l.customerPhone}"`,
      `"${(l.vehicleText || 'Unspecified').replace(/"/g, '""')}"`,
      `"${(l.serviceInterestName || 'General').replace(/"/g, '""')}"`,
      `"${l.status}"`,
      l.needsFollowUp ? 'YES' : 'NO',
      l.isDuplicate ? 'YES' : 'NO',
      `"${l.source || 'Web'}"`,
      `"${new Date(l.createdAt).toISOString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smokecustoms_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.container}>
      {/* ── Executive Header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>
            <span>STUDIO CRM PIPELINE</span>
            <span className={styles.eyebrowDot} />
            <span>EXECUTIVE DISPATCH</span>
          </div>
          <h1 className={styles.pageTitle}>Leads & Inquiries</h1>
          <p className={styles.pageSubtitle}>
            Monitor incoming detailing requests, coordinate treatments, and track pipeline conversion.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button type="button" onClick={handleExportCSV} className={styles.exportBtn} title="Download CSV spreadsheet of current view">
            <Icon.FileText size={15} />
            <span>Export CSV</span>
          </button>
          <Link href="/admin/quotes" className={styles.primaryActionBtn}>
            <Icon.Plus size={15} />
            <span>Create Quote</span>
          </Link>
        </div>
      </div>

      {/* ── Executive KPI Metric Cards ── */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Total Inquiries</span>
            <span className={styles.metricValue}>{metrics.total}</span>
            <span className={styles.metricSubtext}>All recorded leads</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconNeutral}`}>
            <Icon.Inbox size={20} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Follow-up Overdue</span>
            <span className={styles.metricValue} style={{ color: metrics.followUpDue > 0 ? '#B45309' : '#0F172A' }}>
              {metrics.followUpDue}
            </span>
            <span className={styles.metricSubtext}>3+ days without action</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconWarning}`}>
            <Icon.AlertTriangle size={20} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>24h Duplicates</span>
            <span className={styles.metricValue} style={{ color: metrics.duplicates > 0 ? '#BE123C' : '#0F172A' }}>
              {metrics.duplicates}
            </span>
            <span className={styles.metricSubtext}>Repeated client inquiries</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconDuplicate}`}>
            <Icon.Repeat size={20} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Active Pipeline</span>
            <span className={styles.metricValue} style={{ color: '#2563EB' }}>
              {metrics.active}
            </span>
            <span className={styles.metricSubtext}>New, Contacted, & Quotes</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconActive}`}>
            <Icon.Clock size={20} />
          </div>
        </div>
      </div>

      {/* ── Controls & Filter Panel ── */}
      <div className={styles.controlsCard}>
        {/* Category Filter Tabs */}
        <div className={styles.tabsScroll}>
          <div className={styles.statusTabs}>
            {filterTabs.map((tab) => {
              const isActive = filterTab === tab.key;
              const hasAlert = tab.alert && tab.count > 0;
              return (
                <button
                  key={tab.key}
                  type="button"
                  className={`${styles.tabBtn} ${isActive ? styles.activeTab : ''}`}
                  onClick={() => setFilterTab(tab.key)}
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

        {/* Search Input & Channel Selector Row */}
        <div className={styles.searchRow}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>
              <Icon.Search size={15} />
            </span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search client name, phone number, vehicle..."
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
            <select
              className={styles.sourceSelect}
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            >
              <option value="ALL">All Acquisition Channels</option>
              <option value="public_web">Website Inquiries</option>
              <option value="CONTACT_FORM">Contact Form Submissions</option>
              <option value="WHATSAPP">WhatsApp Inquiries</option>
            </select>

            <span style={{ fontSize: '0.78125rem', color: '#64748B', whiteSpace: 'nowrap' }}>
              Showing <strong>{filteredLeads.length}</strong> of {leads.length}
            </span>
          </div>
        </div>
      </div>

      {/* ── Leads Table Card ── */}
      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Received</th>
                <th style={{ width: '220px' }}>Client Profile</th>
                <th style={{ width: '230px' }}>Vehicle & Treatment</th>
                <th style={{ width: '140px' }}>Pipeline Status</th>
                <th style={{ width: '150px' }}>Flags & Signals</th>
                <th style={{ width: '130px' }}>Channel</th>
                <th style={{ width: '160px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead, idx) => {
                const isLast = idx === filteredLeads.length - 1;
                const statusClass = `status${lead.status}`;

                return (
                  <tr key={lead.id} className={`${styles.tableRow} ${isLast ? styles.tableRowLast : ''}`}>
                    {/* 1. Date */}
                    <td className={styles.dateCell}>
                      <div className={styles.datePrimary}>
                        {new Date(lead.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                      <div className={styles.dateTime}>
                        {new Date(lead.createdAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>

                    {/* 2. Client Profile */}
                    <td className={styles.clientCell}>
                      <Link href={`/admin/leads/${lead.id}`} className={styles.clientWrapper}>
                        <div className={styles.clientAvatar}>
                          {getInitials(lead.customerName)}
                        </div>
                        <div className={styles.clientDetails}>
                          <span className={styles.clientName}>{lead.customerName}</span>
                          <span className={styles.clientPhone}>{lead.customerPhone}</span>
                        </div>
                      </Link>
                    </td>

                    {/* 3. Vehicle & Service */}
                    <td className={styles.vehicleCell}>
                      <div className={styles.vehicleDetails}>
                        <span className={styles.vehicleName}>
                          {lead.vehicleText ?? 'Vehicle Unspecified'}
                        </span>
                        <span className={styles.serviceInterestTag}>
                          {lead.serviceInterestName ?? 'General Inquiry'}
                        </span>
                      </div>
                    </td>

                    {/* 4. Pipeline Status */}
                    <td className={styles.statusCell}>
                      <span className={`${styles.statusPill} ${styles[statusClass] || styles.statusNEW}`}>
                        <span className={styles.statusDot} />
                        <span>{formatStatus(lead.status)}</span>
                      </span>
                    </td>

                    {/* 5. Flags & Signals */}
                    <td className={styles.flagsCell}>
                      <div className={styles.flagsGroup}>
                        {lead.isDuplicate && (
                          <span className={styles.flagDuplicate} title="Client submitted another inquiry within 24 hours">
                            <Icon.Repeat size={11} />
                            <span>Duplicate (24h)</span>
                          </span>
                        )}
                        {lead.needsFollowUp && (
                          <span className={styles.flagFollowup} title="Lead has been inactive for 3 or more days">
                            <Icon.AlertTriangle size={11} />
                            <span>Follow-up Due</span>
                          </span>
                        )}
                        {lead.photosCount > 0 && (
                          <span className={styles.flagPhotos} title={`${lead.photosCount} inspection photo(s) attached`}>
                            <Icon.Camera size={11} />
                            <span>{lead.photosCount} photo{lead.photosCount > 1 ? 's' : ''}</span>
                          </span>
                        )}
                        {!lead.needsFollowUp && !lead.isDuplicate && lead.photosCount === 0 && (
                          <span className={styles.emptyFlags}>—</span>
                        )}
                      </div>
                    </td>

                    {/* 6. Channel */}
                    <td className={styles.channelCell}>
                      <span className={styles.channelBadge}>
                        {formatSource(lead.source)}
                      </span>
                    </td>

                    {/* 7. Action Hub */}
                    <td className={styles.actionCell}>
                      <div className={styles.actionBtns}>
                        <WhatsAppCTA
                          phone={lead.customerPhone}
                          message={`Hi ${lead.customerName}, this is Smoke M Customs regarding your inquiry for ${lead.vehicleText || 'your vehicle'}.`}
                          iconOnly
                          size="sm"
                          variant="icon"
                          ariaLabel={`WhatsApp ${lead.customerName}`}
                          logCommunication={{
                            customerId: lead.customerId,
                            leadId: lead.id,
                            summary: `Outbound WhatsApp chat opened with ${lead.customerName}`,
                          }}
                        />

                        <a
                          href={`tel:${lead.customerPhone}`}
                          className={styles.callBtn}
                          title={`Call ${lead.customerName}`}
                        >
                          <Icon.Phone size={13} />
                        </a>

                        <Link
                          href={`/admin/leads/${lead.id}`}
                          className={styles.manageBtn}
                        >
                          <span>Manage</span>
                          <Icon.ArrowRight size={12} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className={styles.emptyCard}>
                      <div className={styles.emptyIconWrap}>
                        <Icon.Inbox size={24} />
                      </div>
                      <h4 className={styles.emptyTitle}>No matching inquiries found</h4>
                      <p className={styles.emptyDesc}>
                        Try adjusting your search query, clear filters, or select a different pipeline stage tab.
                      </p>
                      {(searchTerm || filterTab !== 'ALL' || sourceFilter !== 'ALL') && (
                        <button
                          type="button"
                          className={styles.emptyResetBtn}
                          onClick={() => {
                            setSearchTerm('');
                            setFilterTab('ALL');
                            setSourceFilter('ALL');
                          }}
                        >
                          Reset All Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Summary Footer */}
        {filteredLeads.length > 0 && (
          <div className={styles.tableFooter}>
            <span>
              Showing {filteredLeads.length} of {leads.length} total lead{leads.length !== 1 ? 's' : ''}
            </span>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
              Smoke M Customs • Executive CRM Engine
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
