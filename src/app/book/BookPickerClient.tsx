'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/common/Icons';
import styles from './booking.module.css';

interface ServiceItem {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  category: string | null;
  startingPrice: string;
  durationMinutes: number;
  warrantyText?: string | null;
  benefits?: string[];
}

interface PackageItem {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  price: string | null;
  startingPrice: string | null;
  durationMinutes: number;
  warrantyText?: string | null;
  benefits?: string[];
}

interface BookPickerClientProps {
  services: ServiceItem[];
  packages: PackageItem[];
}

export function BookPickerClient({ services, packages }: BookPickerClientProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'services' | 'packages'>('all');

  const allItems = [
    ...services.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      description: s.description || 'Specialized precision detailing performed inside our dust-free positive-pressure bays.',
      type: 'service' as const,
      category: s.category || 'Specialized Detailing',
      price: s.startingPrice,
      durationHours: (s.durationMinutes / 60).toFixed(1).replace('.0', ''),
      warranty: s.warrantyText,
      benefits: (s.benefits || ['Hydrophobic Protection', 'Showroom Finish', 'Ceramic Safe']).slice(0, 3),
      href: `/book/${s.slug}`,
    })),
    ...packages.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description || 'Comprehensive multi-stage package suite combining interior and exterior restorative care.',
      type: 'package' as const,
      category: 'Curated Package Suite',
      price: p.price ?? p.startingPrice ?? '0',
      durationHours: (p.durationMinutes / 60).toFixed(1).replace('.0', ''),
      warranty: p.warrantyText,
      benefits: (p.benefits || ['Multi-Stage Detailing', 'Extended Warranty', 'Paint Sealant']).slice(0, 3),
      href: `/book/${p.slug}`,
    })),
  ];

  const filteredItems = allItems.filter((item) => {
    if (activeTab === 'services') return item.type === 'service';
    if (activeTab === 'packages') return item.type === 'package';
    return true;
  });

  return (
    <div>
      {/* Category Tabs */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-8)',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-outline'}`}
        >
          All Treatments ({allItems.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('services')}
          className={`btn ${activeTab === 'services' ? 'btn-primary' : 'btn-outline'}`}
        >
          Individual Services ({services.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('packages')}
          className={`btn ${activeTab === 'packages' ? 'btn-primary' : 'btn-outline'}`}
        >
          Package Suites ({packages.length})
        </button>
      </div>

      {/* Grid of Selectable Treatments */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 'var(--space-6)',
          marginBottom: 'var(--space-12)',
        }}
      >
        {filteredItems.map((item) => (
          <div
            key={item.id}
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-6)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all var(--transition-fast)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div>
              {/* Category & Warranty Tags */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--space-3)',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--color-gold)',
                  }}
                >
                  {item.category}
                </span>
                {item.warranty && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      background: 'rgba(212, 168, 83, 0.12)',
                      color: 'var(--color-gold)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid rgba(212, 168, 83, 0.3)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Icon.Shield size={12} color="var(--color-gold)" /> {item.warranty}
                  </span>
                )}
              </div>

              {/* Title & Description */}
              <h2
                style={{
                  fontSize: 'var(--text-xl)',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                {item.name}
              </h2>
              <p
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 'var(--leading-relaxed)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                {item.description}
              </p>

              {/* Key Highlights */}
              {item.benefits.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    marginBottom: 'var(--space-6)',
                  }}
                >
                  {item.benefits.map((b, idx) => (
                    <div
                      key={idx}
                      style={{
                        fontSize: '11px',
                        color: 'var(--color-text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Icon.Check size={12} color="var(--color-gold)" /> {b}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Price, Duration & CTA */}
            <div
              style={{
                borderTop: '1px solid var(--color-border)',
                paddingTop: 'var(--space-4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Starting Price
                </div>
                <div
                  style={{
                    fontSize: 'var(--text-lg)',
                    fontWeight: 800,
                    color: 'var(--color-gold)',
                  }}
                >
                  ₹{Number(item.price).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icon.Clock size={12} color="var(--color-gold)" /> ~{item.durationHours} Hours Detailing
                </div>
              </div>

              <Link href={item.href} className="btn btn-primary">
                Book Bay Slot &rarr;
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Trust & Guarantee Strip */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-8)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-6)',
          textAlign: 'center',
        }}
      >
        <div>
          <div style={{ marginBottom: 'var(--space-2)', display: 'flex', justifyContent: 'center' }}>
            <Icon.Bay size={28} color="var(--color-gold)" />
          </div>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Dust-Free Bays
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
            Positive-pressure air filtration ensuring zero airborne contaminant settling during curing.
          </p>
        </div>
        <div>
          <div style={{ marginBottom: 'var(--space-2)', display: 'flex', justifyContent: 'center' }}>
            <Icon.Zap size={28} color="var(--color-gold)" />
          </div>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Zero Upfront Deposit
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
            Reserve your appointment with zero upfront charge. Pay only upon inspection and vehicle handover.
          </p>
        </div>
        <div>
          <div style={{ marginBottom: 'var(--space-2)', display: 'flex', justifyContent: 'center' }}>
            <Icon.Microscope size={28} color="var(--color-gold)" />
          </div>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Certified Masters
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
            Rupes & Gyeon certified precision technicians treating every panel with surgical paint gauges.
          </p>
        </div>
      </div>
    </div>
  );
}
