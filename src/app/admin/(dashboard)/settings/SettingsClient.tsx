'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui';
import { Icon } from '@/components/common/Icons';
import styles from './settings.module.css';

interface Resource {
  id: string;
  name: string;
  isActive: boolean;
}

interface BusinessHour {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface BlockedDate {
  id: string;
  date: string;
  reason: string | null;
  createdAt: string;
}

interface BookingRules {
  bufferMinutes: number;
  minLeadTimeHours: number;
  slotGranularityMinutes: number;
}

interface SettingsClientProps {
  initialResources: Resource[];
  initialHours: BusinessHour[];
  initialBlockedDates: BlockedDate[];
  initialBookingRules: BookingRules;
}

export function SettingsClient({
  initialResources,
  initialHours,
  initialBlockedDates,
  initialBookingRules,
}: SettingsClientProps) {
  // ── Tab State ──
  const [activeTab, setActiveTab] = useState<'STUDIO' | 'EMAIL' | 'WHATSAPP'>('STUDIO');
  const { success, error } = useToast();

  // ── Detailing Bay States ──
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [newBayName, setNewBayName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Business Hours
  const [hours, setHours] = useState<BusinessHour[]>(initialHours);
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [editStart, setEditStart] = useState('10:00');
  const [editEnd, setEditEnd] = useState('19:00');
  const [editIsClosed, setEditIsClosed] = useState(false);

  // Blocked Dates
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>(initialBlockedDates);
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [newBlockedReason, setNewBlockedReason] = useState('');

  // Booking Tolerances
  const [rules, setRules] = useState<BookingRules>(initialBookingRules);
  const [rulesSavedMsg, setRulesSavedMsg] = useState(false);

  // ── Email Automation & Provider States ──
  const [emailConfig, setEmailConfig] = useState({
    providerType: 'SIMULATED',
    smtpHost: 'smtp-relay.brevo.com',
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: '',
    smtpPassword: '',
    resendApiKey: '',
    fromName: 'Smoke M Customs',
    fromEmail: 'concierge@smokecustoms.com',
    replyToEmail: 'concierge@smokecustoms.com',
    isEnabled: true,
  });

  const [templates, setTemplates] = useState<Record<string, { key: string; isEnabled: boolean; subject?: string }>>({
    LEAD_WELCOME: { key: 'LEAD_WELCOME', isEnabled: true },
    QUOTE_SENT: { key: 'QUOTE_SENT', isEnabled: true },
    BOOKING_CONFIRMATION: { key: 'BOOKING_CONFIRMATION', isEnabled: true },
    BOOKING_CANCELLED: { key: 'BOOKING_CANCELLED', isEnabled: true },
  });

  const [emailLoading, setEmailLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
    previewUrl?: string;
    simulated?: boolean;
  } | null>(null);

  // ── WhatsApp Settings State ──
  const [whatsAppConfig, setWhatsAppConfig] = useState({
    isEnabled: true,
    phoneNumberId: '',
    accessToken: '',
    appSecret: '',
    webhookVerifyToken: 'smokecustoms_meta_token_secret',
    studioBusinessPhone: '+91 98765 43210',
    autoSendLeadWelcome: true,
    autoSendQuoteNotification: true,
    autoSendBookingConfirmation: true,
    autoSendBookingCancellation: true,
  });
  const [whatsAppDeliveryMode, setWhatsAppDeliveryMode] = useState<'LIVE' | 'SIMULATED'>('SIMULATED');
  const [whatsAppWebhookUrl, setWhatsAppWebhookUrl] = useState('');
  const [whatsAppLoading, setWhatsAppLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  // Test Outbound State
  const [waTestPhone, setWaTestPhone] = useState('');
  const [waTestMessage, setWaTestMessage] = useState('');
  const [waTestLoading, setWaTestLoading] = useState(false);
  const [waTestResult, setWaTestResult] = useState<{
    success?: boolean;
    messageId?: string;
    simulated?: boolean;
    error?: string;
    mode?: string;
    preview?: string;
  } | null>(null);

  // Inbound Simulation State
  const [waSimPhone, setWaSimPhone] = useState('9876543210');
  const [waSimName, setWaSimName] = useState('Vikram Malhotra');
  const [waSimMessage, setWaSimMessage] = useState('Hi Smoke M Customs, I would like to schedule an inspection for my BMW M340i.');
  const [waSimLoading, setWaSimLoading] = useState(false);
  const [waSimResult, setWaSimResult] = useState<any>(null);

  // Load active email & whatsapp settings on mount
  useEffect(() => {
    fetch('/api/admin/email/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.config) setEmailConfig(data.config);
        if (data.templates) setTemplates(data.templates);
      })
      .catch((err) => console.error('Failed to load email settings:', err));

    fetch('/api/admin/whatsapp/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.config) setWhatsAppConfig(data.config);
        if (data.deliveryMode) setWhatsAppDeliveryMode(data.deliveryMode);
        if (data.webhookUrl) setWhatsAppWebhookUrl(data.webhookUrl);
      })
      .catch((err) => console.error('Failed to load whatsapp settings:', err));
  }, []);

  const handleSaveWhatsAppSettings = async () => {
    setWhatsAppLoading(true);
    try {
      const res = await fetch('/api/admin/whatsapp/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: whatsAppConfig }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        success('WhatsApp Cloud API configuration saved successfully!');
        if (data.config) setWhatsAppConfig(data.config);
        if (data.deliveryMode) setWhatsAppDeliveryMode(data.deliveryMode);
      } else {
        error(data.error || 'Failed to save WhatsApp settings');
      }
    } catch {
      error('Error saving WhatsApp settings');
    } finally {
      setWhatsAppLoading(false);
    }
  };

  const handleSendWhatsAppTest = async () => {
    if (!waTestPhone || waTestPhone.replace(/\D/g, '').length < 10) {
      error('Please enter a valid 10-digit mobile number for test dispatch.');
      return;
    }
    setWaTestLoading(true);
    setWaTestResult(null);
    try {
      const res = await fetch('/api/admin/whatsapp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toPhone: waTestPhone,
          customMessage: waTestMessage || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setWaTestResult(data);
        success(`WhatsApp test message sent successfully! (${data.simulated ? 'Simulated Sandbox' : 'Live Cloud API'})`);
      } else {
        setWaTestResult({ error: data.error || 'Test dispatch failed' });
        error(data.error || 'Failed to send WhatsApp test message');
      }
    } catch (err: any) {
      setWaTestResult({ error: err.message || 'Network error' });
      error('Error sending WhatsApp test message');
    } finally {
      setWaTestLoading(false);
    }
  };

  const handleSimulateInboundMessage = async () => {
    if (!waSimPhone || !waSimMessage.trim()) {
      error('Please enter client phone number and message text.');
      return;
    }
    setWaSimLoading(true);
    setWaSimResult(null);
    try {
      const res = await fetch('/api/admin/whatsapp/simulate-inbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromPhone: waSimPhone,
          clientName: waSimName,
          messageText: waSimMessage,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setWaSimResult(data);
        success(`Inbound message simulated! CRM timeline and Admin alert created for ${data.customer.name}.`);
      } else {
        setWaSimResult({ error: data.error || 'Simulation failed' });
        error(data.error || 'Failed to simulate inbound message');
      }
    } catch (err: any) {
      setWaSimResult({ error: err.message || 'Network error' });
      error('Error simulating inbound WhatsApp message');
    } finally {
      setWaSimLoading(false);
    }
  };

  const handleSaveEmailSettings = async () => {
    setEmailLoading(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/email/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: emailConfig,
          templates,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        success('Email configurations saved successfully!');
        if (data.config) setEmailConfig(data.config);
      } else {
        error(data.error || 'Failed to save email settings');
      }
    } catch {
      error('Error saving email settings');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleTestEmailConnection = async () => {
    const toEmail = prompt('Enter recipient email address to send test verification email:');
    if (!toEmail || !toEmail.includes('@')) return;

    setEmailLoading(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toEmail }),
      });
      const data = await res.json();
      setTestResult(data);
      if (res.ok && data.success) {
        success(data.message || `Test email dispatched to ${toEmail}`);
      } else {
        error(data.error || 'Email connection test failed');
      }
    } catch (err: any) {
      setTestResult({ success: false, error: err.message || 'Network error during test' });
      error('Network error during test');
    } finally {
      setEmailLoading(false);
    }
  };

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // ── Bay Actions ──
  const handleCreateBay = async () => {
    if (!newBayName.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE_BAY', name: newBayName.trim() }),
      });
      const data = await res.json();
      if (data.success && data.resource) {
        setResources((prev) => [...prev, data.resource]);
        setNewBayName('');
        success(`Workstation ${data.resource.name} created successfully.`);
      } else {
        error(data.error || 'Failed to add bay');
      }
    } catch {
      error('Error creating bay');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleBay = async (id: string, currentActive: boolean) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TOGGLE_BAY', resourceId: id, isActive: currentActive }),
      });
      const data = await res.json();
      if (data.success && data.resources) {
        setResources(data.resources);
        success(`Bay status updated to ${!currentActive ? 'Active' : 'Disabled'}.`);
      }
    } catch {
      error('Failed to toggle bay status');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Business Hours Actions ──
  const openEditHour = (dIndex: number) => {
    const existing = hours.find((h) => h.dayOfWeek === dIndex);
    setEditingDay(dIndex);
    if (existing) {
      setEditStart(existing.startTime);
      setEditEnd(existing.endTime);
      setEditIsClosed(false);
    } else {
      setEditStart('10:00');
      setEditEnd('19:00');
      setEditIsClosed(true);
    }
  };

  const handleSaveHours = async () => {
    if (editingDay === null) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_HOURS',
          dayOfWeek: editingDay,
          startTime: editStart,
          endTime: editEnd,
          isClosed: editIsClosed,
        }),
      });
      const data = await res.json();
      if (data.success && data.hours) {
        setHours(data.hours);
        setEditingDay(null);
        success('Operating shift schedule updated.');
      } else {
        error(data.error || 'Failed to update schedule');
      }
    } catch {
      error('Error saving business hours');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Blocked Dates Actions ──
  const handleAddBlockedDate = async () => {
    if (!newBlockedDate) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_BLOCKED_DATE',
          date: newBlockedDate,
          reason: newBlockedReason.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.blockedDates) {
        setBlockedDates(data.blockedDates);
        setNewBlockedDate('');
        setNewBlockedReason('');
        success(`Date ${newBlockedDate} added to studio blackout calendar.`);
      } else {
        error(data.error || 'Failed to block date');
      }
    } catch {
      error('Error adding blocked date');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBlockedDate = async (date: string) => {
    if (!confirm(`Are you sure you want to unblock ${date}? Public appointments will be accepted for this day.`)) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_BLOCKED_DATE', date }),
      });
      const data = await res.json();
      if (data.success && data.blockedDates) {
        setBlockedDates(data.blockedDates);
        success(`Date ${date} unblocked. Appointments are now accepted.`);
      }
    } catch {
      error('Error unblocking date');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Booking Rules Actions ──
  const handleSaveRules = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_BOOKING_RULES',
          ...rules,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRulesSavedMsg(true);
        success('Booking engine scheduling rules saved.');
        setTimeout(() => setRulesSavedMsg(false), 3000);
      }
    } catch {
      error('Error updating booking rules');
    } finally {
      setActionLoading(false);
    }
  };

  // Derived KPI Stats
  const activeBaysCount = resources.filter((r) => r.isActive).length;
  const totalBaysCount = resources.length;
  const openDaysCount = hours.filter((h) => h.startTime && h.endTime).length;
  const blockedDatesCount = blockedDates.length;
  const isCommsFullyActive = emailConfig.isEnabled && whatsAppConfig.isEnabled;

  return (
    <div className={styles.container}>
      {/* ── Executive Header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.eyebrow}>
            <span>Studio Control</span>
            <span className={styles.eyebrowDot} />
            <span>System &amp; Security</span>
            <span className={styles.eyebrowDot} />
            <span>Master Configuration</span>
          </div>
          <h1 className={styles.pageTitle}>Studio Settings &amp; Configuration</h1>
          <p className={styles.pageSubtitle}>
            Manage detailing bays, weekly operating shifts, blackout schedules, and transactional automation infrastructure.
          </p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.statusBadge}>
            <span className={styles.pulseDot} />
            <span>Studio Engine Operational</span>
          </div>
        </div>
      </div>

      {/* ── Executive KPI Metric Cards Strip ── */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Detailing Bays</span>
            <span className={styles.metricValue}>
              {activeBaysCount} <span style={{ fontSize: '1rem', color: '#94A3B8', fontWeight: 600 }}>/ {totalBaysCount}</span>
            </span>
            <span className={styles.metricSubtext}>
              <span style={{ color: '#16A34A', fontWeight: 700 }}>●</span> Parallel workstation capacity
            </span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconGold}`}>
            <Icon.Bay size={22} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Weekly Schedule</span>
            <span className={styles.metricValue}>{openDaysCount} Days</span>
            <span className={styles.metricSubtext}>
              Mon – Sat active (Sun deep sterilize)
            </span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconGreen}`}>
            <Icon.Clock size={22} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Blocked Blackouts</span>
            <span className={styles.metricValue}>{blockedDatesCount}</span>
            <span className={styles.metricSubtext}>
              Holidays &amp; maintenance windows
            </span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconAmber}`}>
            <Icon.Calendar size={22} />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Automation Gateways</span>
            <span className={styles.metricValue} style={{ fontSize: '1.25rem' }}>
              {isCommsFullyActive ? 'Active Engine' : 'Standby'}
            </span>
            <span className={styles.metricSubtext}>
              Email ({emailConfig.providerType}) • WA ({whatsAppDeliveryMode})
            </span>
          </div>
          <div className={`${styles.metricIconWrap} ${styles.metricIconPurple}`}>
            <Icon.Zap size={22} />
          </div>
        </div>
      </div>

      {/* ── Segmented Navigation Tabs ── */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === 'STUDIO' ? styles.tabButtonActive : ''}`}
            onClick={() => setActiveTab('STUDIO')}
          >
            <Icon.Bay size={16} />
            <span>Detailing Bays &amp; Scheduling</span>
            <span className={`${styles.tabBadge} ${activeTab === 'STUDIO' ? '' : styles.tabBadgeInactive}`}>
              {totalBaysCount}
            </span>
          </button>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === 'EMAIL' ? styles.tabButtonActive : ''}`}
            onClick={() => setActiveTab('EMAIL')}
          >
            <Icon.Mail size={16} />
            <span>Email &amp; Automation Infrastructure</span>
            <span className={`${styles.tabBadge} ${activeTab === 'EMAIL' ? '' : styles.tabBadgeInactive}`}>
              {emailConfig.providerType}
            </span>
          </button>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === 'WHATSAPP' ? styles.tabButtonActive : ''}`}
            onClick={() => setActiveTab('WHATSAPP')}
          >
            <Icon.WhatsApp size={16} />
            <span>WhatsApp Cloud API &amp; Automations</span>
            <span className={`${styles.tabBadge} ${activeTab === 'WHATSAPP' ? '' : styles.tabBadgeInactive}`}>
              {whatsAppDeliveryMode}
            </span>
          </button>
        </div>
      </div>

      {activeTab === 'STUDIO' ? (
        <div className={styles.grid}>
          {/* ── 1. Detailing Bays ── */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <span className={styles.cardIconHolder}>
                  <Icon.Bay size={18} />
                </span>
                Detailing Bays &amp; Workstations
              </h2>
            </div>
            <p className={styles.cardDescription}>
              Active bays appear in the booking engine for parallel appointment slots. Disabled bays are temporarily pulled from scheduling calculations.
            </p>

            <div className={styles.bayList}>
              {resources.map((r, idx) => (
                <div key={r.id} className={styles.bayRow}>
                  <div className={styles.bayMeta}>
                    <div className={styles.bayIcon}>
                      #{idx + 1}
                    </div>
                    <div className={styles.bayInfo}>
                      <span className={styles.bayName}>{r.name}</span>
                      <span className={styles.bayIdBadge}>
                        ID: {r.id.slice(-6).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`${styles.bayToggleBtn} ${r.isActive ? styles.bayActive : styles.bayDisabled}`}
                    disabled={actionLoading}
                    onClick={() => handleToggleBay(r.id, r.isActive)}
                  >
                    <span className={styles.bayIndicatorDot} />
                    {r.isActive ? 'Active' : 'Disabled'}
                  </button>
                </div>
              ))}
            </div>

            <div className={styles.addBayRow}>
              <input
                type="text"
                placeholder="New Bay Name (e.g. Bay 3 - Wash Bay)"
                value={newBayName}
                onChange={(e) => setNewBayName(e.target.value)}
                className={styles.inputField}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={handleCreateBay}
                disabled={actionLoading || !newBayName.trim()}
                className={styles.btnPrimary}
              >
                <Icon.Plus size={14} /> Add Bay
              </button>
            </div>
          </div>

          {/* ── 2. Operating Schedule (Business Hours) ── */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <span className={styles.cardIconHolder}>
                  <Icon.Clock size={18} />
                </span>
                Operating Schedule
              </h2>
            </div>
            <p className={styles.cardDescription}>
              Click on any day to modify operating shifts or toggle studio closure. Time ranges determine public slot boundaries.
            </p>

            <div className={styles.hoursList}>
              {[1, 2, 3, 4, 5, 6, 0].map((dIndex) => {
                const h = hours.find((hour) => hour.dayOfWeek === dIndex);
                const isEditing = editingDay === dIndex;

                return (
                  <div key={dIndex} style={{ padding: '0.625rem 0', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={styles.hourDay}>{days[dIndex]}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span className={`${styles.hourTimeBadge} ${!h ? styles.hourClosedBadge : ''}`}>
                          <Icon.Clock size={12} />
                          {h ? `${h.startTime} – ${h.endTime}` : 'Closed (Deep Cleaning)'}
                        </span>
                        <button
                          type="button"
                          onClick={() => openEditHour(dIndex)}
                          className={styles.editActionBtn}
                        >
                          <Icon.Edit size={12} />
                          {isEditing ? 'Cancel' : 'Edit'}
                        </button>
                      </div>
                    </div>

                    {/* Inline Edit Form */}
                    {isEditing && (
                      <div className={styles.inlineEditDrawer}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>
                          <input
                            type="checkbox"
                            checked={editIsClosed}
                            onChange={(e) => setEditIsClosed(e.target.checked)}
                            style={{ cursor: 'pointer' }}
                          />
                          Mark Closed
                        </label>

                        {!editIsClosed && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                              type="time"
                              value={editStart}
                              onChange={(e) => setEditStart(e.target.value)}
                              className={styles.inputField}
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            />
                            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>to</span>
                            <input
                              type="time"
                              value={editEnd}
                              onChange={(e) => setEditEnd(e.target.value)}
                              className={styles.inputField}
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            />
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={handleSaveHours}
                          disabled={actionLoading}
                          className={styles.btnPrimary}
                          style={{ marginLeft: 'auto', padding: '0.35rem 0.875rem', fontSize: '0.75rem' }}
                        >
                          Save
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 3. Blocked Dates Manager ── */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <span className={styles.cardIconHolder}>
                  <Icon.Calendar size={18} />
                </span>
                Studio Blocked Dates &amp; Holidays
              </h2>
            </div>
            <p className={styles.cardDescription}>
              Block specific calendar dates for national holidays, deep studio maintenance, or closed track day events.
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                type="date"
                value={newBlockedDate}
                onChange={(e) => setNewBlockedDate(e.target.value)}
                className={styles.inputField}
                style={{ minWidth: '150px' }}
              />
              <input
                type="text"
                placeholder="Reason (e.g. Diwali Holiday, Track Day)"
                value={newBlockedReason}
                onChange={(e) => setNewBlockedReason(e.target.value)}
                className={styles.inputField}
                style={{ flex: 1, minWidth: '160px' }}
              />
              <button
                type="button"
                onClick={handleAddBlockedDate}
                disabled={actionLoading || !newBlockedDate}
                className={styles.btnPrimary}
              >
                <Icon.Plus size={14} /> Block Date
              </button>
            </div>

            <div style={{ marginTop: '0.25rem', maxHeight: '200px', overflowY: 'auto' }}>
              {blockedDates.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px dashed #CBD5E1' }}>
                  <Icon.Calendar size={28} color="#94A3B8" style={{ margin: '0 auto 6px' }} />
                  <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: 0, fontWeight: 500 }}>
                    No dates currently blocked. All business days accept appointments.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {blockedDates.map((bd) => (
                    <div key={bd.id} className={styles.blockedDateItem}>
                      <div className={styles.blockedDateText}>
                        <Icon.Calendar size={14} color="#B45309" />
                        <span className={styles.blockedDateBadge}>{bd.date}</span>
                        <span className={styles.blockedReasonBadge}>
                          {bd.reason || 'Closed'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteBlockedDate(bd.date)}
                        className={styles.unblockBtn}
                      >
                        <Icon.Cross size={12} /> Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── 4. Booking Engine Rules & Tolerances ── */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <span className={styles.cardIconHolder}>
                  <Icon.Settings size={18} />
                </span>
                Booking Rules &amp; Tolerances
              </h2>
              {rulesSavedMsg && (
                <span style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icon.Check size={14} /> Rules Saved
                </span>
              )}
            </div>
            <p className={styles.cardDescription}>
              Configure global turnaround buffer time between services, minimum same-day notice lead times, and scheduling slot intervals.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #F1F5F9' }}>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A' }}>
                    Post-Service Buffer Time
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Disinfection and bay preparation time added after every completed service.
                  </div>
                </div>
                <select
                  value={rules.bufferMinutes}
                  onChange={(e) => setRules({ ...rules, bufferMinutes: Number(e.target.value) })}
                  className={styles.selectField}
                >
                  <option value={0}>0 mins (No buffer)</option>
                  <option value={15}>15 mins (Standard turnaround)</option>
                  <option value={30}>30 mins (Extended wash)</option>
                  <option value={45}>45 mins (Deep sterilize)</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #F1F5F9' }}>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A' }}>
                    Min Same-Day Lead Time
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Minimum hours in advance a customer must book before arrival.
                  </div>
                </div>
                <select
                  value={rules.minLeadTimeHours}
                  onChange={(e) => setRules({ ...rules, minLeadTimeHours: Number(e.target.value) })}
                  className={styles.selectField}
                >
                  <option value={1}>1 hour</option>
                  <option value={2}>2 hours (Standard)</option>
                  <option value={4}>4 hours</option>
                  <option value={24}>24 hours (Advance only)</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A' }}>
                    Slot Granularity Step
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Time increments presented in the public booking scheduler calendar.
                  </div>
                </div>
                <select
                  value={rules.slotGranularityMinutes}
                  onChange={(e) => setRules({ ...rules, slotGranularityMinutes: Number(e.target.value) })}
                  className={styles.selectField}
                >
                  <option value={30}>Every 30 mins</option>
                  <option value={60}>Every 60 mins (On the hour)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleSaveRules}
                disabled={actionLoading}
                className={styles.btnPrimary}
                style={{ alignSelf: 'flex-end', marginTop: '0.5rem' }}
              >
                <Icon.Check size={14} /> Save Scheduling Rules
              </button>
            </div>
          </div>

          {/* ── 5. Studio Profile & Identity ── */}
          <div className={styles.card} style={{ gridColumn: '1 / -1' }}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <span className={styles.cardIconHolder}>
                  <Icon.Car size={18} />
                </span>
                Studio Profile &amp; Legal Identity
              </h2>
            </div>
            <p className={styles.cardDescription}>
              Verified brand details displayed on official invoices, formal quotation proposals, and transactional notifications.
            </p>

            <div className={styles.profileGrid}>
              <div className={styles.infoTile}>
                <span className={styles.infoLabel}>Studio Brand Name</span>
                <span className={styles.infoVal}>SMOKE M CUSTOMS</span>
              </div>
              <div className={styles.infoTile}>
                <span className={styles.infoLabel}>Specialization</span>
                <span className={styles.infoVal}>Luxury Automotive Detailing &amp; Paint Protection</span>
              </div>
              <div className={styles.infoTile}>
                <span className={styles.infoLabel}>Studio Hotline</span>
                <span className={styles.infoVal}>+91 98765 43210</span>
              </div>
              <div className={styles.infoTile}>
                <span className={styles.infoLabel}>WhatsApp Concierge</span>
                <span className={styles.infoVal}>+91 98765 43210</span>
              </div>
              <div className={styles.infoTile}>
                <span className={styles.infoLabel}>Official Email</span>
                <span className={styles.infoVal}>concierge@smokecustoms.com</span>
              </div>
              <div className={styles.infoTile}>
                <span className={styles.infoLabel}>GST Registration Number</span>
                <span className={styles.infoVal}>29AAACS1234F1Z5</span>
              </div>
              <div className={styles.infoTile} style={{ gridColumn: 'span 2' }}>
                <span className={styles.infoLabel}>Studio Atelier Address</span>
                <span className={styles.infoVal}>Plot 42, Industrial Area, Bangalore 560068, Karnataka, India</span>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'EMAIL' ? (
        /* ── EMAIL & AUTOMATION CONFIGURATION ── */
        <div className={styles.grid}>
          {/* Card 1: Provider Infrastructure */}
          <div className={styles.card} style={{ gridColumn: 'span 1' }}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <span className={styles.cardIconHolder}>
                  <Icon.Mail size={18} />
                </span>
                Email Service Provider &amp; Credentials
              </h2>
            </div>
            <p className={styles.cardDescription}>
              Choose your active dispatch engine. Switch seamlessly between Free Simulated Sandbox, Custom SMTP (Brevo/Gmail), or Resend Cloud.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Active Dispatch Engine</label>
                <select
                  className={styles.selectField}
                  value={emailConfig.providerType}
                  onChange={(e) => setEmailConfig({ ...emailConfig, providerType: e.target.value as any })}
                >
                  <option value="SIMULATED">Simulated / Local Sandbox (Zero setup, preview links)</option>
                  <option value="SMTP">Custom SMTP (Brevo 300 free/day, Gmail, SES, Mailgun)</option>
                  <option value="RESEND">Resend Cloud API</option>
                </select>
              </div>

              {emailConfig.providerType === 'SIMULATED' && (
                <div className={styles.noticeBannerAmber}>
                  <Icon.Info size={14} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
                  <strong>Simulated Sandbox Active:</strong> Emails will be rendered with full luxury Atelier templates and logged cleanly to server console with interactive preview URLs. No external mail server required.
                </div>
              )}

              {emailConfig.providerType === 'SMTP' && (
                <>
                  <div className={styles.noticeBannerBlue}>
                    <Icon.Lightbulb size={14} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
                    <strong>Free Service Recommendation:</strong> Brevo (Sendinblue) offers <strong>300 free emails per day</strong>. Host: <code>smtp-relay.brevo.com</code>, Port: <code>587</code>, Secure: <code>No (STARTTLS)</code>.
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem' }}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>SMTP Host</label>
                      <input
                        type="text"
                        className={styles.inputField}
                        placeholder="e.g. smtp-relay.brevo.com"
                        value={emailConfig.smtpHost || ''}
                        onChange={(e) => setEmailConfig({ ...emailConfig, smtpHost: e.target.value })}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Port</label>
                      <input
                        type="number"
                        className={styles.inputField}
                        placeholder="587"
                        value={emailConfig.smtpPort || 587}
                        onChange={(e) => setEmailConfig({ ...emailConfig, smtpPort: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '2px 0' }}>
                    <input
                      type="checkbox"
                      id="smtp-secure"
                      checked={Boolean(emailConfig.smtpSecure)}
                      onChange={(e) => setEmailConfig({ ...emailConfig, smtpSecure: e.target.checked })}
                      style={{ cursor: 'pointer' }}
                    />
                    <label htmlFor="smtp-secure" style={{ fontSize: '0.75rem', color: '#475569', cursor: 'pointer' }}>
                      Require Direct SSL/TLS (Enable for port 465; leave disabled for 587 STARTTLS)
                    </label>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>SMTP Username / Account Email</label>
                    <input
                      type="text"
                      className={styles.inputField}
                      placeholder="e.g. concierge@smokecustoms.com or Brevo API login"
                      value={emailConfig.smtpUser || ''}
                      onChange={(e) => setEmailConfig({ ...emailConfig, smtpUser: e.target.value })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>SMTP Password / Master Key</label>
                    <input
                      type="password"
                      className={styles.inputField}
                      placeholder="••••••••"
                      value={emailConfig.smtpPassword || ''}
                      onChange={(e) => setEmailConfig({ ...emailConfig, smtpPassword: e.target.value })}
                    />
                  </div>
                </>
              )}

              {emailConfig.providerType === 'RESEND' && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Resend API Key</label>
                  <input
                    type="password"
                    className={styles.inputField}
                    placeholder="re_xxxxxxxxxxxx"
                    value={emailConfig.resendApiKey || ''}
                    onChange={(e) => setEmailConfig({ ...emailConfig, resendApiKey: e.target.value })}
                  />
                  <span style={{ fontSize: '10px', color: '#64748B' }}>
                    Resend provides 100 free transactional emails per day. Sign up at resend.com.
                  </span>
                </div>
              )}

              <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '4px 0' }} />

              {/* Sender Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>From Name</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={emailConfig.fromName || ''}
                    onChange={(e) => setEmailConfig({ ...emailConfig, fromName: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>From Email</label>
                  <input
                    type="email"
                    className={styles.inputField}
                    value={emailConfig.fromEmail || ''}
                    onChange={(e) => setEmailConfig({ ...emailConfig, fromEmail: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Reply-To Email</label>
                <input
                  type="email"
                  className={styles.inputField}
                  value={emailConfig.replyToEmail || ''}
                  onChange={(e) => setEmailConfig({ ...emailConfig, replyToEmail: e.target.value })}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleSaveEmailSettings}
                  disabled={emailLoading}
                  className={styles.btnPrimary}
                >
                  <Icon.Check size={14} />
                  {emailLoading ? 'Saving...' : 'Save Provider Settings'}
                </button>
                <button
                  type="button"
                  onClick={handleTestEmailConnection}
                  disabled={emailLoading}
                  className={styles.btnSecondary}
                >
                  <Icon.Zap size={14} /> Verify Connection &amp; Test
                </button>
              </div>

              {/* Test Result Message */}
              {testResult && (
                <div
                  className={`${styles.testResultBox} ${testResult.success ? styles.testResultSuccess : styles.testResultError}`}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                    {testResult.success ? (
                      <>
                        <Icon.Check size={16} /> Verification Succeeded:
                      </>
                    ) : (
                      <>
                        <Icon.Cross size={16} /> Verification Failed:
                      </>
                    )}
                  </div>
                  <span>{testResult.message || testResult.error}</span>
                  {testResult.previewUrl && (
                    <div style={{ marginTop: '4px' }}>
                      <a
                        href={testResult.previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#B45309', fontWeight: 600, textDecoration: 'underline' }}
                      >
                        Open Generated Email Preview ↗
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Transactional Triggers */}
          <div className={styles.card} style={{ gridColumn: 'span 1' }}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <span className={styles.cardIconHolder}>
                  <Icon.Zap size={18} />
                </span>
                Event-Driven Automated Emails
              </h2>
            </div>
            <p className={styles.cardDescription}>
              Control which operational events automatically trigger luxury HTML notifications to clients. Customise subject lines per event.
            </p>

            {/* Master Switch */}
            <div
              className={`${styles.toggleRow} ${emailConfig.isEnabled ? styles.toggleMaster : styles.toggleMasterPaused}`}
            >
              <div>
                <strong style={{ fontSize: '0.8125rem', color: '#0F172A' }}>
                  Global Automated Email Dispatch
                </strong>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  {emailConfig.isEnabled
                    ? 'Automated transactional emails are actively dispatched.'
                    : 'All automated client emails are temporarily paused.'}
                </div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(emailConfig.isEnabled)}
                onChange={(e) => setEmailConfig({ ...emailConfig, isEnabled: e.target.checked })}
                style={{ transform: 'scale(1.25)', cursor: 'pointer' }}
              />
            </div>

            {/* Trigger 1: Lead Welcome */}
            <div className={styles.toggleRow}>
              <div style={{ flex: 1, marginRight: '12px' }}>
                <strong style={{ fontSize: '0.8125rem', color: '#0F172A' }}>
                  1. Lead Welcome Acknowledgment
                </strong>
                <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 6px 0' }}>
                  Dispatched immediately upon new inquiry submission or estimate request.
                </p>
                <input
                  type="text"
                  className={styles.inputField}
                  style={{ width: '100%', fontSize: '0.75rem', padding: '0.4rem 0.625rem' }}
                  placeholder="Custom subject line..."
                  value={templates.LEAD_WELCOME?.subject || 'Welcome to Smoke M Customs — Detailing Inquiry Received'}
                  onChange={(e) =>
                    setTemplates({
                      ...templates,
                      LEAD_WELCOME: { ...templates.LEAD_WELCOME, subject: e.target.value },
                    })
                  }
                />
              </div>
              <input
                type="checkbox"
                checked={templates.LEAD_WELCOME?.isEnabled ?? true}
                onChange={(e) =>
                  setTemplates({
                    ...templates,
                    LEAD_WELCOME: { ...templates.LEAD_WELCOME, isEnabled: e.target.checked },
                  })
                }
                style={{ transform: 'scale(1.25)', cursor: 'pointer' }}
              />
            </div>

            {/* Trigger 2: Quote Sent */}
            <div className={styles.toggleRow}>
              <div style={{ flex: 1, marginRight: '12px' }}>
                <strong style={{ fontSize: '0.8125rem', color: '#0F172A' }}>
                  2. Formal Quotation Proposal Delivered
                </strong>
                <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 6px 0' }}>
                  Dispatched when an official estimate with interactive link is sent to the client.
                </p>
                <input
                  type="text"
                  className={styles.inputField}
                  style={{ width: '100%', fontSize: '0.75rem', padding: '0.4rem 0.625rem' }}
                  placeholder="Custom subject line..."
                  value={templates.QUOTE_SENT?.subject || 'Your Detailing Estimate — Smoke M Customs'}
                  onChange={(e) =>
                    setTemplates({
                      ...templates,
                      QUOTE_SENT: { ...templates.QUOTE_SENT, subject: e.target.value },
                    })
                  }
                />
              </div>
              <input
                type="checkbox"
                checked={templates.QUOTE_SENT?.isEnabled ?? true}
                onChange={(e) =>
                  setTemplates({
                    ...templates,
                    QUOTE_SENT: { ...templates.QUOTE_SENT, isEnabled: e.target.checked },
                  })
                }
                style={{ transform: 'scale(1.25)', cursor: 'pointer' }}
              />
            </div>

            {/* Trigger 3: Booking Confirmed (.ics invite) */}
            <div className={styles.toggleRow}>
              <div style={{ flex: 1, marginRight: '12px' }}>
                <strong style={{ fontSize: '0.8125rem', color: '#0F172A' }}>
                  3. Appointment Confirmed (Calendar .ics Invite)
                </strong>
                <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 6px 0' }}>
                  Dispatched when booking is confirmed; attaches Apple/Google calendar event and bay assignment.
                </p>
                <input
                  type="text"
                  className={styles.inputField}
                  style={{ width: '100%', fontSize: '0.75rem', padding: '0.4rem 0.625rem' }}
                  placeholder="Custom subject line..."
                  value={templates.BOOKING_CONFIRMATION?.subject || 'Appointment Confirmed — Smoke M Customs Detailing'}
                  onChange={(e) =>
                    setTemplates({
                      ...templates,
                      BOOKING_CONFIRMATION: { ...templates.BOOKING_CONFIRMATION, subject: e.target.value },
                    })
                  }
                />
              </div>
              <input
                type="checkbox"
                checked={templates.BOOKING_CONFIRMATION?.isEnabled ?? true}
                onChange={(e) =>
                  setTemplates({
                    ...templates,
                    BOOKING_CONFIRMATION: { ...templates.BOOKING_CONFIRMATION, isEnabled: e.target.checked },
                  })
                }
                style={{ transform: 'scale(1.25)', cursor: 'pointer' }}
              />
            </div>

            {/* Trigger 4: Booking Cancelled */}
            <div className={styles.toggleRow}>
              <div style={{ flex: 1, marginRight: '12px' }}>
                <strong style={{ fontSize: '0.8125rem', color: '#0F172A' }}>
                  4. Appointment Cancellation Notice
                </strong>
                <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 6px 0' }}>
                  Dispatched when an appointment is cancelled, offering a direct link to reschedule.
                </p>
                <input
                  type="text"
                  className={styles.inputField}
                  style={{ width: '100%', fontSize: '0.75rem', padding: '0.4rem 0.625rem' }}
                  placeholder="Custom subject line..."
                  value={templates.BOOKING_CANCELLED?.subject || 'Appointment Cancelled — Smoke M Customs'}
                  onChange={(e) =>
                    setTemplates({
                      ...templates,
                      BOOKING_CANCELLED: { ...templates.BOOKING_CANCELLED, subject: e.target.value },
                    })
                  }
                />
              </div>
              <input
                type="checkbox"
                checked={templates.BOOKING_CANCELLED?.isEnabled ?? true}
                onChange={(e) =>
                  setTemplates({
                    ...templates,
                    BOOKING_CANCELLED: { ...templates.BOOKING_CANCELLED, isEnabled: e.target.checked },
                  })
                }
                style={{ transform: 'scale(1.25)', cursor: 'pointer' }}
              />
            </div>

            <button
              type="button"
              onClick={handleSaveEmailSettings}
              disabled={emailLoading}
              className={styles.btnPrimary}
              style={{ alignSelf: 'flex-end', marginTop: '0.5rem' }}
            >
              <Icon.Check size={14} />
              {emailLoading ? 'Saving...' : 'Save Trigger Settings'}
            </button>
          </div>
        </div>
      ) : (
        /* ── WHATSAPP CLOUD API & AUTOMATIONS ── */
        <div className={styles.grid}>
          {/* Status & Overview Banner */}
          <div className={styles.card} style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 className={styles.cardTitle} style={{ fontSize: '1.125rem' }}>
                  <span className={styles.cardIconHolder} style={{ backgroundColor: '#F0FDF4', color: '#16A34A' }}>
                    <Icon.WhatsApp size={20} />
                  </span>
                  Meta WhatsApp Business Cloud API
                </h2>
                <p className={styles.cardDescription} style={{ marginTop: '4px' }}>
                  Two-way messaging infrastructure. Automated template alerts for bookings, quotations, and leads, plus live CRM chat synchronisation.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '0.35rem 0.875rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: whatsAppDeliveryMode === 'LIVE' ? '#ECFDF5' : '#FFFBEB',
                    color: whatsAppDeliveryMode === 'LIVE' ? '#059669' : '#B45309',
                    border: `1px solid ${whatsAppDeliveryMode === 'LIVE' ? '#A7F3D0' : '#FDE68A'}`,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      backgroundColor: whatsAppDeliveryMode === 'LIVE' ? '#10B981' : '#F59E0B',
                    }}
                  />
                  {whatsAppDeliveryMode === 'LIVE' ? 'Live Meta Cloud API' : 'Developer Sandbox (Simulated)'}
                </span>

                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, color: '#0F172A' }}>
                  <input
                    type="checkbox"
                    checked={whatsAppConfig.isEnabled}
                    onChange={(e) => setWhatsAppConfig({ ...whatsAppConfig, isEnabled: e.target.checked })}
                    style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                  />
                  Enable WhatsApp Engine
                </label>
              </div>
            </div>
          </div>

          {/* Card 1: Meta Cloud API Credentials */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <span className={styles.cardIconHolder}>
                  <Icon.Lock size={18} />
                </span>
                API Credentials &amp; Phone Setup
              </h2>
            </div>
            <p className={styles.cardDescription}>
              Meta Developer App configuration for your verified WhatsApp Business phone number.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>WhatsApp Phone Number ID</label>
                <input
                  type="text"
                  className={styles.inputField}
                  placeholder="e.g. 109283746592837"
                  value={whatsAppConfig.phoneNumberId}
                  onChange={(e) => setWhatsAppConfig({ ...whatsAppConfig, phoneNumberId: e.target.value.trim() })}
                />
                <span style={{ fontSize: '10px', color: '#64748B' }}>
                  Found under Meta App Dashboard &gt; WhatsApp &gt; API Setup &gt; Phone number ID.
                </span>
              </div>

              <div className={styles.formGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className={styles.formLabel}>System User Access Token</label>
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    style={{ background: 'none', border: 'none', color: '#B45309', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {showSecret ? 'Hide' : 'Show / Edit'}
                  </button>
                </div>
                <input
                  type={showSecret ? 'text' : 'password'}
                  className={styles.inputField}
                  placeholder="Permanent EAAB... access token"
                  value={whatsAppConfig.accessToken}
                  onChange={(e) => setWhatsAppConfig({ ...whatsAppConfig, accessToken: e.target.value.trim() })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Meta App Secret (HMAC-SHA256)</label>
                <input
                  type={showSecret ? 'text' : 'password'}
                  className={styles.inputField}
                  placeholder="App secret for inbound signature verification"
                  value={whatsAppConfig.appSecret}
                  onChange={(e) => setWhatsAppConfig({ ...whatsAppConfig, appSecret: e.target.value.trim() })}
                />
                <span style={{ fontSize: '10px', color: '#64748B' }}>
                  Used to verify Meta webhook signatures and prevent spoofed incoming messages.
                </span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Studio Display Number</label>
                <input
                  type="text"
                  className={styles.inputField}
                  placeholder="+91 98765 43210"
                  value={whatsAppConfig.studioBusinessPhone}
                  onChange={(e) => setWhatsAppConfig({ ...whatsAppConfig, studioBusinessPhone: e.target.value.trim() })}
                />
              </div>

              <button
                type="button"
                onClick={handleSaveWhatsAppSettings}
                disabled={whatsAppLoading}
                className={styles.btnPrimary}
                style={{ alignSelf: 'flex-start', marginTop: '0.25rem' }}
              >
                <Icon.Check size={14} />
                {whatsAppLoading ? 'Saving...' : 'Save API Credentials'}
              </button>
            </div>
          </div>

          {/* Card 2: Automated Workflow Messaging Triggers */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <span className={styles.cardIconHolder}>
                  <Icon.Zap size={18} />
                </span>
                Automated Workflow Triggers
              </h2>
            </div>
            <p className={styles.cardDescription}>
              Trigger instant transactional WhatsApp alerts to clients upon key studio lifecycle events.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid #F1F5F9' }}>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A' }}>New Lead Welcome Message</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Sends instant greeting &amp; studio confirmation when client submits inquiry.</div>
                </div>
                <input
                  type="checkbox"
                  checked={whatsAppConfig.autoSendLeadWelcome}
                  onChange={(e) => setWhatsAppConfig({ ...whatsAppConfig, autoSendLeadWelcome: e.target.checked })}
                  style={{ transform: 'scale(1.25)', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid #F1F5F9' }}>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A' }}>Bay Booking Confirmation</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Dispatches appointment date, slot time, and bay details upon slot reservation.</div>
                </div>
                <input
                  type="checkbox"
                  checked={whatsAppConfig.autoSendBookingConfirmation}
                  onChange={(e) => setWhatsAppConfig({ ...whatsAppConfig, autoSendBookingConfirmation: e.target.checked })}
                  style={{ transform: 'scale(1.25)', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid #F1F5F9' }}>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A' }}>Booking Cancellation Alert</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Sends notice if a client appointment is cancelled or rescheduled.</div>
                </div>
                <input
                  type="checkbox"
                  checked={whatsAppConfig.autoSendBookingCancellation}
                  onChange={(e) => setWhatsAppConfig({ ...whatsAppConfig, autoSendBookingCancellation: e.target.checked })}
                  style={{ transform: 'scale(1.25)', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0' }}>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A' }}>Formal Quotation Dispatched</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Sends itemized total and viewable quote link when quote is issued.</div>
                </div>
                <input
                  type="checkbox"
                  checked={whatsAppConfig.autoSendQuoteNotification}
                  onChange={(e) => setWhatsAppConfig({ ...whatsAppConfig, autoSendQuoteNotification: e.target.checked })}
                  style={{ transform: 'scale(1.25)', cursor: 'pointer' }}
                />
              </div>

              <button
                type="button"
                onClick={handleSaveWhatsAppSettings}
                disabled={whatsAppLoading}
                className={styles.btnPrimary}
                style={{ alignSelf: 'flex-start', marginTop: '0.25rem' }}
              >
                <Icon.Check size={14} />
                {whatsAppLoading ? 'Saving...' : 'Save Automation Triggers'}
              </button>
            </div>
          </div>

          {/* Card 3: Inbound Webhook Configuration */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <span className={styles.cardIconHolder}>
                  <Icon.Refresh size={18} />
                </span>
                Meta Webhook Live Setup
              </h2>
            </div>
            <p className={styles.cardDescription}>
              Configure Meta Webhooks in the Facebook Developer Portal to receive incoming client WhatsApp messages directly into the CRM.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Callback URL</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    readOnly
                    className={styles.inputField}
                    value={whatsAppWebhookUrl || 'https://smokecustoms.com/api/webhooks/whatsapp'}
                    style={{ backgroundColor: '#F8FAFC', color: '#B45309', fontWeight: 600, flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(whatsAppWebhookUrl || 'https://smokecustoms.com/api/webhooks/whatsapp');
                      success('Callback URL copied to clipboard!');
                    }}
                    className={styles.btnSecondary}
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Verify Token</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={whatsAppConfig.webhookVerifyToken}
                    onChange={(e) => setWhatsAppConfig({ ...whatsAppConfig, webhookVerifyToken: e.target.value.trim() })}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(whatsAppConfig.webhookVerifyToken);
                      success('Verify token copied to clipboard!');
                    }}
                    className={styles.btnSecondary}
                  >
                    Copy
                  </button>
                </div>
                <span style={{ fontSize: '10px', color: '#64748B' }}>
                  Match this exact string in Meta App &gt; Webhooks &gt; WhatsApp Business Account &gt; Verify Token.
                </span>
              </div>

              <div style={{ backgroundColor: '#F8FAFC', padding: '0.875rem', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '0.75rem', color: '#334155' }}>
                <strong style={{ color: '#0F172A' }}>Required Webhook Fields:</strong>
                <ul style={{ margin: '6px 0 0 16px', padding: 0, lineHeight: 1.6 }}>
                  <li><code>messages</code> (Incoming customer messages &amp; replies)</li>
                  <li><code>message_template_status_update</code> (Template approval status)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Card 4: Outbound Test Sender & Inbound Simulator */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <span className={styles.cardIconHolder}>
                  <Icon.Send size={18} />
                </span>
                Connectivity Test &amp; Inbound Simulator
              </h2>
            </div>
            <p className={styles.cardDescription}>
              Verify outbound dispatch to your phone or simulate client inbound messages to verify CRM ingestion.
            </p>

            {/* Test 1: Outbound */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingBottom: '1rem', borderBottom: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A' }}>
                Test Outbound Dispatch
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem' }}>
                <input
                  type="tel"
                  placeholder="Recipient mobile (+91 98765 43210)"
                  className={styles.inputField}
                  value={waTestPhone}
                  onChange={(e) => setWaTestPhone(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleSendWhatsAppTest}
                  disabled={waTestLoading}
                  className={styles.btnPrimary}
                >
                  <Icon.Send size={14} />
                  {waTestLoading ? 'Sending...' : 'Send Test'}
                </button>
              </div>

              {waTestResult && (
                <div
                  className={`${styles.testResultBox} ${waTestResult.success ? styles.testResultSuccess : styles.testResultError}`}
                >
                  {waTestResult.success ? (
                    <div>
                      <strong>Test Dispatched:</strong> ID: <code>{waTestResult.messageId}</code> ({waTestResult.mode})
                    </div>
                  ) : (
                    <div><strong>Error:</strong> {waTestResult.error}</div>
                  )}
                </div>
              )}
            </div>

            {/* Test 2: Inbound Simulation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A' }}>
                Simulate Inbound Client Message
              </span>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>
                Simulates an incoming WhatsApp message. Creates or matches customer in CRM, records communication timeline, and fires admin alert.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <input
                  type="tel"
                  placeholder="Client Phone"
                  className={styles.inputField}
                  value={waSimPhone}
                  onChange={(e) => setWaSimPhone(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Client Name"
                  className={styles.inputField}
                  value={waSimName}
                  onChange={(e) => setWaSimName(e.target.value)}
                />
              </div>

              <textarea
                className={styles.inputField}
                rows={2}
                placeholder="Client message body..."
                value={waSimMessage}
                onChange={(e) => setWaSimMessage(e.target.value)}
                style={{ resize: 'vertical' }}
              />

              <button
                type="button"
                onClick={handleSimulateInboundMessage}
                disabled={waSimLoading}
                className={styles.btnSecondary}
                style={{ alignSelf: 'flex-start' }}
              >
                <Icon.Refresh size={14} />
                {waSimLoading ? 'Simulating...' : 'Simulate Inbound Message'}
              </button>

              {waSimResult && (
                <div
                  className={`${styles.testResultBox} ${waSimResult.success ? styles.testResultSuccess : styles.testResultError}`}
                >
                  {waSimResult.success ? (
                    <div>
                      <strong>Webhook Processed:</strong> Customer: {waSimResult.customer.name} (ID: {waSimResult.customer.id.slice(-6)}), Inbound Log ID: {waSimResult.communicationId.slice(-6)}
                    </div>
                  ) : (
                    <div><strong>Error:</strong> {waSimResult.error}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
