'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DatePicker } from './DatePicker';
import { SlotPicker, type TimeSlot } from './SlotPicker';
import { Icon } from '@/components/common/Icons';
import { Select, type SelectOption } from '@/components/ui';
import styles from '@/app/book/booking.module.css';

const VEHICLE_SEGMENT_OPTIONS: SelectOption[] = [
  { value: 'HATCHBACK', label: 'Hatchback / Compact', sublabel: 'Polo, i20, Mini Cooper, Altroz', icon: <Icon.Car size={16} /> },
  { value: 'SEDAN', label: 'Executive Sedan', sublabel: 'C-Class, 3 Series, A4, City, Camry', icon: <Icon.Car size={16} /> },
  { value: 'SUV', label: 'SUV / Crossover', sublabel: 'Creta, Seltos, Defender, Range Rover, GLS', icon: <Icon.Car size={16} /> },
  { value: 'MUV', label: 'MUV / Multi-Purpose', sublabel: 'Innova, Carnival, Vellfire', icon: <Icon.Car size={16} /> },
  { value: 'LUXURY', label: 'Supercar / Exotic Sports', sublabel: '911, AMG GT, Huracán, Ferrari, Urus', icon: <Icon.Crown size={16} /> },
];

interface TreatmentInfo {
  id: string;
  slug: string;
  name: string;
  type: 'service' | 'package';
  durationMinutes: number;
  price: string;
  category: string;
  warranty?: string | null;
}

interface BookServiceWizardProps {
  treatment: TreatmentInfo;
  blockedDates?: string[];
  leadId?: string;
  quoteId?: string;
}

export function BookServiceWizard({
  treatment,
  blockedDates = [],
  leadId,
  quoteId,
}: BookServiceWizardProps) {
  const router = useRouter();

  const [step, setStep] = useState(1);

  // Initialize selectedDate to tomorrow
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    // If tomorrow is Sunday, skip to Monday
    if (d.getDay() === 0) {
      d.setDate(d.getDate() + 1);
    }
    return d.toISOString().split('T')[0];
  });

  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictAlert, setConflictAlert] = useState<string | null>(null);

  // Customer & Vehicle fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleType, setVehicleType] = useState('SEDAN');
  const [customerNotes, setCustomerNotes] = useState('');

  // Fetch available slots from /api/booking/availability
  const fetchAvailability = useCallback(async (date: string) => {
    if (!date) return;
    setSlotsLoading(true);
    setError(null);

    const paramKey = treatment.type === 'package' ? 'packageId' : 'serviceId';
    try {
      const res = await fetch(`/api/booking/availability?date=${date}&${paramKey}=${treatment.id}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to check bay availability');
      }
      setSlots(data.slots || []);
    } catch (err: any) {
      setError(err.message || 'Error checking availability');
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [treatment]);

  useEffect(() => {
    fetchAvailability(selectedDate);
    setSelectedSlot(null);
  }, [selectedDate, fetchAvailability]);

  // Form submission with conflict handling
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Please select an available bay time slot.');
      setStep(1);
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      setError('Please provide your name and phone number.');
      setStep(2);
      return;
    }

    setSubmitLoading(true);
    setError(null);
    setConflictAlert(null);

    try {
      const payload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        vehicleBrand: vehicleBrand.trim() || undefined,
        vehicleModel: vehicleModel.trim() || undefined,
        vehicleType,
        customerNotes: customerNotes.trim() || undefined,
        serviceId: treatment.type === 'service' ? treatment.id : undefined,
        packageId: treatment.type === 'package' ? treatment.id : undefined,
        resourceId: selectedSlot.resourceId,
        startAt: selectedSlot.startAt,
        leadId: leadId || undefined,
        quoteId: quoteId || undefined,
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      // Handle 409 Conflict / SLOT_NO_LONGER_AVAILABLE
      if (res.status === 409 || data.error === 'SLOT_NO_LONGER_AVAILABLE') {
        setConflictAlert(
          'The bay time slot you selected was just booked by another client. We have reloaded the live calendar. Please select an alternative slot below.'
        );
        setSelectedSlot(null);
        setStep(1); // Jump back to step 1
        await fetchAvailability(selectedDate); // Reload slots
        setSubmitLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to confirm booking.');
      }

      // Success -> navigate to confirmation page
      router.push(`/booking/${data.bookingId}`);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setSubmitLoading(false);
    }
  };

  const formatDisplayTime = (iso: string) => {
    const d = new Date(iso);
    const h = d.getUTCHours();
    const m = d.getUTCMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    const displayM = m < 10 ? `0${m}` : m;
    return `${displayH}:${displayM} ${ampm}`;
  };

  return (
    <div className={styles.wizard}>
      {/* Wizard Steps Navigation */}
      <div className={styles.stepTabs}>
        <button
          type="button"
          className={`${styles.stepTab} ${step >= 1 ? styles.activeTab : ''}`}
          onClick={() => setStep(1)}
        >
          <span className={styles.tabNum}>1</span> Date & Bay Slot
        </button>
        <button
          type="button"
          className={`${styles.stepTab} ${step >= 2 ? styles.activeTab : ''}`}
          onClick={() => {
            if (selectedSlot) setStep(2);
          }}
        >
          <span className={styles.tabNum}>2</span> Vehicle & Contact
        </button>
        <button
          type="button"
          className={`${styles.stepTab} ${step >= 3 ? styles.activeTab : ''}`}
          onClick={() => {
            if (selectedSlot && customerName && customerPhone) setStep(3);
          }}
        >
          <span className={styles.tabNum}>3</span> Review & Confirm
        </button>
      </div>

      {/* Conflict Notice Alert */}
      {conflictAlert && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #EF4444',
            color: '#FCA5A5',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 'var(--space-6)',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Icon.AlertTriangle size={18} color="#EF4444" />
          <span>{conflictAlert}</span>
        </div>
      )}

      {error && <div className={styles.errorAlert}>{error}</div>}

      {/* ── STEP 1: Date & Detailing Bay Slot ── */}
      {step === 1 && (
        <div className={styles.stepContent}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <div>
              <h2 className={styles.stepHeading}>Pick Appointment Date & Bay</h2>
              <p className={styles.stepSub}>
                Selected: <strong>{treatment.name}</strong> (~{(treatment.durationMinutes / 60).toFixed(1)} hrs duration)
              </p>
            </div>
            <Link href="/book" className="btn btn-outline btn-sm">
              Change Treatment
            </Link>
          </div>

          {/* Reusable DatePicker */}
          <DatePicker
            selectedDate={selectedDate}
            onDateChange={(date) => {
              setSelectedDate(date);
              setConflictAlert(null);
            }}
            blockedDates={blockedDates}
          />

          {/* Reusable SlotPicker */}
          <SlotPicker
            slots={slots}
            selectedSlot={selectedSlot}
            onSelectSlot={(slot) => {
              setSelectedSlot(slot);
              setError(null);
              setConflictAlert(null);
            }}
            loading={slotsLoading}
            error={error}
          />

          <div className={styles.navRow}>
            <Link href="/book" className="btn btn-secondary">
              &larr; Back to Treatments
            </Link>
            <button
              type="button"
              disabled={!selectedSlot}
              className="btn btn-primary btn-lg"
              onClick={() => {
                if (selectedSlot) setStep(2);
              }}
            >
              Continue to Vehicle Details &rarr;
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Customer & Vehicle Information ── */}
      {step === 2 && (
        <div className={styles.stepContent}>
          <h2 className={styles.stepHeading}>Customer & Vehicle Details</h2>
          <p className={styles.stepSub}>
            Provide your vehicle details and contact number for bay reservation.
          </p>

          <div className={styles.twoCol}>
            <div className={styles.formGroup}>
              <label htmlFor="customerName" className={styles.label}>
                Full Name <span className={styles.required}>*</span>
              </label>
              <input
                id="customerName"
                type="text"
                className={styles.input}
                placeholder="e.g. Vikram Malhotra"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="customerPhone" className={styles.label}>
                Mobile Number <span className={styles.required}>*</span>
              </label>
              <input
                id="customerPhone"
                type="tel"
                className={styles.input}
                placeholder="e.g. 9876543210"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="customerEmail" className={styles.label}>
              Email Address (Optional — for appointment calendar invite)
            </label>
            <input
              id="customerEmail"
              type="email"
              className={styles.input}
              placeholder="e.g. vikram@example.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
          </div>

          <div className={styles.twoCol}>
            <div className={styles.formGroup}>
              <label htmlFor="vehicleBrand" className={styles.label}>
                Vehicle Brand
              </label>
              <input
                id="vehicleBrand"
                type="text"
                className={styles.input}
                placeholder="e.g. BMW, Porsche, Mercedes, Thar"
                value={vehicleBrand}
                onChange={(e) => setVehicleBrand(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="vehicleModel" className={styles.label}>
                Vehicle Model
              </label>
              <input
                id="vehicleModel"
                type="text"
                className={styles.input}
                placeholder="e.g. M340i, 911 GT3, Defender"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="vehicleType" className={styles.label}>
              Vehicle Segment
            </label>
            <Select
              id="vehicleType"
              value={vehicleType}
              onChange={(val) => setVehicleType(val)}
              options={VEHICLE_SEGMENT_OPTIONS}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="customerNotes" className={styles.label}>
              Special Notes / Detailing Requirements (Optional)
            </label>
            <textarea
              id="customerNotes"
              className={styles.textarea}
              rows={2}
              placeholder="Specify paint condition, swirl intensity, or preferred vehicle delivery time..."
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
            />
          </div>

          <div className={styles.navRow}>
            <button type="button" onClick={() => setStep(1)} className="btn btn-secondary">
              &larr; Back to Slot Picker
            </button>
            <button
              type="button"
              disabled={!customerName.trim() || !customerPhone.trim()}
              className="btn btn-primary btn-lg"
              onClick={() => {
                if (customerName.trim() && customerPhone.trim()) {
                  setStep(3);
                }
              }}
            >
              Review Booking &rarr;
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Review & Confirm ── */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className={styles.stepContent}>
          <h2 className={styles.stepHeading}>Review & Confirm Bay Reservation</h2>
          <p className={styles.stepSub}>
            Please review your booking details before reserving the bay.
          </p>

          <div className={styles.summaryBox}>
            <div className={styles.summaryItem}>
              <span className={styles.sumLabel}>Treatment</span>
              <span className={styles.sumVal}>{treatment.name}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.sumLabel}>Appointment Date</span>
              <span className={styles.sumVal}>
                {new Date(`${selectedDate}T00:00:00Z`).toLocaleDateString('en-IN', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.sumLabel}>Allocated Detailing Bay</span>
              <span className={styles.sumVal}>
                {selectedSlot
                  ? (new Date(selectedSlot.endAt).getTime() - new Date(selectedSlot.startAt).getTime()) / (1000 * 60 * 60) > 9
                    ? `Drop-off at ${formatDisplayTime(selectedSlot.startAt)} (Multi-Day Bay Hold • ${selectedSlot.resourceName})`
                    : `${formatDisplayTime(selectedSlot.startAt)} – ${formatDisplayTime(
                        selectedSlot.endAt
                      )} (${selectedSlot.resourceName})`
                  : 'Slot not selected'}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.sumLabel}>Vehicle</span>
              <span className={styles.sumVal}>
                {vehicleBrand || vehicleModel
                  ? `${vehicleBrand} ${vehicleModel}`
                  : 'Customer Vehicle'}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.sumLabel}>Customer</span>
              <span className={styles.sumVal}>
                {customerName} &bull; {customerPhone}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.sumLabel}>Estimated Amount</span>
              <span className={styles.sumValGold}>
                ₹{Number(treatment.price).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(212, 168, 83, 0.08)',
              border: '1px solid rgba(212, 168, 83, 0.3)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4)',
              marginBottom: 'var(--space-6)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <div style={{ color: 'var(--color-gold)', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon.Check size={14} color="var(--color-gold)" /> No Upfront Payment Required
            </div>
            Your slot in our positive-pressure bay is held immediately. Our studio manager will call you prior to drop-off to inspect paint depth readings and confirm timelines.
          </div>

          <div className={styles.navRow}>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="btn btn-secondary"
              disabled={submitLoading}
            >
              &larr; Back to Details
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="btn btn-primary btn-lg"
            >
              {submitLoading ? 'Securing Bay Slot...' : 'Confirm Bay Appointment'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
