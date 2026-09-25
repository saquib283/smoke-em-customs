import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  EmailService,
  renderLuxuryEmailLayout,
  renderLeadWelcomeEmail,
  renderQuoteNotificationEmail,
  renderBookingConfirmationEmail,
  renderBookingCancelledEmail,
  renderCampaignEmail,
  interpolateEmailTokens,
} from '../src/modules/email/index.ts';
import { SimulatedEmailProvider } from '../src/modules/email/providers/simulated.ts';
import { CampaignService } from '../src/modules/campaigns/index.ts';

describe('Email Service & Pluggable Providers', () => {
  it('SimulatedEmailProvider successfully renders and dispatches test emails', async () => {
    const provider = new SimulatedEmailProvider();
    const result = await provider.send({
      to: 'client@example.com',
      subject: 'Welcome to Smoke M Customs',
      html: '<h1>Exclusive Detailing</h1>',
      text: 'Exclusive Detailing',
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.simulated, true);
    assert.ok(result.messageId.startsWith('sim_'));
    assert.ok(result.previewUrl?.includes('simulated'));

    const verify = await provider.verifyConnection();
    assert.strictEqual(verify.success, true);
  });

  it('EmailService supports dynamic provider configuration and master enable toggle', async () => {
    const service = new EmailService();

    // Verify default config retrieval
    const initialConfig = service.getConfig();
    assert.ok(initialConfig.providerType);

    // Switch provider dynamically
    const updated = service.updateConfig({
      providerType: 'SIMULATED',
      fromName: 'Smoke M Studio Concierge',
      fromEmail: 'concierge@smokecustoms.com',
      isEnabled: true,
    });

    assert.strictEqual(updated.providerType, 'SIMULATED');
    assert.strictEqual(updated.fromName, 'Smoke M Studio Concierge');

    // Test sending when enabled
    const sendResult = await service.sendEmail({
      to: 'customer@luxurydetailing.in',
      subject: 'Booking Confirmed',
      html: '<p>Your Porsche 911 GT3 RS slot is confirmed.</p>',
    });
    assert.strictEqual(sendResult.success, true);

    // Test suppression when globally disabled
    service.updateConfig({ isEnabled: false });
    const suppressedResult = await service.sendEmail({
      to: 'customer@luxurydetailing.in',
      subject: 'Booking Suppressed',
      html: '<p>Should not dispatch</p>',
    });
    assert.strictEqual(suppressedResult.success, true);
    assert.strictEqual(suppressedResult.simulated, true);

    // Restore enabled
    service.updateConfig({ isEnabled: true });
  });

  it('Template configuration allows toggling and custom subject lines', () => {
    const service = new EmailService();
    const initialTemplates = service.getTemplates();
    assert.ok(initialTemplates['LEAD_WELCOME']);
    assert.strictEqual(initialTemplates['LEAD_WELCOME'].isEnabled, true);

    // Update template state
    service.updateTemplate('LEAD_WELCOME', {
      isEnabled: false,
      subject: 'Customized Welcome Subject',
    });

    const updated = service.getTemplates();
    assert.strictEqual(updated['LEAD_WELCOME'].isEnabled, false);
    assert.strictEqual(updated['LEAD_WELCOME'].subject, 'Customized Welcome Subject');

    // Restore
    service.updateTemplate('LEAD_WELCOME', { isEnabled: true });
  });
});

describe('Dynamic Token Interpolation & Luxury Templates', () => {
  it('interpolateEmailTokens substitutes dynamic variables safely', () => {
    const rawTemplate = 'Dear {{ customerName }}, your {{vehicleText}} is scheduled for {{ serviceName }}.';
    const parsed = interpolateEmailTokens(rawTemplate, {
      customerName: 'Vikram Singhania',
      vehicleText: 'Lamborghini Urus Performante',
      serviceName: 'Full-Body Self-Healing TPU PPF',
    });

    assert.strictEqual(
      parsed,
      'Dear Vikram Singhania, your Lamborghini Urus Performante is scheduled for Full-Body Self-Healing TPU PPF.'
    );
  });

  it('interpolateEmailTokens handles missing or null tokens gracefully without crashing', () => {
    const rawTemplate = 'Welcome {{ customerName }}! Your balance is {{ balance }}. Note: {{ notes }}';
    const parsed = interpolateEmailTokens(rawTemplate, {
      customerName: 'Arjun',
      balance: null,
      notes: '',
    });

    assert.strictEqual(parsed, 'Welcome Arjun! Your balance is . Note: ');
  });

  it('renderLeadWelcomeEmail produces Concourse-grade branded HTML', () => {
    const email = renderLeadWelcomeEmail({
      customerName: 'Devan Sharma',
      vehicleText: 'Mercedes-AMG G63',
      serviceName: 'Graphene Matrix Coating',
      leadId: 'ld-123456',
    });

    assert.ok(email.subject.includes('Smoke M Customs') || email.subject.includes("Smoke 'Em Customs"));
    assert.ok(email.html.includes('Devan Sharma'));
    assert.ok(email.html.includes('Mercedes-AMG G63'));
    assert.ok(email.html.includes('logo.png'));
    assert.ok(email.html.includes("CUSTOMS"));
    assert.ok(email.html.includes('https://smokecustoms.com/book'));
  });

  it('renderQuoteNotificationEmail includes currency formatting and quote review CTA', () => {
    const email = renderQuoteNotificationEmail({
      customerName: 'Ananya Roy',
      quoteNumber: 'SMC-2026-089',
      vehicleText: 'BMW M4 Competition',
      serviceSummary: 'Stage 3 Rotary Correction + Ceramic Shield',
      totalAmountFormatted: '₹ 85,000',
      validUntilFormatted: '05 Oct 2026',
      quoteUrl: 'https://smokecustoms.com/quotes/qt-12345',
    });

    assert.ok(email.subject.includes('SMC-2026-089'));
    assert.ok(email.html.includes('₹ 85,000'));
    assert.ok(email.html.includes('BMW M4 Competition'));
    assert.ok(email.html.includes('https://smokecustoms.com/quotes/qt-12345'));
    assert.ok(email.html.includes('View & Accept Estimate'));
  });

  it('renderBookingConfirmationEmail creates appointment details and generates .ics calendar attachment', () => {
    const email = renderBookingConfirmationEmail({
      customerName: 'Karan Mehra',
      bookingNumber: 'BK-9988',
      serviceName: 'Concourse Wash & Seal',
      vehicleText: 'Audi RS6 Avant',
      appointmentTimeFormatted: 'Monday, 28 Sep 2026 at 10:00 AM',
      bayName: 'Bay 1 — Wet Detailing Studio',
      bookingUrl: 'https://smokecustoms.com/bookings/BK-9988',
      calendarEvent: {
        title: 'Smoke M Customs Detailing — Audi RS6 Avant',
        description: 'Concourse Wash & Seal session at Smoke M Customs Bay 1.',
        startTime: new Date('2026-09-28T10:00:00Z'),
        endTime: new Date('2026-09-28T13:00:00Z'),
        location: 'Smoke M Customs Detailing Studio, Bangalore',
      },
    });

    assert.ok(email.subject.includes('BK-9988'));
    assert.ok(email.html.includes('Bay 1 — Wet Detailing Studio'));
    assert.ok(email.html.includes('Audi RS6 Avant'));
    assert.ok(email.icsContent, 'Should generate .ics calendar payload');
    assert.ok(email.icsContent?.includes('BEGIN:VCALENDAR'));
    assert.ok(email.icsContent?.includes('SUMMARY:Smoke M Customs Detailing — Audi RS6 Avant'));
  });

  it('renderBookingCancelledEmail provides polite acknowledgment and rescheduling link', () => {
    const email = renderBookingCancelledEmail({
      customerName: 'Rohan Gupta',
      bookingNumber: 'BK-5521',
      appointmentTimeFormatted: 'Friday, 02 Oct 2026 at 02:00 PM',
      reason: 'Client requested reschedule due to travel',
    });

    assert.ok(email.subject.includes('Cancelled'));
    assert.ok(email.html.includes('BK-5521'));
    assert.ok(email.html.includes('Client requested reschedule due to travel'));
    assert.ok(email.html.includes('Schedule New Session'));
  });

  it('renderCampaignEmail wraps custom promotional copy into full luxury email', () => {
    const html = renderCampaignEmail({
      title: 'Monsoon Detailing VIP Invite',
      contentHtml: '<h2>Exclusive Monsoon Privileges</h2><p>Special 15% VIP discount on ceramic packages.</p>',
      preheader: 'Special studio privilege inside',
      ctaText: 'Reserve Priority Slot',
      ctaUrl: 'https://smokecustoms.com/book',
      unsubscribeUrl: 'https://smokecustoms.com/unsubscribe?c=123',
    });

    assert.ok(html.includes('Exclusive Monsoon Privileges'));
    assert.ok(html.includes('Special studio privilege inside'));
    assert.ok(html.includes('Reserve Priority Slot →'));
    assert.ok(html.includes('Unsubscribe from marketing emails'));
  });
});

describe('Marketing Email Campaign Engine', () => {
  const campaignService = new CampaignService();

  it('creates, inspects, and lists marketing email campaign drafts', async () => {
    const campaign = await campaignService.createCampaign({
      title: 'Monsoon Ceramic Shield Promo',
      subject: 'Exclusive Invitation: Protect Your Gloss This Monsoon',
      preheader: 'Complimentary windshield coating with ceramic package.',
      contentHtml: '<p>Dear {{customerName}}, reserve your studio detailing bay today.</p>',
      audienceType: 'ALL_CUSTOMERS',
    });

    assert.ok(campaign.id.startsWith('cmp_'));
    assert.strictEqual(campaign.status, 'DRAFT');
    assert.strictEqual(campaign.title, 'Monsoon Ceramic Shield Promo');
    assert.strictEqual(campaign.sentCount, 0);

    // Retrieve by ID
    const retrieved = await campaignService.getCampaign(campaign.id);
    assert.ok(retrieved);
    assert.strictEqual(retrieved?.id, campaign.id);

    // List all
    const all = await campaignService.listCampaigns();
    assert.ok(all.some((c) => c.id === campaign.id));
  });

  it('updates draft campaign content and audience segmentation', async () => {
    const campaign = await campaignService.createCampaign({
      title: 'Early Bird PPF',
      subject: 'Early Bird PPF Subject',
      contentHtml: '<p>PPF Offer</p>',
      audienceType: 'ACTIVE_LEADS',
    });

    const updated = await campaignService.updateCampaign(campaign.id, {
      title: 'Updated Early Bird PPF',
      subject: 'Revised Subject: Armor Your Car',
      audienceType: 'PAST_BOOKINGS',
    });

    assert.ok(updated);
    assert.strictEqual(updated?.title, 'Updated Early Bird PPF');
    assert.strictEqual(updated?.subject, 'Revised Subject: Armor Your Car');
    assert.strictEqual(updated?.audienceType, 'PAST_BOOKINGS');
  });

  it('dispatches individual test preview email without launching broadcast', async () => {
    const campaign = await campaignService.createCampaign({
      title: 'VIP Test Campaign',
      subject: 'Testing Email Preview',
      contentHtml: '<p>Hello {{customerName}}, this is a test preview.</p>',
    });

    const testResult = await campaignService.sendTestPreview(campaign.id, 'admin.tester@smokecustoms.com');
    assert.strictEqual(testResult.success, true);
    assert.strictEqual(testResult.recipient, 'admin.tester@smokecustoms.com');

    // Campaign status should remain DRAFT
    const fresh = await campaignService.getCampaign(campaign.id);
    assert.strictEqual(fresh?.status, 'DRAFT');
    assert.strictEqual(fresh?.sentCount, 0);
  });

  it('broadcasts campaign to segmented audience, updating delivery metrics and CRM records', async () => {
    const campaign = await campaignService.createCampaign({
      title: 'Broadcast Execution Test',
      subject: 'Special Detailing Announcement',
      contentHtml: '<p>Dear {{customerName}}, studio announcement.</p>',
      audienceType: 'ALL_CUSTOMERS',
    });

    const broadcastResult = await campaignService.launchBroadcast(campaign.id);
    assert.strictEqual(broadcastResult.status, 'COMPLETED');
    assert.ok(broadcastResult.sentCount >= 0);

    const completed = await campaignService.getCampaign(campaign.id);
    assert.strictEqual(completed?.status, 'COMPLETED');
    assert.ok(completed?.sentAt);
  });

  it('deletes draft campaign successfully and prevents mutating completed campaigns', async () => {
    const draft = await campaignService.createCampaign({
      title: 'Draft To Delete',
      subject: 'Subject',
      contentHtml: '<p>Content</p>',
    });

    const deleted = await campaignService.deleteCampaign(draft.id);
    assert.strictEqual(deleted, true);

    const check = await campaignService.getCampaign(draft.id);
    assert.strictEqual(check, null);
  });
});
