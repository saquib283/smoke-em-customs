'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './booking.module.css';

interface ItemOption {
  id: string;
  name: string;
  type: 'service' | 'package';
  durationMinutes: number;
  price: string;
  category?: string | null;
}

interface SlotOption {
  startAt: string;
  endAt: string;
  resourceId: string;
  resourceName: string;
  isAvailable: boolean;
}

interface BookingWizardProps {
  services: Array<{ id: string; name: string; startingPrice: string; durationMinutes: number; category: string | null }>;
  packages: Array<{ id: string; name: string; price: string | null; startingPrice: string | null; durationMinutes: number }>;
  preselectedServiceId?: string;
  preselectedPackageId?: string;
}

export function BookingWizard({
  services,
  packages,
  preselectedServiceId,
  preselectedPackageId,
}: BookingWizardProps) {
  const router = useRouter();

  // Combine services and packages for selection
  const items: ItemOption[] = [
    ...services.map((s) => ({
      id: s.id,
      name: s.name,
      type: 'service' as const,
      durationMinutes: s.durationMinutes,
      price: s.startingPrice,
      category: s.category,
    })),
    ...packages.map((p) => ({
      id: p.id,
      name: p.name,
      type: 'package' as const,
      durationMinutes: p.durationMinutes,
      price: p.price ?? p.startingPrice ?? '0',
      category: 'Package Suite',
    })),
  ];

  const defaultItemId = preselectedPackageId || preselectedServiceId || items[0]?.id;

  const [step, setStep] = useState(1);
  const [selectedItemId, setSelectedItemId] = useState(defaultItemId);
  const [selectedDate, setSelectedDate] = useState(() => {
    // Tomorrow as sensible default date
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotOption | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Customer & Vehicle fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleType, setVehicleType] = useState('SEDAN');
  const [customerNotes, setCustomerNotes] = useState('');

  // Fetch slots whenever selectedDate or selectedItemId changes
  useEffect(() => {
    if (!selectedItemId || !selectedDate) return;

    let isMounted = true;
    setSlotsLoading(true);
    setError(null);
    setSelectedSlot(null);

    const selectedItem = items.find((i) => i.id === selectedItemId);
    const paramKey = selectedItem?.type === 'package' ? 'packageId' : 'serviceId';

    fetch(`/api/slots?date=${selectedDate}&${paramKey}=${selectedItemId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.error) {
          setError(data.error);
          setSlots([]);
        } else {
          setSlots(data.slots || []);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to fetch slots.');
      })
      .finally(() => {
        if (isMounted) setSlotsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDate, selectedItemId]);

  // Generate next 14 calendar dates
  const nextDates = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1); // Starting tomorrow
    const iso = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = d.getDate();
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    return { iso, dayName, dayNum, month };
  });

  const selectedItem = items.find((i) => i.id === selectedItemId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Please choose an available bay time slot.');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      setError('Please provide your name and mobile number.');
      return;
    }

    setSubmitLoading(true);
    setError(null);

    try {
      const payload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        vehicleBrand: vehicleBrand.trim() || undefined,
        vehicleModel: vehicleModel.trim() || undefined,
        vehicleType,
        customerNotes: customerNotes.trim() || undefined,
        serviceId: selectedItem?.type === 'service' ? selectedItem.id : undefined,
        packageId: selectedItem?.type === 'package' ? selectedItem.id : undefined,
        resourceId: selectedSlot.resourceId,
        startAt: selectedSlot.startAt,
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reserve booking.');
      }

      router.push(`/booking/${data.bookingId}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred during booking.');
      setSubmitLoading(false);
    }
  };

  return (
    <div className={styles.wizard}>
      {/* Wizard Steps */}
      <div className={styles.stepTabs}>
        <button
          type="button"
          className={`${styles.stepTab} ${step >= 1 ? styles.activeTab : ''}`}
          onClick={() => setStep(1)}
        >
          <span className={styles.tabNum}>1</span> Treatment
        </button>
        <button
          type="button"
          className={`${styles.stepTab} ${step >= 2 ? styles.activeTab : ''}`}
          onClick={() => {
            if (selectedItemId) setStep(2);
          }}
        >
          <span className={styles.tabNum}>2</span> Date & Slot
        </button>
        <button
          type="button"
          className={`${styles.stepTab} ${step >= 3 ? styles.activeTab : ''}`}
          onClick={() => {
            if (selectedSlot) setStep(3);
          }}
        >
          <span className={styles.tabNum}>3</span> Vehicle & Confirm
        </button>
      </div>

      {error && <div className={styles.errorAlert}>{error}</div>}

      {/* ── STEP 1: Select Service / Package ── */}
      {step === 1 && (
        <div className={styles.stepContent}>
          <h2 className={styles.stepHeading}>Choose Service or Package Suite</h2>
          <p className={styles.stepSub}>Select the treatment you would like to book for your vehicle.</p>

          <div className={styles.itemGrid}>
            {items.map((item) => (
              <div
                key={item.id}
                className={`${styles.itemCard} ${selectedItemId === item.id ? styles.itemSelected : ''}`}
                onClick={() => setSelectedItemId(item.id)}
              >
                <div className={styles.itemTop}>
                  <span className={styles.itemCat}>{item.category}</span>
                  <span className={styles.itemPrice}>
                    From ₹{Number(item.price).toLocaleString('en-IN')}
                  </span>
                </div>
                <h3 className={styles.itemName}>{item.name}</h3>
                <span className={styles.itemDuration}>
                  ⏱️ Approx. {Math.round(item.durationMinutes / 60)} Hours
                </span>
              </div>
            ))}
          </div>

          <div className={styles.navRow}>
            <div />
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={() => setStep(2)}
            >
              Next: Select Date & Slot &rarr;
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Date & Available Slots ── */}
      {step === 2 && (
        <div className={styles.stepContent}>
          <h2 className={styles.stepHeading}>Select Date & Bay Time Slot</h2>
          <p className={styles.stepSub}>
            Selected treatment: <strong>{selectedItem?.name}</strong> (~{Math.round((selectedItem?.durationMinutes ?? 120) / 60)} hrs)
          </p>

          {/* Date Scroller */}
          <div className={styles.dateScroller}>
            {nextDates.map((d) => (
              <button
                key={d.iso}
                type="button"
                className={`${styles.dateBtn} ${selectedDate === d.iso ? styles.dateSelected : ''}`}
                onClick={() => setSelectedDate(d.iso)}
              >
                <span className={styles.dDay}>{d.dayName}</span>
                <span className={styles.dNum}>{d.dayNum}</span>
                <span className={styles.dMonth}>{d.month}</span>
              </button>
            ))}
          </div>

          {/* Slots List */}
          <div className={styles.slotsSection}>
            <h3 className={styles.slotsTitle}>
              Available Bay Slots for {new Date(`${selectedDate}T00:00:00Z`).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>

            {slotsLoading ? (
              <div className={styles.loadingBox}>Checking bay calendar availability...</div>
            ) : slots.length === 0 ? (
              <div className={styles.emptyBox}>
                No free detailing bays available on this date. Please pick another date or contact our team via WhatsApp.
              </div>
            ) : (
              <div className={styles.slotsGrid}>
                {slots.map((slot, index) => {
                  const startTime = new Date(slot.startAt).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  });
                  const endTime = new Date(slot.endAt).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  });
                  const isSelected = selectedSlot?.startAt === slot.startAt && selectedSlot?.resourceId === slot.resourceId;

                  return (
                    <button
                      key={index}
                      type="button"
                      className={`${styles.slotBtn} ${isSelected ? styles.slotSelected : ''}`}
                      onClick={() => {
                        setSelectedSlot(slot);
                        setError(null);
                      }}
                    >
                      <div className={styles.slotTime}>{startTime} – {endTime}</div>
                      <div className={styles.slotBay}>🏛️ {slot.resourceName}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className={styles.navRow}>
            <button type="button" onClick={() => setStep(1)} className="btn btn-secondary">
              &larr; Back
            </button>
            <button
              type="button"
              disabled={!selectedSlot}
              className="btn btn-primary btn-lg"
              onClick={() => {
                if (selectedSlot) setStep(3);
              }}
            >
              Next: Vehicle & Client Info &rarr;
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Vehicle & Client Info & Confirm ── */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className={styles.stepContent}>
          <h2 className={styles.stepHeading}>Client & Vehicle Information</h2>
          <p className={styles.stepSub}>Final step to reserve your bay slot.</p>

          <div className={styles.summaryBox}>
            <div className={styles.summaryItem}>
              <span className={styles.sumLabel}>Treatment</span>
              <span className={styles.sumVal}>{selectedItem?.name}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.sumLabel}>Date</span>
              <span className={styles.sumVal}>{new Date(`${selectedDate}T00:00:00Z`).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.sumLabel}>Time & Bay</span>
              <span className={styles.sumVal}>
                {selectedSlot && new Date(selectedSlot.startAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} ({selectedSlot?.resourceName})
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.sumLabel}>Estimated Total</span>
              <span className={styles.sumValGold}>₹{Number(selectedItem?.price).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className={styles.twoCol}>
            <div className={styles.formGroup}>
              <label htmlFor="customerName" className={styles.label}>
                Full Name <span className={styles.required}>*</span>
              </label>
              <input
                id="customerName"
                type="text"
                className={styles.input}
                placeholder="e.g. Aditya Singhania"
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
            <label htmlFor="customerEmail" className={styles.label}>Email Address (Optional)</label>
            <input
              id="customerEmail"
              type="email"
              className={styles.input}
              placeholder="e.g. aditya@example.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
          </div>

          <div className={styles.twoCol}>
            <div className={styles.formGroup}>
              <label htmlFor="vehicleBrand" className={styles.label}>Vehicle Brand</label>
              <input
                id="vehicleBrand"
                type="text"
                className={styles.input}
                placeholder="e.g. BMW, Mahindra, Porsche"
                value={vehicleBrand}
                onChange={(e) => setVehicleBrand(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="vehicleModel" className={styles.label}>Vehicle Model</label>
              <input
                id="vehicleModel"
                type="text"
                className={styles.input}
                placeholder="e.g. 330i, Thar, 911"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="customerNotes" className={styles.label}>Special Requests / Notes (Optional)</label>
            <textarea
              id="customerNotes"
              className={styles.textarea}
              rows={2}
              placeholder="Any specific instructions, scratches, or handover timing preferences..."
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
            />
          </div>

          <div className={styles.navRow}>
            <button type="button" onClick={() => setStep(2)} className="btn btn-secondary">
              &larr; Back to Slots
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="btn btn-primary btn-lg"
            >
              {submitLoading ? 'Reserving Bay Slot...' : 'Confirm Appointment'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
