'use client';

import React, { useState } from 'react';
import { Icon } from '@/components/common/Icons';
import styles from './ContactForm.module.css';

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
            <select
              className={styles.select}
              value={serviceInterest}
              onChange={(e) => setServiceInterest(e.target.value)}
            >
              <option value="Paint Protection Film (PPF)">Paint Protection Film (TPU Self-Healing)</option>
              <option value="Ceramic Coating">9H Dual-Layer Nano-Ceramic Coating</option>
              <option value="Paint Correction">Concourse Multi-Stage Swirl Elimination</option>
              <option value="Interior Detailing">Deep Interior Sanitization & Leather Feed</option>
              <option value="Protection Packages">All-Inclusive Protection Suite</option>
              <option value="General Detailing Consultation">General Detailing Inspection / Custom Request</option>
            </select>
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
