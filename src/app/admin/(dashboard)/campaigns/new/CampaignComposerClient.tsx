'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast, ConfirmModal, Select, type SelectOption } from '@/components/ui';
import { Icon } from '@/components/common/Icons';
import type { CampaignAudienceType } from '@/modules/campaigns/index.ts';
import styles from '../campaigns.module.css';

const AUDIENCE_OPTIONS: SelectOption<CampaignAudienceType>[] = [
  { value: 'ALL_CUSTOMERS', label: 'All Registered Customers', icon: <Icon.Users size={15} /> },
  { value: 'ACTIVE_LEADS', label: 'Active Leads & Inquiries', icon: <Icon.Inbox size={15} /> },
  { value: 'PAST_BOOKINGS', label: 'Past Booking Clients', icon: <Icon.Calendar size={15} /> },
  { value: 'INACTIVE_CUSTOMERS', label: 'Inactive Clients (90+ Days)', icon: <Icon.Clock size={15} /> },
];

const PRESET_TEMPLATES = [
  {
    name: 'VIP Ceramic Privilege Offer',
    title: 'VIP Monsoon Ceramic Coating Privilege',
    subject: 'Special Detailing Privilege: Ceramic Shield at Smoke M Customs',
    preheader: 'Complimentary hydrophobic glass coating with any ceramic package.',
    html: `<h2 style="font-size: 20px; font-weight: 700; color: #FFFFFF; margin: 0 0 16px 0;">
  Dear {{customerName}},
</h2>
<p style="font-size: 15px; color: #C0C0D0; line-height: 24px; margin: 0 0 20px 0;">
  As a valued client of <strong>Smoke M Customs</strong>, we are pleased to extend an exclusive invitation for our signature <em>Ceramic Shield & Surface Restoration Treatment</em>.
</p>
<div style="background-color: #181822; border: 1px solid #282836; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
  <h3 style="font-size: 16px; font-weight: 700; color: #E5A93C; margin: 0 0 10px 0;">
    Package Inclusions:
  </h3>
  <ul style="font-size: 14px; color: #E8E8ED; line-height: 22px; padding-left: 20px; margin: 0;">
    <li>Multi-stage rotary paint correction & defect removal</li>
    <li>9H Ultra-Hydrophobic Ceramic Matrix application</li>
    <li>Complimentary windshield & glass rain repellent coating</li>
    <li>Comprehensive leather treatment & interior UV preservation</li>
  </ul>
</div>
<p style="font-size: 14px; color: #8E8E9A; line-height: 22px; margin: 0 0 24px 0;">
  Slots in our climate-controlled detailing bays are strictly limited to ensure absolute perfection. Reserve your slot today.
</p>
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0;">
  <tr>
    <td align="center">
      <a href="https://smokecustoms.com/book" target="_blank" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #F0BA5A 0%, #D89828 100%); color: #0A0A0C; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 6px; letter-spacing: 0.5px; text-transform: uppercase;">
        Claim Your VIP Slot →
      </a>
    </td>
  </tr>
</table>`,
  },
  {
    name: 'Paint Protection Film (PPF) Launch',
    title: 'Self-Healing TPU PPF Protection',
    subject: 'Flawless Paint Armor: Next-Gen Self-Healing PPF is Here',
    preheader: 'Protect your vehicle against rock chips, micro-scratches, and road debris.',
    html: `<h2 style="font-size: 20px; font-weight: 700; color: #FFFFFF; margin: 0 0 16px 0;">
  Engineered Armor for Your Vehicle
</h2>
<p style="font-size: 15px; color: #C0C0D0; line-height: 24px; margin: 0 0 20px 0;">
  Hello {{customerName}},<br/><br/>
  Road gravel, UV radiation, and stone chips can permanently etch into high-gloss clear coats. Our studio now offers optical-clarity <strong>TPU Self-Healing Paint Protection Film</strong> with a 10-year warranty.
</p>
<div style="background-color: #181822; border: 1px solid #282836; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
  <h3 style="font-size: 16px; font-weight: 700; color: #E5A93C; margin: 0 0 10px 0;">
    Why Smoke M Customs TPU PPF?
  </h3>
  <ul style="font-size: 14px; color: #E8E8ED; line-height: 22px; padding-left: 20px; margin: 0;">
    <li>Micro-scratches self-heal under natural sunlight or warm water</li>
    <li>Deep mirror gloss finish with zero orange peel distortion</li>
    <li>Edge-wrapped custom pre-cut patterns for invisible seams</li>
  </ul>
</div>
<p style="font-size: 14px; color: #8E8E9A; margin: 0 0 20px 0;">
  Get a tailored estimate for full front or complete vehicle coverage today.
</p>
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0;">
  <tr>
    <td align="center">
      <a href="https://smokecustoms.com/estimate" target="_blank" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #F0BA5A 0%, #D89828 100%); color: #0A0A0C; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 6px; letter-spacing: 0.5px; text-transform: uppercase;">
        Request Custom Quote →
      </a>
    </td>
  </tr>
</table>`,
  },
  {
    name: 'Annual Maintenance & Polish Invitation',
    title: 'Seasonal Detailing & Maintenance Check',
    subject: 'Time for a Rejuvenation: Keep Your Finish Concourse-Ready',
    preheader: 'Special studio loyalty maintenance wash and ceramic top-up package.',
    html: `<h2 style="font-size: 20px; font-weight: 700; color: #FFFFFF; margin: 0 0 16px 0;">
  Maintain That Day-One Showroom Glow
</h2>
<p style="font-size: 15px; color: #C0C0D0; line-height: 24px; margin: 0 0 20px 0;">
  Dear {{customerName}},<br/><br/>
  It has been several months since your last detailing appointment at Smoke M Customs. Atmospheric fallout, road tar, and water minerals gradually diminish hydrophobicity without regular decontamination.
</p>
<div style="background-color: #181822; border: 1px solid #282836; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
  <h3 style="font-size: 16px; font-weight: 700; color: #E5A93C; margin: 0 0 10px 0;">
    Special Loyalty Refresh Includes:
  </h3>
  <ul style="font-size: 14px; color: #E8E8ED; line-height: 22px; padding-left: 20px; margin: 0;">
    <li>Iron de-ionizer fallout extraction & clay bar treatment</li>
    <li>Silica SiO2 ceramic top-up spray sealant</li>
    <li>Deep interior vacuum, dash steam cleaning & anti-bacterial fogging</li>
  </ul>
</div>
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0;">
  <tr>
    <td align="center">
      <a href="https://smokecustoms.com/book" target="_blank" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #F0BA5A 0%, #D89828 100%); color: #0A0A0C; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 6px; letter-spacing: 0.5px; text-transform: uppercase;">
        Book Maintenance Session →
      </a>
    </td>
  </tr>
</table>`,
  },
];

export function CampaignComposerClient() {
  const router = useRouter();
  const { success, error, info } = useToast();

  const [title, setTitle] = useState(PRESET_TEMPLATES[0].title);
  const [subject, setSubject] = useState(PRESET_TEMPLATES[0].subject);
  const [preheader, setPreheader] = useState(PRESET_TEMPLATES[0].preheader);
  const [contentHtml, setContentHtml] = useState(PRESET_TEMPLATES[0].html);
  const [audienceType, setAudienceType] = useState<CampaignAudienceType>('ALL_CUSTOMERS');

  const [submitting, setSubmitting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);

  // Audience explanations
  const audienceDescriptions: Record<CampaignAudienceType, string> = {
    ALL_CUSTOMERS: 'All customer profiles with valid email addresses registered in the database.',
    ACTIVE_LEADS: 'Prospects with open inquiries who have not yet converted into bookings.',
    PAST_BOOKINGS: 'Clients who have confirmed or completed detailing appointments.',
    INACTIVE_CUSTOMERS: 'Customers with no active bookings in the past 90 days (Re-engagement).',
  };

  const handleApplyPreset = (presetIndex: number) => {
    const p = PRESET_TEMPLATES[presetIndex];
    if (!p) return;
    setTitle(p.title);
    setSubject(p.subject);
    setPreheader(p.preheader);
    setContentHtml(p.html);
    info(`Loaded "${p.name}" template.`);
  };

  // Live rendered layout preview
  const livePreviewHtml = useMemo(() => {
    // Interpolate sample tokens
    const interpolated = contentHtml
      .replace(/{{\s*customerName\s*}}/g, 'Arjun Mehta')
      .replace(/{{\s*customerEmail\s*}}/g, 'arjun.mehta@example.com')
      .replace(/{{\s*studioName\s*}}/g, 'Smoke M Customs')
      .replace(/{{\s*studioPhone\s*}}/g, '+91 98765 43210')
      .replace(/{{\s*studioEmail\s*}}/g, 'concierge@smokecustoms.com');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070709; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #E8E8ED;">
  ${
    preheader
      ? `<div style="display:none;font-size:1px;color:#0A0A0C;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</div>`
      : ''
  }
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #070709; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #121217; border: 1px solid #24242C; border-radius: 12px; overflow: hidden; box-shadow: 0 12px 40px rgba(0,0,0,0.6);">
          <tr>
            <td style="padding: 24px 24px 20px 24px; background: linear-gradient(180deg, #181820 0%, #121217 100%); border-bottom: 1px solid #24242C; text-align: center;">
              <img src="/logo.png" alt="Smoke 'Em Customs" width="52" height="52" style="display: block; margin: 0 auto 10px auto; border-radius: 50%; border: 1px solid #282834;" />
              <div style="font-size: 20px; font-weight: 900; letter-spacing: 3px; color: #FFFFFF; text-transform: uppercase; margin-bottom: 4px;">
                SMOKE <span style="color: #E5A93C;">'EM</span> CUSTOMS
              </div>
              <div style="font-size: 11px; letter-spacing: 2px; color: #A0A0B0; text-transform: uppercase;">
                Concierge Detailing & Surface Protection
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px 24px;">
              ${interpolated}
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 24px; background-color: #0D0D12; border-top: 1px solid #202028; text-align: center;">
              <div style="font-size: 12px; color: #A0A0B0; line-height: 18px;">
                <strong style="color: #E8E8ED;">Smoke M Customs Studio</strong> • Bangalore, India<br/>
                Concierge Hotline: +91 98765 43210
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }, [contentHtml, subject, preheader]);

  const handleSaveDraft = async () => {
    if (!title.trim() || !subject.trim() || !contentHtml.trim()) {
      error('Title, subject, and email body are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subject,
          preheader,
          contentHtml,
          audienceType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save campaign draft');
      }

      success('Campaign draft saved successfully.');
      router.push('/admin/campaigns');
    } catch (err: any) {
      error(err.message || 'Error saving campaign');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBroadcast = async () => {
    setShowBroadcastModal(false);
    setSubmitting(true);

    try {
      // 1. Create draft first
      const createRes = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subject,
          preheader,
          contentHtml,
          audienceType,
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok || !createData.campaign?.id) {
        throw new Error(createData.error || 'Failed to initialize campaign');
      }

      const campaignId = createData.campaign.id;

      // 2. Dispatch broadcast
      const sendRes = await fetch(`/api/admin/campaigns/${campaignId}/send`, {
        method: 'POST',
      });
      const sendData = await sendRes.json();

      if (!sendRes.ok) {
        throw new Error(sendData.error || 'Failed to dispatch broadcast');
      }

      success(sendData.message || 'Email campaign broadcast initiated!');
      router.push('/admin/campaigns');
    } catch (err: any) {
      error(err.message || 'Broadcast failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendTestPreview = async () => {
    const testEmail = prompt('Enter recipient email address for test preview:');
    if (!testEmail || !testEmail.includes('@')) return;

    setTesting(true);
    try {
      // 1. Save temporary or active campaign
      const createRes = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `[Preview] ${title}`,
          subject,
          preheader,
          contentHtml,
          audienceType,
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok || !createData.campaign?.id) {
        throw new Error(createData.error || 'Failed to initialize preview');
      }

      const testRes = await fetch(`/api/admin/campaigns/${createData.campaign.id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmail }),
      });

      const testData = await testRes.json();
      if (!testRes.ok) {
        throw new Error(testData.error || 'Failed to dispatch test email');
      }

      success(`Test preview dispatched to ${testEmail}!`);
    } catch (err: any) {
      error(err.message || 'Failed to send test email');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* ── Page Header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <Link href="/admin/campaigns" className={styles.backLink}>
            ← Back to Campaigns
          </Link>
          <div className={styles.eyebrow}>
            <span>Studio Control</span>
            <span className={styles.eyebrowDot} />
            <span>Marketing &amp; Broadcast</span>
            <span className={styles.eyebrowDot} />
            <span>Email Campaigns</span>
          </div>
          <h1 className={styles.pageTitle}>Compose Email Campaign</h1>
          <p className={styles.pageSubtitle}>
            Design custom branded marketing emails, select targeted audience segments, and broadcast to clients.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.btnSecondaryComposer}
            onClick={handleSendTestPreview}
            disabled={submitting || testing}
          >
            <Icon.Mail size={15} />
            <span>{testing ? 'Sending Test...' : 'Send Test Preview'}</span>
          </button>
          <button
            type="button"
            className={styles.btnSecondaryComposer}
            onClick={handleSaveDraft}
            disabled={submitting || testing}
          >
            <span>{submitting ? 'Saving...' : 'Save Draft'}</span>
          </button>
          <button
            type="button"
            className={styles.btnPrimaryComposer}
            onClick={() => setShowBroadcastModal(true)}
            disabled={submitting || testing}
          >
            <span>Launch Broadcast →</span>
          </button>
        </div>
      </div>

      {/* ── Preset Selector Bar ── */}
      <div className={styles.presetBar}>
        <span className={styles.presetLabel}>
          <Icon.Sparkles size={14} />
          <span>Load Preset:</span>
        </span>
        {PRESET_TEMPLATES.map((preset, idx) => (
          <button
            key={preset.name}
            type="button"
            onClick={() => handleApplyPreset(idx)}
            className={styles.presetBtn}
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* ── Composer Grid: Form Left, Preview Right ── */}
      <div className={styles.composerLayout}>
        {/* Form Panel */}
        <div className={styles.formPanel}>
          <div className={styles.formGroup}>
            <label htmlFor="camp-title">Internal Campaign Name *</label>
            <input
              id="camp-title"
              type="text"
              className={styles.input}
              placeholder="e.g. Monsoon Ceramic Shield Promo"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="camp-audience">Audience Segmentation *</label>
            <Select<CampaignAudienceType>
              id="camp-audience"
              size="sm"
              value={audienceType}
              onChange={(val) => setAudienceType(val)}
              options={AUDIENCE_OPTIONS}
            />
            <div className={styles.audienceBadge}>
              <Icon.Users size={14} color="#B45309" />
              <span>{audienceDescriptions[audienceType]}</span>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="camp-subject">Email Subject Line *</label>
            <input
              id="camp-subject"
              type="text"
              className={styles.input}
              placeholder="e.g. Exclusive Detailing Privilege: Smoke M Customs"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="camp-preheader">Preheader / Snippet Preview</label>
            <input
              id="camp-preheader"
              type="text"
              className={styles.input}
              placeholder="Appears in recipient inbox preview next to subject..."
              value={preheader}
              onChange={(e) => setPreheader(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="camp-html">Email Body HTML / Content *</label>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#B45309',
                  backgroundColor: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}
              >
                HTML Supported
              </span>
            </div>
            <textarea
              id="camp-html"
              className={styles.textarea}
              rows={14}
              value={contentHtml}
              onChange={(e) => setContentHtml(e.target.value)}
            />
            <div className={styles.tokenInsertBar}>
              <span className={styles.tokenLabel}>Insert tokens:</span>
              {['{{customerName}}', '{{customerEmail}}', '{{studioName}}', '{{studioPhone}}'].map((tok) => (
                <button
                  key={tok}
                  type="button"
                  onClick={() => setContentHtml((prev) => prev + ` ${tok}`)}
                  className={styles.tokenPill}
                >
                  {tok}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Luxury Email Preview Panel */}
        <div className={styles.previewPanel}>
          <div className={styles.previewLabel}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon.Eye size={16} color="#B45309" />
              <span>Live Luxury Email Preview</span>
            </span>
            <span className={styles.previewClientBadge}>
              Client View
            </span>
          </div>

          {/* Email Client Header Chrome */}
          <div className={styles.clientChrome}>
            <div className={styles.windowControls}>
              <div className={`${styles.controlDot} ${styles.dotRed}`} />
              <div className={`${styles.controlDot} ${styles.dotYellow}`} />
              <div className={`${styles.controlDot} ${styles.dotGreen}`} />
            </div>
            <div className={styles.chromeMetaRow}>
              <strong>From:</strong> Smoke M Customs &lt;concierge@smokecustoms.com&gt;
            </div>
            <div className={styles.chromeMetaRow}>
              <strong>Subject:</strong> {subject || '(Untitled Subject)'}
            </div>
            {preheader && (
              <div className={styles.chromeMetaRow}>
                <strong>Preheader:</strong> {preheader}
              </div>
            )}
          </div>

          <iframe
            title="Email Live Preview"
            className={styles.previewFrame}
            srcDoc={livePreviewHtml}
          />
        </div>
      </div>

      {/* Broadcast Launch Modal */}
      <ConfirmModal
        open={showBroadcastModal}
        title="Broadcast Campaign to Audience?"
        description={`Are you sure you want to broadcast "${title}" to the ${audienceType.replace('_', ' ')} segment? Emails will be queued and sent immediately using the active email provider.`}
        confirmLabel="Confirm & Broadcast Now"
        variant="default"
        onConfirm={handleBroadcast}
        onCancel={() => setShowBroadcastModal(false)}
      />
    </div>
  );
}
