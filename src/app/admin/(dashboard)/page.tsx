import type { Metadata } from 'next';
import Link from 'next/link';
import { crmService } from '@/modules/crm';
import { bookingService } from '@/modules/booking';
import { notificationsService } from '@/modules/notifications';
import styles from './dashboard.module.css';

export const metadata: Metadata = {
  title: 'Dashboard — Smoke M Customs Admin',
};

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [leads, bookings, customers, unreadCount] = await Promise.all([
    crmService.listLeads(),
    bookingService.listBookings(),
    crmService.listCustomers(),
    notificationsService.getUnreadCount(),
  ]);

  const newLeads = leads.filter((l) => l.status === 'NEW');
  const activeLeads = leads.filter((l) => !['COMPLETED', 'LOST'].includes(l.status));

  // Today's bookings
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysBookings = bookings.filter((b) => b.startAt.startsWith(todayStr));

  return (
    <div className={styles.dashboard}>
      {/* ── Top Header Bar ── */}
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Studio Control Console</h1>
          <p className={styles.subtitle}>Real-time bay capacity, client leads, and quotation pipeline.</p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/admin/leads" className="btn btn-secondary btn-sm">
            View All Leads ({leads.length})
          </Link>
          <Link href="/admin/quotes" className="btn btn-primary btn-sm">
            + New Quote
          </Link>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconBox}>📥</div>
          <div className={styles.kpiInfo}>
            <span className={`${styles.kpiValue} ${newLeads.length > 0 ? styles.kpiValueHighlight : ''}`}>
              {newLeads.length}
            </span>
            <span className={styles.kpiLabel}>New Leads Needing Action</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconBox}>📅</div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiValue}>{todaysBookings.length}</span>
            <span className={styles.kpiLabel}>Today&apos;s Bay Bookings</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconBox}>🔄</div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiValue}>{activeLeads.length}</span>
            <span className={styles.kpiLabel}>Active Pipeline Leads</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconBox}>👥</div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiValue}>{customers.length}</span>
            <span className={styles.kpiLabel}>Total Registered Clients</span>
          </div>
        </div>
      </div>

      {/* ── Two Column: Urgent Leads & Today's Bay Schedule ── */}
      <div className={styles.twoColumn}>
        {/* Leads Triage Queue */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>
              Enquiries Needing Attention
              {newLeads.length > 0 && <span className={styles.badgeAlert}>{newLeads.length} New</span>}
            </h2>
            <Link href="/admin/leads" className="btn btn-outline btn-sm">
              Full CRM Pipeline &rarr;
            </Link>
          </div>

          <div className={styles.leadsList}>
            {leads.slice(0, 5).map((lead) => {
              const cleanPhone = lead.customerPhone.replace(/\D/g, '');
              const waText = encodeURIComponent(
                `Hi ${lead.customerName}, this is Smoke M Customs regarding your detailing enquiry for your ${lead.vehicleText ?? 'car'}. When would be a convenient time to speak?`
              );

              return (
                <div key={lead.id} className={styles.leadRow}>
                  <div className={styles.leadMain}>
                    <span className={styles.leadName}>{lead.customerName}</span>
                    <span className={styles.leadCar}>
                      {lead.vehicleText ?? 'Vehicle unspecified'} &bull; {lead.serviceInterestName ?? 'General Detailing'}
                    </span>
                    <span className={styles.leadPhone}>{lead.customerPhone}</span>
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
                        💬 WhatsApp
                      </a>
                      <a
                        href={`tel:${lead.customerPhone}`}
                        className={styles.callIconBtn}
                        title="Call Customer"
                      >
                        📞 Call
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}

            {leads.length === 0 && (
              <p className={styles.emptyMsg}>No leads in pipeline yet.</p>
            )}
          </div>
        </div>

        {/* Today's Detailing Bay Schedule */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Today&apos;s Detailing Bay Schedule</h2>
            <Link href="/admin/calendar" className="btn btn-outline btn-sm">
              Bay Calendar &rarr;
            </Link>
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
                  <div key={b.id} className={styles.bookingRow}>
                    <div className={styles.bookingTime}>
                      <span className={styles.timeVal}>{startTime} – {endTime}</span>
                      <span className={styles.bayVal}>🏛️ {b.resourceName}</span>
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
                  </div>
                );
              })
            ) : (
              <div className={styles.emptyMsg}>
                No appointments scheduled for today yet. Bays are open for walk-ins or urgent bookings.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
