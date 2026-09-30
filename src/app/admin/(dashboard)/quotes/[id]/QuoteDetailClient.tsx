'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { WhatsAppCTA } from '@/components/common/WhatsAppCTA';
import { Icon } from '@/components/common/Icons';
import { useToast, Select, type SelectOption } from '@/components/ui';
import type { QuoteDetail } from '@/modules/quoting/types';
import { downloadQuotePDF } from '@/modules/quoting/pdfGenerator';
import { generateQuoteWhatsAppSummary } from '@/modules/whatsapp';
import styles from './quoteDetail.module.css';

interface ResourceOption {
  id: string;
  name: string;
}

interface ServiceOption {
  id: string;
  name: string;
  startingPrice: string | number;
}

interface PackageOption {
  id: string;
  name: string;
  startingPrice?: string | number | null;
  price?: string | number | null;
}

interface EditLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  serviceId?: string;
  packageId?: string;
}

interface QuoteDetailClientProps {
  initialQuote: QuoteDetail;
  resources: ResourceOption[];
  services: ServiceOption[];
  packages: PackageOption[];
}

export function QuoteDetailClient({
  initialQuote,
  resources,
  services,
  packages,
}: QuoteDetailClientProps) {
  const router = useRouter();
  const { success, error: toastError, info } = useToast();

  const [quote, setQuote] = useState<QuoteDetail>(initialQuote);
  const [actionLoading, setActionLoading] = useState(false);

  // Convert to Booking form state
  const [showBookSection, setShowBookSection] = useState(false);
  const [bookResourceId, setBookResourceId] = useState<string>(resources[0]?.id || '');
  const [bookDate, setBookDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [bookTime, setBookTime] = useState<string>('10:00');
  const [bookDuration, setBookDuration] = useState<number>(120);
  const [bookNotes, setBookNotes] = useState<string>('Booking created from accepted studio quote.');

  // Revision / Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editItems, setEditItems] = useState<EditLineItem[]>(() =>
    quote.items.map((i) => ({
      description: i.description,
      quantity: i.quantity || 1,
      unitPrice: Number(i.unitPrice) || 0,
      serviceId: i.serviceId || undefined,
      packageId: i.packageId || undefined,
    }))
  );
  const [editDiscount, setEditDiscount] = useState<number>(Number(quote.discount) || 0);
  const [editNotes, setEditNotes] = useState<string>(quote.notes || '');
  const [editTerms, setEditTerms] = useState<string>(quote.terms || '');

  // Client Initials
  const clientInitials = useMemo(() => {
    const parts = (quote.customerName || 'Client').trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (quote.customerName[0] || 'C').toUpperCase();
  }, [quote.customerName]);

  // Formatted Expiry Date
  const validUntilFormatted = useMemo(() => {
    if (!quote.validUntil) return 'Open';
    return new Date(quote.validUntil).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [quote.validUntil]);

  // WhatsApp summary generation
  const whatsAppSummaryText = useMemo(() => {
    const shareUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/quotes/${quote.id}`
      : `https://smokecustoms.com/quotes/${quote.id}`;
    return generateQuoteWhatsAppSummary(
      {
        id: quote.id,
        customerName: quote.customerName,
        vehicleText: quote.vehicleText,
        total: quote.total,
        subtotal: quote.subtotal,
        discount: quote.discount,
        tax: quote.tax,
        validUntil: quote.validUntil,
        notes: quote.notes,
        terms: quote.terms,
        items: quote.items.map((i) => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          lineTotal: i.lineTotal,
        })),
      },
      shareUrl
    );
  }, [quote]);

  // Copy WhatsApp summary
  const handleCopyWhatsAppText = async () => {
    try {
      await navigator.clipboard.writeText(whatsAppSummaryText);
      success('WhatsApp quotation summary copied to clipboard!');
    } catch {
      toastError('Failed to copy summary to clipboard');
    }
  };

  // Status Lifecycle Action
  const handleStatusUpdate = async (action: 'SEND' | 'ACCEPT' | 'DECLINE' | 'EXPIRE' | 'REVERT_DRAFT' | 'DELETE') => {
    if (action === 'DELETE') {
      if (!confirm('Are you sure you want to permanently discard this draft quote?')) return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, quoteId: quote.id }),
      });
      const data = await res.json();

      if (action === 'DELETE') {
        if (data.success) {
          success('Draft quotation discarded');
          router.push('/admin/quotes');
        } else {
          toastError(data.error || 'Failed to delete quotation');
        }
        return;
      }

      if (data.success && data.quote) {
        setQuote(data.quote);
        if (action === 'SEND') success('Quotation marked as SENT to client.');
        if (action === 'ACCEPT') success('Quotation marked as ACCEPTED by customer.');
        if (action === 'DECLINE') info('Quotation marked as DECLINED.');
        if (action === 'EXPIRE') info('Quotation marked as EXPIRED.');
        if (action === 'REVERT_DRAFT') info('Quotation reverted to DRAFT status.');
      } else {
        toastError(data.error || 'Failed to update quotation');
      }
    } catch {
      toastError('Error connecting to quotation service');
    } finally {
      setActionLoading(false);
    }
  };

  // Convert to Booking
  const handleConvertBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookResourceId || !bookDate || !bookTime) {
      toastError('Please choose an assigned bay, appointment date, and time');
      return;
    }

    setActionLoading(true);
    try {
      const startAt = new Date(`${bookDate}T${bookTime}:00Z`).toISOString();
      const payload = {
        customerId: quote.customerId,
        vehicleId: quote.vehicleId || undefined,
        leadId: quote.leadId || undefined,
        quoteId: quote.id,
        resourceId: bookResourceId,
        startAt,
        durationMinutes: Number(bookDuration) || 120,
        priceQuoted: quote.total,
        internalNotes: bookNotes,
      };

      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE', bookingData: payload }),
      });
      const data = await res.json();

      if (data.success && data.booking) {
        setQuote((prev) => ({
          ...prev,
          status: 'ACCEPTED',
          linkedBookingId: data.booking.id,
        }));
        setShowBookSection(false);
        success('Bay reservation locked! Quote converted to Booking #' + data.booking.id.slice(-6).toUpperCase());
      } else {
        toastError(data.error || 'Failed to create booking from quote');
      }
    } catch {
      toastError('Error connecting to booking service');
    } finally {
      setActionLoading(false);
    }
  };

  // Revision / Edit handlers
  const handleEditItemChange = (index: number, field: string, value: any) => {
    setEditItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleAddEditItem = () => {
    setEditItems((prev) => [
      ...prev,
      {
        description: 'Bespoke Studio Treatment',
        quantity: 1,
        unitPrice: 5000,
        serviceId: undefined,
        packageId: undefined,
      },
    ]);
  };

  const handleRemoveEditItem = (index: number) => {
    if (editItems.length <= 1) {
      toastError('Quotation must contain at least one line item');
      return;
    }
    setEditItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Calculate live edit totals
  const editSubtotal = useMemo(() => {
    return editItems.reduce((acc, it) => acc + (it.quantity || 1) * (it.unitPrice || 0), 0);
  }, [editItems]);
  const editTaxable = Math.max(0, editSubtotal - editDiscount);
  const editTaxAmount = Math.round(editTaxable * 0.18);
  const editGrandTotal = editTaxable + editTaxAmount;

  const handleSaveRevision = async () => {
    if (!editItems.length || !editItems.some((i) => i.description.trim())) {
      toastError('Please specify at least one valid line item');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        items: editItems.map((item) => ({
          serviceId: item.serviceId,
          packageId: item.packageId,
          description: item.description.trim(),
          quantity: item.quantity,
          unitPrice: String(item.unitPrice),
        })),
        discount: String(editDiscount),
        tax: String(editTaxAmount),
        notes: editNotes,
        terms: editTerms,
      };

      const res = await fetch('/api/admin/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE',
          quoteId: quote.id,
          quoteData: payload,
        }),
      });
      const data = await res.json();
      if (data.success && data.quote) {
        setQuote(data.quote);
        setIsEditing(false);
        success('Quotation successfully revised and updated!');
      } else {
        toastError(data.error || 'Failed to update quotation');
      }
    } catch {
      toastError('Error saving quotation changes');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* ── Top Navigation Bar ── */}
      <div className={styles.topNav}>
        <Link href="/admin/quotes" className={styles.backBtn} id="btn-back-to-quotes">
          <Icon.ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} />
          <span>Back to Quotations</span>
        </Link>

        <div className={styles.topActions}>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => {
              try {
                downloadQuotePDF(quote);
                success('Quotation PDF downloaded successfully!');
              } catch {
                window.open(`/api/quotes/${quote.id}/pdf`, '_blank');
              }
            }}
            id="btn-download-pdf-quote"
            style={{
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              borderColor: '#0F172A',
              fontWeight: 600,
            }}
            title="Download formatted PDF quote"
          >
            <Icon.FileText size={14} />
            <span>Download PDF Quote</span>
          </button>

          <Link
            href={`/quotes/${quote.id}`}
            target="_blank"
            className={styles.actionBtn}
            id="btn-printable-quote"
          >
            <Icon.FileText size={14} />
            <span>Print View &rarr;</span>
          </Link>

          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleCopyWhatsAppText}
            id="btn-copy-wa-text"
          >
            <Icon.Check size={14} />
            <span>Copy WhatsApp Text</span>
          </button>

          <WhatsAppCTA
            phone={quote.customerPhone}
            message={whatsAppSummaryText}
            label="Send via WhatsApp"
            variant="outline"
            size="sm"
          />
        </div>
      </div>

      {/* ── Hero Dossier Header Card ── */}
      <div className={styles.headerCard}>
        <div className={styles.headerLeft}>
          <div className={styles.quoteAvatar}>{clientInitials}</div>
          <div className={styles.headerMeta}>
            <div className={styles.eyebrow}>
              <span>Studio Control</span>
              <span className={styles.eyebrowDot} />
              <span>Commercial Proposals</span>
              <span className={styles.eyebrowDot} />
              <span>Dossier #{quote.id.slice(-6).toUpperCase()}</span>
            </div>
            <h1 className={styles.pageTitle}>{quote.customerName}</h1>
            <div className={styles.headerSubtext}>
              <span>Phone: {quote.customerPhone || 'Not provided'}</span>
              {quote.customerEmail && (
                <>
                  <span>•</span>
                  <span>{quote.customerEmail}</span>
                </>
              )}
              {quote.vehicleText && (
                <>
                  <span>•</span>
                  <span style={{ color: '#B45309', fontWeight: 600 }}>{quote.vehicleText}</span>
                </>
              )}
              <span>•</span>
              <span
                className={`${styles.statusPill} ${
                  styles[`status${quote.status}`] || styles.statusDRAFT
                }`}
              >
                <span className={styles.statusDot} />
                <span>{quote.status}</span>
              </span>
            </div>
          </div>
        </div>

        <div className={styles.contractBadge}>
          Contract Total: ₹{Number(quote.total).toLocaleString('en-IN')}
        </div>
      </div>

      {/* ── Main Two Column Grid ── */}
      <div className={styles.grid}>
        {/* ── Left Column: Primary Content ── */}
        <div className={styles.mainColumn}>
          {/* Card 1: Client & Vehicle Information */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitle}>
                <div className={styles.cardHeaderIcon}>
                  <Icon.Users size={17} />
                </div>
                <div>
                  <h3 className={styles.cardTitle}>Client & Vehicle Parameters</h3>
                  <p className={styles.cardSubtitle}>
                    Verified client contact credentials and garage vehicle profile.
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Client Name</span>
                  <span className={styles.infoValue}>{quote.customerName}</span>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Direct Contact Phone</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className={styles.infoValue} style={{ fontFeatureSettings: 'tnum' }}>
                      {quote.customerPhone}
                    </span>
                    <a
                      href={`tel:${quote.customerPhone}`}
                      style={{ color: '#B45309', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' }}
                    >
                      Call ↗
                    </a>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Vehicle Specification</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.1rem' }}>
                    <Icon.Car size={15} color="#B45309" />
                    <span className={styles.infoValue}>{quote.vehicleText || 'Client Vehicle'}</span>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Proposal Validity</span>
                  <span className={styles.infoValue}>Valid Until {validUntilFormatted}</span>
                </div>

                {quote.leadId && (
                  <div className={styles.infoItem} style={{ gridColumn: 'span 2' }}>
                    <span className={styles.infoLabel}>CRM Lead Lineage</span>
                    <Link href={`/admin/leads/${quote.leadId}`} className={styles.lineageLink}>
                      <Icon.Link size={13} />
                      <span>Linked Inbound Lead #{quote.leadId.slice(-6).toUpperCase()} &rarr;</span>
                    </Link>
                  </div>
                )}

                {quote.linkedBookingId && (
                  <div className={styles.infoItem} style={{ gridColumn: 'span 2' }}>
                    <span className={styles.infoLabel}>Allocated Detailing Bay</span>
                    <Link href={`/admin/bookings/${quote.linkedBookingId}`} className={styles.lineageLink}>
                      <Icon.Bay size={13} />
                      <span>Linked Studio Booking #{quote.linkedBookingId.slice(-6).toUpperCase()} &rarr;</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Treatment Line Items & Commercial Breakdown */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitle}>
                <div className={styles.cardHeaderIcon}>
                  <Icon.Tag size={17} />
                </div>
                <div>
                  <h3 className={styles.cardTitle}>
                    Line Items & Treatments ({quote.items.length})
                  </h3>
                  <p className={styles.cardSubtitle}>
                    Itemized studio packages, ceramic coatings, and surface restoration.
                  </p>
                </div>
              </div>

              {!isEditing && quote.status === 'DRAFT' && (
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => setIsEditing(true)}
                  id="btn-edit-items-toggle"
                >
                  <Icon.Edit size={14} />
                  <span>Revise Items & Pricing</span>
                </button>
              )}
            </div>

            <div className={styles.cardBody}>
              {isEditing ? (
                /* ── Inline Revision Editor ── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table className={styles.itemsTable}>
                      <thead>
                        <tr>
                          <th>Treatment Description</th>
                          <th style={{ width: '80px' }}>Qty</th>
                          <th style={{ width: '140px' }}>Unit Price (₹)</th>
                          <th style={{ width: '130px', textAlign: 'right' }}>Total</th>
                          <th style={{ width: '40px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {editItems.map((item, idx) => (
                          <tr key={idx}>
                            <td>
                              <input
                                type="text"
                                className={styles.inputField}
                                value={item.description}
                                onChange={(e) => handleEditItemChange(idx, 'description', e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                min="1"
                                className={styles.inputField}
                                value={item.quantity}
                                onChange={(e) =>
                                  handleEditItemChange(idx, 'quantity', parseInt(e.target.value) || 1)
                                }
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                step="500"
                                className={styles.inputField}
                                value={item.unitPrice}
                                onChange={(e) =>
                                  handleEditItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)
                                }
                              />
                            </td>
                            <td>
                              <span className={styles.itemTotalText}>
                                ₹{(item.quantity * item.unitPrice).toLocaleString('en-IN')}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className={styles.btnDangerOutline}
                                style={{ padding: '4px 8px' }}
                                onClick={() => handleRemoveEditItem(idx)}
                              >
                                <Icon.Cross size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={handleAddEditItem}
                    >
                      <Icon.Plus size={14} /> + Add Line Item
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <label className={styles.infoLabel}>Discount Concession (₹)</label>
                      <input
                        type="number"
                        min="0"
                        className={styles.inputField}
                        value={editDiscount}
                        onChange={(e) => setEditDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                      />
                    </div>
                  </div>

                  {/* Edit Live Totals */}
                  <div className={styles.ledgerSummary}>
                    <div className={styles.ledgerRow}>
                      <span>Subtotal:</span>
                      <span className={styles.ledgerValue}>₹{editSubtotal.toLocaleString('en-IN')}</span>
                    </div>
                    {editDiscount > 0 && (
                      <div className={styles.ledgerRow}>
                        <span>Discount:</span>
                        <span className={styles.ledgerDiscountValue}>
                          -₹{editDiscount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                    <div className={styles.ledgerRow}>
                      <span>GST (18%):</span>
                      <span className={styles.ledgerTaxValue}>+₹{editTaxAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className={styles.ledgerDivider} />
                    <div className={styles.grandTotalRow}>
                      <span className={styles.grandTotalLabel}>Estimated Total</span>
                      <span className={styles.grandTotalAmount}>
                        ₹{editGrandTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className={styles.btnSecondaryOutline}
                      onClick={() => setIsEditing(false)}
                      disabled={actionLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className={styles.btnPrimaryLarge}
                      style={{ width: 'auto', padding: '0.6rem 1.25rem' }}
                      onClick={handleSaveRevision}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Saving...' : 'Save Updated Quotation'}
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Standard View Mode ── */
                <>
                  <div style={{ overflowX: 'auto' }}>
                    <table className={styles.itemsTable}>
                      <thead>
                        <tr>
                          <th>Item & Treatment</th>
                          <th style={{ width: '70px', textAlign: 'center' }}>Qty</th>
                          <th style={{ width: '140px', textAlign: 'right' }}>Unit Price</th>
                          <th style={{ width: '140px', textAlign: 'right' }}>Line Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quote.items.map((item) => (
                          <tr key={item.id}>
                            <td style={{ fontWeight: 600, color: '#1E293B' }}>{item.description}</td>
                            <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right' }}>
                              ₹{Number(item.unitPrice).toLocaleString('en-IN')}
                            </td>
                            <td>
                              <span className={styles.itemTotalText}>
                                ₹{Number(item.lineTotal).toLocaleString('en-IN')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Financial Ledger */}
                  <div className={styles.ledgerSummary}>
                    <div className={styles.ledgerRow}>
                      <span>Treatments Subtotal:</span>
                      <span className={styles.ledgerValue}>
                        ₹{Number(quote.subtotal).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {Number(quote.discount) > 0 && (
                      <div className={styles.ledgerRow}>
                        <span>Commercial Concession / Discount:</span>
                        <span className={styles.ledgerDiscountValue}>
                          -₹{Number(quote.discount).toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}

                    <div className={styles.ledgerRow}>
                      <span>Statutory GST (18%):</span>
                      <span className={styles.ledgerTaxValue}>
                        +₹{Number(quote.tax).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className={styles.ledgerDivider} />

                    <div className={styles.grandTotalRow}>
                      <span className={styles.grandTotalLabel}>Total Contract Estimate</span>
                      <span className={styles.grandTotalAmount}>
                        ₹{Number(quote.total).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Card 3: Warranty & Terms */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitle}>
                <div className={`${styles.cardHeaderIcon} ${styles.cardHeaderIconSlate}`}>
                  <Icon.Shield size={17} />
                </div>
                <div>
                  <h3 className={styles.cardTitle}>Warranty Commitments & Studio Terms</h3>
                  <p className={styles.cardSubtitle}>
                    Official quality assurance statement and vehicle handover conditions.
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.cardBody}>
              {quote.notes && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Warranty & Quality Notes</span>
                  <span style={{ fontSize: '0.875rem', color: '#1E293B', marginTop: '0.2rem', lineHeight: 1.5 }}>
                    {quote.notes}
                  </span>
                </div>
              )}

              {quote.terms && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Handover & Payment Terms</span>
                  <span style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.2rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                    {quote.terms}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right Column: Lifecycle Operations (Sticky) ── */}
        <div className={styles.sidebarColumn}>
          {/* Card 1: Lifecycle State Machine */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitle}>
                <div className={styles.cardHeaderIcon}>
                  <Icon.Check size={17} />
                </div>
                <div>
                  <h3 className={styles.cardTitle}>Proposal Workflow Console</h3>
                  <p className={styles.cardSubtitle}>Lifecycle transitions & deal locking</p>
                </div>
              </div>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.actionGroup}>
                {quote.status === 'DRAFT' && (
                  <>
                    <button
                      type="button"
                      className={styles.btnPrimaryLarge}
                      onClick={() => handleStatusUpdate('SEND')}
                      disabled={actionLoading}
                      id="btn-mark-sent"
                    >
                      <Icon.Check size={16} />
                      <span>{actionLoading ? 'Updating...' : 'Mark as Sent to Client'}</span>
                    </button>

                    <button
                      type="button"
                      className={styles.btnSecondaryOutline}
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      <Icon.Edit size={14} />
                      <span>{isEditing ? 'Close Revision Editor' : 'Revise Items & Pricing'}</span>
                    </button>

                    <button
                      type="button"
                      className={styles.btnDangerOutline}
                      onClick={() => handleStatusUpdate('DELETE')}
                      disabled={actionLoading}
                      id="btn-delete-draft"
                    >
                      <Icon.Cross size={14} />
                      <span>Discard / Delete Draft</span>
                    </button>
                  </>
                )}

                {quote.status === 'SENT' && (
                  <>
                    <button
                      type="button"
                      className={`${styles.btnPrimaryLarge} ${styles.btnGreenLarge}`}
                      onClick={() => handleStatusUpdate('ACCEPT')}
                      disabled={actionLoading}
                      id="btn-accept-quote"
                    >
                      <Icon.Check size={16} />
                      <span>Customer Accepted Deal</span>
                    </button>

                    <div className={styles.secondaryRow}>
                      <button
                        type="button"
                        className={styles.btnDangerOutline}
                        onClick={() => handleStatusUpdate('DECLINE')}
                        disabled={actionLoading}
                      >
                        <Icon.Cross size={14} />
                        <span>Declined</span>
                      </button>

                      <button
                        type="button"
                        className={styles.btnSecondaryOutline}
                        onClick={() => handleStatusUpdate('EXPIRE')}
                        disabled={actionLoading}
                      >
                        <Icon.Clock size={14} />
                        <span>Expire</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      className={styles.btnSecondaryOutline}
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      <Icon.Edit size={14} />
                      <span>Revise Proposal</span>
                    </button>
                  </>
                )}

                {(quote.status === 'DECLINED' || quote.status === 'EXPIRED') && (
                  <button
                    type="button"
                    className={styles.btnPrimaryLarge}
                    onClick={() => handleStatusUpdate('REVERT_DRAFT')}
                    disabled={actionLoading}
                  >
                    <Icon.Refresh size={16} />
                    <span>Reopen & Revert to Draft</span>
                  </button>
                )}

                {quote.status === 'ACCEPTED' && (
                  <div className={styles.bookingSuccessBanner}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#15803D' }}>
                      ✓ Deal Accepted by Customer
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#166534' }}>
                      Commercial terms agreed. Proceed to detailing bay slot reservation below.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Convert to Booking / Schedule Bay */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitle}>
                <div className={`${styles.cardHeaderIcon} ${styles.cardHeaderIconSlate}`}>
                  <Icon.Bay size={17} />
                </div>
                <div>
                  <h3 className={styles.cardTitle}>Bay Reservation Dispatch</h3>
                  <p className={styles.cardSubtitle}>Lock into detailing calendar</p>
                </div>
              </div>
            </div>

            <div className={styles.cardBody}>
              {quote.linkedBookingId ? (
                <div className={styles.bookingSuccessBanner}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Icon.Check size={16} color="#15803D" />
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#15803D' }}>
                      Bay Slot Reserved
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#166534' }}>
                    Detailing bay slot has been locked for this quotation agreement.
                  </span>
                  <Link
                    href={`/admin/bookings/${quote.linkedBookingId}`}
                    className={styles.btnPrimaryLarge}
                    style={{ marginTop: '0.5rem', textDecoration: 'none' }}
                  >
                    <span>View Booking Dossier &rarr;</span>
                  </Link>
                </div>
              ) : (
                <>
                  {!showBookSection ? (
                    <button
                      type="button"
                      className={styles.btnPrimaryLarge}
                      onClick={() => setShowBookSection(true)}
                      id="btn-open-book-section"
                    >
                      <Icon.Calendar size={16} />
                      <span>Convert to Booking / Schedule Bay</span>
                    </button>
                  ) : (
                    <form onSubmit={handleConvertBooking} className={styles.actionBox}>
                      <span className={styles.actionBoxTitle}>Schedule Detailing Bay Slot</span>

                      <div>
                        <label className={styles.infoLabel}>Assigned Bay Resource</label>
                        <Select
                          size="sm"
                          value={bookResourceId}
                          onChange={(val) => setBookResourceId(val)}
                          options={resources.map((r) => ({
                            value: r.id,
                            label: r.name,
                            icon: <Icon.Bay size={15} />,
                          }))}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div>
                          <label className={styles.infoLabel}>Date</label>
                          <input
                            type="date"
                            className={styles.inputField}
                            value={bookDate}
                            onChange={(e) => setBookDate(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label className={styles.infoLabel}>Start Time</label>
                          <input
                            type="time"
                            className={styles.inputField}
                            value={bookTime}
                            onChange={(e) => setBookTime(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className={styles.infoLabel}>Estimated Duration (Mins)</label>
                        <input
                          type="number"
                          min="30"
                          step="30"
                          className={styles.inputField}
                          value={bookDuration}
                          onChange={(e) => setBookDuration(parseInt(e.target.value) || 120)}
                          required
                        />
                      </div>

                      <div>
                        <label className={styles.infoLabel}>Workshop Instructions</label>
                        <textarea
                          className={`${styles.inputField} ${styles.textareaField}`}
                          rows={2}
                          value={bookNotes}
                          onChange={(e) => setBookNotes(e.target.value)}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="submit"
                          className={styles.btnPrimaryLarge}
                          disabled={actionLoading}
                        >
                          {actionLoading ? 'Locking Slot...' : 'Confirm & Reserve Bay Slot'}
                        </button>
                        <button
                          type="button"
                          className={styles.btnSecondaryOutline}
                          onClick={() => setShowBookSection(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Card 3: Dispatch Registry */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitle}>
                <div className={`${styles.cardHeaderIcon} ${styles.cardHeaderIconSlate}`}>
                  <Icon.Tag size={17} />
                </div>
                <div>
                  <h3 className={styles.cardTitle}>Dispatch Registry</h3>
                  <p className={styles.cardSubtitle}>Audit stamps and client links</p>
                </div>
              </div>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.metaList}>
                <div className={styles.metaRow}>
                  <span>Quote Reference:</span>
                  <span className={styles.metaValue} style={{ fontSize: '0.6875rem' }}>
                    {quote.id}
                  </span>
                </div>

                <div className={styles.metaRow}>
                  <span>Created Timestamp:</span>
                  <span className={styles.metaValue}>
                    {new Date(quote.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div className={styles.metaRow}>
                  <span>Public View Link:</span>
                  <Link
                    href={`/quotes/${quote.id}`}
                    target="_blank"
                    style={{ color: '#B45309', fontWeight: 600, fontSize: '0.75rem' }}
                  >
                    /quotes/{quote.id.slice(-6)} ↗
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
