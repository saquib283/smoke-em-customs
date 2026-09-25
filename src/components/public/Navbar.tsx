'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  ChevronDownIcon,
  ShieldIcon,
  PackageIcon,
  FileTextIcon,
  ImageIcon,
  StarIcon,
  CrownIcon,
  InfoIcon,
  MapPinIcon,
  UserIcon,
  WhatsAppIcon,
  ArrowRightIcon,
  SparklesIcon,
} from '@/components/common/Icons';
import styles from './Navbar.module.css';

interface NavDropdownItem {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string; color?: string }>;
  badge?: string;
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith('/admin')) return;
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  // Close mobile drawer and dropdown on route change
  useEffect(() => {
    setIsOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  // Hide public navbar on admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const handleMouseEnter = (menu: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setOpenDropdown(menu);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
  };

  const servicesMenu: NavDropdownItem[] = [
    {
      title: 'Paint Protection Film (PPF)',
      description: 'Self-healing ultra-gloss TPU armour with 10-year warranty',
      href: '/services#ppf',
      icon: ShieldIcon,
    },
    {
      title: 'Ceramic Coating',
      description: '9H liquid crystal nano-glass with hydrophobic hyper-slick finish',
      href: '/services#ceramic',
      icon: SparklesIcon,
    },
    {
      title: 'Bespoke Detailing',
      description: 'Multi-stage concours paint correction and leather nourishment',
      href: '/services#detailing',
      icon: ShieldIcon,
    },
    {
      title: 'All Studio Services',
      description: 'Browse complete catalogue of bespoke treatments and customizations',
      href: '/services',
      icon: ShieldIcon,
    },
    {
      title: 'Instant Cost Estimator',
      description: 'Configure vehicle options and calculate accurate real-time pricing',
      href: '/quote',
      icon: FileTextIcon,
    },
  ];

  const showcaseMenu: NavDropdownItem[] = [
    {
      title: 'Transformation Gallery',
      description: 'High-definition before & after showcases of supercar & luxury builds',
      href: '/gallery',
      icon: ImageIcon,
    },
    {
      title: 'Verified Client Reviews',
      description: 'Read authentic 5.0★ experiences and stories from passionate owners',
      href: '/reviews',
      icon: StarIcon,
    },
    {
      title: 'Studio Privileges & Offers',
      description: 'Exclusive seasonal allocations, bespoke tier privileges & specials',
      href: '/offers',
      badge: 'Privilege',
      icon: CrownIcon,
    },
  ];

  const studioMenu: NavDropdownItem[] = [
    {
      title: 'The Atelier & Craft',
      description: 'Our heritage, climate-controlled cleanrooms, and master standards',
      href: '/about',
      icon: InfoIcon,
    },
    {
      title: 'Studio Location & Contact',
      description: 'Visit our flagship facility or schedule covered vehicle flatbed transit',
      href: '/contact',
      icon: MapPinIcon,
    },
    {
      title: 'Client Portal',
      description: 'Track active vehicle work in progress, milestones & inspection logs',
      href: '/portal',
      icon: UserIcon,
    },
  ];

  const isServicesActive = pathname?.startsWith('/services') || pathname === '/quote';
  const isPackagesActive = pathname?.startsWith('/packages');
  const isShowcaseActive = pathname?.startsWith('/gallery') || pathname?.startsWith('/reviews') || pathname?.startsWith('/offers');
  const isStudioActive = pathname?.startsWith('/about') || pathname?.startsWith('/contact') || pathname?.startsWith('/portal');

  return (
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
      <div className={styles.container}>
        {/* Brand Identity / Logo */}
        <Link href="/" className={styles.logo} aria-label="Smoke 'Em Customs Atelier">
          <div className={styles.logoBadgeContainer}>
            <Image
              src="/logo.png"
              alt="Smoke 'Em Customs Emblem"
              width={38}
              height={38}
              priority
              className={styles.logoImage}
            />
          </div>
          <div className={styles.logoText}>
            <span className={styles.logoSmoke}>SMOKE &apos;EM</span>
            <span className={styles.logoCustoms}>CUSTOMS</span>
          </div>
        </Link>

        {/* Curated Luxury Navigation (Stripe/Linear style) */}
        <nav className={styles.desktopNav} aria-label="Main navigation">
          {/* Services Dropdown */}
          <div
            className={styles.navItem}
            onMouseEnter={() => handleMouseEnter('services')}
            onMouseLeave={handleMouseLeave}
          >
            <Link
              href="/services"
              className={`${styles.navLink} ${isServicesActive ? styles.activeNavLink : ''}`}
              aria-expanded={openDropdown === 'services'}
              aria-haspopup="true"
            >
              <span>Services</span>
              <ChevronDownIcon
                size={13}
                className={`${styles.chevron} ${openDropdown === 'services' ? styles.chevronOpen : ''}`}
              />
            </Link>

            {openDropdown === 'services' && (
              <div className={styles.dropdownFlyout} role="menu">
                <div className={styles.dropdownCard}>
                  <div className={styles.dropdownHeader}>
                    <span className={styles.dropdownCategory}>Bespoke Protection & Detailing</span>
                  </div>
                  <div className={styles.dropdownGrid}>
                    {servicesMenu.map((item) => {
                      const IconComponent = item.icon;
                      return (
                        <Link
                          key={item.title}
                          href={item.href}
                          className={styles.dropdownItem}
                          role="menuitem"
                        >
                          <div className={styles.itemIconBox}>
                            <IconComponent size={18} />
                          </div>
                          <div className={styles.itemContent}>
                            <div className={styles.itemTitleRow}>
                              <span className={styles.itemTitle}>{item.title}</span>
                              {item.badge && <span className={styles.itemBadge}>{item.badge}</span>}
                            </div>
                            <p className={styles.itemDescription}>{item.description}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  <div className={styles.dropdownFooter}>
                    <span>Looking for custom protection on a rare vehicle?</span>
                    <Link href="/contact" className={styles.footerLink}>
                      Consult Master Detailer <ArrowRightIcon size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Packages Direct Link */}
          <Link
            href="/packages"
            className={`${styles.navLink} ${isPackagesActive ? styles.activeNavLink : ''}`}
            aria-current={isPackagesActive ? 'page' : undefined}
          >
            <span>Packages</span>
          </Link>

          {/* Showcase Dropdown */}
          <div
            className={styles.navItem}
            onMouseEnter={() => handleMouseEnter('showcase')}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              className={`${styles.navLink} ${isShowcaseActive ? styles.activeNavLink : ''}`}
              aria-expanded={openDropdown === 'showcase'}
              aria-haspopup="true"
              onClick={() => setOpenDropdown(openDropdown === 'showcase' ? null : 'showcase')}
            >
              <span>Showcase</span>
              <ChevronDownIcon
                size={13}
                className={`${styles.chevron} ${openDropdown === 'showcase' ? styles.chevronOpen : ''}`}
              />
            </button>

            {openDropdown === 'showcase' && (
              <div className={styles.dropdownFlyout} role="menu">
                <div className={styles.dropdownCard}>
                  <div className={styles.dropdownHeader}>
                    <span className={styles.dropdownCategory}>Studio Portfolio & Praise</span>
                  </div>
                  <div className={styles.dropdownGrid}>
                    {showcaseMenu.map((item) => {
                      const IconComponent = item.icon;
                      return (
                        <Link
                          key={item.title}
                          href={item.href}
                          className={styles.dropdownItem}
                          role="menuitem"
                        >
                          <div className={styles.itemIconBox}>
                            <IconComponent size={18} />
                          </div>
                          <div className={styles.itemContent}>
                            <div className={styles.itemTitleRow}>
                              <span className={styles.itemTitle}>{item.title}</span>
                              {item.badge && <span className={styles.itemBadge}>{item.badge}</span>}
                            </div>
                            <p className={styles.itemDescription}>{item.description}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  <div className={styles.dropdownFooter}>
                    <span>Explore our client transformation archive</span>
                    <Link href="/gallery" className={styles.footerLink}>
                      View 100+ Builds <ArrowRightIcon size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* The Atelier Dropdown */}
          <div
            className={styles.navItem}
            onMouseEnter={() => handleMouseEnter('studio')}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              className={`${styles.navLink} ${isStudioActive ? styles.activeNavLink : ''}`}
              aria-expanded={openDropdown === 'studio'}
              aria-haspopup="true"
              onClick={() => setOpenDropdown(openDropdown === 'studio' ? null : 'studio')}
            >
              <span>The Atelier</span>
              <ChevronDownIcon
                size={13}
                className={`${styles.chevron} ${openDropdown === 'studio' ? styles.chevronOpen : ''}`}
              />
            </button>

            {openDropdown === 'studio' && (
              <div className={styles.dropdownFlyout} role="menu">
                <div className={styles.dropdownCard}>
                  <div className={styles.dropdownHeader}>
                    <span className={styles.dropdownCategory}>The Smoke &apos;Em Standards</span>
                  </div>
                  <div className={styles.dropdownGrid}>
                    {studioMenu.map((item) => {
                      const IconComponent = item.icon;
                      return (
                        <Link
                          key={item.title}
                          href={item.href}
                          className={styles.dropdownItem}
                          role="menuitem"
                        >
                          <div className={styles.itemIconBox}>
                            <IconComponent size={18} />
                          </div>
                          <div className={styles.itemContent}>
                            <div className={styles.itemTitleRow}>
                              <span className={styles.itemTitle}>{item.title}</span>
                              {item.badge && <span className={styles.itemBadge}>{item.badge}</span>}
                            </div>
                            <p className={styles.itemDescription}>{item.description}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  <div className={styles.dropdownFooter}>
                    <span>Need immediate customer support?</span>
                    <Link href="/portal" className={styles.footerLink}>
                      Client Access <ArrowRightIcon size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Right Action Group: VIP Concierge + Portal + Single Hero CTA */}
        <div className={styles.actions}>
          {/* WhatsApp VIP Concierge Button */}
          <a
            href="https://wa.me/919876543210?text=Hi%20Smoke%20M%20Customs%2C%20I%20would%20like%20to%20enquire%20about%20your%20bespoke%20detailing%20services."
            target="_blank"
            rel="noopener noreferrer"
            className={styles.conciergePill}
            aria-label="Connect with Studio Concierge on WhatsApp"
          >
            <span className={styles.waBadgeIcon}>
              <WhatsAppIcon size={16} />
            </span>
            <div className={styles.conciergeInfo}>
              <span className={styles.conciergeText}>WhatsApp Us</span>
            </div>
          </a>

          {/* Customer Portal Shortcut */}
          <Link
            href="/portal"
            className={`${styles.portalShortcut} ${pathname?.startsWith('/portal') ? styles.activePortalShortcut : ''}`}
            title="Customer Portal"
            aria-label="Customer Portal"
          >
            <UserIcon size={15} />
            <span className={styles.portalText}>Portal</span>
          </Link>

          {/* Primary Hero Action Button */}
          <Link href="/book" className={styles.btnHeroBook}>
            <span>Book Bay</span>
            <ArrowRightIcon size={13} className={styles.btnArrow} />
          </Link>

          {/* Mobile Hamburger Toggle */}
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

      {/* Mobile Drawer Navigation */}
      <div
        className={`${styles.mobileDrawer} ${isOpen ? styles.drawerOpen : ''}`}
        role="dialog"
        aria-label="Mobile navigation menu"
      >
        <div className={styles.mobileNavContent}>
          {/* Mobile Section 1: Services */}
          <div className={styles.mobileSection}>
            <span className={styles.mobileSectionTitle}>Services & Protection</span>
            <div className={styles.mobileLinkList}>
              <Link href="/services" className={styles.mobileNavLink}>
                <ShieldIcon size={16} />
                <span>All Detailing & PPF Services</span>
              </Link>
              <Link href="/packages" className={styles.mobileNavLink}>
                <PackageIcon size={16} />
                <span>Protection Packages</span>
              </Link>
              <Link href="/quote" className={styles.mobileNavLink}>
                <FileTextIcon size={16} />
                <span>Instant Cost Estimator</span>
              </Link>
            </div>
          </div>

          {/* Mobile Section 2: Showcase */}
          <div className={styles.mobileSection}>
            <span className={styles.mobileSectionTitle}>Showcase & Reputation</span>
            <div className={styles.mobileLinkList}>
              <Link href="/gallery" className={styles.mobileNavLink}>
                <ImageIcon size={16} />
                <span>Transformation Gallery</span>
              </Link>
              <Link href="/reviews" className={styles.mobileNavLink}>
                <StarIcon size={16} />
                <span>Client Reviews (5.0★)</span>
              </Link>
              <Link href="/offers" className={styles.mobileNavLink}>
                <CrownIcon size={16} />
                <span>Privileges & Offers</span>
                <span className={styles.itemBadge}>VIP</span>
              </Link>
            </div>
          </div>

          {/* Mobile Section 3: The Atelier */}
          <div className={styles.mobileSection}>
            <span className={styles.mobileSectionTitle}>The Atelier</span>
            <div className={styles.mobileLinkList}>
              <Link href="/about" className={styles.mobileNavLink}>
                <InfoIcon size={16} />
                <span>Our Heritage & Standards</span>
              </Link>
              <Link href="/contact" className={styles.mobileNavLink}>
                <MapPinIcon size={16} />
                <span>Studio Location & Booking</span>
              </Link>
              <Link href="/portal" className={styles.mobileNavLink}>
                <UserIcon size={16} />
                <span>Customer Vehicle Portal</span>
              </Link>
            </div>
          </div>

          {/* Mobile CTA Bar */}
          <div className={styles.mobileActions}>
            <Link href="/book" className={styles.mobileBtnBook}>
              Book Detailing Bay
            </Link>
            <Link href="/quote" className={styles.mobileBtnQuote}>
              Calculate Instant Quote
            </Link>
            <a
              href="https://wa.me/919876543210?text=Hi%20Smoke%20M%20Customs%2C%20I%20would%20like%20to%20enquire%20about%20your%20services"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.mobileWaBtn}
            >
              <WhatsAppIcon size={16} />
              <span>WhatsApp Studio Concierge</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
