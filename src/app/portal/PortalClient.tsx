'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './portal.module.css';

interface CustomerData {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  vehicles: Array<{
    id: string;
    make: string;
    model: string;
    year: number | null;
    paintCondition: string | null;
  }>;
}

interface BookingData {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  resourceName: string;
  serviceName: string | null;
  packageName: string | null;
  vehicleText: string | null;
  notes: string | null;
}

interface QuoteData {
  id: string;
  status: string;
  estimatedPrice: string | null;
  notes: string | null;
  createdAt: string;
  vehicleText?: string | null;
  serviceInterestName?: string | null;
}

export function PortalClient() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth flow states
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [demoCode, setDemoCode] = useState<string | null>(null);

  // Portal data states
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [activeTab, setActiveTab] = useState<'BOOKINGS' | 'VEHICLES' | 'QUOTES' | 'WARRANTY'>('BOOKINGS');

  // Reschedule modal
  const [rescheduleBookingId, setRescheduleBookingId] = useState<string | null>(null);
  const [rescheduleStart, setRescheduleStart] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  // Initial check: attempt to fetch portal data
  const loadPortalData = async () => {
    try {
      const res = await fetch('/api/portal/data');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.customer) {
          setCustomer(data.customer);
          setBookings(data.bookings || []);
          setQuotes(data.quotes || []);
          setIsAuthenticated(true);
          return;
        }
      }
      setIsAuthenticated(false);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortalData();
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 10) {
      setAuthError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch('/api/portal/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clean }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setStep('OTP');
      if (data.demoCode) {
        setDemoCode(data.demoCode);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Error communicating with authentication server.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!otp.trim()) {
      setAuthError('Please enter the 6-digit verification code.');
      return;
    }

    setAuthLoading(true);
    try {
      const clean = phone.replace(/\D/g, '');
      const res = await fetch('/api/portal/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clean, code: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid or expired code.');
      }

      await loadPortalData();
    } catch (err: any) {
      setAuthError(err.message || 'Invalid verification code.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/portal/auth/logout', { method: 'POST' });
      setIsAuthenticated(false);
      setCustomer(null);
      setBookings([]);
      setQuotes([]);
      setStep('PHONE');
      setPhone('');
      setOtp('');
      setDemoCode(null);
    } catch {
      window.location.reload();
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    const reason = prompt('Please enter cancellation reason:');
    if (reason === null) return;

    try {
      const res = await fetch('/api/portal/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, reason: reason || 'Customer requested cancellation via portal' }),
      });
      const data = await res.json();
      if (data.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: 'CANCELLED' } : b))
        );
        alert('Booking has been cancelled.');
      } else {
        alert(data.error || 'Failed to cancel booking.');
      }
    } catch {
      alert('Error processing cancellation request.');
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!rescheduleBookingId || !rescheduleStart) {
      alert('Please select a new date and time.');
      return;
    }

    setModalLoading(true);
    try {
      const res = await fetch('/api/portal/bookings/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: rescheduleBookingId,
          newStartAt: new Date(rescheduleStart).toISOString(),
          reason: rescheduleReason || 'Customer requested reschedule via portal',
        }),
      });
      const data = await res.json();
      if (data.success && data.booking) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === rescheduleBookingId
              ? { ...b, startAt: data.booking.startAt, endAt: data.booking.endAt, status: data.booking.status }
              : b
          )
        );
        setRescheduleBookingId(null);
        setRescheduleStart('');
        setRescheduleReason('');
        alert('Your appointment has been rescheduled.');
      } else {
        alert(data.error || 'Failed to reschedule booking. Please select another slot.');
      }
    } catch {
      alert('Error updating appointment.');
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <main className={styles.main}>
        <div className={styles.container} style={{ textAlign: 'center', paddingTop: '80px' }}>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Connecting to Smoke M Client Concierge...
          </p>
        </div>
      </main>
    );
  }

  // ── Authentication Card ──
  if (!isAuthenticated) {
    return (
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.authCard}>
            <span className={styles.authBadge}>CLIENT CONCIERGE</span>
            <h1 className={styles.authTitle}>Client Service Portal</h1>
            <p className={styles.authSubtitle}>
              Access your booked detailing bays, warranty certificates, and vehicle job cards securely via WhatsApp OTP.
            </p>

            {authError && (
              <div
                style={{
                  backgroundColor: 'var(--color-error-subtle)',
                  color: 'var(--color-error)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12px',
                  marginBottom: '16px',
                }}
              >
                {authError}
              </div>
            )}

            {step === 'PHONE' ? (
              <form onSubmit={handleSendOtp}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Registered Mobile Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="Enter 10-digit phone number"
                    className={styles.input}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="btn btn-primary btn-full btn-lg"
                >
                  {authLoading ? 'Transmitting Code...' : 'Send Verification OTP &rarr;'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Enter 6-Digit Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="• • • • • •"
                    className={`${styles.input} ${styles.otpInput}`}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </div>

                {demoCode && (
                  <div className={styles.demoBanner}>
                    <span>Development OTP: <strong>{demoCode}</strong></span>
                    <button
                      type="button"
                      onClick={() => setOtp(demoCode)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-accent-primary)',
                        textDecoration: 'underline',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      Auto-fill
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="btn btn-primary btn-full btn-lg"
                  style={{ marginBottom: '12px' }}
                >
                  {authLoading ? 'Verifying...' : 'Authenticate Portal &rarr;'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('PHONE');
                    setOtp('');
                    setAuthError(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  ← Change Mobile Number
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    );
  }

  // ── Authenticated Customer Portal ──
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {/* Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            paddingBottom: '24px',
            borderBottom: '1px solid var(--color-border)',
            marginBottom: '24px',
          }}
        >
          <div>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-accent-text)', letterSpacing: '1px' }}>
              AUTHENTICATED CLIENT
            </span>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold', margin: '4px 0' }}>
              Welcome, {customer?.name}
            </h1>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
              Mobile: {customer?.phone} {customer?.email && `• ${customer.email}`}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link href="/book" className="btn btn-primary btn-sm">
              + New Bay Booking
            </Link>
            <button
              onClick={handleLogout}
              className="btn btn-secondary btn-sm"
              title="Sign Out"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '1px solid var(--color-border)',
            marginBottom: '24px',
          }}
        >
          <button
            onClick={() => setActiveTab('BOOKINGS')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'BOOKINGS' ? '2px solid var(--color-accent-primary)' : '2px solid transparent',
              color: activeTab === 'BOOKINGS' ? 'var(--color-accent-text)' : 'var(--color-text-secondary)',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            📅 Bay Appointments ({bookings.length})
          </button>

          <button
            onClick={() => setActiveTab('VEHICLES')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'VEHICLES' ? '2px solid var(--color-accent-primary)' : '2px solid transparent',
              color: activeTab === 'VEHICLES' ? 'var(--color-accent-text)' : 'var(--color-text-secondary)',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🚗 Registered Vehicles ({customer?.vehicles.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('WARRANTY')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'WARRANTY' ? '2px solid var(--color-accent-primary)' : '2px solid transparent',
              color: activeTab === 'WARRANTY' ? 'var(--color-accent-text)' : 'var(--color-text-secondary)',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🛡️ Warranty Certificates
          </button>

          <button
            onClick={() => setActiveTab('QUOTES')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'QUOTES' ? '2px solid var(--color-accent-primary)' : '2px solid transparent',
              color: activeTab === 'QUOTES' ? 'var(--color-accent-text)' : 'var(--color-text-secondary)',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            📋 Estimates ({quotes.length})
          </button>
        </div>

        {/* ── Tab Content ── */}

        {/* 1. Bookings Tab */}
        {activeTab === 'BOOKINGS' && (
          <div>
            {bookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '16px' }}>
                  You have no bay bookings registered under this number.
                </p>
                <Link href="/book" className="btn btn-primary btn-md">
                  Reserve Detailing Bay
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {bookings.map((b) => {
                  const startDate = new Date(b.startAt).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });
                  const startTime = new Date(b.startAt).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  });
                  const endTime = new Date(b.endAt).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  });

                  return (
                    <div
                      key={b.id}
                      style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '20px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '16px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 'bold',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor:
                                b.status === 'CONFIRMED'
                                  ? 'rgba(16, 185, 129, 0.15)'
                                  : b.status === 'CANCELLED'
                                  ? 'rgba(239, 68, 68, 0.15)'
                                  : 'rgba(212, 168, 83, 0.15)',
                              color:
                                b.status === 'CONFIRMED'
                                  ? '#10B981'
                                  : b.status === 'CANCELLED'
                                  ? '#EF4444'
                                  : 'var(--color-accent-text)',
                              border: '1px solid var(--color-border)',
                            }}
                          >
                            {b.status}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            🏛️ {b.resourceName}
                          </span>
                        </div>

                        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', margin: '4px 0' }}>
                          {b.serviceName || b.packageName || 'Detailing Service'}
                        </h3>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: '4px 0' }}>
                          🚗 {b.vehicleText || 'Client Vehicle'} &bull; ⏰ {startDate} ({startTime} – {endTime})
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {b.status !== 'CANCELLED' && (
                          <>
                            <button
                              onClick={() => {
                                setRescheduleBookingId(b.id);
                                setRescheduleStart('');
                              }}
                              className="btn btn-secondary btn-sm"
                            >
                              Reschedule Slot
                            </button>
                            <button
                              onClick={() => handleCancelBooking(b.id)}
                              className="btn btn-outline btn-sm"
                              style={{ color: 'var(--color-error)' }}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        <Link href={`/booking/${b.id}`} className="btn btn-outline btn-sm">
                          Job Card &rarr;
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 2. Vehicles Tab */}
        {activeTab === 'VEHICLES' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {customer?.vehicles && customer.vehicles.length > 0 ? (
              customer.vehicles.map((v) => (
                <div
                  key={v.id}
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px',
                  }}
                >
                  <span style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}>🚗</span>
                  <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', margin: '4px 0' }}>
                    {v.make} {v.model}
                  </h3>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: '4px 0' }}>
                    Model Year: {v.year || 'Standard'} &bull; Condition: {v.paintCondition || 'Evaluated at Bay'}
                  </p>
                  <div style={{ marginTop: '16px' }}>
                    <Link href={`/book?vehicle=${encodeURIComponent(`${v.make} ${v.model}`)}`} className="btn btn-secondary btn-full btn-sm">
                      Book Service for this Car
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                  No vehicles registered in your garage yet. Vehicles are added automatically upon booking or quote submission.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 3. Warranty Certificates Tab */}
        {activeTab === 'WARRANTY' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(212, 168, 83, 0.15) 0%, rgba(20, 20, 20, 0.95) 75%)',
                border: '1px solid var(--color-accent-border)',
                borderRadius: 'var(--radius-xl)',
                padding: '24px',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-accent-text)', letterSpacing: '1px' }}>
                  SMOKE M DIGITAL WARRANTY
                </span>
                <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 'bold' }}>✓ ACTIVE</span>
              </div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', margin: '4px 0' }}>
                Paint Protection Film (PPF) Guarantee
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: '8px 0 16px' }}>
                Covers optical clarity, anti-yellowing, adhesive stability, and self-healing thermal activation.
              </p>
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Client: {customer?.name} &bull; Hotline: +91 98765 43210
              </div>
            </div>

            <div
              style={{
                background: 'linear-gradient(135deg, rgba(212, 168, 83, 0.15) 0%, rgba(20, 20, 20, 0.95) 75%)',
                border: '1px solid var(--color-accent-border)',
                borderRadius: 'var(--radius-xl)',
                padding: '24px',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-accent-text)', letterSpacing: '1px' }}>
                  SMOKE M DIGITAL WARRANTY
                </span>
                <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 'bold' }}>✓ ACTIVE</span>
              </div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', margin: '4px 0' }}>
                9H Ceramic Coating Protection
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: '8px 0 16px' }}>
                Includes hydrophobic surface tension, UV resistance, and chemical etch defense. Requires 6-month inspection.
              </p>
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Complimentary 6-month checkup eligible at studio bay.
              </div>
            </div>
          </div>
        )}

        {/* 4. Quotes Tab */}
        {activeTab === 'QUOTES' && (
          <div>
            {quotes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '16px' }}>
                  No preliminary estimates on file.
                </p>
                <Link href="/quote" className="btn btn-primary btn-md">
                  Generate Instant Estimate
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {quotes.map((q) => (
                  <div
                    key={q.id}
                    style={{
                      backgroundColor: 'var(--color-bg-secondary)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        Created: {new Date(q.createdAt).toLocaleDateString('en-IN')}
                      </span>
                      <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', margin: '4px 0' }}>
                        Estimate: ₹{Number(q.estimatedPrice || 0).toLocaleString('en-IN')}
                      </h4>
                      <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0 }}>
                        {q.notes || 'Preliminary algorithmic calculation'}
                      </p>
                    </div>

                    <Link href="/book" className="btn btn-primary btn-sm">
                      Convert to Bay Slot
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reschedule Modal */}
        {rescheduleBookingId && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 'var(--z-modal)',
              padding: '16px',
            }}
            onClick={() => setRescheduleBookingId(null)}
          >
            <div
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-xl)',
                padding: '24px',
                maxWidth: '440px',
                width: '100%',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', marginBottom: '8px' }}>
                Reschedule Bay Slot
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                Select a new start date and time for your detailing appointment:
              </p>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '6px' }}>
                  New Date & Start Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={rescheduleStart}
                  onChange={(e) => setRescheduleStart(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: 'var(--color-bg-primary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-text-primary)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '6px' }}>
                  Reason (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Traveling this week"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: 'var(--color-bg-primary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-text-primary)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setRescheduleBookingId(null)}
                  disabled={modalLoading}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRescheduleSubmit}
                  disabled={modalLoading || !rescheduleStart}
                  className="btn btn-primary btn-sm"
                >
                  {modalLoading ? 'Confirming...' : 'Confirm New Slot'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
