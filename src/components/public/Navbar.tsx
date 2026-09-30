'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  WhatsAppIcon,
  ArrowRightIcon,
  ChevronDownIcon,
} from '@/components/common/Icons';
import styles from './Navbar.module.css';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith('/admin')) return;
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Hide public navbar on admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const closeMenu = () => {
    setIsOpen(false);
  };

  const navLinks = [
    { href: '/services', label: 'Services' },
    { href: '/packages', label: 'Packages' },
    { href: '/gallery', label: 'Gallery' },
    { href: '/reviews', label: 'Reviews' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <>
      <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
        <div className={styles.container}>
          {/* Brand Wordmark Treatment (DESIGN.md §2 & Prompt §5) */}
          <Link href="/" className={styles.logo} aria-label="Smoke M Customs Home" onClick={closeMenu}>
            <Image
              src="/logo.png"
              alt="Smoke 'Em Customs Logo"
              width={44}
              height={44}
              priority
              className={styles.logoImage}
            />
            <span className={styles.wordmark}>
              SMOKE <span className={styles.wordmarkAccent}>M</span> CUSTOMS
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className={styles.desktopNav} aria-label="Main Navigation">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== '/' && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${styles.navLink} ${isActive ? styles.activeNavLink : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className={styles.desktopActions}>
            <a
              href="https://wa.me/919876543210?text=Hi%20Smoke%20M%20Customs%2C%20I%20would%20like%20to%20enquire%20about%20your%20services"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.waBtn}
              aria-label="Direct WhatsApp Consultation"
              title="Chat with Workshop Manager"
            >
              <WhatsAppIcon size={18} />
            </a>

            <Link href="/book" className="btn btn-secondary btn-sm">
              Book Bay
            </Link>

            <Link href="/quote" className={`btn btn-primary btn-sm ${styles.ctaBtn}`}>
              Get a Free Quote
            </Link>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            className={styles.mobileMenuToggle}
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-label="Toggle navigation menu"
          >
            {isOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Fullscreen Mobile Drawer */}
      {isOpen && (
        <div className={styles.mobileDrawer} role="dialog" aria-modal="true" aria-label="Mobile Navigation">
          <div className={styles.mobileDrawerHeader}>
            <Link href="/" className={styles.logo} onClick={closeMenu}>
              <Image
                src="/logo.png"
                alt="Smoke 'Em Customs Logo"
                width={38}
                height={38}
                className={styles.logoImage}
              />
              <span className={styles.wordmark}>
                SMOKE <span className={styles.wordmarkAccent}>M</span> CUSTOMS
              </span>
            </Link>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={closeMenu}
              aria-label="Close navigation menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <ul className={styles.mobileNavList}>
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== '/' && pathname?.startsWith(link.href));
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`${styles.mobileNavLink} ${isActive ? styles.mobileActiveLink : ''}`}
                    onClick={closeMenu}
                  >
                    <span>{link.label}</span>
                    <ArrowRightIcon size={16} />
                  </Link>
                </li>
              );
            })}
            <li>
              <Link
                href="/offers"
                className={`${styles.mobileNavLink} ${pathname === '/offers' ? styles.mobileActiveLink : ''}`}
                onClick={closeMenu}
              >
                <span>Current Offers</span>
                <ArrowRightIcon size={16} />
              </Link>
            </li>
          </ul>

          <div className={styles.mobileDrawerActions}>
            <Link href="/quote" className="btn btn-primary btn-lg" onClick={closeMenu}>
              Get a Free Quote
            </Link>
            <Link href="/book" className="btn btn-secondary btn-lg" onClick={closeMenu}>
              Book Detailing Bay
            </Link>
            <a
              href="https://wa.me/919876543210?text=Hi%20Smoke%20M%20Customs%2C%20I%20would%20like%20to%20enquire%20about%20your%20services"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.mobileWaBtn}
              onClick={closeMenu}
            >
              <WhatsAppIcon size={20} /> Chat on WhatsApp
            </a>
          </div>
        </div>
      )}
    </>
  );
}
