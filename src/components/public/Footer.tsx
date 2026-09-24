'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Footer.module.css';

export function Footer() {
  const pathname = usePathname();

  // Hide on admin routes
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Brand Col */}
          <div className={styles.colBrand}>
            <Link href="/" className={styles.logo}>
              <span className={styles.logoBadge}>SMC</span>
              <span className={styles.logoText}>
                <span className={styles.logoSmoke}>SMOKE M</span>{' '}
                <span className={styles.logoCustoms}>CUSTOMS</span>
              </span>
            </Link>
            <p className={styles.brandDesc}>
              Bespoke automotive detailing and surface protection studio.
              Delivering showroom-defining gloss, self-healing paint protection films,
              and precision vehicle preservation with certified international standards.
            </p>
            <div className={styles.socialLinks}>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
                aria-label="Instagram"
              >
                📸
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
                aria-label="YouTube"
              >
                ▶️
              </a>
              <a
                href="https://wa.me/919876543210"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
                aria-label="WhatsApp"
              >
                💬
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className={styles.col}>
            <h4 className={styles.heading}>Explore</h4>
            <ul className={styles.linkList}>
              <li><Link href="/services">Services Catalogue</Link></li>
              <li><Link href="/packages">Protection Packages</Link></li>
              <li><Link href="/gallery">Before & After Gallery</Link></li>
              <li><Link href="/reviews">Customer Reviews</Link></li>
              <li><Link href="/offers">Current Offers</Link></li>
              <li><Link href="/about">About Studio</Link></li>
              <li><Link href="/contact">Location & Contact</Link></li>
              <li><Link href="/portal">Client Portal (Bookings & Warranty)</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div className={styles.col}>
            <h4 className={styles.heading}>Specializations</h4>
            <ul className={styles.linkList}>
              <li><Link href="/services/ceramic-coating">9H Ceramic Coating</Link></li>
              <li><Link href="/services/paint-protection-film">TPU Paint Protection Film</Link></li>
              <li><Link href="/services/paint-correction">Multi-Stage Paint Correction</Link></li>
              <li><Link href="/services/interior-detailing">Interior Sanitization & Leather Care</Link></li>
              <li><Link href="/services/exterior-detailing">Concours Exterior Detail</Link></li>
              <li><Link href="/services/windshield-coating">Hydrophobic Glass Coating</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className={styles.col}>
            <h4 className={styles.heading}>Studio</h4>
            <ul className={styles.contactList}>
              <li>
                <span className={styles.contactIcon}>📍</span>
                <span>42 Detailing Boulevard, Phase II, Auto Zone, India</span>
              </li>
              <li>
                <span className={styles.contactIcon}>⏰</span>
                <span>Mon – Sat: 10:00 AM – 7:00 PM<br /><small className={styles.closed}>Sunday: Closed for deep bay cleaning</small></span>
              </li>
              <li>
                <span className={styles.contactIcon}>📞</span>
                <a href="tel:+919876543210">+91 98765 43210</a>
              </li>
              <li>
                <span className={styles.contactIcon}>💬</span>
                <a
                  href="https://wa.me/919876543210?text=Hi%20Smoke%20M%20Customs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.waHighlight}
                >
                  WhatsApp Support Active
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottomBar}>
          <p className={styles.copy}>
            © {new Date().getFullYear()} Smoke M Customs. All rights reserved. Precision Automotive Craftsmanship.
          </p>
          <div className={styles.bottomLinks}>
            <Link href="/privacy">Privacy Policy</Link>
            <span className={styles.dot}>•</span>
            <Link href="/terms">Terms of Service</Link>
            <span className={styles.dot}>•</span>
            <Link href="/quote">Get Quote</Link>
            <span className={styles.dot}>•</span>
            <Link href="/book">Book Bay</Link>
            <span className={styles.dot}>•</span>
            <Link href="/admin/login" className={styles.adminLink}>
              Staff Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
