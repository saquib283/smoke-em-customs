'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { WhatsAppCTA } from '@/components/common/WhatsAppCTA';
import { Icon } from '@/components/common/Icons';
import type { LeadDetail } from '@/modules/crm';
import type { CommunicationEntry } from '@/modules/notifications';
import styles from './detail.module.css';

interface LeadDetailProps {
  initialLead: LeadDetail | any;
  initialCommunications: CommunicationEntry[] | any[];
}

export function LeadDetailClient({ initialLead, initialCommunications }: LeadDetailProps) {
  const [lead, setLead] = useState<any>(initialLead);
  const [communications, setCommunications] = useState<any[]>(initialCommunications);
  const [newNote, setNewNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);

  // Communications log state
  const [commChannel, setCommChannel] = useState<'WHATSAPP' | 'CALL' | 'EMAIL' | 'SMS'>('WHATSAPP');
  const [commDirection, setCommDirection] = useState<'OUTBOUND' | 'INBOUND'>('OUTBOUND');
  const [commSummary, setCommSummary] = useState('');
  const [commLoading, setCommLoading] = useState(false);

  // Direct WhatsApp Cloud API chat state
  const [directWaText, setDirectWaText] = useState('');
  const [directWaSending, setDirectWaSending] = useState(false);

  const pipelineStatuses = [
    'NEW',
    'CONTACTED',
    'QUOTE_SENT',
    'FOLLOW_UP',
    'BOOKED',
    'COMPLETED',
    'LOST',
  ];

  const handleStatusChange = async (newStatus: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_STATUS',
          leadId: lead.id,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLead((prev: any) => ({
          ...prev,
          status: newStatus,
          statusHistory: data.lead?.statusHistory || [
            { id: Date.now().toString(), fromStatus: prev.status, toStatus: newStatus, changedAt: new Date().toISOString() },
            ...(prev.statusHistory || []),
          ],
        }));
      } else {
        alert(data.error || 'Failed to update status');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_NOTE',
          leadId: lead.id,
          body: newNote.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.lead) {
        setLead(data.lead);
        setNewNote('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogCommunication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commSummary.trim()) return;
    setCommLoading(true);
    try {
      const res = await fetch('/api/admin/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: lead.customerId,
          leadId: lead.id,
          channel: commChannel,
          direction: commDirection,
          summary: commSummary.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.communication) {
        setCommunications((prev) => [data.communication, ...prev]);
        setCommSummary('');
      }
    } catch (err) {
      console.error('Failed to log communication:', err);
    } finally {
      setCommLoading(false);
    }
  };

  const handleSendDirectWhatsApp = async (textToSend?: string) => {
    const text = (textToSend || directWaText).trim();
    if (!text) return;
    setDirectWaSending(true);
    try {
      const res = await fetch('/api/admin/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: lead.customerId,
          leadId: lead.id,
          phone: lead.customerPhone,
          text,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDirectWaText('');
        fetch(`/api/admin/communications?leadId=${lead.id}`)
          .then((r) => r.json())
          .then((d) => d.success && setCommunications(d.communications || []))
          .catch(() => {});
      } else {
        alert(data.error || 'Failed to dispatch WhatsApp message.');
      }
    } catch (err: any) {
      alert(err.message || 'Error sending WhatsApp message.');
    } finally {
      setDirectWaSending(false);
    }
  };

  const statusColorClass = `status${lead.status}`;

  return (
    <div className={styles.container}>
      {/* ── Top Bar ── */}
      <div className={styles.topBar}>
        <Link href="/admin/leads" className={styles.backBtn}>
          <Icon.ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} />
          <span>Back to All Leads</span>
        </Link>
        <div className={styles.topActions}>
          <Link
            href={`/admin/quotes/new?leadId=${lead.id}&customerId=${lead.customerId}`}
            className="btn btn-primary btn-sm"
          >
            + Generate Formal Quote
          </Link>
          <Link
            href={`/admin/bookings?customerId=${lead.customerId}&leadId=${lead.id}`}
            className="btn btn-secondary btn-sm"
          >
            + Book Bay Slot
          </Link>
          <WhatsAppCTA
            phone={lead.customerPhone}
            message={`Hi ${lead.customerName}, Smoke M Customs following up on quote request for your ${lead.vehicleText || 'vehicle'}.`}
            label="WhatsApp Client"
            variant="outline"
            size="sm"
            logCommunication={{
              customerId: lead.customerId,
              leadId: lead.id,
              summary: `Outbound WhatsApp follow-up regarding ${lead.vehicleText || 'inquiry'}`,
            }}
          />
        </div>
      </div>

      {/* ── Main Lead Banner ── */}
      <div className={styles.headerCard}>
        <div className={styles.headerLeft}>
          <div className={styles.customerAvatar}>
            {lead.customerName?.charAt(0)?.toUpperCase() ?? 'L'}
          </div>
          <div>
            <span className={styles.leadTag}>LEAD PROFILE & PIPELINE</span>
            <h1 className={styles.leadTitle}>{lead.customerName}</h1>
            <div className={styles.leadMeta}>
              <span>Phone: <strong>{lead.customerPhone}</strong></span>
              <span>•</span>
              <span>Created {new Date(lead.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              {lead.source && (
                <>
                  <span>•</span>
                  <span>Source: {lead.source}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className={`${styles.leadStatusBadge} ${styles[statusColorClass] || ''}`} style={{ backgroundColor: '#F1F5F9', color: '#0F172A', border: '1px solid #CBD5E1' }}>
            {lead.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* Duplicate Lead Warning */}
      {lead.isDuplicate && (
        <div className={`${styles.alertBox} ${styles.alertDuplicate}`}>
          <Icon.Repeat size={18} />
          <div>
            <strong>24-Hour Duplicate Detected:</strong> Customer submitted another inquiry for this vehicle within 24 hours. Check previous notes and interactions below.
          </div>
        </div>
      )}

      {/* Follow-up Overdue Warning */}
      {lead.needsFollowUp && (
        <div className={`${styles.alertBox} ${styles.alertFollowup}`}>
          <Icon.AlertTriangle size={18} />
          <div>
            <strong>Follow-up Overdue:</strong> Lead has been inactive for 3 or more days without conversion or close.
          </div>
        </div>
      )}

      {/* ── Two Column Content Grid ── */}
      <div className={styles.contentGrid}>
        {/* Left Column: Pipeline, Info, Direct WhatsApp & Communications */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Status Progression */}
          <div className={styles.sectionCard}>
            <h2 className={styles.cardTitle}>
              <Icon.Tag size={18} />
              <span>Pipeline Stage Progression</span>
            </h2>
            <div className={styles.statusButtons}>
              {pipelineStatuses.map((st) => (
                <button
                  key={st}
                  type="button"
                  disabled={actionLoading}
                  className={`${styles.statusOptionBtn} ${lead.status === st ? styles.activeStatusOption : ''}`}
                  onClick={() => handleStatusChange(st)}
                >
                  {st.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Client & Vehicle Parameters */}
          <div className={styles.sectionCard}>
            <h2 className={styles.cardTitle}>
              <Icon.Car size={18} />
              <span>Client & Vehicle Parameters</span>
            </h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Mobile Number</span>
                <span className={styles.infoVal}>{lead.customerPhone}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Email</span>
                <span className={styles.infoVal}>{lead.customer?.email ?? 'Not provided'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Vehicle</span>
                <span className={styles.infoVal}>{lead.vehicleText ?? 'Not specified'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Primary Treatment</span>
                <span className={styles.infoVal}>{lead.serviceInterestName ?? 'General Inquiry'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Paint Condition</span>
                <span className={styles.infoVal}>{lead.vehicleCondition ?? 'Unspecified'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Desired Outcome</span>
                <span className={styles.infoVal}>{lead.desiredResult ?? 'Unspecified'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Estimated Band</span>
                <span className={styles.infoVal}>
                  {lead.budgetRangeMin && lead.budgetRangeMax
                    ? `₹${Number(lead.budgetRangeMin).toLocaleString('en-IN')} – ₹${Number(lead.budgetRangeMax).toLocaleString('en-IN')}`
                    : 'Standard Evaluation'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Preferred Contact</span>
                <span className={styles.infoVal}>{lead.customer?.preferredContactMethod ?? 'WHATSAPP'}</span>
              </div>
            </div>

            {lead.additionalNotes && (
              <div className={styles.notesBox} style={{ marginTop: 'var(--space-2)' }}>
                <span className={styles.infoLabel}>Client Requirements / Notes:</span>
                <p>{lead.additionalNotes}</p>
              </div>
            )}
          </div>

          {/* Attached Vehicle Photos */}
          {lead.photos && lead.photos.length > 0 && (
            <div className={styles.sectionCard}>
              <h2 className={styles.cardTitle}>
                <Icon.Image size={18} />
                <span>Client Attached Photos ({lead.photos.length})</span>
              </h2>
              <div className={styles.photosGrid}>
                {lead.photos.map((p: any) => (
                  <div
                    key={p.id}
                    className={styles.photoThumbnail}
                    onClick={() => setActivePhotoUrl(p.url)}
                    title="Click to view full photo"
                  >
                    <img src={p.url} alt={p.altText || 'Vehicle photo'} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Direct WhatsApp Two-Way Cloud API Chat */}
          <div className={styles.waCard}>
            <div className={styles.waHeader}>
              <span className={styles.waTitle}>
                <Icon.WhatsApp size={18} /> Direct WhatsApp Cloud Chat
              </span>
              <span style={{ fontSize: '11px', color: '#15803D', fontWeight: 600 }}>
                Meta Cloud API Active
              </span>
            </div>

            <div className={styles.waShortcuts}>
              <button
                type="button"
                className={styles.shortcutBtn}
                onClick={() =>
                  handleSendDirectWhatsApp(
                    `Hi ${lead.customerName}, could you please share a few clear photos of your ${
                      lead.vehicleText || 'vehicle'
                    } so our master detailers can inspect the clear coat condition?`
                  )
                }
                disabled={directWaSending}
              >
                Request Vehicle Photos
              </button>
              <button
                type="button"
                className={styles.shortcutBtn}
                onClick={() =>
                  handleSendDirectWhatsApp(
                    `Hi ${lead.customerName}, we have inspection slots open tomorrow at our climate-controlled bay. Would 11:00 AM or 3:00 PM suit you?`
                  )
                }
                disabled={directWaSending}
              >
                Suggest Bay Slot
              </button>
              <button
                type="button"
                className={styles.shortcutBtn}
                onClick={() =>
                  handleSendDirectWhatsApp(
                    `Hi ${lead.customerName}, following up on your inquiry. Let us know if you have any questions regarding our 9H ceramic warranty or self-healing PPF coverage!`
                  )
                }
                disabled={directWaSending}
              >
                Follow-up Query
              </button>
            </div>

            <div className={styles.waInputRow}>
              <textarea
                rows={2}
                className={styles.waTextarea}
                placeholder={`Type direct WhatsApp message to ${lead.customerName}...`}
                value={directWaText}
                onChange={(e) => setDirectWaText(e.target.value)}
              />
              <button
                type="button"
                disabled={directWaSending || !directWaText.trim()}
                onClick={() => handleSendDirectWhatsApp()}
                className={styles.waSendBtn}
              >
                {directWaSending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Status History, Internal Notes & Communication Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Status History Timeline */}
          {lead.statusHistory && lead.statusHistory.length > 0 && (
            <div className={styles.sectionCard}>
              <h2 className={styles.cardTitle}>
                <Icon.Clock size={18} />
                <span>Pipeline Status History</span>
              </h2>
              <div className={styles.timeline}>
                {lead.statusHistory.map((h: any) => (
                  <div key={h.id} className={styles.timelineItem}>
                    <span className={styles.timelineTransition}>
                      {h.fromStatus ? `${h.fromStatus} → ` : 'Created as '}
                      <strong>{h.toStatus}</strong>
                    </span>
                    <span className={styles.timelineDate}>
                      {new Date(h.changedAt).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Internal Notes */}
          <div className={styles.sectionCard}>
            <h2 className={styles.cardTitle}>
              <Icon.FileText size={18} />
              <span>Internal Staff Notes</span>
            </h2>
            <form onSubmit={handleAddNote} className={styles.noteForm}>
              <input
                type="text"
                className={styles.noteInput}
                placeholder="Add inspection note or estimate log..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
              <button
                type="submit"
                disabled={actionLoading || !newNote.trim()}
                className="btn btn-secondary btn-sm"
              >
                Post Note
              </button>
            </form>

            <div className={styles.notesList}>
              {lead.notes?.map((n: any) => (
                <div key={n.id} className={styles.noteItem}>
                  <div className={styles.noteHead}>
                    <span className={styles.noteAuthor}>{n.authorName}</span>
                    <span className={styles.noteDate}>
                      {new Date(n.createdAt).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className={styles.noteBody}>{n.body}</p>
                </div>
              ))}
              {(!lead.notes || lead.notes.length === 0) && (
                <p style={{ color: '#94A3B8', fontSize: '12px' }}>No internal notes recorded yet.</p>
              )}
            </div>
          </div>

          {/* Communication Logs */}
          <div className={styles.sectionCard}>
            <h2 className={styles.cardTitle}>
              <Icon.Users size={18} />
              <span>Customer Communication Logs</span>
            </h2>
            <form onSubmit={handleLogCommunication}>
              <div className={styles.commFormRow}>
                <select
                  className={styles.commSelect}
                  value={commChannel}
                  onChange={(e) => setCommChannel(e.target.value as any)}
                >
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="CALL">Phone Call</option>
                  <option value="EMAIL">Email</option>
                  <option value="SMS">SMS</option>
                </select>
                <select
                  className={styles.commSelect}
                  value={commDirection}
                  onChange={(e) => setCommDirection(e.target.value as any)}
                >
                  <option value="OUTBOUND">Outbound (Studio to Client)</option>
                  <option value="INBOUND">Inbound (Client to Studio)</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 8 }}>
                <input
                  type="text"
                  className={styles.noteInput}
                  placeholder="Log summary of customer interaction..."
                  value={commSummary}
                  onChange={(e) => setCommSummary(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={commLoading || !commSummary.trim()}
                  className="btn btn-secondary btn-sm"
                >
                  {commLoading ? 'Saving...' : 'Log'}
                </button>
              </div>
            </form>

            <div className={styles.commList} style={{ marginTop: 'var(--space-3)' }}>
              {communications.map((c) => (
                <div key={c.id} className={styles.commItem}>
                  <div className={styles.commHead}>
                    <span
                      className={`${styles.commTag} ${
                        c.direction === 'OUTBOUND'
                          ? styles.commTagOutbound
                          : styles.commTagInbound
                      }`}
                    >
                      {c.direction} • {c.channel}
                    </span>
                    <span className={styles.commTime}>
                      {new Date(c.createdAt).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className={styles.commSummary}>{c.summary}</p>
                </div>
              ))}
              {communications.length === 0 && (
                <p style={{ color: '#94A3B8', fontSize: '12px' }}>No direct contacts logged yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal for Photo Zoom */}
      {activePhotoUrl && (
        <div className={styles.lightboxOverlay} onClick={() => setActivePhotoUrl(null)}>
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.lightboxClose}
              onClick={() => setActivePhotoUrl(null)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Icon.Cross size={14} /> Close
            </button>
            <img src={activePhotoUrl} alt="Vehicle Inspection Photo" />
          </div>
        </div>
      )}
    </div>
  );
}
