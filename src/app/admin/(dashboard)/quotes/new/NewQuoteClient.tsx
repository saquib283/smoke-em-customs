'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast, Select, type SelectOption } from '@/components/ui';
import { Icon } from '@/components/common/Icons';
import styles from './newQuote.module.css';

export interface LeadOption {
  id: string;
  customerName: string;
  customerId: string;
  customerPhone?: string | null;
  vehicleText?: string | null;
  vehicleId?: string | null;
}

export interface ServiceOption {
  id: string;
  name: string;
  startingPrice: string | number;
}

export interface PackageOption {
  id: string;
  name: string;
  startingPrice?: string | number | null;
  price?: string | number | null;
}

interface NewQuoteClientProps {
  leads: LeadOption[];
  services: ServiceOption[];
  packages: PackageOption[];
  initialLeadId?: string;
}

interface LineItemState {
  serviceId?: string;
  packageId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

const COMMON_PRESET_CHIPS = [
  { name: 'Ceramic Coating (3-Year)', price: 15000 },
  { name: 'Full Front TPU PPF', price: 45000 },
  { name: 'Multi-Stage Paint Correction', price: 8500 },
  { name: 'Interior Leather & Steam Treatment', price: 6000 },
  { name: 'Hydrophobic Glass Shield (All Windows)', price: 4000 },
];

const WARRANTY_PRESETS = [
  {
    label: '3-Year Ceramic Warranty',
    notes: 'Includes 3-year warranty against clear coat degradation, gloss loss, and environmental fallout. Complimentary 6-month inspection & decontamination wash included.',
    terms: '• 50% advance booking deposit required upon vehicle handover.\n• Remaining balance payable upon job completion and pre-delivery inspection.\n• Warranty valid subject to adherence to prescribed annual studio decontamination schedule.',
  },
  {
    label: '5-Year TPU PPF Guarantee',
    notes: 'Covers 5-year manufacturer guarantee against yellowing, cracking, bubbling, or edge-lifting. Complimentary 14-day post-installation edge inspection.',
    terms: '• 50% advance deposit to secure film allocation and bay reservation.\n• Full inspection and sign-off required prior to driving off studio premises.\n• Pressure washing must maintain a minimum 12-inch distance from film edges.',
  },
  {
    label: 'Standard Bespoke Detailing',
    notes: 'Studio craftsmanship guaranteed to concourse showroom standards. 30-day surface protection guarantee.',
    terms: '• Advance payment required upon vehicle booking.\n• Work performed according to vehicle manufacturer paint tolerances.\n• Vehicle storage fees apply 48 hours after completion notification.',
  },
];

export function NewQuoteClient({
  leads,
  services,
  packages,
  initialLeadId,
}: NewQuoteClientProps) {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  // Find initial lead
  const initialSelectedLeadId = useMemo(() => {
    if (initialLeadId && leads.some((l) => l.id === initialLeadId)) {
      return initialLeadId;
    }
    return leads[0]?.id || '';
  }, [initialLeadId, leads]);

  const [targetLeadId, setTargetLeadId] = useState<string>(initialSelectedLeadId);

  const leadOptions = useMemo(() => {
    return leads.map((l) => ({
      value: l.id,
      label: l.customerName,
      sublabel: `${l.customerPhone || 'No Phone'} • ${l.vehicleText || 'Vehicle not specified'}`,
      icon: <Icon.User size={15} />,
    }));
  }, [leads]);
  const [lineItems, setLineItems] = useState<LineItemState[]>(() => {
    const defaultService = services[0];
    return [
      {
        description: defaultService ? defaultService.name : 'Exterior Ceramic Coating',
        quantity: 1,
        unitPrice: defaultService ? Number(defaultService.startingPrice) || 15000 : 15000,
        serviceId: defaultService?.id,
      },
    ];
  });

  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(18);
  const [validDays, setValidDays] = useState<number>(7);
  const [quoteNotes, setQuoteNotes] = useState(
    'Includes 3-year warranty and complimentary 6-month inspection.'
  );
  const [quoteTerms, setQuoteTerms] = useState(
    '• 50% advance booking deposit required upon vehicle handover.\n• Remaining balance payable upon job completion and pre-delivery inspection.\n• Warranty valid subject to adherence to prescribed maintenance schedule.'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected lead object
  const selectedLead = useMemo(() => {
    return leads.find((l) => l.id === targetLeadId) || null;
  }, [leads, targetLeadId]);

  // Client initials
  const clientInitials = useMemo(() => {
    if (!selectedLead?.customerName) return 'SM';
    const parts = selectedLead.customerName.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (selectedLead.customerName[0] || 'C').toUpperCase();
  }, [selectedLead]);

  // Computations
  const subtotal = useMemo(() => {
    return lineItems.reduce((acc, item) => acc + (item.quantity || 1) * (item.unitPrice || 0), 0);
  }, [lineItems]);

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round(taxableAmount * (taxPercent / 100));
  const grandTotal = taxableAmount + taxAmount;

  const validUntilFormatted = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + (Number(validDays) || 7));
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [validDays]);

  // Line item handlers
  const handleAddCustomItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        description: 'Bespoke Studio Treatment',
        quantity: 1,
        unitPrice: 5000,
      },
    ]);
  };

  const handleAddServicePreset = (serviceId: string) => {
    const s = services.find((item) => item.id === serviceId);
    if (!s) return;
    setLineItems((prev) => [
      ...prev,
      {
        serviceId: s.id,
        description: s.name,
        quantity: 1,
        unitPrice: Number(s.startingPrice) || 5000,
      },
    ]);
  };

  const handleAddPackagePreset = (packageId: string) => {
    const p = packages.find((item) => item.id === packageId);
    if (!p) return;
    const priceVal = Number(p.price || p.startingPrice) || 25000;
    setLineItems((prev) => [
      ...prev,
      {
        packageId: p.id,
        description: `${p.name} (Package Suite)`,
        quantity: 1,
        unitPrice: priceVal,
      },
    ]);
  };

  const handleAddQuickChip = (name: string, price: number) => {
    setLineItems((prev) => [
      ...prev,
      {
        description: name,
        quantity: 1,
        unitPrice: price,
      },
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length <= 1) {
      toastError('Quotation must contain at least one line item');
      return;
    }
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof LineItemState, value: any) => {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const applyWarrantyPreset = (preset: typeof WARRANTY_PRESETS[0]) => {
    setQuoteNotes(preset.notes);
    setQuoteTerms(preset.terms);
    success(`Applied ${preset.label} terms`);
  };

  // Submit quotation creation
  const handleCreateQuote = async () => {
    if (!selectedLead) {
      toastError('Please select a valid target client / lead');
      return;
    }

    if (lineItems.length === 0 || !lineItems.some((i) => i.description.trim())) {
      toastError('Please specify at least one valid line item with description');
      return;
    }

    setIsSubmitting(true);
    try {
      const validUntilDate = new Date();
      validUntilDate.setDate(validUntilDate.getDate() + (Number(validDays) || 7));

      const payload = {
        leadId: selectedLead.id,
        customerId: selectedLead.customerId,
        vehicleId: selectedLead.vehicleId || undefined,
        items: lineItems.map((item) => ({
          serviceId: item.serviceId,
          packageId: item.packageId,
          description: item.description.trim(),
          quantity: Number(item.quantity) || 1,
          unitPrice: String(item.unitPrice || 0),
        })),
        discount: String(discountAmount),
        tax: String(taxAmount),
        validUntil: validUntilDate.toISOString(),
        notes: quoteNotes,
        terms: quoteTerms,
      };

      const res = await fetch('/api/admin/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE', quoteData: payload }),
      });

      const data = await res.json();
      if (data.success && data.quote) {
        success('Formal studio quotation successfully generated in DRAFT status!');
        router.push(`/admin/quotes/${data.quote.id}`);
      } else {
        toastError(data.error || 'Failed to generate quotation');
      }
    } catch {
      toastError('Error connecting to studio quotation service');
    } finally {
      setIsSubmitting(false);
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
        <div className={styles.navBadge}>
          <Icon.Tag size={13} />
          <span>New Proposal Composer</span>
        </div>
      </div>

      {/* ── Hero Page Header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>
            <span>Studio Control</span>
            <span className={styles.eyebrowDot} />
            <span>Commercial Proposals</span>
            <span className={styles.eyebrowDot} />
            <span>Quotation Engine</span>
          </div>
          <h1 className={styles.pageTitle}>Generate Formal Studio Quotation</h1>
          <p className={styles.pageSubtitle}>
            Configure treatment line items, apply bespoke pricing concessions, calculate statutory taxes,
            and issue official client proposals with real-time financial accuracy.
          </p>
        </div>

        <div className={styles.headerActions}>
          <Link href="/admin/quotes" className={styles.cancelBtn}>
            Cancel
          </Link>
          <button
            type="button"
            className={styles.primaryActionBtn}
            onClick={handleCreateQuote}
            disabled={isSubmitting}
            id="btn-save-quote-top"
          >
            <Icon.Check size={16} />
            <span>{isSubmitting ? 'Generating...' : 'Save & Issue Quotation (DRAFT)'}</span>
          </button>
        </div>
      </div>

      {/* ── Two Column Composer Grid ── */}
      <div className={styles.composerGrid}>
        {/* ── Left / Main Column ── */}
        <div className={styles.mainColumn}>
          {/* Card 1: Target Client & Vehicle */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitle}>
                <div className={styles.cardHeaderIcon}>
                  <Icon.Users size={17} />
                </div>
                <div>
                  <h3 className={styles.cardTitle}>Target Client & Vehicle</h3>
                  <p className={styles.cardSubtitle}>
                    Associate proposal with a registered client lead and garage vehicle profile.
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <span>Select Active Lead / Client</span>
                  <span className={styles.labelHelper}>{leads.length} active leads available</span>
                </label>
                <Select
                  value={targetLeadId}
                  onChange={(val) => setTargetLeadId(val)}
                  options={leadOptions}
                  searchable={leadOptions.length > 5}
                  searchPlaceholder="Search active clients or vehicles..."
                />
              </div>

              {selectedLead && (
                <div className={styles.clientPreviewCard}>
                  <div className={styles.clientMeta}>
                    <div className={styles.clientAvatar}>{clientInitials}</div>
                    <div className={styles.clientDetails}>
                      <span className={styles.clientName}>{selectedLead.customerName}</span>
                      <div className={styles.clientContact}>
                        <span>{selectedLead.customerPhone || 'Phone unlisted'}</span>
                        <span>•</span>
                        <span>Client ID: {selectedLead.customerId.slice(-6).toUpperCase()}</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.vehicleBadge}>
                    <Icon.Car size={15} color="#B45309" />
                    <span>{selectedLead.vehicleText || 'Vehicle unassigned'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Line Items & Studio Treatments */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitle}>
                <div className={styles.cardHeaderIcon}>
                  <Icon.Tag size={17} />
                </div>
                <div>
                  <h3 className={styles.cardTitle}>Line Items & Treatments ({lineItems.length})</h3>
                  <p className={styles.cardSubtitle}>
                    Add ceramic packages, TPU PPF films, custom corrective detailing, or parts.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className={styles.addCustomBtn}
                onClick={handleAddCustomItem}
                id="btn-add-custom-item"
              >
                <Icon.Plus size={14} />
                <span>Custom Item</span>
              </button>
            </div>

            <div className={styles.cardBody}>
              {/* Presets Selector Toolbar */}
              <div className={styles.presetsBar}>
                <div className={styles.presetDropdownGroup}>
                  {services.length > 0 && (
                    <div style={{ minWidth: '220px' }}>
                      <Select
                        size="sm"
                        placeholder="+ Add Service Preset..."
                        value=""
                        onChange={(val) => {
                          if (val) handleAddServicePreset(val);
                        }}
                        options={services.map((s) => ({
                          value: s.id,
                          label: s.name,
                          badge: `₹${Number(s.startingPrice).toLocaleString('en-IN')}`,
                          icon: <Icon.Sparkles size={14} />,
                        }))}
                      />
                    </div>
                  )}

                  {packages.length > 0 && (
                    <div style={{ minWidth: '220px' }}>
                      <Select
                        size="sm"
                        placeholder="+ Add Package Suite..."
                        value=""
                        onChange={(val) => {
                          if (val) handleAddPackagePreset(val);
                        }}
                        options={packages.map((p) => ({
                          value: p.id,
                          label: p.name,
                          icon: <Icon.Package size={14} />,
                        }))}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Line Items Table */}
              <div style={{ overflowX: 'auto' }}>
                <table className={styles.itemsTable}>
                  <thead>
                    <tr>
                      <th style={{ minWidth: '280px' }}>Treatment Description</th>
                      <th style={{ width: '90px' }}>Qty</th>
                      <th style={{ width: '150px' }}>Unit Price (₹)</th>
                      <th style={{ width: '140px', textAlign: 'right' }}>Total (₹)</th>
                      <th style={{ width: '50px', textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item, index) => {
                      const itemTotal = (item.quantity || 1) * (item.unitPrice || 0);
                      return (
                        <tr key={index}>
                          <td>
                            <input
                              type="text"
                              className={styles.tableInput}
                              placeholder="Treatment or package name"
                              value={item.description}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="1"
                              className={styles.tableInput}
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              step="500"
                              className={styles.tableInput}
                              value={item.unitPrice}
                              onChange={(e) =>
                                handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)
                              }
                            />
                          </td>
                          <td>
                            <span className={styles.lineTotalText}>
                              ₹{itemTotal.toLocaleString('en-IN')}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className={styles.deleteItemBtn}
                              onClick={() => handleRemoveLineItem(index)}
                              title="Delete Item"
                            >
                              <Icon.Trash size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Quick Preset Chips */}
              <div className={styles.suggestionsRow}>
                <span className={styles.suggestionLabel}>Quick Suggestions:</span>
                {COMMON_PRESET_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={styles.chipBtn}
                    onClick={() => handleAddQuickChip(chip.name, chip.price)}
                  >
                    + {chip.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card 3: Terms, Warranty & Studio Notes */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitle}>
                <div className={styles.cardHeaderIcon}>
                  <Icon.Shield size={17} />
                </div>
                <div>
                  <h3 className={styles.cardTitle}>Warranty, Terms & Handover Conditions</h3>
                  <p className={styles.cardSubtitle}>
                    Official studio commitments, payment stages, and surface warranty duration.
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.cardBody}>
              {/* Presets */}
              <div className={styles.suggestionsRow} style={{ marginBottom: '0.25rem' }}>
                <span className={styles.suggestionLabel}>Apply Standard Preset:</span>
                {WARRANTY_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={styles.chipBtn}
                    onClick={() => applyWarrantyPreset(p)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Warranty & Studio Notes</label>
                <textarea
                  className={`${styles.textInput} ${styles.textarea}`}
                  rows={2}
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  placeholder="e.g. Includes 3-year warranty against clear coat degradation and complimentary 6-month checkup."
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Terms & Handover Conditions</label>
                <textarea
                  className={`${styles.textInput} ${styles.textarea}`}
                  rows={3}
                  value={quoteTerms}
                  onChange={(e) => setQuoteTerms(e.target.value)}
                  placeholder="Specify deposit percentages, delivery conditions, or warranty maintenance prerequisites."
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Right / Sticky Sidebar Column ── */}
        <div className={styles.sidebarColumn}>
          {/* Card: Commercial Breakdown & Calculations */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTitle}>
                <div className={`${styles.cardHeaderIcon} ${styles.cardHeaderIconSlate}`}>
                  <Icon.FileText size={17} />
                </div>
                <div>
                  <h3 className={styles.cardTitle}>Commercial Ledger</h3>
                  <p className={styles.cardSubtitle}>Live pricing & tax calculations</p>
                </div>
              </div>
            </div>

            <div className={styles.cardBody}>
              {/* Concession / Discount Input */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Commercial Concession / Discount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  className={styles.textInput}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  id="input-discount"
                />
              </div>

              {/* Statutory Tax Rate */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Statutory GST Rate (%)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className={styles.textInput}
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(Math.max(0, parseFloat(e.target.value) || 0))}
                    id="input-gst"
                  />
                  <button
                    type="button"
                    className={styles.chipBtn}
                    onClick={() => setTaxPercent(18)}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    18% GST
                  </button>
                  <button
                    type="button"
                    className={styles.chipBtn}
                    onClick={() => setTaxPercent(0)}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    0% Exempt
                  </button>
                </div>
              </div>

              {/* Validity Window */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Proposal Validity (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  className={styles.textInput}
                  value={validDays}
                  onChange={(e) => setValidDays(Math.max(1, parseInt(e.target.value) || 7))}
                  id="input-valid-days"
                />
                <div className={styles.expiryBadge}>
                  <Icon.Calendar size={13} color="#B45309" />
                  <span>Valid until {validUntilFormatted}</span>
                </div>
              </div>

              {/* Financial Ledger Summary */}
              <div className={styles.ledgerSummary}>
                <div className={styles.ledgerRow}>
                  <span>Treatments Subtotal:</span>
                  <span className={styles.ledgerValue}>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>

                {discountAmount > 0 && (
                  <div className={styles.ledgerRow}>
                    <span>Concession / Discount:</span>
                    <span className={styles.ledgerDiscountValue}>
                      -₹{discountAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                <div className={styles.ledgerRow}>
                  <span>Taxable Base:</span>
                  <span className={styles.ledgerValue}>₹{taxableAmount.toLocaleString('en-IN')}</span>
                </div>

                <div className={styles.ledgerRow}>
                  <span>Statutory GST ({taxPercent}%):</span>
                  <span className={styles.ledgerTaxValue}>+₹{taxAmount.toLocaleString('en-IN')}</span>
                </div>

                <div className={styles.ledgerDivider} />

                <div className={styles.grandTotalRow}>
                  <span className={styles.grandTotalLabel}>Total Estimate</span>
                  <span className={styles.grandTotalAmount} id="grand-total-display">
                    ₹{grandTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Issuance Action Buttons */}
              <div className={styles.issuanceBox}>
                <button
                  type="button"
                  className={styles.sidebarActionBtn}
                  onClick={handleCreateQuote}
                  disabled={isSubmitting}
                  id="btn-save-quote-sidebar"
                >
                  <Icon.Check size={16} />
                  <span>{isSubmitting ? 'Saving Proposal...' : 'Save & Issue Quotation (DRAFT)'}</span>
                </button>

                <Link href="/admin/quotes" className={styles.sidebarSecondaryBtn}>
                  Cancel & Return to List
                </Link>
              </div>

              {/* Studio Policy Notice */}
              <div className={styles.workflowNotice}>
                <Icon.FileText size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  Quotations initialize in <strong>DRAFT</strong> status. You can review, download PDF,
                  or dispatch an instant WhatsApp proposal to the client upon creation.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
