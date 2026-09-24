'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import styles from './AdminShell.module.css';

interface AdminShellProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
  children: React.ReactNode;
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
}

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: '📊', section: 'Overview' },
  { href: '/admin/leads', label: 'Leads', icon: '📥', section: 'CRM' },
  { href: '/admin/customers', label: 'Customers', icon: '👥', section: 'CRM' },
  { href: '/admin/vehicles', label: 'Vehicles', icon: '🚗', section: 'CRM' },
  { href: '/admin/bookings', label: 'Bookings', icon: '📅', section: 'Operations' },
  { href: '/admin/calendar', label: 'Calendar', icon: '🗓️', section: 'Operations' },
  { href: '/admin/quotes', label: 'Quotes', icon: '📋', section: 'Operations' },
  { href: '/admin/services', label: 'Services', icon: '🔧', section: 'Catalogue' },
  { href: '/admin/packages', label: 'Packages', icon: '📦', section: 'Catalogue' },
  { href: '/admin/gallery', label: 'Gallery', icon: '🖼️', section: 'Marketing' },
  { href: '/admin/reviews', label: 'Reviews', icon: '⭐', section: 'Marketing' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️', section: 'Studio Control' },
];

function getBreadcrumbs(pathname: string) {
  if (pathname === '/admin') {
    return [
      { label: 'Studio Control', href: '/admin' },
      { label: 'Overview Dashboard' },
    ];
  }

  const match = NAV_ITEMS.find((item) => item.href !== '/admin' && pathname.startsWith(item.href));
  if (match) {
    return [
      { label: 'Studio Control', href: '/admin' },
      { label: match.section },
      { label: match.label, href: match.href },
    ];
  }

  // Fallback for custom or nested routes
  const segments = pathname.replace(/^\/admin\/?/, '').split('/').filter(Boolean);
  const crumbs = [{ label: 'Studio Control', href: '/admin' }];
  let curr = '/admin';
  for (const seg of segments) {
    curr += `/${seg}`;
    crumbs.push({
      label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
      href: curr,
    });
  }
  return crumbs;
}

export function AdminShell({ user, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const breadcrumbs = getBreadcrumbs(pathname);

  // Notification Feed State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/admin/notifications');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // Ignore background fetch failure
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotifDropdownOpen(false);
      }
    }
    if (notifDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notifDropdownOpen]);

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      try {
        await fetch('/api/admin/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'MARK_READ', id: notif.id }),
        });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Continue
      }
    }

    setNotifDropdownOpen(false);
    if (notif.entityType === 'lead') {
      router.push('/admin/leads');
    } else if (notif.entityType === 'booking') {
      router.push('/admin/bookings');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MARK_ALL_READ' }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Continue
    }
  };

  return (
    <div className={styles.shell}>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <Link href="/admin" className={styles.logo} onClick={() => setMobileOpen(false)}>
            <span className="gradient-text">SMOKE M</span>
            <span className={styles.studioBadge}>ADMIN</span>
          </Link>
          <button
            type="button"
            className={styles.closeDrawerBtn}
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
          >
            ✕
          </button>
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`${styles.navItem} ${isActive(item.href) ? styles.navItemActive : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {user.name?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{user.name ?? 'Admin'}</span>
              <span className={styles.userRole}>{user.role ?? 'ADMIN'}</span>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className={styles.signOutBtn}
            title="Sign out"
          >
            ↪
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={styles.main}>
        {/* Topbar Header with Breadcrumbs & Notification Bell */}
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button
              type="button"
              className={styles.hamburgerBtn}
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
            >
              ☰
            </button>

            {/* Breadcrumbs */}
            <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
              <ol className={styles.breadcrumbList}>
                {breadcrumbs.map((crumb, idx) => {
                  const isLast = idx === breadcrumbs.length - 1;
                  return (
                    <li key={idx} className={styles.breadcrumbItem}>
                      {idx > 0 && <span className={styles.breadcrumbSeparator}>/</span>}
                      {isLast || !crumb.href ? (
                        <span className={styles.breadcrumbCurrent}>{crumb.label}</span>
                      ) : (
                        <Link href={crumb.href} className={styles.breadcrumbLink}>
                          {crumb.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>
          </div>

          <div className={styles.topbarRight}>
            <div className={styles.studioStatus}>
              <span className={styles.statusPulse} />
              <span className={styles.statusLabel}>Studio Active</span>
            </div>

            {/* Notification Bell Feed */}
            <div className={styles.notificationWrapper} ref={dropdownRef}>
              <button
                type="button"
                className={styles.notificationBellBtn}
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                title="Notifications Feed"
                aria-label="Toggle notifications"
              >
                🔔
                {unreadCount > 0 && (
                  <span className={styles.notificationBadge}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifDropdownOpen && (
                <div className={styles.notificationDropdown}>
                  <div className={styles.notificationHeader}>
                    <span className={styles.notificationTitle}>Inbound Feed</span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        className={styles.markAllBtn}
                        onClick={handleMarkAllRead}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className={styles.notificationList}>
                    {notifications.length === 0 ? (
                      <div className={styles.notificationEmpty}>
                        No activity notifications recorded.
                      </div>
                    ) : (
                      notifications.map((n) => {
                        let icon = '🔔';
                        if (n.type === 'NEW_LEAD') icon = '📥';
                        if (n.type === 'NEW_BOOKING_PENDING') icon = '📅';
                        if (n.type === 'LEAD_NEEDS_FOLLOWUP') icon = '⚠️';

                        return (
                          <div
                            key={n.id}
                            className={`${styles.notificationItem} ${!n.isRead ? styles.notificationItemUnread : ''}`}
                            onClick={() => handleNotificationClick(n)}
                            style={{ cursor: 'pointer' }}
                          >
                            <span className={styles.notificationIcon}>{icon}</span>
                            <div className={styles.notificationContent}>
                              <span className={styles.notificationItemTitle}>{n.title}</span>
                              <span className={styles.notificationItemBody}>{n.body}</span>
                              <span className={styles.notificationTime}>
                                {new Date(n.createdAt).toLocaleTimeString('en-IN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            {!n.isRead && (
                              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--color-accent-primary)', alignSelf: 'center' }} />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.siteLink}
              title="Open public website in new tab"
            >
              <span>View Site</span>
              <span className={styles.siteLinkIcon}>↗</span>
            </Link>

            <div className={styles.topbarUser}>
              <div className={styles.topbarAvatar}>
                {user.name?.[0]?.toUpperCase() ?? 'A'}
              </div>
              <span className={styles.topbarName}>{user.name ?? 'Admin'}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
