'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WhatsAppCTA } from '@/components/common/WhatsAppCTA';
import styles from './MobileStickyBar.module.css';

export function MobileStickyBar() {
  const pathname = usePathname();

  // Hide on homepage (hero CTA has priority) and admin pages per DESIGN.md §7
  if (!pathname || pathname === '/' || pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <aside className={styles.stickyBar} aria-label="Quick Actions">
      <WhatsAppCTA
        phone="919876543210"
        message="Hi Smoke M Customs, I would like to enquire about your services"
        iconOnly
        size="md"
        variant="icon"
        className={styles.waBtn}
        ariaLabel="Contact via WhatsApp"
      />

      <Link href="/quote" className={`btn btn-primary ${styles.btnQuote}`}>
        Get a Quote
      </Link>

      <Link href="/book" className={`btn btn-secondary ${styles.btnBook}`}>
        Book Now
      </Link>
    </aside>
  );
}
