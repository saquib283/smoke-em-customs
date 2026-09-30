'use client';

import React, { useState } from 'react';
import { Icon } from '@/components/common/Icons';
import { Select, type SelectOption } from '@/components/ui';
import styles from './ContactForm.module.css';

const CONTACT_SERVICE_OPTIONS: SelectOption[] = [
  { value: 'Paint Protection Film (PPF)', label: 'Paint Protection Film (PPF)', sublabel: 'TPU Self-Healing Ultra Gloss / Matte', icon: <Icon.Shield size={16} /> },
  { value: 'Ceramic Coating', label: 'Ceramic Coating', sublabel: '9H Dual-Layer Nano-Ceramic Armor', icon: <Icon.Sparkles size={16} /> },
  { value: 'Paint Correction', label: 'Paint Correction', sublabel: 'Concourse Multi-Stage Swirl Elimination', icon: <Icon.Wrench size={16} /> },
  { value: 'Interior Detailing', label: 'Interior Detailing', sublabel: 'Deep Sanitization & Leather Conditioner', icon: <Icon.Soap size={16} /> },
  { value: 'Protection Packages', label: 'Protection Packages', sublabel: 'All-Inclusive Full Vehicle Protection Suite', icon: <Icon.Crown size={16} /> },
  { value: 'General Detailing Consultation', label: 'General Detailing Consultation', sublabel: 'In-Studio Paint Inspection & Custom Quote', icon: <Icon.Question size={16} /> },
];

export function ContactForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [vehicleText, setVehicleText] = useState('');
  const [serviceInterest, setServiceInterest] = useState('Paint Protection Film (PPF)');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedLead, setSubmittedLead] = useState<{ id: string; name: string; phone: string; vehicle: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Please provide a valid 10-digit mobile number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: cleanPhone.startsWith('91') && cleanPhone.length > 10 ? cleanPhone : `91${cleanPhone.slice(-10)}`,
          email: email.trim() || undefined,
          vehicleText: vehicleText.trim() || undefined,
          serviceInterestName: serviceInterest,
          message: message.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit enquiry.');
      }

      setSubmittedLead({
        id: data.leadId,
        name: name.trim(),
        phone: cleanPhone,
        vehicle: vehicleText.trim() || 'Vehicle',
      });
    } catch (err: any) {
      setError(err.message || 'Error transmitting your message. Please try again or chat via WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedLead) {
    const waText = encodeURIComponent(
      `Hi Smoke M Customs, I just submitted an inquiry on your website for my ${submittedLead.vehicle}. My name is ${submittedLead.name}. Looking forward to discussing details.`
    );

    return (
      <div className={styles.successCard}>
        <span className={styles.successIcon}><Icon.Sparkles size={24} color="var(--color-gold)" /></span>
        <h3 className={styles.successTitle}>Inquiry Registered Successfully</h3>
        <p className={styles.successText}>
          Thank you, <strong>{submittedLead.name}</strong>. Our detailing concierge has received your vehicle details.
          We will review your request and connect with you on WhatsApp or phone shortly.
        </p>

        <div className={styles.successActions}>
          <a
            href={`https://wa.me/919876543210?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.waBtn}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon.WhatsApp size={16} /> Instant WhatsApp Follow-up
            </span>
          </a>

          <button
            type="button"
            className={styles.resetBtn}
            onClick={() => {
              setSubmittedLead(null);
              setName('');
              setPhone('');
              setEmail('');
              setVehicleText('');
              setMessage('');
            }}
          >
            Submit Another Inquiry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.formCard}>
      <h3 className={styles.formTitle}>Direct Studio Consultation</h3>
      <p className={styles.formSubtitle}>
        Share your vehicle make and paint concerns. Our certified specialists will prepare a preliminary assessment.
      </p>

      {error && <div className={styles.errorMsg}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className={styles.grid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Full Name *</label>
            <input
              type="text"
              required
              className={styles.input}
              placeholder="e.g. Vikram Malhotra"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Mobile Phone (WhatsApp) *</label>
            <input
              type="tel"
              required
              className={styles.input}
              placeholder="10-digit number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Email Address (Optional)</label>
            <input
              type="email"
              className={styles.input}
              placeholder="e.g. client@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Vehicle Make & Model</label>
            <input
              type="text"
              className={styles.input}
              placeholder="e.g. BMW M4 / Thar 4x4"
              value={vehicleText}
              onChange={(e) => setVehicleText(e.target.value)}
            />
          </div>

          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label className={styles.label}>Primary Service of Interest</label>
            <Select
              value={serviceInterest}
              onChange={(val) => setServiceInterest(val)}
              options={CONTACT_SERVICE_OPTIONS}
            />
          </div>

          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label className={styles.label}>Specific Vehicle Details or Requests</label>
            <textarea
              className={styles.textarea}
              rows={3}
              placeholder="Any swirl marks, rock chips, recent delivery date, or specific questions..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`btn btn-primary btn-lg ${styles.submitBtn}`}
        >
          {isSubmitting ? 'Transmitting Request...' : 'Send Inquiry to Master Detailer &rarr;'}
        </button>
      </form>
    </div>
  );
}
