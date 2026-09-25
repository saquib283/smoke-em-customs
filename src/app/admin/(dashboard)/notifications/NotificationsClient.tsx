'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/common/Icons';
import { useToast } from '@/components/ui';
import styles from './notifications.module.css';

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsClientProps {
  initialNotifications: NotificationItem[];
  initialUnreadCount: number;
}

type TabType = 'ALL' | 'UNREAD' | 'LEADS' | 'BOOKINGS' | 'QUOTES' | 'FOLLOW_UPS';

export function NotificationsClient({
  initialNotifications,
  initialUnreadCount,
}: NotificationsClientProps) {
  const { success, error: toastError } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState<number>(initialUnreadCount);
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/notifications');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        success('Notification feed synchronized with live events');
      } else {
        toastError(data.error || 'Failed to refresh notifications');
      }
    } catch {
      toastError('Error connecting to notification service');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MARK_READ', id }),
      });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount(data.unreadCount ?? Math.max(0, unreadCount - 1));
      }
    } catch {
      toastError('Failed to update notification state');
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MARK_ALL_READ' }),
      });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        success('All alerts marked as read');
      }
    } catch {
      toastError('Failed to mark all notifications as read');
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`/api/admin/notifications?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (data.unreadCount !== undefined) {
          setUnreadCount(data.unreadCount);
        }
        success('Notification dismissed');
      }
    } catch {
      toastError('Failed to dismiss notification');
    }
  };

  // KPI Metrics
  const metrics = useMemo(() => {
    const leadsCount = notifications.filter(
      (n) => n.type === 'NEW_LEAD' || n.entityType === 'lead'
    ).length;
    const bookingsCount = notifications.filter(
      (n) => n.type.includes('BOOKING') || n.entityType === 'booking'
    ).length;
    const quotesCount = notifications.filter(
      (n) => n.type.includes('QUOTE') || n.entityType === 'quote'
    ).length;
    const followupsCount = notifications.filter(
      (n) => n.type.includes('FOLLOWUP') || n.title.toLowerCase().includes('follow-up')
    ).length;

    return {
      unread: unreadCount,
      leads: leadsCount,
      bookings: bookingsCount,
      quotes: quotesCount,
      followups: followupsCount,
    };
  }, [notifications, unreadCount]);

  // Filter list by selected tab & search
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (activeTab === 'UNREAD' && item.isRead) return false;
      if (activeTab === 'LEADS' && !(item.type === 'NEW_LEAD' || item.entityType === 'lead')) return false;
      if (activeTab === 'BOOKINGS' && !(item.type.includes('BOOKING') || item.entityType === 'booking')) return false;
      if (activeTab === 'QUOTES' && !(item.type.includes('QUOTE') || item.entityType === 'quote')) return false;
      if (activeTab === 'FOLLOW_UPS' && !(item.type.includes('FOLLOWUP') || item.title.toLowerCase().includes('follow-up'))) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const inTitle = item.title.toLowerCase().includes(query);
        const inBody = item.body.toLowerCase().includes(query);
        const inType = item.type.toLowerCase().includes(query);
        const inEntity = item.entityId?.toLowerCase().includes(query);
        if (!inTitle && !inBody && !inType && !inEntity) return false;
      }

      return true;
    });
  }, [notifications, activeTab, searchTerm]);

  // Intelligent Deep Link Generator
  const getEntityLink = (notif: NotificationItem): { url: string; label: string } | null => {
    if (notif.entityType === 'lead' || notif.type.includes('LEAD')) {
      return {
        url: notif.entityId ? `/admin/leads/${notif.entityId}` : '/admin/leads',
        label: 'View Lead',
      };
    }
    if (notif.entityType === 'booking' || notif.type.includes('BOOKING')) {
      return {
        url: notif.entityId ? `/admin/bookings/${notif.entityId}` : '/admin/bookings',
        label: 'View Booking',
      };
    }
    if (notif.entityType === 'quote' || notif.type.includes('QUOTE')) {
      return {
        url: notif.entityId ? `/admin/quotes/${notif.entityId}` : '/admin/quotes',
        label: 'View Quote',
      };
    }
    if (notif.entityType === 'customer') {
      return {
        url: notif.entityId ? `/admin/customers/${notif.entityId}` : '/admin/customers',
        label: 'View Customer',
      };
    }
    return null;
  };

  const getIconData = (type: string) => {
    if (type.includes('BOOKING_CANCELLED')) {
      return {
        icon: <Icon.Cross size={18} />,
        wrapClass: styles.iconBookingCancelled,
        badgeClass: styles.typeBadgeLead,
      };
    }
    if (type.includes('BOOKING')) {
      return {
        icon: <Icon.Calendar size={18} />,
        wrapClass: styles.iconBooking,
        badgeClass: styles.typeBadgeBooking,
      };
    }
    if (type.includes('LEAD')) {
      return {
        icon: <Icon.Inbox size={18} />,
        wrapClass: styles.iconLead,
        badgeClass: styles.typeBadgeLead,
      };
    }
    if (type.includes('QUOTE')) {
      return {
        icon: <Icon.FileText size={18} />,
        wrapClass: styles.iconQuote,
        badgeClass: styles.typeBadgeQuote,
      };
    }
    if (type.includes('FOLLOWUP')) {
      return {
        icon: <Icon.Clock size={18} />,
        wrapClass: styles.iconFollowup,
        badgeClass: styles.typeBadgeFollowup,
      };
    }
    return {
      icon: <Icon.Bell size={18} />,
      wrapClass: styles.iconDefault,
      badgeClass: styles.typeBadge,
    };
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMin / 60);

      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const statusTabs = [
    { id: 'ALL' as const, label: 'All Alerts', count: notifications.length },
    { id: 'UNREAD' as const, label: 'Unread', count: unreadCount, alert: unreadCount > 0 },
    { id: 'LEADS' as const, label: 'Leads & Enquiries', count: metrics.leads },
    { id: 'BOOKINGS' as const, label: 'Bay Bookings', count: metrics.bookings },
    { id: 'QUOTES' as const, label: 'Quotes & Proposals', count: metrics.quotes },
    { id: 'FOLLOW_UPS' as const, label: 'Follow-ups', count: metrics.followups },
  ];

  return (
    <div className={styles.container}>
      {/* ── Page Header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>
            <span>STUDIO DISPATCH</span>
            <span className={styles.eyebrowDot} />
            <span>EVENT LOG & NOTIFICATIONS</span>
          </div>

          <div className={styles.titleRow}>
            <h1 className={styles.pageTitle}>Studio Notification Feed</h1>
            {unreadCount > 0 ? (
              <span className={styles.unreadPill}>
                <span className={styles.pulseDot} />
                {unreadCount} {unreadCount === 1 ? 'Action Required' : 'Actions Required'}
              </span>
            ) : (
              <span className={styles.allCaughtUpPill}>
                <Icon.Check size={12} />
                All Caught Up
              </span>
            )}
          </div>

          <p className={styles.pageSubtitle}>
            Real-time studio dispatch stream — live lead inquiries, bay reservations, quotation decisions, and automated follow-ups.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={fetchFeed}
            disabled={loading}
            id="btn-refresh-feed"
            title="Synchronize notification feed"
          >
            <span className={loading ? styles.rotating : ''}>
              <Icon.Refresh size={14} />
            </span>
            <span>{loading ? 'Refreshing...' : 'Refresh Feed'}</span>
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.btnPrimary}`}
              onClick={handleMarkAllRead}
              id="btn-mark-all-read"
            >
              <Icon.Check size={14} />
              <span>Mark all as read</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Executive KPI Metric Ribbon ── */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Unread Dispatches</span>
            <span className={styles.metricValue} style={{ color: unreadCount > 0 ? '#B45309' : '#0F172A' }}>
              {unreadCount}
            </span>
            <span className={styles.metricSubtext}>
              {unreadCount > 0 ? 'Requires studio triage' : 'Studio inbox clear'}
            </span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconAmber}`}>
            <Icon.Bell size={20} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Inbound Leads</span>
            <span className={styles.metricValue}>{metrics.leads}</span>
            <span className={styles.metricSubtext}>Fresh inquiries & requests</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconBlue}`}>
            <Icon.Inbox size={20} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Bay Reservations</span>
            <span className={styles.metricValue} style={{ color: '#16A34A' }}>
              {metrics.bookings}
            </span>
            <span className={styles.metricSubtext}>Slots booked & scheduled</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconGreen}`}>
            <Icon.Calendar size={20} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Formal Quotations</span>
            <span className={styles.metricValue} style={{ color: '#7E22CE' }}>
              {metrics.quotes}
            </span>
            <span className={styles.metricSubtext}>Drafts, sent & accepted deals</span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconPurple}`}>
            <Icon.FileText size={20} />
          </div>
        </div>
      </div>

      {/* ── Filter & Search Controls Panel ── */}
      <div className={styles.controlsCard}>
        <div className={styles.tabsScroll}>
          <div className={styles.statusTabs} role="tablist">
            {statusTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const hasAlert = tab.alert && tab.count > 0;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`${styles.tabBtn} ${isActive ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`${styles.tabBadge} ${
                      hasAlert && !isActive ? styles.tabBadgeAlert : ''
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
              placeholder="Search notifications by client, vehicle, bay, or event keywords..."
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
              Showing <strong>{filteredNotifications.length}</strong> of {notifications.length} alerts
            </span>
          </div>
        </div>
      </div>

      {/* ── Notification Feed Stream ── */}
      <div className={styles.feedList}>
        {filteredNotifications.length === 0 ? (
          <div className={styles.emptyCard}>
            <div className={styles.emptyIconWrap}>
              <Icon.Bell size={24} />
            </div>
            <h4 className={styles.emptyTitle}>
              {searchTerm ? 'No matching notifications found' : 'You are completely caught up'}
            </h4>
            <p className={styles.emptyDesc}>
              {searchTerm
                ? 'Try broadening your search term or selecting a different alert category tab.'
                : 'All detailing studio inquiries, bay bookings, quotation decisions, and follow-ups are up to date.'}
            </p>
            {searchTerm ? (
              <button
                type="button"
                className={styles.emptyResetBtn}
                onClick={() => {
                  setSearchTerm('');
                  setActiveTab('ALL');
                }}
              >
                Reset Search Filters
              </button>
            ) : (
              <button
                type="button"
                className={styles.emptyResetBtn}
                onClick={fetchFeed}
              >
                Refresh Stream
              </button>
            )}
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const entityData = getEntityLink(notif);
            const { icon, wrapClass, badgeClass } = getIconData(notif.type);

            return (
              <div
                key={notif.id}
                className={`${styles.feedItem} ${!notif.isRead ? styles.feedItemUnread : ''}`}
              >
                <div className={styles.feedItemMain}>
                  <div className={`${styles.feedIconWrap} ${wrapClass}`}>
                    {icon}
                  </div>

                  <div className={styles.feedContent}>
                    <div className={styles.feedMeta}>
                      <span className={`${styles.typeBadge} ${badgeClass}`}>
                        {notif.type.replace(/_/g, ' ')}
                      </span>
                      <span className={styles.metaDot}>•</span>
                      <span className={styles.timestamp}>
                        <Icon.Clock size={12} />
                        {formatTimestamp(notif.createdAt)}
                      </span>
                      {!notif.isRead && (
                        <span className={styles.newBadge}>NEW</span>
                      )}
                    </div>

                    <div className={styles.feedTitle}>{notif.title}</div>
                    <div className={styles.feedBody}>{notif.body}</div>
                  </div>
                </div>

                <div className={styles.feedActions}>
                  {entityData && (
                    <Link
                      href={entityData.url}
                      className={styles.btnNavigate}
                      onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                    >
                      <span>{entityData.label}</span>
                      <Icon.ArrowRight size={11} />
                    </Link>
                  )}

                  {!notif.isRead && (
                    <button
                      type="button"
                      className={`${styles.btnIconSmall} ${styles.btnIconCheck}`}
                      onClick={(e) => handleMarkRead(notif.id, e)}
                      title="Mark as read"
                      aria-label="Mark as read"
                    >
                      <Icon.Check size={14} />
                    </button>
                  )}

                  <button
                    type="button"
                    className={`${styles.btnIconSmall} ${styles.btnIconDelete}`}
                    onClick={(e) => handleDelete(notif.id, e)}
                    title="Dismiss alert"
                    aria-label="Dismiss alert"
                  >
                    <Icon.Cross size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
