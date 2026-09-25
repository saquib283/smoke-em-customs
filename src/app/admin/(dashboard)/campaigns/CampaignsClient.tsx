'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useToast, ConfirmModal } from '@/components/ui';
import { Icon } from '@/components/common/Icons';
import type { EmailCampaignRecord } from '@/modules/campaigns/index.ts';
import styles from './campaigns.module.css';

interface CampaignsClientProps {
  initialCampaigns: EmailCampaignRecord[];
}

type TabType = 'ALL' | 'DRAFT' | 'COMPLETED' | 'SENDING';

export function CampaignsClient({ initialCampaigns }: CampaignsClientProps) {
  const [campaigns, setCampaigns] = useState<EmailCampaignRecord[]>(initialCampaigns);
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const [launchModalCampaign, setLaunchModalCampaign] = useState<EmailCampaignRecord | null>(null);
  const { success, error, info } = useToast();

  // ── Executive KPI Metrics ──
  const metrics = useMemo(() => {
    const total = campaigns.length;
    const totalDelivered = campaigns.reduce((acc, c) => acc + (c.sentCount || 0), 0);
    const totalDrafts = campaigns.filter((c) => c.status === 'DRAFT').length;
    const totalRecipients = campaigns.reduce((acc, c) => acc + (c.totalRecipients || 0), 0);
    return { total, totalDelivered, totalDrafts, totalRecipients };
  }, [campaigns]);

  // ── Segmented Filter Tabs ──
  const filterTabs = useMemo(
    () => [
      { id: 'ALL' as const, label: 'All Campaigns', count: campaigns.length },
      { id: 'DRAFT' as const, label: 'Drafts', count: campaigns.filter((c) => c.status === 'DRAFT').length },
      { id: 'COMPLETED' as const, label: 'Sent / Completed', count: campaigns.filter((c) => c.status === 'COMPLETED').length },
      { id: 'SENDING' as const, label: 'Broadcasting', count: campaigns.filter((c) => c.status === 'SENDING').length },
    ],
    [campaigns]
  );

  // ── Filtered Campaigns ──
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      if (activeTab === 'DRAFT' && c.status !== 'DRAFT') return false;
      if (activeTab === 'COMPLETED' && c.status !== 'COMPLETED') return false;
      if (activeTab === 'SENDING' && c.status !== 'SENDING') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = c.title.toLowerCase().includes(q);
        const matchSubject = c.subject.toLowerCase().includes(q);
        if (!matchTitle && !matchSubject) return false;
      }
      return true;
    });
  }, [campaigns, activeTab, searchQuery]);

  const handleLaunchCampaign = async () => {
    if (!launchModalCampaign) return;
    const id = launchModalCampaign.id;
    setLoadingId(id);
    setLaunchModalCampaign(null);

    try {
      const res = await fetch(`/api/admin/campaigns/${id}/send`, { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to broadcast campaign');
      }

      success(data.message || 'Campaign launched successfully!');

      // Update state
      setCampaigns((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...data.campaign } : c))
      );
    } catch (err: any) {
      error(err.message || 'Failed to broadcast campaign');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteCampaign = async () => {
    if (!deleteModalId) return;
    const id = deleteModalId;
    setDeleteModalId(null);

    try {
      const res = await fetch(`/api/admin/campaigns/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete campaign');
      }

      info('Campaign draft deleted.');
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      error(err.message || 'Error deleting campaign');
    }
  };

  const handleSendTest = async (campaign: EmailCampaignRecord) => {
    const testEmail = prompt('Enter recipient email address for test preview:');
    if (!testEmail || !testEmail.includes('@')) return;

    setLoadingId(campaign.id);
    try {
      const res = await fetch(`/api/admin/campaigns/${campaign.id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmail }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch test preview');
      }

      success(data.message || `Test preview sent to ${testEmail}`);
    } catch (err: any) {
      error(err.message || 'Error sending test email');
    } finally {
      setLoadingId(null);
    }
  };

  // ── Export CSV Handler ──
  const handleExportCSV = () => {
    const headers = [
      'Campaign Title',
      'Subject Line',
      'Status',
      'Target Audience',
      'Delivered Sent',
      'Failed',
      'Created Date',
    ];
    const rows = filteredCampaigns.map((c) => [
      `"${c.title.replace(/"/g, '""')}"`,
      `"${c.subject.replace(/"/g, '""')}"`,
      c.status,
      c.totalRecipients || 0,
      c.sentCount || 0,
      c.failedCount || 0,
      new Date(c.createdAt).toISOString().slice(0, 10),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `smokecustoms_campaigns_${new Date().toISOString().slice(0, 10)}.csv`
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
            <span>Email Campaigns & Broadcasts</span>
          </div>
          <h1 className={styles.pageTitle}>Email Campaigns</h1>
          <p className={styles.pageSubtitle}>
            Compose, segment, and broadcast marketing email privileges and seasonal announcements to your customer base.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button className={styles.exportBtn} onClick={handleExportCSV} title="Export campaigns to CSV">
            <Icon.FileText size={15} />
            <span>Export CSV</span>
          </button>
          <Link href="/admin/campaigns/new" className={styles.addBtn}>
            <Icon.Plus size={15} />
            <span>+ New Campaign</span>
          </Link>
        </div>
      </div>

      {/* ── Executive KPI Metric Cards ── */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Total Campaigns</span>
            <span className={styles.metricValue}>{metrics.total}</span>
            <span className={styles.metricSubtext}>Broadcast initiatives</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconGold}`}>
            <Icon.Mail size={22} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Emails Delivered</span>
            <span className={styles.metricValue}>{metrics.totalDelivered.toLocaleString('en-IN')}</span>
            <span className={styles.metricSubtext}>Verified inboxes reached</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconGreen}`}>
            <Icon.Send size={22} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Active Drafts</span>
            <span className={styles.metricValue}>{metrics.totalDrafts}</span>
            <span className={styles.metricSubtext}>In composition / review</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconAmber}`}>
            <Icon.Edit size={22} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Audience Reach</span>
            <span className={styles.metricValue}>{metrics.totalRecipients.toLocaleString('en-IN')}</span>
            <span className={styles.metricSubtext}>Eligible client base</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconPurple}`}>
            <Icon.Users size={22} />
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
              placeholder="Search campaigns by title, email subject..."
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
            Showing <strong>{filteredCampaigns.length}</strong> of {campaigns.length} campaigns
          </div>
        </div>
      </div>

      {/* ── Campaigns Grid / Empty State ── */}
      {filteredCampaigns.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIconWrap}>
            <Icon.Mail size={24} />
          </div>
          <h4 className={styles.emptyTitle}>No campaigns found</h4>
          <p className={styles.emptyDesc}>
            {searchQuery
              ? `No campaigns match "${searchQuery}". Try adjusting your search query or filters.`
              : activeTab === 'DRAFT'
              ? 'There are currently no active campaign drafts.'
              : 'Create your first marketing email campaign to re-engage past clients.'}
          </p>
          <Link href="/admin/campaigns/new" className={styles.emptyActionBtn}>
            <Icon.Plus size={14} />
            <span>+ Create Campaign</span>
          </Link>
        </div>
      ) : (
        <div className={styles.campaignsGrid}>
          {filteredCampaigns.map((camp) => {
            const isSending = camp.status === 'SENDING' || loadingId === camp.id;
            const isCompleted = camp.status === 'COMPLETED';

            return (
              <div key={camp.id} className={styles.campaignCard}>
                <div className={styles.cardTop}>
                  <div>
                    <h3 className={styles.campaignTitle}>{camp.title}</h3>
                    <p className={styles.campaignSubject}>&ldquo;{camp.subject}&rdquo;</p>
                  </div>
                  <span
                    className={`${styles.statusPill} ${
                      isCompleted
                        ? styles.statusCompleted
                        : isSending
                        ? styles.statusSending
                        : styles.statusDraft
                    }`}
                  >
                    {isSending ? 'SENDING...' : camp.status}
                  </span>
                </div>

                {/* Metrics Bar */}
                <div className={styles.cardMetrics}>
                  <div className={styles.metricItem}>
                    <span className={styles.metricNumber}>{camp.totalRecipients || 0}</span>
                    <span className={styles.metricLabelSmall}>Audience</span>
                  </div>
                  <div className={styles.metricItem}>
                    <span className={styles.metricNumber} style={{ color: '#16A34A' }}>
                      {camp.sentCount || 0}
                    </span>
                    <span className={styles.metricLabelSmall}>Delivered</span>
                  </div>
                  <div className={styles.metricItem}>
                    <span
                      className={styles.metricNumber}
                      style={{ color: (camp.failedCount || 0) > 0 ? '#DC2626' : '#94A3B8' }}
                    >
                      {camp.failedCount || 0}
                    </span>
                    <span className={styles.metricLabelSmall}>Failed</span>
                  </div>
                </div>

                {/* Actions */}
                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={styles.btnTest}
                    onClick={() => handleSendTest(camp)}
                    disabled={isSending}
                    title="Send a test preview to your personal inbox"
                  >
                    <Icon.Send size={12} />
                    <span>Test Send</span>
                  </button>

                  {!isCompleted && (
                    <button
                      type="button"
                      className={styles.btnBroadcast}
                      onClick={() => setLaunchModalCampaign(camp)}
                      disabled={isSending}
                      title="Broadcast to client audience"
                    >
                      <Icon.Zap size={12} />
                      <span>{isSending ? 'Broadcasting...' : 'Launch Broadcast →'}</span>
                    </button>
                  )}

                  {!isCompleted && (
                    <button
                      type="button"
                      className={styles.btnDelete}
                      onClick={() => setDeleteModalId(camp.id)}
                      title="Delete Campaign Draft"
                    >
                      <Icon.Trash size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmModal
        open={Boolean(launchModalCampaign)}
        title="Launch Email Broadcast?"
        description={`Are you sure you want to broadcast "${launchModalCampaign?.title}" to ${launchModalCampaign?.totalRecipients} customer recipient(s)? This action will dispatch emails immediately via the active provider.`}
        confirmLabel="Confirm & Broadcast Now"
        variant="default"
        onConfirm={handleLaunchCampaign}
        onCancel={() => setLaunchModalCampaign(null)}
      />

      <ConfirmModal
        open={Boolean(deleteModalId)}
        title="Delete Campaign Draft?"
        description="Are you sure you want to permanently delete this email campaign draft? This action cannot be undone."
        confirmLabel="Delete Draft"
        variant="danger"
        onConfirm={handleDeleteCampaign}
        onCancel={() => setDeleteModalId(null)}
      />
    </div>
  );
}
