'use client';

import React, { useState } from 'react';
import styles from './quotes.module.css';

interface QuoteItem {
  id: string;
  customerName: string;
  leadId: string;
  status: string;
  total: string;
  validUntil: string | null;
  createdAt: string;
}

interface LeadOption {
  id: string;
  customerName: string;
  customerId: string;
  customerPhone: string;
  vehicleText: string | null;
}

interface ServiceOption {
  id: string;
  name: string;
  startingPrice: string;
}

interface QuotesClientProps {
  initialQuotes: QuoteItem[];
  leads: LeadOption[];
  services: ServiceOption[];
}

interface NewLineItem {
  serviceId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export function QuotesClient({ initialQuotes, leads, services }: QuotesClientProps) {
  const [quotes, setQuotes] = useState<QuoteItem[]>(initialQuotes);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [selectedQuoteDetail, setSelectedQuoteDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State for New Quote
  const [selectedLeadId, setSelectedLeadId] = useState<string>(leads[0]?.id || '');
  const [lineItems, setLineItems] = useState<NewLineItem[]>([
    {
      description: services[0]?.name || 'Exterior Ceramic Coating',
      quantity: 1,
      unitPrice: Number(services[0]?.startingPrice) || 15000,
      serviceId: services[0]?.id || undefined,
    },
  ]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(18); // standard 18% GST for detailing
  const [quoteNotes, setQuoteNotes] = useState('Includes 3-year warranty and complimentary 6-month inspection.');

  const statuses = ['ALL', 'DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED'];

  const filtered = quotes.filter((q) => {
    if (filterStatus !== 'ALL' && q.status !== filterStatus) return false;
    if (searchTerm.trim()) {
      const match = q.customerName.toLowerCase().includes(searchTerm.toLowerCase());
      if (!match) return false;
    }
    return true;
  });

  // Calculate totals
  const subtotal = lineItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const taxAmount = Math.round((subtotal - discountAmount) * (taxPercent / 100));
  const finalTotal = Math.max(0, subtotal - discountAmount + taxAmount);

  const handleAddLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        description: 'Custom Detailing Add-on',
        quantity: 1,
        unitPrice: 2500,
      },
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof NewLineItem, value: any) => {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleServiceSelect = (index: number, serviceId: string) => {
    const s = services.find((srv) => srv.id === serviceId);
    if (!s) return;
    setLineItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              serviceId: s.id,
              description: s.name,
              unitPrice: Number(s.startingPrice) || 5000,
            }
          : item
      )
    );
  };

  const handleCreateQuote = async () => {
    const chosenLead = leads.find((l) => l.id === selectedLeadId);
    if (!chosenLead) {
      alert('Please select a valid lead/customer');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        leadId: chosenLead.id,
        customerId: chosenLead.customerId,
        items: lineItems.map((item) => ({
          serviceId: item.serviceId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: String(item.unitPrice),
        })),
        discount: String(discountAmount),
        tax: String(taxAmount),
        notes: quoteNotes,
        terms: 'Payment 50% advance upon vehicle handover, balance upon inspection and delivery.',
      };

      const res = await fetch('/api/admin/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE', quoteData: payload }),
      });
      const data = await res.json();
      if (data.success && data.quote) {
        setQuotes((prev) => [
          {
            id: data.quote.id,
            customerName: chosenLead.customerName,
            leadId: chosenLead.id,
            status: data.quote.status,
            total: data.quote.total,
            validUntil: data.quote.validUntil,
            createdAt: data.quote.createdAt,
          },
          ...prev,
        ]);
        setShowCreateModal(false);
      } else {
        alert(data.error || 'Failed to generate quotation');
      }
    } catch {
      alert('Error connecting to quotation service');
    } finally {
      setActionLoading(false);
    }
  };

  const openQuoteDetail = async (id: string) => {
    setSelectedQuoteId(id);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/quotes?id=${id}`);
      const data = await res.json();
      if (data.success && data.quote) {
        setSelectedQuoteDetail(data.quote);
      }
    } catch {
      // Ignore
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusUpdate = async (action: 'SEND' | 'ACCEPT' | 'DECLINE') => {
    if (!selectedQuoteId) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, quoteId: selectedQuoteId }),
      });
      const data = await res.json();
      if (data.success && data.quote) {
        setSelectedQuoteDetail((prev: any) => ({ ...prev, status: data.quote.status }));
        setQuotes((prev) =>
          prev.map((q) => (q.id === selectedQuoteId ? { ...q, status: data.quote.status } : q))
        );
      }
    } catch {
      alert('Failed to update quote status');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>Studio Quotations</h1>
          <p className={styles.headerSubtitle}>
            Issue customized line-item proposals, manage discounts, and dispatch WhatsApp invoices.
          </p>
        </div>

        <button className={styles.newQuoteBtn} onClick={() => setShowCreateModal(true)}>
          + Generate New Quotation
        </button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.filterGroup}>
          {statuses.map((st) => (
            <button
              key={st}
              className={`${styles.tabBtn} ${filterStatus === st ? styles.activeTab : ''}`}
              onClick={() => setFilterStatus(st)}
            >
              {st}
            </button>
          ))}
        </div>

        <div className={styles.searchBox}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Quote Ref</th>
                <th>Customer</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Date Generated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    No quotes found. Click "+ Generate New Quotation" to create one.
                  </td>
                </tr>
              ) : (
                filtered.map((q) => (
                  <tr key={q.id} className={styles.row}>
                    <td>
                      <span className={styles.quoteNumber}>#{q.id.slice(-6).toUpperCase()}</span>
                    </td>
                    <td>
                      <strong>{q.customerName}</strong>
                    </td>
                    <td>
                      <span className={styles.totalAmount}>
                        ₹{Number(q.total).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles['badge' + q.status]}`}>
                        {q.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                      {new Date(q.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td>
                      <button className={styles.actionBtn} onClick={() => openQuoteDetail(q.id)}>
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE QUOTE MODAL */}
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Generate Detailing Quotation</h2>
              <button className={styles.closeBtn} onClick={() => setShowCreateModal(false)}>
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Select Lead */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Target Lead / Customer</label>
                <select
                  className={styles.selectInput}
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                >
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.customerName} ({l.customerPhone}) — {l.vehicleText || 'No vehicle'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Line Items */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Services & Line Items</label>
                <div className={styles.itemsCard}>
                  {lineItems.map((item, index) => (
                    <div key={index} className={styles.itemRow}>
                      <div className={styles.itemDesc}>
                        <input
                          type="text"
                          className={styles.textInput}
                          placeholder="Service name / description"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        />
                      </div>

                      <div className={styles.itemQty}>
                        <input
                          type="number"
                          min="1"
                          className={styles.textInput}
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)
                          }
                        />
                      </div>

                      <div className={styles.itemPrice}>
                        <input
                          type="number"
                          className={styles.textInput}
                          placeholder="Price (₹)"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>

                      <div className={styles.itemTotal}>
                        ₹{(item.quantity * item.unitPrice).toLocaleString('en-IN')}
                      </div>

                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          className={styles.removeItemBtn}
                          onClick={() => handleRemoveLineItem(index)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}

                  <button type="button" className={styles.addItemBtn} onClick={handleAddLineItem}>
                    + Add Another Item
                  </button>
                </div>
              </div>

              {/* Discount, Tax & Summary */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', flex: 1, minWidth: '240px' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Discount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      className={styles.textInput}
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>GST Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      className={styles.textInput}
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className={styles.totalsGrid}>
                  <div className={styles.totalRow}>
                    <span>Subtotal:</span>
                    <span>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className={styles.totalRow}>
                    <span>Discount:</span>
                    <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className={styles.totalRow}>
                    <span>GST ({taxPercent}%):</span>
                    <span>+₹{taxAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className={styles.grandTotalRow}>
                    <span>Total Estimate:</span>
                    <span>₹{finalTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Warranty & Studio Notes</label>
                <textarea
                  className={styles.textInput}
                  rows={2}
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.tabBtn}
                onClick={() => setShowCreateModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className={styles.newQuoteBtn}
                onClick={handleCreateQuote}
                disabled={actionLoading}
              >
                Save & Issue Quotation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW QUOTE DETAILS MODAL */}
      {selectedQuoteId && (
        <div className={styles.modalOverlay} onClick={() => setSelectedQuoteId(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                Quotation #{selectedQuoteId.slice(-6).toUpperCase()}
              </h2>
              <button className={styles.closeBtn} onClick={() => setSelectedQuoteId(null)}>
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              {detailLoading || !selectedQuoteDetail ? (
                <p>Loading quotation details...</p>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold' }}>
                        {selectedQuoteDetail.customerName}
                      </h3>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                        Phone: {selectedQuoteDetail.customerPhone}
                      </p>
                    </div>

                    <span
                      className={`${styles.badge} ${
                        styles['badge' + selectedQuoteDetail.status]
                      }`}
                    >
                      {selectedQuoteDetail.status}
                    </span>
                  </div>

                  {/* Items Table */}
                  <div className={styles.itemsCard}>
                    <table style={{ width: '100%', fontSize: 'var(--text-xs)', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                          <th style={{ paddingBottom: 'var(--space-2)' }}>Item</th>
                          <th style={{ paddingBottom: 'var(--space-2)', textAlign: 'center' }}>Qty</th>
                          <th style={{ paddingBottom: 'var(--space-2)', textAlign: 'right' }}>Unit Price</th>
                          <th style={{ paddingBottom: 'var(--space-2)', textAlign: 'right' }}>Line Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedQuoteDetail.items?.map((item: any) => (
                          <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <td style={{ padding: 'var(--space-2) 0' }}>{item.description}</td>
                            <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right' }}>
                              ₹{Number(item.unitPrice).toLocaleString('en-IN')}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--color-accent-primary)' }}>
                              ₹{Number(item.lineTotal).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className={styles.totalsGrid}>
                      <div className={styles.totalRow}>
                        <span>Subtotal:</span>
                        <span>₹{Number(selectedQuoteDetail.subtotal).toLocaleString('en-IN')}</span>
                      </div>
                      <div className={styles.totalRow}>
                        <span>Discount:</span>
                        <span>-₹{Number(selectedQuoteDetail.discount).toLocaleString('en-IN')}</span>
                      </div>
                      <div className={styles.totalRow}>
                        <span>GST Tax:</span>
                        <span>+₹{Number(selectedQuoteDetail.tax).toLocaleString('en-IN')}</span>
                      </div>
                      <div className={styles.grandTotalRow}>
                        <span>Total:</span>
                        <span>₹{Number(selectedQuoteDetail.total).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {selectedQuoteDetail.notes && (
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg-primary)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                      <strong>Notes:</strong> {selectedQuoteDetail.notes}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-2)' }}>
                    {selectedQuoteDetail.status === 'DRAFT' && (
                      <button
                        className={styles.newQuoteBtn}
                        onClick={() => handleStatusUpdate('SEND')}
                        disabled={actionLoading}
                      >
                        ✓ Mark Sent
                      </button>
                    )}

                    {selectedQuoteDetail.status === 'SENT' && (
                      <>
                        <button
                          className={styles.newQuoteBtn}
                          style={{ background: '#10B981', color: '#FFF' }}
                          onClick={() => handleStatusUpdate('ACCEPT')}
                          disabled={actionLoading}
                        >
                          ✓ Customer Accepted
                        </button>
                        <button
                          className={styles.tabBtn}
                          style={{ color: '#EF4444', borderColor: 'rgba(239,68,68,0.4)' }}
                          onClick={() => handleStatusUpdate('DECLINE')}
                          disabled={actionLoading}
                        >
                          ✕ Customer Declined
                        </button>
                      </>
                    )}

                    {/* WhatsApp Pre-filled Quote Link */}
                    {selectedQuoteDetail.customerPhone && (
                      <a
                        className={styles.btnWhatsApp}
                        target="_blank"
                        rel="noopener noreferrer"
                        href={`https://wa.me/${selectedQuoteDetail.customerPhone.replace(
                          /[^0-9]/g,
                          ''
                        )}?text=${encodeURIComponent(
                          `Hello ${selectedQuoteDetail.customerName}, Smoke M Customs has generated your detailing proposal #${selectedQuoteDetail.id
                            .slice(-6)
                            .toUpperCase()} for ₹${Number(selectedQuoteDetail.total).toLocaleString(
                            'en-IN'
                          )}.\n\nSummary of Services:\n${selectedQuoteDetail.items
                            ?.map((i: any) => `• ${i.description} (₹${Number(i.lineTotal).toLocaleString('en-IN')})`)
                            .join('\n')}\n\nPlease let us know if you'd like to book your bay slot!`
                        )}`}
                      >
                        💬 Send Quote via WhatsApp
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
