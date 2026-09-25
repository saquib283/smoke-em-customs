'use client';

import React from 'react';
import styles from './WhatsAppCTA.module.css';

export interface WhatsAppCTAProps {
  /**
   * Phone number (international or 10-digit Indian). Defaults to Smoke M Customs studio line: 919876543210
   */
  phone?: string;
  /**
   * Pre-filled text message.
   */
  message?: string;
  /**
   * Button display label.
   */
  label?: string | React.ReactNode;
  /**
   * Visual aesthetic variant.
   */
  variant?: 'button' | 'gold' | 'outline' | 'icon' | 'floating';
  /**
   * Size token.
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Render icon only (omits text label).
   */
  iconOnly?: boolean;
  /**
   * Custom CSS class names.
   */
  className?: string;
  /**
   * Target attribute (default: _blank).
   */
  target?: string;
  /**
   * Rel attribute (default: noopener noreferrer).
   */
  rel?: string;
  /**
   * Optional payload to automatically record an outbound communication in the DB.
   * Useful in Admin CRM, Quote sharing, and Booking management.
   */
  logCommunication?: {
    customerId: string;
    leadId?: string;
    summary?: string;
  };
  /**
   * Optional click callback before navigating.
   */
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  /**
   * Accessibility label.
   */
  ariaLabel?: string;
}

const DEFAULT_STUDIO_PHONE = '919876543210';

export function WhatsAppCTA({
  phone = DEFAULT_STUDIO_PHONE,
  message = 'Hi Smoke M Customs, I would like to enquire about your detailing services.',
  label = 'Chat on WhatsApp',
  variant = 'button',
  size = 'md',
  iconOnly = false,
  className = '',
  target = '_blank',
  rel = 'noopener noreferrer',
  logCommunication,
  onClick,
  ariaLabel,
}: WhatsAppCTAProps) {
  // Format phone number into clean E.164 digits without symbols
  const cleanPhone = phone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  const deepLink = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // If logging is enabled, fire non-blocking request to log communication
    if (logCommunication?.customerId) {
      fetch('/api/admin/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: logCommunication.customerId,
          leadId: logCommunication.leadId,
          channel: 'WHATSAPP',
          direction: 'OUTBOUND',
          summary: logCommunication.summary || `Sent WhatsApp message: "${message.slice(0, 80)}..."`,
        }),
      }).catch((err) => {
        console.warn('Failed to log outbound WhatsApp communication:', err);
      });
    }

    if (onClick) {
      onClick(e);
    }
  };

  const variantClass = {
    button: styles.variantButton,
    gold: styles.variantGold,
    outline: styles.variantOutline,
    icon: styles.variantIcon,
    floating: styles.variantFloating,
  }[variant];

  const sizeClass = {
    sm: styles.sizeSm,
    md: styles.sizeMd,
    lg: styles.sizeLg,
  }[size];

  const classes = [
    styles.ctaWrapper,
    variantClass,
    sizeClass,
    iconOnly ? styles.iconOnly : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const accessibleLabel =
    ariaLabel || (typeof label === 'string' ? label : 'Chat on WhatsApp');

  return (
    <a
      href={deepLink}
      target={target}
      rel={rel}
      onClick={handleClick}
      className={classes}
      aria-label={accessibleLabel}
      title={accessibleLabel}
    >
      <svg
        className={styles.iconSvg}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM17.52 14.33C17.22 14.18 15.75 13.45 15.47 13.35C15.2 13.25 15 13.2 14.81 13.5C14.61 13.79 14.04 14.47 13.87 14.67C13.7 14.86 13.52 14.89 13.23 14.74C12.93 14.59 11.99 14.28 10.87 13.29C10 12.51 9.41 11.55 9.26 11.3C9.11 11.05 9.24 10.92 9.39 10.77C9.52 10.64 9.69 10.42 9.83 10.25C9.98 10.08 10.03 9.96 10.13 9.76C10.23 9.56 10.18 9.39 10.1 9.24C10.03 9.09 9.44 7.64 9.2 7.04C8.96 6.46 8.72 6.54 8.54 6.53H7.98C7.79 6.53 7.47 6.6 7.21 6.89C6.94 7.18 6.18 7.9 6.18 9.35C6.18 10.81 7.24 12.21 7.39 12.41C7.54 12.61 9.47 15.58 12.44 16.86C13.15 17.17 13.71 17.35 14.14 17.49C14.86 17.72 15.51 17.68 16.03 17.61C16.61 17.52 17.81 16.88 18.06 16.18C18.31 15.48 18.31 14.89 18.23 14.77C18.16 14.64 17.82 14.48 17.52 14.33Z" />
      </svg>
      {!iconOnly && <span className={styles.label}>{label}</span>}
    </a>
  );
}

export default WhatsAppCTA;
