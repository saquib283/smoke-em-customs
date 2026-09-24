'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './leads.module.css';

interface LeadItem {
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
  const [leads, setLeads] = useState<LeadItem[]>(initialLeads);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedLeadDetail, setSelectedLeadDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);

  const filterTabs = [
    { key: 'ALL', label: 'All Leads' },
    { key: 'FOLLOW_UP_DUE', label: '⚠️ Follow-up Due' },
    { key: 'DUPLICATES', label: '🔁 Duplicates' },
    { key: 'NEW', label: 'New' },
    { key: 'CONTACTED', label: 'Contacted' },
    { key: 'QUOTE_SENT', label: 'Quote Sent' },
    { key: 'FOLLOW_UP', label: 'Follow Up' },
    { key: 'BOOKED', label: 'Booked' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'LOST', label: 'Lost' },
  ];

  const pipelineStatuses = [
    'NEW',
    'CONTACTED',
    'QUOTE_SENT',
    'FOLLOW_UP',
    'BOOKED',
    'COMPLETED',
    'LOST',
  ];

  const filteredLeads = leads.filter((l) => {
    if (filterStatus === 'FOLLOW_UP_DUE') {
      if (!l.needsFollowUp) return false;
    } else if (filterStatus === 'DUPLICATES') {
      if (!l.isDuplicate) return false;
    } else if (filterStatus !== 'ALL') {
      if (l.status !== filterStatus) return false;
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        l.customerName.toLowerCase().includes(q) ||
        l.customerPhone.includes(q) ||
        (l.vehicleText && l.vehicleText.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const openLeadDetail = async (id: string) => {
    setSelectedLeadId(id);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/leads?id=${id}`);
      const data = await res.json();
      setSelectedLeadDetail(data.lead || null);
    } catch {
      // Fallback
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedLeadId) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_STATUS',
          leadId: selectedLeadId,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLeads((prev) =>
          prev.map((l) => (l.id === selectedLeadId ? { ...l, status: newStatus } : l))
        );
        if (selectedLeadDetail) {
          setSelectedLeadDetail(data.lead || { ...selectedLeadDetail, status: newStatus });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId || !newNote.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_NOTE',
          leadId: selectedLeadId,
          body: newNote.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.lead) {
        setSelectedLeadDetail(data.lead);
        setNewNote('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* ── Filter & Search Toolbar ── */}
      <div className={styles.toolbar}>
        <div className={styles.statusTabs}>
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`${styles.tabBtn} ${filterStatus === tab.key ? styles.activeTab : ''}`}
              onClick={() => setFilterStatus(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.searchBox}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search client, mobile, vehicle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* ── Leads Table ── */}
      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Received</th>
                <th>Client</th>
                <th>Vehicle & Treatment</th>
                <th>Pipeline Status</th>
                <th>Flags</th>
                <th>Channel</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => {
                const cleanPhone = lead.customerPhone.replace(/\D/g, '');
                const waPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
                const waText = encodeURIComponent(
                  `Hi ${lead.customerName}, this is Smoke M Customs regarding your detailing inquiry.`
                );

                return (
                  <tr key={lead.id} className={styles.tableRow}>
                    <td className={styles.dateCell}>
                      {new Date(lead.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>
                      <div className={styles.clientCol}>
                        <span className={styles.nameText}>{lead.customerName}</span>
                        <span className={styles.phoneText}>{lead.customerPhone}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.carCol}>
                        <span className={styles.carText}>{lead.vehicleText ?? 'Vehicle Unspecified'}</span>
                        <span className={styles.serviceText}>{lead.serviceInterestName ?? 'General Inquiry'}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.statusPill} ${styles[`status${lead.status}`] || ''}`}>
                        {lead.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        {lead.needsFollowUp && (
                          <span className={styles.badgeFollowup}>
                            ⚠️ Follow-up Due
                          </span>
                        )}
                        {lead.isDuplicate && (
                          <span className={styles.badgeDuplicate}>
                            🔁 Duplicate (24h)
                          </span>
                        )}
                        {lead.photosCount > 0 && (
                          <span className={styles.badgePhotos}>
                            📷 {lead.photosCount} photo{lead.photosCount > 1 ? 's' : ''}
                          </span>
                        )}
                        {!lead.needsFollowUp && !lead.isDuplicate && lead.photosCount === 0 && (
                          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>—</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={styles.sourceTag}>{lead.source ?? 'Web'}</span>
                    </td>
                    <td>
                      <div className={styles.actionBtns}>
                        <a
                          href={`https://wa.me/${waPhone}?text=${waText}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.waBtn}
                          title="WhatsApp direct chat"
                        >
                          💬
                        </a>
                        <a href={`tel:${lead.customerPhone}`} className={styles.callBtn} title="Call Client">
                          📞
                        </a>
                        <button
                          type="button"
                          onClick={() => openLeadDetail(lead.id)}
                          className="btn btn-secondary btn-sm"
                        >
                          Manage
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={7} className={styles.emptyCell}>
                    No leads found matching current filter or search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Slide-over Detail Drawer ── */}
      {selectedLeadId && (
        <div className={styles.drawerBackdrop} onClick={() => setSelectedLeadId(null)}>
          <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div>
                <span className={styles.drawerTag}>LEAD PROFILE & PIPELINE</span>
                <h3 className={styles.drawerTitle}>
                  {selectedLeadDetail?.customerName || 'Lead Detail'}
                </h3>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setSelectedLeadId(null)}
              >
                ✕
              </button>
            </div>

            {detailLoading ? (
              <div className={styles.drawerLoading}>Loading lead details, photos & history...</div>
            ) : selectedLeadDetail ? (
              <div className={styles.drawerBody}>
                {/* Duplicate Lead Notice */}
                {selectedLeadDetail.isDuplicate && (
                  <div className={styles.badgeDuplicate} style={{ display: 'block', padding: 'var(--space-2) var(--space-3)', width: '100%' }}>
                    <strong>🔁 24-Hour Duplicate Detected:</strong> Customer submitted another inquiry for this vehicle within 24 hours. Check previous notes and interactions below.
                  </div>
                )}

                {/* Follow-up Overdue Flag */}
                {selectedLeadDetail.needsFollowUp && (
                  <div className={styles.badgeFollowup} style={{ display: 'block', padding: 'var(--space-2) var(--space-3)', width: '100%' }}>
                    <strong>⚠️ Follow-up Overdue:</strong> Lead has been inactive for 3 or more days without conversion or close.
                  </div>
                )}

                {/* Status Transitions */}
                <div className={styles.drawerSection}>
                  <label className={styles.sectionLabel}>Pipeline Status Transition</label>
                  <div className={styles.statusButtons}>
                    {pipelineStatuses.map((st) => (
                      <button
                        key={st}
                        type="button"
                        disabled={actionLoading}
                        className={`${styles.statusOptionBtn} ${selectedLeadDetail.status === st ? styles.activeStatusOption : ''}`}
                        onClick={() => handleStatusChange(st)}
                      >
                        {st.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Client & Vehicle Parameters */}
                <div className={styles.drawerSection}>
                  <label className={styles.sectionLabel}>Client & Vehicle Parameters</label>
                  <div className={styles.infoGrid}>
                    <div>
                      <span className={styles.infoLabel}>Mobile Number</span>
                      <span className={styles.infoVal}>{selectedLeadDetail.customerPhone}</span>
                    </div>
                    <div>
                      <span className={styles.infoLabel}>Email</span>
                      <span className={styles.infoVal}>{selectedLeadDetail.customer?.email ?? 'Not provided'}</span>
                    </div>
                    <div>
                      <span className={styles.infoLabel}>Vehicle</span>
                      <span className={styles.infoVal}>{selectedLeadDetail.vehicleText ?? 'Not specified'}</span>
                    </div>
                    <div>
                      <span className={styles.infoLabel}>Primary Treatment</span>
                      <span className={styles.infoVal}>{selectedLeadDetail.serviceInterestName ?? 'General Inquiry'}</span>
                    </div>
                    <div>
                      <span className={styles.infoLabel}>Paint Condition</span>
                      <span className={styles.infoVal}>{selectedLeadDetail.vehicleCondition ?? 'Unspecified'}</span>
                    </div>
                    <div>
                      <span className={styles.infoLabel}>Desired Outcome</span>
                      <span className={styles.infoVal}>{selectedLeadDetail.desiredResult ?? 'Unspecified'}</span>
                    </div>
                    <div>
                      <span className={styles.infoLabel}>Estimated Band</span>
                      <span className={styles.infoVal}>
                        {selectedLeadDetail.budgetRangeMin && selectedLeadDetail.budgetRangeMax
                          ? `₹${Number(selectedLeadDetail.budgetRangeMin).toLocaleString('en-IN')} – ₹${Number(selectedLeadDetail.budgetRangeMax).toLocaleString('en-IN')}`
                          : 'Standard Evaluation'}
                      </span>
                    </div>
                    <div>
                      <span className={styles.infoLabel}>Preferred Contact</span>
                      <span className={styles.infoVal}>{selectedLeadDetail.customer?.preferredContactMethod ?? 'WHATSAPP'}</span>
                    </div>
                  </div>

                  {selectedLeadDetail.additionalNotes && (
                    <div className={styles.notesBox} style={{ marginTop: 'var(--space-2)' }}>
                      <span className={styles.infoLabel}>Client Requirements / Notes:</span>
                      <p className={styles.notesText}>{selectedLeadDetail.additionalNotes}</p>
                    </div>
                  )}
                </div>

                {/* Attached Vehicle & Paint Photos */}
                {selectedLeadDetail.photos && selectedLeadDetail.photos.length > 0 && (
                  <div className={styles.drawerSection}>
                    <label className={styles.sectionLabel}>
                      Client Attached Photos ({selectedLeadDetail.photos.length})
                    </label>
                    <div className={styles.photosGrid}>
                      {selectedLeadDetail.photos.map((p: any) => (
                        <div
                          key={p.id}
                          className={styles.photoThumbnail}
                          onClick={() => setActivePhotoUrl(p.url)}
                          title="Click to expand"
                        >
                          <img src={p.url} alt={p.altText || 'Lead vehicle photo'} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Action Links */}
                <div className={styles.drawerActionsRow}>
                  <Link
                    href={`/admin/quotes?leadId=${selectedLeadDetail.id}&customerId=${selectedLeadDetail.customerId}`}
                    className="btn btn-primary btn-sm"
                  >
                    + Generate Formal Quote
                  </Link>
                  <Link
                    href={`/admin/bookings?customerId=${selectedLeadDetail.customerId}&leadId=${selectedLeadDetail.id}`}
                    className="btn btn-secondary btn-sm"
                  >
                    + Book Bay Slot
                  </Link>
                  <a
                    href={`https://wa.me/${selectedLeadDetail.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                      `Hi ${selectedLeadDetail.customerName}, Smoke M Customs following up on quote request for your ${selectedLeadDetail.vehicleText || 'vehicle'}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                  >
                    💬 WhatsApp Client
                  </a>
                </div>

                {/* Status Transition History Timeline */}
                {selectedLeadDetail.statusHistory && selectedLeadDetail.statusHistory.length > 0 && (
                  <div className={styles.drawerSection}>
                    <label className={styles.sectionLabel}>Pipeline Status History</label>
                    <div className={styles.timeline}>
                      {selectedLeadDetail.statusHistory.map((h: any) => (
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

                {/* Internal Notes & Timeline */}
                <div className={styles.drawerSection}>
                  <label className={styles.sectionLabel}>Internal Staff Notes</label>
                  <form onSubmit={handleAddNote} className={styles.noteForm}>
                    <input
                      type="text"
                      className={styles.noteInput}
                      placeholder="Add inspection note, follow-up log, quote price sent..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                    />
                    <button type="submit" disabled={actionLoading || !newNote.trim()} className="btn btn-secondary btn-sm">
                      Post Note
                    </button>
                  </form>

                  <div className={styles.notesList}>
                    {selectedLeadDetail.notes?.map((n: any) => (
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
                    {(!selectedLeadDetail.notes || selectedLeadDetail.notes.length === 0) && (
                      <p className={styles.emptyNotes}>No internal notes recorded yet.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Lightbox Modal for Photo Zoom */}
      {activePhotoUrl && (
        <div className={styles.lightboxOverlay} onClick={() => setActivePhotoUrl(null)}>
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.lightboxClose}
              onClick={() => setActivePhotoUrl(null)}
            >
              ✕ Close
            </button>
            <img src={activePhotoUrl} alt="Inspection Photo" />
          </div>
        </div>
      )}
    </div>
  );
}
