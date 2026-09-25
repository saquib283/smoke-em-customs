import type { Metadata } from 'next';
import Link from 'next/link';
import { crmService } from '@/modules/crm';
import { bookingService } from '@/modules/booking';
import { notificationsService } from '@/modules/notifications';
import { quotingService } from '@/modules/quoting';
import { Icon } from '@/components/common/Icons';
import styles from './dashboard.module.css';

export const metadata: Metadata = {
  title: 'Dashboard — Smoke M Customs Admin',
};

export const dynamic = 'force-dynamic';

function getInitials(name: string): string {
  if (!name) return 'CL';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default async function AdminDashboardPage() {
  const [leads, bookings, customers, unreadCount, quotes, quoteStats, resources] = await Promise.all([
    crmService.listLeads(),
    bookingService.listBookings(),
    crmService.listCustomers(),
    notificationsService.getUnreadCount(),
    quotingService.listQuotes(),
    quotingService.getQuoteStats(),
    bookingService.listResources(),
  ]);

  const newLeads = leads.filter((l) => l.status === 'NEW');
  const activeLeads = leads.filter((l) => !['COMPLETED', 'LOST'].includes(l.status));

  // Today's date calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysBookings = bookings.filter((b) => b.startAt.startsWith(todayStr));
  const activeBays = resources.filter((r) => r.isActive);

  // Format currency
  const formatCurrency = (val: number) => {
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className={styles.dashboard}>
      {/* ── Top Header Bar ── */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>
            <span>Studio Control</span>
            <span className={styles.eyebrowDot} />
            <span>Executive Overview</span>
            <span className={styles.eyebrowDot} />
            <span>Operations Dispatch</span>
          </div>
          <h1 className={styles.title}>Studio Control Console</h1>
          <p className={styles.subtitle}>
            Real-time bay capacity, client inquiry pipeline, and operational detailing workflows.
          </p>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.statusBeacon}>
            <span className={styles.pulseDot} />
            <span>Studio Active • {activeBays.length} Bays Online</span>
          </div>
          <Link href="/admin/leads" className={styles.headerBtnSecondary}>
            <Icon.Users size={15} />
            <span>View All Leads ({leads.length})</span>
          </Link>
          <Link href="/admin/quotes/new" className={styles.headerBtnPrimary}>
            <Icon.Plus size={15} />
            <span>+ New Quote</span>
          </Link>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className={styles.kpiGrid}>
        <Link href="/admin/leads" className={styles.kpiCard}>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>New Leads Needing Action</span>
            <span className={`${styles.kpiValue} ${newLeads.length > 0 ? styles.kpiValueHighlight : ''}`}>
              {newLeads.length}
            </span>
            <span className={styles.kpiSubtext}>
              <span style={{ color: newLeads.length > 0 ? '#B45309' : '#16A34A', fontWeight: 700 }}>●</span>
              {activeLeads.length} active leads in pipeline
            </span>
          </div>
          <div className={`${styles.kpiIconBox} ${styles.kpiIconGold}`}>
            <Icon.Inbox size={22} />
          </div>
        </Link>

        <Link href="/admin/calendar" className={styles.kpiCard}>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Today&apos;s Bay Bookings</span>
            <span className={styles.kpiValue}>{todaysBookings.length}</span>
            <span className={styles.kpiSubtext}>
              <span style={{ color: '#16A34A', fontWeight: 700 }}>●</span>
              {activeBays.length} detailing bays prepped
            </span>
          </div>
          <div className={`${styles.kpiIconBox} ${styles.kpiIconGreen}`}>
            <Icon.Calendar size={22} />
          </div>
        </Link>

        <Link href="/admin/quotes" className={styles.kpiCard}>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Quotation Pipeline</span>
            <span className={styles.kpiValue}>
              {quoteStats.draftCount + quoteStats.sentCount}
            </span>
            <span className={styles.kpiSubtext}>
              {formatCurrency(quoteStats.totalQuotedValue)} pipeline value
            </span>
          </div>
          <div className={`${styles.kpiIconBox} ${styles.kpiIconAmber}`}>
            <Icon.FileText size={22} />
          </div>
        </Link>

        <Link href="/admin/customers" className={styles.kpiCard}>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Total Registered Clients</span>
            <span className={styles.kpiValue}>{customers.length}</span>
            <span className={styles.kpiSubtext}>
              Verified client garage records
            </span>
          </div>
          <div className={`${styles.kpiIconBox} ${styles.kpiIconPurple}`}>
            <Icon.Users size={22} />
          </div>
        </Link>
      </div>

      {/* ── Quick Operational Shortcuts Bar ── */}
      <div className={styles.quickActionBar}>
        <Link href="/admin/leads" className={styles.shortcutBtn}>
          <Icon.Inbox size={15} />
          <span>Leads Pipeline</span>
          {newLeads.length > 0 && (
            <span className={styles.shortcutBadge}>{newLeads.length} New</span>
          )}
        </Link>
        <Link href="/admin/bookings" className={styles.shortcutBtn}>
          <Icon.Bay size={15} />
          <span>Bay Bookings</span>
        </Link>
        <Link href="/admin/calendar" className={styles.shortcutBtn}>
          <Icon.Calendar size={15} />
          <span>Bay Calendar</span>
        </Link>
        <Link href="/admin/quotes" className={styles.shortcutBtn}>
          <Icon.FileText size={15} />
          <span>Formal Quotes</span>
        </Link>
        <Link href="/admin/customers" className={styles.shortcutBtn}>
          <Icon.Users size={15} />
          <span>Client Garage</span>
        </Link>
        <Link href="/admin/campaigns" className={styles.shortcutBtn}>
          <Icon.Mail size={15} />
          <span>Campaign Broadcasts</span>
        </Link>
        <Link href="/admin/settings" className={styles.shortcutBtn}>
          <Icon.Settings size={15} />
          <span>Studio Settings</span>
        </Link>
      </div>

      {/* ── Two Column: Urgent Leads & Today's Bay Schedule ── */}
      <div className={styles.twoColumn}>
        {/* Leads Triage Queue */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>
              <Icon.Inbox size={18} color="#B45309" />
              <span>Enquiries Needing Attention</span>
              {newLeads.length > 0 && (
                <span className={styles.badgeAlert}>{newLeads.length} New</span>
              )}
            </h2>
            <Link href="/admin/leads" className={styles.panelLink}>
              <span>Full CRM Pipeline ({leads.length})</span>
              <Icon.ArrowRight size={14} />
            </Link>
          </div>

          <div className={styles.leadsList}>
            {leads.slice(0, 5).map((lead) => {
              const cleanPhone = lead.customerPhone.replace(/\D/g, '');
              const waText = encodeURIComponent(
                `Hi ${lead.customerName}, this is Smoke M Customs regarding your detailing enquiry for your ${lead.vehicleText ?? 'car'}. When would be a convenient time to speak?`
              );
              const initials = getInitials(lead.customerName);

              return (
                <div key={lead.id} className={styles.leadRow}>
                  <div className={styles.leadLeft}>
                    <div className={styles.leadAvatar}>{initials}</div>
                    <div className={styles.leadMain}>
                      <span className={styles.leadName}>{lead.customerName}</span>
                      <span className={styles.leadCar}>
                        <Icon.Car size={13} />
                        {lead.vehicleText ?? 'Vehicle unspecified'} &bull; {lead.serviceInterestName ?? 'General Detailing'}
                      </span>
                      <span className={styles.leadPhone}>
                        <Icon.Phone size={12} />
                        {lead.customerPhone}
                      </span>
                    </div>
                  </div>

                  <div className={styles.leadMeta}>
                    <span className={`${styles.statusPill} ${styles[`status${lead.status}`] || ''}`}>
                      {lead.status.replace(/_/g, ' ')}
                    </span>
                    <div className={styles.leadActions}>
                      <a
                        href={`https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`}?text=${waText}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.waIconBtn}
                        title="Chat on WhatsApp"
                      >
                        <Icon.WhatsApp size={14} /> WhatsApp
                      </a>
                      <a
                        href={`tel:${lead.customerPhone}`}
                        className={styles.callIconBtn}
                        title="Call Customer"
                      >
                        <Icon.Phone size={14} /> Call
                      </a>
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className={styles.viewLeadBtn}
                        title="View Full Lead Profile"
                      >
                        <Icon.Eye size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}

            {leads.length === 0 && (
              <p className={styles.emptyMsg}>No inquiries currently in pipeline.</p>
            )}
          </div>
        </div>

        {/* Today's Detailing Bay Schedule */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>
                <Icon.Calendar size={18} color="#B45309" />
                <span>Today&apos;s Detailing Bay Schedule</span>
              </h2>
            </div>
            <Link href="/admin/calendar" className={styles.panelLink}>
              <span>Bay Calendar</span>
              <Icon.ArrowRight size={14} />
            </Link>
          </div>

          {/* Bay Capacity Status Strip */}
          <div className={styles.baysStatusStrip}>
            {resources.map((bay) => {
              const hasBookingToday = todaysBookings.some((b) => b.resourceName === bay.name);
              return (
                <div key={bay.id} className={styles.bayStatusItem}>
                  <span className={styles.bayNameBadge}>
                    <Icon.Bay size={14} color="#B45309" />
                    {bay.name}
                  </span>
                  <span className={hasBookingToday ? styles.bayOccupiedPill : styles.bayReadyPill}>
                    <span className={styles.pulseDot} style={{ width: 5, height: 5 }} />
                    {hasBookingToday ? 'Occupied' : 'Ready / Open'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className={styles.scheduleList}>
            {todaysBookings.length > 0 ? (
              todaysBookings.map((b) => {
                const startTime = new Date(b.startAt).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                });
                const endTime = new Date(b.endAt).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                });

                return (
                  <Link key={b.id} href={`/admin/bookings/${b.id}`} className={styles.bookingRow} style={{ textDecoration: 'none' }}>
                    <div className={styles.bookingTime}>
                      <span className={styles.timeVal}>{startTime} – {endTime}</span>
                      <span className={styles.bayVal}>
                        <Icon.Bay size={13} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} />
                        {b.resourceName}
                      </span>
                    </div>
                    <div className={styles.bookingDetail}>
                      <span className={styles.clientName}>{b.customerName}</span>
                      <span className={styles.serviceText}>
                        {b.vehicleText ?? 'Car'} &bull; {b.serviceName ?? b.packageName ?? 'Service'}
                      </span>
                    </div>
                    <span className={`${styles.statusPill} ${styles[`status${b.status}`] || ''}`}>
                      {b.status}
                    </span>
                  </Link>
                );
              })
            ) : (
              <div className={styles.emptyScheduleBox}>
                <div className={styles.emptyScheduleIcon}>
                  <Icon.Calendar size={22} />
                </div>
                <h3 className={styles.emptyScheduleTitle}>All Detailing Bays Available Today</h3>
                <p className={styles.emptyScheduleText}>
                  No appointments booked for today yet. Workstations are fully prepped and open for walk-ins or scheduled intake.
                </p>
                <div className={styles.emptyScheduleActions}>
                  <Link href="/admin/bookings" className={styles.headerBtnPrimary} style={{ padding: '0.4rem 0.875rem' }}>
                    <Icon.Plus size={14} /> Book Appointment
                  </Link>
                  <Link href="/admin/calendar" className={styles.headerBtnSecondary} style={{ padding: '0.4rem 0.875rem' }}>
                    View 7-Day Schedule
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Section: Recent Quotations & Commercial Pipeline ── */}
      <div className={styles.recentQuotesPanel}>
        <div className={styles.panelHeader}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <h2 className={styles.panelTitle}>
              <Icon.FileText size={18} color="#B45309" />
              <span>Recent Quotations &amp; Proposals</span>
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
              {quoteStats.acceptedCount} accepted proposals &bull; {formatCurrency(quoteStats.acceptedRevenue)} verified revenue
            </span>
          </div>
          <Link href="/admin/quotes" className={styles.panelLink}>
            <span>View All Quotes ({quotes.length})</span>
            <Icon.ArrowRight size={14} />
          </Link>
        </div>

        <div className={styles.quotesTableList}>
          {quotes.slice(0, 4).map((q) => (
            <Link key={q.id} href="/admin/quotes" className={styles.quoteRowItem}>
              <div className={styles.quoteMetaCol}>
                <span className={styles.quoteIdBadge}>
                  #{q.id.slice(-6).toUpperCase()}
                </span>
                <div className={styles.quoteClientInfo}>
                  <span className={styles.quoteClientName}>{q.customerName}</span>
                  <span className={styles.quoteVehicleText}>
                    {q.vehicleText || 'Luxury Vehicle'} &bull; {q.itemCount} line {q.itemCount === 1 ? 'item' : 'items'}
                  </span>
                </div>
              </div>

              <div className={styles.quoteFinancialCol}>
                <span className={styles.quoteTotalVal}>
                  {formatCurrency(parseFloat(q.total) || 0)}
                </span>
                <span className={`${styles.statusPill} ${styles[`status${q.status}`] || ''}`}>
                  {q.status}
                </span>
                <Icon.ArrowRight size={14} color="#94A3B8" />
              </div>
            </Link>
          ))}

          {quotes.length === 0 && (
            <p className={styles.emptyMsg}>No quotations generated yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
