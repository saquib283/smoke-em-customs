'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { POPULAR_VEHICLE_BRANDS, getModelsForBrand, detectVehicleType } from '@/lib/vehicles';
import styles from './quote.module.css';

interface ServiceOption {
  id: string;
  name: string;
  category: string | null;
  startingPrice: string;
}

interface QuoteFormProps {
  services: ServiceOption[];
  preselectedServiceId?: string;
}

interface UploadedPhoto {
  mediaId: string;
  url: string;
  filename: string;
}

export function QuoteForm({ services, preselectedServiceId }: QuoteFormProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submittedResult, setSubmittedResult] = useState<{
    referenceCode: string;
    estimate: { min: number; max: number } | null;
    isDuplicate?: boolean;
    recommendation?: {
      recommendation: { packageSlug?: string; serviceSlug?: string; confidence: number; rationale: string };
      alternatives: Array<{ packageSlug?: string; serviceSlug?: string; confidence: number }>;
    } | null;
  } | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    // Step 1: Contact
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    preferredContactMethod: 'WHATSAPP' as 'WHATSAPP' | 'CALL' | 'EMAIL',

    // Step 2: Vehicle
    vehicleBrand: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleType: 'SEDAN' as 'HATCHBACK' | 'SEDAN' | 'SUV' | 'MUV' | 'LUXURY' | 'TWO_WHEELER' | 'OTHER',

    // Step 3: Requirements
    serviceInterestId: preselectedServiceId || (services[0]?.id ?? ''),
    vehicleCondition: 'Well Maintained',
    desiredResult: 'Maximum Scratch & Stone Protection',
    preferredDate: '',
    additionalNotes: '',
    photos: [] as UploadedPhoto[],
  });

  const updateField = (field: string, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    setError(null);
  };

  const handleBrandSelect = (brand: string) => {
    updateField('vehicleBrand', brand);
    const models = getModelsForBrand(brand);
    if (models.length > 0) {
      updateField('vehicleModel', models[0].name.split('/')[0].trim());
      updateField('vehicleType', models[0].type);
    }
  };

  // Real-time rules-based estimate calculation
  const liveEstimate = useMemo(() => {
    const service = services.find((s) => s.id === formData.serviceInterestId);
    if (!service) return null;

    const basePrice = parseFloat(service.startingPrice) || 5000;
    let multiplier = 1.0;

    switch (formData.vehicleType) {
      case 'HATCHBACK':
        multiplier = 1.0;
        break;
      case 'SEDAN':
        multiplier = 1.15;
        break;
      case 'SUV':
      case 'MUV':
        multiplier = 1.3;
        break;
      case 'LUXURY':
        multiplier = 1.5;
        break;
      case 'TWO_WHEELER':
        multiplier = 0.5;
        break;
      default:
        multiplier = 1.1;
    }

    let conditionMultiplier = 1.0;
    if (formData.vehicleCondition === 'Heavy Swirls & Scratches') {
      conditionMultiplier = 1.2;
    } else if (formData.vehicleCondition === 'Paint Oxidation / Faded') {
      conditionMultiplier = 1.3;
    }

    const min = Math.round((basePrice * multiplier * conditionMultiplier) / 500) * 500;
    const max = Math.round((min * 1.25) / 500) * 500;

    return { min, max };
  }, [formData.serviceInterestId, formData.vehicleType, formData.vehicleCondition, services]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (formData.photos.length + files.length > 5) {
      setError('You can upload a maximum of 5 vehicle photos.');
      return;
    }

    setUploadingPhotos(true);
    setError(null);

    const newPhotos: UploadedPhoto[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const body = new FormData();
        body.append('file', file);
        body.append('folder', 'leads');

        const res = await fetch('/api/uploads', {
          method: 'POST',
          body,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Failed to upload ${file.name}`);
        }

        newPhotos.push({
          mediaId: data.mediaId,
          url: data.url,
          filename: file.name,
        });
      }

      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, ...newPhotos],
      }));
    } catch (err: any) {
      setError(err.message || 'Error uploading photos. Please try again.');
    } finally {
      setUploadingPhotos(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, idx) => idx !== index),
    }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.customerName.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (!formData.customerPhone.trim() || formData.customerPhone.trim().length < 8) {
        setError('Please enter a valid mobile number (e.g. 9876543210).');
        return;
      }
    } else if (step === 2) {
      if (!formData.vehicleBrand.trim() || !formData.vehicleModel.trim()) {
        setError('Please provide your vehicle brand and model.');
        return;
      }
    }
    setError(null);
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        photoMediaIds: formData.photos.map((p) => p.mediaId),
      };

      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit quote enquiry.');
      }

      setSubmittedResult({
        referenceCode: data.referenceCode,
        estimate: data.estimate,
        isDuplicate: data.isDuplicate,
        recommendation: data.recommendation,
      });
    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success Confirmation Screen ──
  if (submittedResult) {
    const selectedService = services.find((s) => s.id === formData.serviceInterestId);
    const cleanPhone = formData.customerPhone.replace(/\D/g, '');
    const waText = encodeURIComponent(
      `Hello Smoke M Customs! 🏁\nI just requested an instant detailing quote.\n\n` +
      `📋 Reference: ${submittedResult.referenceCode}\n` +
      `👤 Name: ${formData.customerName}\n` +
      `🚗 Vehicle: ${formData.vehicleBrand} ${formData.vehicleModel} (${formData.vehicleType})\n` +
      `✨ Treatment: ${selectedService?.name ?? 'Detailing'}\n` +
      `🔍 Paint Condition: ${formData.vehicleCondition}\n` +
      (submittedResult.estimate ? `💰 Estimate: ₹${submittedResult.estimate.min.toLocaleString('en-IN')} – ₹${submittedResult.estimate.max.toLocaleString('en-IN')}\n` : '') +
      `\nPlease review my requirements and confirm next inspection availability.`
    );

    return (
      <div className={styles.successCard}>
        <div className={styles.successIcon}>✓</div>
        <span className={styles.successTag}>ENQUIRY DISPATCHED</span>
        <h2 className={styles.successTitle}>We Have Received Your Vehicle Details</h2>
        <p className={styles.successSubtitle}>
          A master detailer from Smoke M Customs will review your specifications and reach out via{' '}
          <strong>{formData.preferredContactMethod}</strong> within 2 hours.
        </p>

        {submittedResult.isDuplicate && (
          <div className={styles.duplicateBanner}>
            <span className={styles.duplicateBannerIcon}>ℹ️</span>
            <div>
              <div className={styles.duplicateBannerTitle}>Active Inquiry Recognized</div>
              <p className={styles.duplicateBannerText}>
                We detected a recent quote submission from this mobile number within the last 24 hours.
                Your latest photos and options have been consolidated under reference{' '}
                <strong>{submittedResult.referenceCode}</strong>.
              </p>
            </div>
          </div>
        )}

        <div className={styles.referenceBox}>
          <span className={styles.referenceLabel}>Your Quote Reference</span>
          <span className={styles.referenceCode}>{submittedResult.referenceCode}</span>
        </div>

        {submittedResult.estimate && (
          <div className={styles.estimateBox}>
            <span className={styles.estimateLabel}>Preliminary Algorithmic Estimate</span>
            <span className={styles.estimateVal}>
              ₹{submittedResult.estimate.min.toLocaleString('en-IN')} – ₹{submittedResult.estimate.max.toLocaleString('en-IN')}
            </span>
            <p className={styles.estimateDisclaimer}>
              *Exact final quote is confirmed after visual paint-depth and micrometer measurement at our studio bay.
            </p>
          </div>
        )}

        {submittedResult.recommendation?.recommendation && (
          <div style={{
            margin: 'var(--space-4) 0',
            padding: 'var(--space-4)',
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent-text)', fontWeight: 600, letterSpacing: 'var(--tracking-wide)' }}>
                RECOMMENDED TREATMENT
              </span>
              <span className="badge badge-accent">
                {Math.round(submittedResult.recommendation.recommendation.confidence * 100)}% Match
              </span>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
              {submittedResult.recommendation.recommendation.rationale}
            </p>
          </div>
        )}

        <div className={styles.successActions}>
          <a
            href={`https://wa.me/919876543210?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-lg"
          >
            💬 Open in WhatsApp with Quote Ref
          </a>
          <Link href="/book" className="btn btn-secondary btn-lg">
            Directly Reserve a Bay Slot
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wizardContainer}>
      {/* Step Indicators */}
      <div className={styles.stepBar}>
        <div className={`${styles.stepIndicator} ${step >= 1 ? styles.stepActive : ''}`}>
          <span className={styles.stepNumber}>1</span>
          <span className={styles.stepTitle}>Contact</span>
        </div>
        <div className={styles.stepLine} />
        <div className={`${styles.stepIndicator} ${step >= 2 ? styles.stepActive : ''}`}>
          <span className={styles.stepNumber}>2</span>
          <span className={styles.stepTitle}>Vehicle</span>
        </div>
        <div className={styles.stepLine} />
        <div className={`${styles.stepIndicator} ${step >= 3 ? styles.stepActive : ''}`}>
          <span className={styles.stepNumber}>3</span>
          <span className={styles.stepTitle}>Condition</span>
        </div>
        <div className={styles.stepLine} />
        <div className={`${styles.stepIndicator} ${step >= 4 ? styles.stepActive : ''}`}>
          <span className={styles.stepNumber}>4</span>
          <span className={styles.stepTitle}>Estimate</span>
        </div>
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* ── STEP 1: Contact Details ── */}
        {step === 1 && (
          <div className={styles.stepPanel}>
            <h3 className={styles.panelTitle}>1. Client Information</h3>
            <p className={styles.panelDesc}>How should our master detailer deliver your customized quotation?</p>

            <div className={styles.formGroup}>
              <label htmlFor="customerName" className={styles.label}>
                Full Name <span className={styles.required}>*</span>
              </label>
              <input
                id="customerName"
                type="text"
                className={styles.input}
                placeholder="e.g. Vikram Malhotra"
                value={formData.customerName}
                onChange={(e) => updateField('customerName', e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="customerPhone" className={styles.label}>
                Mobile Number (WhatsApp Preferred) <span className={styles.required}>*</span>
              </label>
              <input
                id="customerPhone"
                type="tel"
                className={styles.input}
                placeholder="e.g. 9876543210"
                value={formData.customerPhone}
                onChange={(e) => updateField('customerPhone', e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="customerEmail" className={styles.label}>
                Email Address (Optional)
              </label>
              <input
                id="customerEmail"
                type="email"
                className={styles.input}
                placeholder="e.g. vikram@example.com"
                value={formData.customerEmail}
                onChange={(e) => updateField('customerEmail', e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Preferred Communication Method</label>
              <div className={styles.pillGroup}>
                {(['WHATSAPP', 'CALL', 'EMAIL'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    className={`${styles.pillBtn} ${formData.preferredContactMethod === method ? styles.pillActive : ''}`}
                    onClick={() => updateField('preferredContactMethod', method)}
                  >
                    {method === 'WHATSAPP' && '💬 WhatsApp'}
                    {method === 'CALL' && '📞 Phone Call'}
                    {method === 'EMAIL' && '✉️ Email'}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.navRow}>
              <div />
              <button type="button" onClick={handleNext} className="btn btn-primary btn-lg">
                Continue to Vehicle &rarr;
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Vehicle Details ── */}
        {step === 2 && (
          <div className={styles.stepPanel}>
            <h3 className={styles.panelTitle}>2. Vehicle Specification</h3>
            <p className={styles.panelDesc}>Accurate vehicle sizing ensures an exact chemical and film measurement.</p>

            <div className={styles.formGroup}>
              <label className={styles.label}>Popular Studio Brands (Quick Select)</label>
              <div className={styles.quickPillsRow}>
                {['BMW', 'Mercedes-Benz', 'Porsche', 'Audi', 'Land Rover', 'Mahindra', 'Tata', 'Toyota'].map((brand) => (
                  <button
                    key={brand}
                    type="button"
                    className={`${styles.quickBrandBtn} ${formData.vehicleBrand === brand ? styles.quickBrandActive : ''}`}
                    onClick={() => handleBrandSelect(brand)}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.twoCol}>
              <div className={styles.formGroup}>
                <label htmlFor="vehicleBrand" className={styles.label}>
                  Brand / Make <span className={styles.required}>*</span>
                </label>
                <input
                  id="vehicleBrand"
                  type="text"
                  className={styles.input}
                  placeholder="e.g. BMW, Mercedes-Benz, Porsche, Thar"
                  value={formData.vehicleBrand}
                  onChange={(e) => updateField('vehicleBrand', e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="vehicleModel" className={styles.label}>
                  Model <span className={styles.required}>*</span>
                </label>
                <input
                  id="vehicleModel"
                  type="text"
                  className={styles.input}
                  placeholder="e.g. 330i M Sport, Thar, Creta, Macan"
                  value={formData.vehicleModel}
                  onChange={(e) => {
                    updateField('vehicleModel', e.target.value);
                    if (formData.vehicleBrand) {
                      const detected = detectVehicleType(formData.vehicleBrand, e.target.value);
                      updateField('vehicleType', detected);
                    }
                  }}
                  required
                />
              </div>
            </div>

            <div className={styles.twoCol}>
              <div className={styles.formGroup}>
                <label htmlFor="vehicleYear" className={styles.label}>
                  Manufacturing Year
                </label>
                <input
                  id="vehicleYear"
                  type="number"
                  className={styles.input}
                  placeholder="e.g. 2024"
                  value={formData.vehicleYear}
                  onChange={(e) => updateField('vehicleYear', e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="vehicleType" className={styles.label}>
                  Vehicle Body Style / Segment
                </label>
                <select
                  id="vehicleType"
                  className={styles.select}
                  value={formData.vehicleType}
                  onChange={(e) => updateField('vehicleType', e.target.value)}
                >
                  <option value="HATCHBACK">Hatchback (e.g. Polo, i20, Altroz)</option>
                  <option value="SEDAN">Sedan (e.g. City, 3 Series, C-Class)</option>
                  <option value="SUV">SUV / Compact SUV (e.g. Creta, Thar, Defender)</option>
                  <option value="MUV">MUV / Van (e.g. Innova Hycross, Carnival)</option>
                  <option value="LUXURY">Supercar / Ultra Luxury (e.g. 911, S-Class, Urus)</option>
                  <option value="TWO_WHEELER">Superbike / Motorcycle</option>
                  <option value="OTHER">Other Vehicle</option>
                </select>
              </div>
            </div>

            <div className={styles.navRow}>
              <button type="button" onClick={handleBack} className="btn btn-secondary">
                &larr; Back
              </button>
              <button type="button" onClick={handleNext} className="btn btn-primary btn-lg">
                Continue to Requirements &rarr;
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Requirements & Condition & Photos ── */}
        {step === 3 && (
          <div className={styles.stepPanel}>
            <h3 className={styles.panelTitle}>3. Paint Condition & Desired Outcome</h3>
            <p className={styles.panelDesc}>Tell us what your paint needs so we can allocate the correct preparation stages.</p>

            <div className={styles.formGroup}>
              <label htmlFor="serviceInterestId" className={styles.label}>
                Primary Treatment of Interest
              </label>
              <select
                id="serviceInterestId"
                className={styles.select}
                value={formData.serviceInterestId}
                onChange={(e) => updateField('serviceInterestId', e.target.value)}
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (From ₹{Number(s.startingPrice).toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Current Paint / Surface Condition</label>
              <div className={styles.pillGrid}>
                {[
                  'Brand New (< 1 Month)',
                  'Well Maintained',
                  'Light Swirl Marks',
                  'Heavy Swirls & Scratches',
                  'Paint Oxidation / Faded',
                ].map((cond) => (
                  <button
                    key={cond}
                    type="button"
                    className={`${styles.pillBtn} ${formData.vehicleCondition === cond ? styles.pillActive : ''}`}
                    onClick={() => updateField('vehicleCondition', cond)}
                  >
                    {cond}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Desired Primary Outcome</label>
              <div className={styles.pillGrid}>
                {[
                  'Maximum Scratch & Stone Protection',
                  'Deep Mirror Gloss & Wet Look',
                  'Interior Sanitization & Leather Revival',
                  'Complete Full Vehicle Reconditioning',
                ].map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    className={`${styles.pillBtn} ${formData.desiredResult === goal ? styles.pillActive : ''}`}
                    onClick={() => updateField('desiredResult', goal)}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>

            {/* Vehicle Photos Upload Widget */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Upload Vehicle & Paint Photos (Optional, up to 5)</label>
              <div
                className={styles.uploadDropzone}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className={styles.uploadIcon}>📷</div>
                <div className={styles.uploadPrompt}>
                  {uploadingPhotos ? 'Uploading & analyzing images...' : 'Click to select or drop paint defect photos'}
                </div>
                <div className={styles.uploadSubtext}>
                  JPEG, PNG, or WebP up to 10MB each. Show scratches, swirl marks, or panels of concern.
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className={styles.fileInputHidden}
                onChange={handleFileUpload}
                disabled={uploadingPhotos}
              />

              {formData.photos.length > 0 && (
                <div className={styles.photoGrid}>
                  {formData.photos.map((photo, idx) => (
                    <div key={photo.mediaId || idx} className={styles.photoCard}>
                      <img src={photo.url} alt={photo.filename} />
                      <button
                        type="button"
                        className={styles.photoRemoveBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          removePhoto(idx);
                        }}
                        title="Remove photo"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="additionalNotes" className={styles.label}>
                Specific Notes or Problem Areas (Optional)
              </label>
              <textarea
                id="additionalNotes"
                className={styles.textarea}
                rows={3}
                placeholder="e.g. Scratched driver side door, hard water spots on windshield, need ready by Saturday..."
                value={formData.additionalNotes}
                onChange={(e) => updateField('additionalNotes', e.target.value)}
              />
            </div>

            <div className={styles.navRow}>
              <button type="button" onClick={handleBack} className="btn btn-secondary">
                &larr; Back
              </button>
              <button type="button" onClick={handleNext} className="btn btn-primary btn-lg">
                View Live Estimate &rarr;
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Review & Live Estimate ── */}
        {step === 4 && (
          <div className={styles.stepPanel}>
            <h3 className={styles.panelTitle}>4. Review & Instant Estimate</h3>
            <p className={styles.panelDesc}>Review your parameters before dispatching your request to our bay queue.</p>

            {/* Dynamic Price Display */}
            {liveEstimate && (
              <div className={styles.liveEstimateCard}>
                <span className={styles.estimateCardTag}>ALGORITHMIC ESTIMATE</span>
                <div className={styles.estimateAmount}>
                  ₹{liveEstimate.min.toLocaleString('en-IN')} – ₹{liveEstimate.max.toLocaleString('en-IN')}
                </div>
                <p className={styles.estimateDetails}>
                  Based on: {formData.vehicleBrand} {formData.vehicleModel} ({formData.vehicleType}) &bull;{' '}
                  {formData.vehicleCondition}
                </p>
              </div>
            )}

            <div className={styles.reviewSummary}>
              <div className={styles.reviewRow}>
                <span className={styles.reviewLabel}>Client:</span>
                <span className={styles.reviewVal}>{formData.customerName} ({formData.customerPhone})</span>
              </div>
              <div className={styles.reviewRow}>
                <span className={styles.reviewLabel}>Vehicle:</span>
                <span className={styles.reviewVal}>
                  {formData.vehicleBrand} {formData.vehicleModel} ({formData.vehicleType})
                </span>
              </div>
              <div className={styles.reviewRow}>
                <span className={styles.reviewLabel}>Treatment:</span>
                <span className={styles.reviewVal}>
                  {services.find((s) => s.id === formData.serviceInterestId)?.name}
                </span>
              </div>
              <div className={styles.reviewRow}>
                <span className={styles.reviewLabel}>Condition:</span>
                <span className={styles.reviewVal}>{formData.vehicleCondition}</span>
              </div>
              <div className={styles.reviewRow}>
                <span className={styles.reviewLabel}>Photos Attached:</span>
                <span className={styles.reviewVal}>
                  {formData.photos.length > 0 ? `📷 ${formData.photos.length} photos ready for assessment` : 'None'}
                </span>
              </div>
            </div>

            <div className={styles.navRow}>
              <button type="button" onClick={handleBack} className="btn btn-secondary">
                &larr; Back
              </button>
              <button
                type="submit"
                disabled={loading || uploadingPhotos}
                className="btn btn-primary btn-lg"
              >
                {loading ? 'Transmitting to CRM...' : 'Dispatch Quote Request'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
