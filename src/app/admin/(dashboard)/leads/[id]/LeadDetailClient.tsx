'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { WhatsAppCTA } from '@/components/common/WhatsAppCTA';
import { Icon } from '@/components/common/Icons';
import { useToast, Select, type SelectOption } from '@/components/ui';
import { downloadQuotePDF } from '@/modules/quoting/pdfGenerator';
import type { LeadDetail } from '@/modules/crm';
import type { CommunicationEntry } from '@/modules/notifications';
import styles from './detail.module.css';

const COMM_CHANNEL_OPTIONS: SelectOption<'WHATSAPP' | 'CALL' | 'EMAIL' | 'SMS'>[] = [
  { value: 'WHATSAPP', label: 'WhatsApp', icon: <Icon.WhatsApp size={15} /> },
  { value: 'CALL', label: 'Phone Call', icon: <Icon.Phone size={15} /> },
  { value: 'EMAIL', label: 'Email', icon: <Icon.Mail size={15} /> },
  { value: 'SMS', label: 'SMS Alert', icon: <Icon.Send size={15} /> },
];

const COMM_DIRECTION_OPTIONS: SelectOption<'OUTBOUND' | 'INBOUND'>[] = [
  { value: 'OUTBOUND', label: 'Outbound (Studio to Client)', icon: <Icon.ArrowRight size={15} /> },
  { value: 'INBOUND', label: 'Inbound (Client to Studio)', icon: <Icon.ArrowLeft size={15} /> },
];

interface LeadDetailProps {
  initialLead: LeadDetail | any;
  initialCommunications: CommunicationEntry[] | any[];
}

const PIPELINE_STAGES = [
  { key: 'NEW', label: 'New Intake', step: 1 },
  { key: 'CONTACTED', label: 'Contacted', step: 2 },
  { key: 'QUOTE_SENT', label: 'Quote Sent', step: 3 },
  { key: 'FOLLOW_UP', label: 'Follow Up', step: 4 },
  { key: 'BOOKED', label: 'Booked', step: 5 },
  { key: 'COMPLETED', label: 'Completed', step: 6 },
  { key: 'LOST', label: 'Lost', step: 7 },
];

export function LeadDetailClient({ initialLead, initialCommunications }: LeadDetailProps) {
  const { success, error: toastError, info } = useToast();
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

  // Client Initials
  const clientInitials = (() => {
    const name = (lead.customerName || 'Lead').trim();
    const parts = name.split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return (name.slice(0, 2) || 'LD').toUpperCase();
  })();

  const formatStatus = (st: string) => {
    switch (st) {
      case 'NEW':
        return 'New Intake';
      case 'CONTACTED':
        return 'Contacted';
      case 'QUOTE_SENT':
        return 'Quote Sent';
      case 'FOLLOW_UP':
        return 'Follow-Up Needed';
      case 'BOOKED':
        return 'Bay Slot Booked';
      case 'COMPLETED':
        return 'Converted & Closed';
      case 'LOST':
        return 'Lost / Closed';
      default:
        return st.replace(/_/g, ' ');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === lead.status) return;
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
        success(`Pipeline stage transitioned to ${newStatus.replace(/_/g, ' ')}`);
      } else {
        toastError(data.error || 'Failed to update pipeline stage');
      }
    } catch {
      toastError('Network error connecting to lead service');
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
        success('Internal studio note recorded');
      } else {
        toastError(data.error || 'Failed to save note');
      }
    } catch {
      toastError('Network error saving note');
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
        success('Customer communication logged');
      } else {
        toastError(data.error || 'Failed to log communication');
      }
    } catch {
      toastError('Network error logging communication');
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
        success('WhatsApp message dispatched successfully');
        fetch(`/api/admin/communications?leadId=${lead.id}`)
          .then((r) => r.json())
          .then((d) => d.success && setCommunications(d.communications || []))
          .catch(() => {});
      } else {
        toastError(data.error || 'Failed to dispatch WhatsApp message.');
      }
    } catch (err: any) {
      toastError(err.message || 'Error sending WhatsApp message.');
    } finally {
      setDirectWaSending(false);
    }
  };

  const currentStageIndex = PIPELINE_STAGES.findIndex((s) => s.key === lead.status);

  return (
    <div className={styles.container}>
      {/* ── Top Bar ── */}
      <div className={styles.topBar}>
        <Link href="/admin/leads" className={styles.backBtn} id="btn-back-to-leads">
          <Icon.ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} />
          <span>Back to Inbound Leads</span>
        </Link>
        <div className={styles.topActions}>
          <Link
            href={`/admin/quotes/new?leadId=${lead.id}&customerId=${lead.customerId}`}
            className={styles.primaryActionBtn}
            id="btn-generate-quote"
          >
            <Icon.FileText size={15} />
            <span>Generate Formal Quote</span>
          </Link>

          <Link
            href={`/admin/bookings?customerId=${lead.customerId}&leadId=${lead.id}`}
            className={styles.secondaryActionBtn}
            id="btn-book-slot"
          >
            <Icon.Calendar size={15} />
            <span>Book Bay Slot</span>
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

          <a href={`tel:${lead.customerPhone}`} className={styles.callBtn} title="Call Client Mobile">
            <Icon.Phone size={14} />
            <span>Call Mobile</span>
          </a>
        </div>
      </div>

      {/* ── Main Lead Dossier Banner ── */}
      <div className={styles.headerCard}>
        <div className={styles.headerLeft}>
          <div className={styles.customerAvatar}>{clientInitials}</div>
          <div className={styles.headerMeta}>
            <div className={styles.eyebrow}>
              <span>Studio Control</span>
              <span className={styles.eyebrowDot} />
              <span>Customer & CRM</span>
              <span className={styles.eyebrowDot} />
              <span>Lead Dossier #{lead.id.slice(-6).toUpperCase()}</span>
            </div>
            <h1 className={styles.leadTitle}>{lead.customerName}</h1>
            <div className={styles.leadMeta}>
              <span className={styles.leadMetaItem}>
                <Icon.Phone size={13} color="#B45309" />
                <a href={`tel:${lead.customerPhone}`} className={styles.metaLink}>
                  {lead.customerPhone}
                </a>
              </span>
              <span>•</span>
              <span className={styles.leadMetaItem}>
                <Icon.Mail size={13} />
                <span>{lead.customer?.email || 'No email provided'}</span>
              </span>
              <span>•</span>
              <span>
                Intake: {new Date(lead.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              {lead.source && (
                <>
                  <span>•</span>
                  <span className={styles.sourceBadge}>
                    {lead.source === 'public_web' ? 'Website Intake' : lead.source.replace(/_/g, ' ')}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className={`${styles.statusPill} ${styles[`status${lead.status}`] || styles.statusNEW}`}>
            <span className={styles.statusDot} />
            <span>{formatStatus(lead.status)}</span>
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

      {/* ── Executive Horizontal Pipeline Stepper ── */}
      <div className={styles.stepperCard}>
        <div className={styles.stepperHeader}>
          <div className={styles.stepperTitleWrap}>
            <div className={styles.stepperIcon}>
              <Icon.Tag size={16} />
            </div>
            <div>
              <h3 className={styles.stepperTitle}>Pipeline Stage Progression</h3>
              <p className={styles.stepperSubtitle}>
                Current status: <strong>{formatStatus(lead.status)}</strong>. Advance stage to track customer journey.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.stepperScroll}>
          <div className={styles.stepperTrack}>
            {PIPELINE_STAGES.map((st, idx) => {
              const isActive = lead.status === st.key;
              const isPast = currentStageIndex > idx && lead.status !== 'LOST';
              return (
                <button
                  key={st.key}
                  type="button"
                  disabled={actionLoading}
                  className={`${styles.stepBtn} ${isActive ? styles.stepActive : ''} ${isPast ? styles.stepCompleted : ''}`}
                  onClick={() => handleStatusChange(st.key)}
                  title={`Transition to ${st.label}`}
                >
                  <span className={styles.stepNumber}>
                    {isPast ? '✓' : st.step}
                  </span>
                  <span>{st.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Two Column Content Grid ── */}
      <div className={styles.contentGrid}>
        {/* Left Column: Client Parameters, Photos & Direct WhatsApp */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Client & Vehicle Parameters */}
          <div className={styles.sectionCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <div className={styles.cardHeaderIcon}>
                  <Icon.Car size={17} />
                </div>
                <div>
                  <h3 className={styles.cardTitle}>Client & Vehicle Parameters</h3>
                  <p className={styles.cardSubtitle}>
                    Vehicle condition, requested treatment, and intake preferences.
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Direct Contact Mobile</span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className={styles.infoVal} style={{ fontFeatureSettings: 'tnum' }}>
                    {lead.customerPhone}
                  </span>
                  <a href={`tel:${lead.customerPhone}`} className={styles.dialLink}>
                    Dial ↗
                  </a>
                </div>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Client Email</span>
                <span className={styles.infoVal}>
                  {lead.customer?.email ? (
                    <a href={`mailto:${lead.customer.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {lead.customer.email}
                    </a>
                  ) : (
                    'Not provided'
                  )}
                </span>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Vehicle Model / Spec</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.1rem' }}>
                  <Icon.Car size={15} color="#B45309" />
                  <span className={styles.infoVal}>{lead.vehicleText ?? 'Not specified'}</span>
                </div>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Primary Treatment Inquiry</span>
                <span className={styles.infoVal}>{lead.serviceInterestName ?? 'General Detailing Inquiry'}</span>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Paint Surface Condition</span>
                <span className={styles.infoVal}>{lead.vehicleCondition ?? 'Standard Inspection'}</span>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Existing Coating / PPF</span>
                <span className={styles.infoVal}>{lead.existingCoatingOrPpf ?? 'Factory Finish'}</span>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Desired Treatment Outcome</span>
                <span className={styles.infoVal}>{lead.desiredResult ?? 'High-Gloss Preservation'}</span>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Estimated Budget Band</span>
                <span className={styles.infoVal}>
                  {lead.budgetRangeMin && lead.budgetRangeMax ? (
                    <span className={styles.budgetBadge}>
                      ₹{Number(lead.budgetRangeMin).toLocaleString('en-IN')} – ₹{Number(lead.budgetRangeMax).toLocaleString('en-IN')}
                    </span>
                  ) : (
                    'Studio Evaluation'
                  )}
                </span>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Preferred Schedule Slot</span>
                <span className={styles.infoVal}>
                  {lead.preferredDate
                    ? new Date(lead.preferredDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Flexible / Earliest Open'}
                </span>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>CRM Customer Profile</span>
                <Link
                  href={`/admin/customers/${lead.customerId}`}
                  style={{ color: '#B45309', fontSize: '0.8125rem', fontWeight: 700, textDecoration: 'none' }}
                >
                  View Customer Dossier &rarr;
                </Link>
              </div>
            </div>

            {lead.additionalNotes && (
              <div className={styles.notesBox}>
                <span className={styles.infoLabel}>Client Requirements & Custom Instructions:</span>
                <p style={{ margin: 0 }}>{lead.additionalNotes}</p>
              </div>
            )}
          </div>

          {/* Attached Vehicle Photos */}
          {lead.photos && lead.photos.length > 0 && (
            <div className={styles.sectionCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                  <div className={styles.cardHeaderIcon}>
                    <Icon.Image size={17} />
                  </div>
                  <div>
                    <h3 className={styles.cardTitle}>Client Attached Photos ({lead.photos.length})</h3>
                    <p className={styles.cardSubtitle}>Visual condition uploaded during intake.</p>
                  </div>
                </div>
              </div>
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
              <span style={{ fontSize: '11px', color: '#15803D', fontWeight: 700 }}>
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

        {/* Right Column: Quotes & PDF, Timeline, Staff Notes & Communications */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* ── Issued Studio Quotations & PDF Download Card ── */}
          <div className={styles.sectionCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <div className={styles.cardHeaderIcon}>
                  <Icon.FileText size={17} />
                </div>
                <div>
                  <h3 className={styles.cardTitle}>Issued Studio Quotations</h3>
                  <p className={styles.cardSubtitle}>
                    Formal pricing estimates and downloadable PDF sheets.
                  </p>
                </div>
              </div>
            </div>

            {lead.quotes && lead.quotes.length > 0 ? (
              <div className={styles.quotesList}>
                {lead.quotes.map((q: any) => (
                  <div key={q.id} className={styles.quoteCardItem}>
                    <div className={styles.quoteItemLeft}>
                      <div className={styles.quoteRefRow}>
                        <span className={styles.quoteRef}>QT-{q.id.slice(-6).toUpperCase()}</span>
                        <span className={`${styles.statusPill} ${styles[`status${q.status}`] || styles.statusNEW}`}>
                          <span className={styles.statusDot} />
                          <span>{q.status}</span>
                        </span>
                      </div>
                      <span className={styles.quoteMeta}>
                        Issued: {new Date(q.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {q.validUntil && ` • Valid: ${new Date(q.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                      </span>
                    </div>

                    <div className={styles.quoteItemRight}>
                      <span className={styles.quoteAmount}>
                        ₹{Number(q.total || 0).toLocaleString('en-IN')}
                      </span>
                      <div className={styles.quoteActions}>
                        <button
                          type="button"
                          className={styles.downloadPdfBtn}
                          onClick={() => {
                            try {
                              downloadQuotePDF(q);
                              success(`Quotation QT-${q.id.slice(-6).toUpperCase()} PDF downloaded!`);
                            } catch {
                              window.open(`/api/quotes/${q.id}/pdf`, '_blank');
                            }
                          }}
                          title="Download Quote PDF"
                        >
                          <Icon.FileText size={13} />
                          <span>PDF</span>
                        </button>
                        <Link href={`/admin/quotes/${q.id}`} className={styles.viewQuoteBtn}>
                          <span>View &rarr;</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyQuotesBox}>
                <Icon.FileText size={28} color="#94A3B8" />
                <div style={{ fontSize: '0.84375rem', fontWeight: 600, color: '#334155' }}>
                  No formal quotation generated yet
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', maxWidth: 280 }}>
                  Create an itemized treatment estimate with GST breakdown, downloadable PDF, and WhatsApp sharing.
                </div>
                <Link
                  href={`/admin/quotes/new?leadId=${lead.id}&customerId=${lead.customerId}`}
                  className={styles.primaryActionBtn}
                  style={{ marginTop: '0.25rem' }}
                >
                  <Icon.Plus size={14} />
                  <span>Create Formal Estimate</span>
                </Link>
              </div>
            )}
          </div>

          {/* Pipeline Status History Timeline */}
          {lead.statusHistory && lead.statusHistory.length > 0 && (
            <div className={styles.sectionCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                  <div className={styles.cardHeaderIcon}>
                    <Icon.Clock size={17} />
                  </div>
                  <div>
                    <h3 className={styles.cardTitle}>Pipeline Status History</h3>
                    <p className={styles.cardSubtitle}>Audit trail of progression updates.</p>
                  </div>
                </div>
              </div>
              <div className={styles.timeline}>
                {lead.statusHistory.map((h: any) => (
                  <div key={h.id} className={styles.timelineItem}>
                    <span className={styles.timelineTransition}>
                      {h.fromStatus ? `${h.fromStatus.replace(/_/g, ' ')} → ` : 'Created as '}
                      <strong>{h.toStatus.replace(/_/g, ' ')}</strong>
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

          {/* Internal Staff Notes */}
          <div className={styles.sectionCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <div className={styles.cardHeaderIcon}>
                  <Icon.FileText size={17} />
                </div>
                <div>
                  <h3 className={styles.cardTitle}>Internal Staff Notes</h3>
                  <p className={styles.cardSubtitle}>Inspection logs and private studio remarks.</p>
                </div>
              </div>
            </div>
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
                className={styles.primaryActionBtn}
                style={{ padding: '0.45rem 0.85rem' }}
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
                <p style={{ color: '#94A3B8', fontSize: '12px', margin: '0.25rem 0' }}>No internal notes recorded yet.</p>
              )}
            </div>
          </div>

          {/* Customer Communication Logs */}
          <div className={styles.sectionCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <div className={styles.cardHeaderIcon}>
                  <Icon.Users size={17} />
                </div>
                <div>
                  <h3 className={styles.cardTitle}>Customer Communication Logs</h3>
                  <p className={styles.cardSubtitle}>Multi-channel interaction records.</p>
                </div>
              </div>
            </div>
            <form onSubmit={handleLogCommunication}>
              <div className={styles.commFormRow}>
                <div style={{ flex: 1, minWidth: '140px' }}>
                  <Select<'WHATSAPP' | 'CALL' | 'EMAIL' | 'SMS'>
                    size="sm"
                    value={commChannel}
                    onChange={(val) => setCommChannel(val)}
                    options={COMM_CHANNEL_OPTIONS}
                  />
                </div>
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <Select<'OUTBOUND' | 'INBOUND'>
                    size="sm"
                    value={commDirection}
                    onChange={(val) => setCommDirection(val)}
                    options={COMM_DIRECTION_OPTIONS}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 8 }}>
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
                  className={styles.secondaryActionBtn}
                  style={{ padding: '0.45rem 0.85rem' }}
                >
                  {commLoading ? 'Saving...' : 'Log'}
                </button>
              </div>
            </form>

            <div className={styles.commList} style={{ marginTop: '0.5rem' }}>
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
                <p style={{ color: '#94A3B8', fontSize: '12px', margin: '0.25rem 0' }}>No direct contacts logged yet.</p>
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
