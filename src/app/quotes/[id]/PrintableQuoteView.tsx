'use client';

import React from 'react';
import Link from 'next/link';
import { QuoteDetail } from '@/modules/quoting';
import { generateQuoteWhatsAppSummary, whatsappAdapter } from '@/modules/whatsapp';
import { Icon } from '@/components/common/Icons';
import styles from './quoteView.module.css';

interface PrintableQuoteViewProps {
  quote: QuoteDetail;
}

export function PrintableQuoteView({ quote }: PrintableQuoteViewProps) {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.href : `https://smokecustoms.com/quotes/${quote.id}`;
  const waSummary = generateQuoteWhatsAppSummary(quote, currentUrl);
  const waDeepLink = whatsappAdapter.buildDeepLink(
    quote.customerPhone || '919876543210',
    waSummary
  );

  const subtotalNum = Number(quote.subtotal) || 0;
  const discountNum = Number(quote.discount) || 0;
  const taxNum = Number(quote.tax) || 0;
  const totalNum = Number(quote.total) || 0;

  const validUntilFormatted = quote.validUntil
    ? new Date(quote.validUntil).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '7 Days from Issue';

  const dateIssuedFormatted = new Date(quote.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className={styles.pageContainer}>
      {/* ── Interactive Action Bar (Hidden when printed) ── */}
      <div className={styles.actionBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Link href="/" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
            &larr; Back to Home
          </Link>
        </div>

        <div className={styles.actionBtnGroup}>
          <button type="button" className={styles.btnPrint} onClick={handlePrint} id="btn-print-quote">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon.Printer size={16} /> Print / Save PDF
            </span>
          </button>

          <a
            href={waDeepLink}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.btnWhatsApp}
            id="btn-whatsapp-quote"
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon.WhatsApp size={16} /> Discuss on WhatsApp
            </span>
          </a>

          {quote.linkedBookingId ? (
            <Link href={`/booking/${quote.linkedBookingId}`} className={styles.bookedBadge}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icon.Check size={14} color="#10B981" /> Bay Slot Reserved (View Booking)
              </span>
            </Link>
          ) : (
            <Link
              href={`/book?quoteId=${quote.id}`}
              className={styles.btnBook}
              id="btn-book-quote-slot"
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icon.Calendar size={16} /> Accept & Reserve Bay Slot &rarr;
              </span>
            </Link>
          )}
        </div>
      </div>

      {/* ── Formal Quotation Sheet ── */}
      <div className={styles.quoteDocument} id="printable-quote-sheet">
        {/* Header */}
        <div className={styles.docHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Smoke 'Em Customs"
              width="64"
              height="64"
              className={styles.quoteLogo}
            />
            <div>
              <div className={styles.brandLogo}>Smoke &apos;Em Customs</div>
              <div className={styles.brandSubtitle}>
                Luxury Detailing & Advanced Surface Protection Studio<br />
                #42, Indiranagar 100ft Road, Bengaluru, Karnataka 560038<br />
                Phone: +91 98765 43210 &bull; Email: studio@smokecustoms.com<br />
                GSTIN: 29ABCDE1234F1Z5
              </div>
            </div>
          </div>

          <div className={styles.docMeta}>
            <div className={styles.docTitle}>Estimate / Quotation</div>
            <div className={styles.docRef}>#{quote.id.slice(-6).toUpperCase()}</div>
            <div>
              <span className={`${styles.statusBadge} ${styles['status' + quote.status]}`}>
                {quote.status}
              </span>
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>
              Date: <strong>{dateIssuedFormatted}</strong>
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              Valid Until: <strong>{validUntilFormatted}</strong>
            </div>
          </div>
        </div>

        {/* Client & Vehicle Info */}
        <div className={styles.partiesGrid}>
          <div className={styles.partyBox}>
            <span className={styles.partyLabel}>Prepared For (Client)</span>
            <span className={styles.partyName}>{quote.customerName}</span>
            <span className={styles.partyDetail}>Contact: {quote.customerPhone || 'Not provided'}</span>
            {quote.customerEmail && (
              <span className={styles.partyDetail}>Email: {quote.customerEmail}</span>
            )}
          </div>

          <div className={styles.partyBox}>
            <span className={styles.partyLabel}>Vehicle Specification</span>
            <span className={styles.partyName}>
              {quote.vehicleText || 'Client Vehicle (Inspection at Intake)'}
            </span>
            <span className={styles.partyDetail}>
              Service Location: Smoke M Customs Studio Bay 1 / 2
            </span>
            {quote.issuedByName && (
              <span className={styles.partyDetail}>Estimator: {quote.issuedByName}</span>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.itemsTable}>
            <thead>
              <tr>
                <th style={{ width: '5%' }}>#</th>
                <th style={{ width: '55%' }}>Description & Treatment Details</th>
                <th style={{ width: '10%' }} className={styles.textCenter}>Qty</th>
                <th style={{ width: '15%' }} className={styles.textRight}>Rate (₹)</th>
                <th style={{ width: '15%' }} className={styles.textRight}>Line Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {quote.items.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className={styles.itemNumber}>{idx + 1}</td>
                  <td>
                    <div className={styles.itemDesc}>{item.description}</div>
                    <div className={styles.itemSub}>Certified installer application & warranty coverage</div>
                  </td>
                  <td className={styles.textCenter}>{item.quantity}</td>
                  <td className={styles.textRight}>
                    ₹{Number(item.unitPrice).toLocaleString('en-IN')}
                  </td>
                  <td className={`${styles.textRight} ${styles.itemTotal}`}>
                    ₹{Number(item.lineTotal).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Calculation & Notes */}
        <div className={styles.summarySection}>
          <div className={styles.notesColumn}>
            {quote.notes && (
              <div className={styles.noteBlock}>
                <div className={styles.noteTitle}>Studio Notes & Warranty Coverage</div>
                <div className={styles.noteText}>{quote.notes}</div>
              </div>
            )}

            {quote.terms && (
              <div className={styles.noteBlock}>
                <div className={styles.noteTitle}>Terms of Service & Handover Conditions</div>
                <div className={styles.noteText}>{quote.terms}</div>
              </div>
            )}
          </div>

          <div className={styles.totalsColumn}>
            <div className={styles.calcRow}>
              <span>Subtotal:</span>
              <span>₹{subtotalNum.toLocaleString('en-IN')}</span>
            </div>

            {discountNum > 0 && (
              <div className={`${styles.calcRow} ${styles.calcRowDiscount}`}>
                <span>Discount / Studio Benefit:</span>
                <span>-₹{discountNum.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className={styles.calcRow}>
              <span>GST (18% Detailing Tax):</span>
              <span>+₹{taxNum.toLocaleString('en-IN')}</span>
            </div>

            <div className={styles.grandTotalRow}>
              <span>Total Payable:</span>
              <span>₹{totalNum.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Footer & Signature Block */}
        <div className={styles.docFooter}>
          <div className={styles.footerNotes}>
            <strong>Payment Instructions:</strong> 50% advance to confirm bay schedule via UPI/Bank Transfer.
            Balance upon inspection during delivery. This is a computer-generated quotation document.
          </div>

          <div className={styles.signBox}>
            <div className={styles.signLine} />
            <span className={styles.signTitle}>Authorized Studio Signatory</span>
            <span className={styles.signCompany}>Smoke M Customs Detailing</span>
          </div>
        </div>
      </div>
    </div>
  );
}
