/**
 * Luxury Responsive HTML Email Templates — Smoke M Customs
 * Architecture §15 & DESIGN.md §3-5
 * Crafted for maximum visual excellence across desktop, tablet, and mobile mail clients.
 */

export interface EmailLayoutOptions {
  title: string;
  preheader?: string;
  bodyHtml: string;
  ctaText?: string;
  ctaUrl?: string;
  unsubscribeUrl?: string;
}

/**
 * Base Concourse Luxury HTML Wrapper
 */
export function renderLuxuryEmailLayout(options: EmailLayoutOptions): string {
  const preheaderHtml = options.preheader
    ? `<div style="display:none;font-size:1px;color:#0A0A0C;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${options.preheader}</div>`
    : '';

  const ctaButtonHtml =
    options.ctaText && options.ctaUrl
      ? `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0 16px 0;">
      <tr>
        <td align="center">
          <a href="${options.ctaUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #F0BA5A 0%, #D89828 100%); color: #0A0A0C; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 6px; letter-spacing: 0.5px; text-transform: uppercase;">
            ${options.ctaText} →
          </a>
        </td>
      </tr>
    </table>
    `
      : '';

  const unsubscribeHtml = options.unsubscribeUrl
    ? `<tr><td align="center" style="padding-top: 16px; font-size: 12px; color: #6E6E7A;"><a href="${options.unsubscribeUrl}" style="color: #A0A0B0; text-decoration: underline;">Unsubscribe from marketing emails</a></td></tr>`
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070709; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #E8E8ED;">
  ${preheaderHtml}
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #070709; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #121217; border: 1px solid #24242C; border-radius: 12px; overflow: hidden; box-shadow: 0 12px 40px rgba(0,0,0,0.6);">
          
          <!-- Header Bar -->
          <tr>
            <td style="padding: 28px 32px 22px 32px; background: linear-gradient(180deg, #181820 0%, #121217 100%); border-bottom: 1px solid #24242C; text-align: center;">
              <img src="https://smokecustoms.com/logo.png" alt="Smoke 'Em Customs" width="58" height="58" style="display: block; margin: 0 auto 12px auto; border-radius: 50%; border: 1px solid #282834;" />
              <div style="font-size: 20px; font-weight: 900; letter-spacing: 3px; color: #FFFFFF; text-transform: uppercase; margin-bottom: 4px;">
                SMOKE <span style="color: #E5A93C;">'EM</span> CUSTOMS
              </div>
              <div style="font-size: 11px; letter-spacing: 2px; color: #A0A0B0; text-transform: uppercase;">
                Concierge Automotive Detailing & Surface Protection
              </div>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 32px;">
              ${options.bodyHtml}
              ${ctaButtonHtml}
            </td>
          </tr>

          <!-- Studio Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0D0D12; border-top: 1px solid #202028; text-align: center;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="font-size: 13px; color: #A0A0B0; line-height: 20px;">
                    <strong style="color: #E8E8ED;">Smoke M Customs Studio</strong><br>
                    Positive-Pressure Detailing Bays • Climate Controlled • Concourse Grade<br>
                    Prime Auto Hub, Bangalore, India
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 12px; font-size: 12px; color: #6E6E7A;">
                    Direct Concierge: +91 98765 43210 • <a href="https://smokecustoms.com" style="color: #E5A93C; text-decoration: none;">smokecustoms.com</a>
                  </td>
                </tr>
                ${unsubscribeHtml}
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
/**
 * 0. ICS Calendar Event Payload Generator (Apple Calendar, Google Calendar, Outlook)
 */
export function generateIcsCalendar(params: {
  title: string;
  description: string;
  location: string;
  startTime: Date;
  endTime: Date;
}): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const formatUtc = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Smoke M Customs//Studio Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:smc-${Date.now()}@smokecustoms.com`,
    `DTSTAMP:${formatUtc(new Date())}`,
    `DTSTART:${formatUtc(params.startTime)}`,
    `DTEND:${formatUtc(params.endTime)}`,
    `SUMMARY:${params.title}`,
    `DESCRIPTION:${params.description}`,
    `LOCATION:${params.location}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * 1. Lead Welcome & Intake Acknowledgment Email
 */
export function renderLeadWelcomeEmail(params: {
  customerName: string;
  vehicleText?: string;
  leadId?: string;
  serviceInterest?: string;
  serviceName?: string;
  estimateText?: string;
}): { subject: string; html: string } {
  const refCode = params.leadId ? `#${params.leadId.slice(-6).toUpperCase()}` : '';
  const subject = `Welcome to Smoke M Customs — Detailing Inquiry Received ${refCode}`.trim();
  const serviceText = params.serviceName || params.serviceInterest;

  const bodyHtml = `
    <h2 style="font-size: 22px; font-weight: 700; color: #FFFFFF; margin: 0 0 16px 0;">
      Welcome to the Concierge, ${params.customerName}.
    </h2>
    <p style="font-size: 15px; color: #C0C0D0; line-height: 24px; margin: 0 0 20px 0;">
      Thank you for contacting Smoke M Customs. We have received your detailing inquiry for your 
      <strong style="color: #E5A93C;">${params.vehicleText || 'vehicle'}</strong>.
    </p>

    <div style="background-color: #181822; border: 1px solid #282836; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <div style="font-size: 12px; font-weight: 700; color: #A0A0B0; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px;">
        Inquiry Snapshot
      </div>
      <table border="0" cellpadding="4" cellspacing="0" width="100%" style="font-size: 14px; color: #E8E8ED;">
        ${refCode ? `<tr><td style="color: #8E8E9A; width: 40%;">Reference Code:</td><td><strong>${refCode}</strong></td></tr>` : ''}
        ${params.vehicleText ? `<tr><td style="color: #8E8E9A;">Vehicle:</td><td>${params.vehicleText}</td></tr>` : ''}
        ${serviceText ? `<tr><td style="color: #8E8E9A;">Treatment Interest:</td><td>${serviceText}</td></tr>` : ''}
        ${params.estimateText ? `<tr><td style="color: #8E8E9A;">Preliminary Range:</td><td style="color: #E5A93C; font-weight: 700;">${params.estimateText}</td></tr>` : ''}
      </table>
    </div>

    <p style="font-size: 14px; color: #A0A0B0; line-height: 22px; margin: 0;">
      Our master detailer is reviewing your vehicle specs and will contact you shortly with custom treatment recommendations or a formal quote.
    </p>
  `;

  return {
    subject,
    html: renderLuxuryEmailLayout({
      title: subject,
      preheader: `We have received your detailing inquiry for ${params.vehicleText || 'your vehicle'}.`,
      bodyHtml,
      ctaText: 'Visit Studio Showcase',
      ctaUrl: 'https://smokecustoms.com/book',
    }),
  };
}

/**
 * 2. Formal Quote Ready Notification Email
 */
export function renderQuoteNotificationEmail(params: {
  customerName: string;
  quoteNumber: string;
  totalAmount?: string | number;
  totalAmountFormatted?: string;
  vehicleText?: string;
  serviceSummary?: string;
  items?: Array<{ name: string; qty: number; total: number }>;
  quoteUrl: string;
  validUntilFormatted?: string;
}): { subject: string; html: string } {
  const subject = `Official Quotation #${params.quoteNumber} from Smoke M Customs`;
  const formattedTotal = params.totalAmountFormatted ||
    (params.totalAmount !== undefined
      ? `₹${Number(params.totalAmount).toLocaleString('en-IN')}`
      : 'Estimate Prepared');

  const items = params.items || [];
  const itemsHtml = items.length > 0
    ? items
        .map(
          (it) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #22222E; color: #E8E8ED;">${it.name} <span style="color:#8E8E9A;font-size:12px;">(${it.qty}x)</span></td>
        <td align="right" style="padding: 10px 0; border-bottom: 1px solid #22222E; color: #E5A93C; font-weight: 600;">₹${it.total.toLocaleString('en-IN')}</td>
      </tr>
    `
        )
        .join('')
    : (params.serviceSummary
        ? `<tr><td style="padding: 10px 0; color: #E8E8ED;">${params.serviceSummary}</td><td align="right" style="padding: 10px 0; color: #E5A93C; font-weight: 600;">${formattedTotal}</td></tr>`
        : '');

  const bodyHtml = `
    <h2 style="font-size: 22px; font-weight: 700; color: #FFFFFF; margin: 0 0 16px 0;">
      Your Formal Quotation is Ready
    </h2>
    <p style="font-size: 15px; color: #C0C0D0; line-height: 24px; margin: 0 0 20px 0;">
      Dear ${params.customerName}, we have prepared your formal quotation <strong style="color:#FFFFFF;">#${params.quoteNumber}</strong> detailing the treatments selected for ${params.vehicleText || 'your vehicle'}.
    </p>

    <div style="background-color: #181822; border: 1px solid #282836; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        ${itemsHtml}
        <tr>
          <td style="padding: 14px 0 0 0; font-size: 16px; font-weight: 700; color: #FFFFFF;">Grand Total (incl. 18% GST):</td>
          <td align="right" style="padding: 14px 0 0 0; font-size: 18px; font-weight: 800; color: #E5A93C;">${formattedTotal}</td>
        </tr>
      </table>
    </div>

    <p style="font-size: 13px; color: #8E8E9A; line-height: 20px; margin: 0 0 8px 0;">
      Validity: Valid for 14 days${params.validUntilFormatted ? ` until ${params.validUntilFormatted}` : ''}.
    </p>
  `;

  return {
    subject,
    html: renderLuxuryEmailLayout({
      title: subject,
      preheader: `Your formal estimate #${params.quoteNumber} for ${formattedTotal} is ready to view.`,
      bodyHtml,
      ctaText: 'View & Accept Estimate',
      ctaUrl: params.quoteUrl,
    }),
  };
}

/**
 * 3. Bay Reservation Confirmation Email (with .ics attachment support)
 */
export function renderBookingConfirmationEmail(params: {
  customerName: string;
  bookingNumber?: string;
  serviceName?: string;
  serviceOrPackageName?: string;
  appointmentTimeFormatted: string;
  bayName?: string;
  priceQuoted?: string | number;
  vehicleText?: string;
  studioAddress?: string;
  bookingUrl?: string;
  calendarEvent?: {
    title: string;
    description: string;
    location: string;
    startTime: Date;
    endTime: Date;
  };
}): { subject: string; html: string; icsContent?: string } {
  const serviceName = params.serviceName || params.serviceOrPackageName || 'Concourse Treatment';
  const refCode = params.bookingNumber ? ` #${params.bookingNumber}` : '';
  const subject = `Appointment Confirmed${refCode}: Detailing Bay Reserved for ${params.appointmentTimeFormatted}`;

  const bodyHtml = `
    <h2 style="font-size: 22px; font-weight: 700; color: #FFFFFF; margin: 0 0 16px 0;">
      Detailing Bay Reserved
    </h2>
    <p style="font-size: 15px; color: #C0C0D0; line-height: 24px; margin: 0 0 20px 0;">
      Dear ${params.customerName}, your appointment has been locked in. Our climate-controlled bay has been allocated for your vehicle.
    </p>

    <div style="background-color: #181822; border: 1px solid #282836; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <table border="0" cellpadding="6" cellspacing="0" width="100%" style="font-size: 14px; color: #E8E8ED;">
        ${params.bookingNumber ? `<tr><td style="color: #8E8E9A; width: 38%;">Reservation ID:</td><td><strong>${params.bookingNumber}</strong></td></tr>` : ''}
        <tr><td style="color: #8E8E9A; width: 38%;">Treatment:</td><td><strong>${serviceName}</strong></td></tr>
        <tr><td style="color: #8E8E9A;">Appointment:</td><td style="color: #E5A93C; font-weight: 700;">${params.appointmentTimeFormatted}</td></tr>
        ${params.bayName ? `<tr><td style="color: #8E8E9A;">Facility:</td><td>${params.bayName}</td></tr>` : ''}
        ${params.vehicleText ? `<tr><td style="color: #8E8E9A;">Vehicle:</td><td>${params.vehicleText}</td></tr>` : ''}
        ${params.priceQuoted ? `<tr><td style="color: #8E8E9A;">Quoted Price:</td><td>₹${Number(params.priceQuoted).toLocaleString('en-IN')}</td></tr>` : ''}
      </table>
    </div>

    <p style="font-size: 13px; color: #8E8E9A; line-height: 20px; margin: 0;">
      <strong>Studio Location:</strong> ${params.studioAddress || 'Smoke M Customs Studio, Prime Auto Hub, Bangalore'}.<br>
      Please arrive 10 minutes prior to your allocated slot for intake inspection. A calendar invite (.ics) is attached to this email.
    </p>
  `;

  const icsContent = params.calendarEvent ? generateIcsCalendar(params.calendarEvent) : undefined;

  return {
    subject,
    html: renderLuxuryEmailLayout({
      title: subject,
      preheader: `Your appointment for ${serviceName} on ${params.appointmentTimeFormatted} is confirmed.`,
      bodyHtml,
      ctaText: params.bookingUrl ? 'View Reservation Details' : undefined,
      ctaUrl: params.bookingUrl,
    }),
    icsContent,
  };
}

/**
 * 4. Booking Cancellation Email
 */
export function renderBookingCancelledEmail(params: {
  customerName: string;
  bookingNumber?: string;
  serviceOrPackageName?: string;
  appointmentTimeFormatted: string;
  reason?: string;
}): { subject: string; html: string } {
  const refCode = params.bookingNumber ? ` #${params.bookingNumber}` : '';
  const subject = `Appointment Cancelled${refCode} — Smoke M Customs`;

  const bodyHtml = `
    <h2 style="font-size: 22px; font-weight: 700; color: #FFFFFF; margin: 0 0 16px 0;">
      Appointment Cancellation Notice
    </h2>
    <p style="font-size: 15px; color: #C0C0D0; line-height: 24px; margin: 0 0 20px 0;">
      Dear ${params.customerName}, your detailing appointment ${refCode} scheduled for 
      <strong style="color: #E8E8ED;">${params.appointmentTimeFormatted}</strong> has been cancelled.
    </p>

    ${
      params.reason
        ? `
      <div style="background-color: #1C1818; border: 1px solid #362828; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 14px; color: #E8B0B0;">
        <strong>Reason:</strong> ${params.reason}
      </div>
    `
        : ''
    }

    <p style="font-size: 14px; color: #A0A0B0; line-height: 22px; margin: 0;">
      If you would like to reschedule for a future date, please click below or call our studio concierge.
    </p>
  `;

  return {
    subject,
    html: renderLuxuryEmailLayout({
      title: subject,
      preheader: `Your detailing appointment on ${params.appointmentTimeFormatted} was cancelled.`,
      bodyHtml,
      ctaText: 'Schedule New Session',
      ctaUrl: 'https://smokecustoms.com/book',
    }),
  };
}

/**
 * 5. Marketing Campaign Wrapper
 */
export function renderCampaignEmail(params: {
  title: string;
  contentHtml: string;
  preheader?: string;
  ctaText?: string;
  ctaUrl?: string;
  unsubscribeUrl?: string;
}): string {
  return renderLuxuryEmailLayout({
    title: params.title,
    preheader: params.preheader,
    bodyHtml: params.contentHtml,
    ctaText: params.ctaText,
    ctaUrl: params.ctaUrl,
    unsubscribeUrl: params.unsubscribeUrl,
  });
}

/**
 * Dynamic Template Token Interpolator
 * Replaces {{customerName}}, {{vehicleText}}, {{quoteUrl}}, etc.
 */
export function interpolateEmailTokens(
  template: string,
  variables: Record<string, string | number | undefined | null>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const valStr = value !== undefined && value !== null ? String(value) : '';
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, valStr);
  }
  return result;
}
