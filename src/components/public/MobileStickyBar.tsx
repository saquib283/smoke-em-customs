'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './MobileStickyBar.module.css';

export function MobileStickyBar() {
  const pathname = usePathname();

  // Hide on homepage (hero CTA has priority) and admin pages
  if (!pathname || pathname === '/' || pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <aside className={styles.stickyBar} aria-label="Quick Actions">
      <a
        href="https://wa.me/919876543210?text=Hi%20Smoke%20M%20Customs%2C%20I%20would%20like%20to%20enquire%20about%20your%20services"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.waBtn}
        aria-label="Contact via WhatsApp"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.539 1.776.812 2.791.812 3.179 0 5.767-2.587 5.767-5.766.001-3.187-2.58-5.767-5.767-5.767zm7.65 5.767c0 4.228-3.441 7.669-7.669 7.669-1.28 0-2.484-.316-3.542-.871l-4.529 1.187 1.21-4.417c-.649-1.127-1.008-2.428-1.008-3.799 0-4.228 3.441-7.669 7.669-7.669 4.228.001 7.669 3.442 7.669 7.67z" />
        </svg>
      </a>

      <Link href="/quote" className={`btn btn-secondary ${styles.btnQuote}`}>
        Instant Quote
      </Link>

      <Link href="/book" className={`btn btn-primary ${styles.btnBook}`}>
        Book Bay
      </Link>
    </aside>
  );
}
