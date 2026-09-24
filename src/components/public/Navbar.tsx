'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  // Hide public navbar on admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '/services' },
    { label: 'Packages', href: '/packages' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'Reviews', href: '/reviews' },
    { label: 'Offers', href: '/offers' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Client Portal', href: '/portal' },
  ];

  return (
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
      <div className={styles.container}>
        {/* Brand Logo */}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoBadge}>SMC</span>
          <span className={styles.logoText}>
            <span className={styles.logoSmoke}>SMOKE M</span>{' '}
            <span className={styles.logoCustoms}>CUSTOMS</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className={styles.desktopNav}>
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.navLink} ${isActive ? styles.activeNavLink : ''}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className={styles.actions}>
          <a
            href="https://wa.me/919876543210?text=Hi%20Smoke%20M%20Customs%2C%20I%20would%20like%20to%20enquire%20about%20your%20services"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.waBtn}
            title="Chat on WhatsApp"
            aria-label="Chat on WhatsApp"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.539 1.776.812 2.791.812 3.179 0 5.767-2.587 5.767-5.766.001-3.187-2.58-5.767-5.767-5.767zm7.65 5.767c0 4.228-3.441 7.669-7.669 7.669-1.28 0-2.484-.316-3.542-.871l-4.529 1.187 1.21-4.417c-.649-1.127-1.008-2.428-1.008-3.799 0-4.228 3.441-7.669 7.669-7.669 4.228.001 7.669 3.442 7.669 7.67z" />
            </svg>
            <span className={styles.waText}>WhatsApp</span>
          </a>

          <Link href="/quote" className="btn btn-secondary btn-sm">
            Instant Quote
          </Link>

          <Link href="/book" className="btn btn-primary btn-sm">
            Book Bay
          </Link>

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            className={styles.hamburger}
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={isOpen}
          >
            <span className={`${styles.bar} ${isOpen ? styles.barOpenTop : ''}`} />
            <span className={`${styles.bar} ${isOpen ? styles.barOpenMid : ''}`} />
            <span className={`${styles.bar} ${isOpen ? styles.barOpenBot : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className={`${styles.mobileDrawer} ${isOpen ? styles.drawerOpen : ''}`}>
        <div className={styles.mobileNav}>
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.mobileNavLink} ${isActive ? styles.mobileActiveNavLink : ''}`}
              >
                {link.label}
              </Link>
            );
          })}
          <div className={styles.mobileActions}>
            <Link href="/quote" className="btn btn-secondary btn-full">
              Get an Instant Quote
            </Link>
            <Link href="/book" className="btn btn-primary btn-full">
              Book Detailing Bay
            </Link>
            <a
              href="https://wa.me/919876543210?text=Hi%20Smoke%20M%20Customs%2C%20I%20would%20like%20to%20enquire%20about%20your%20services"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.mobileWaLink}
            >
              💬 WhatsApp Us: +91 98765 43210
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
