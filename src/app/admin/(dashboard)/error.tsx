'use client';

import React from 'react';
import { Icon } from '@/components/common/Icons';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 'var(--space-16) var(--space-8)',
        gap: 'var(--space-6)',
        minHeight: '400px',
      }}
      role="alert"
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 'var(--radius-2xl)',
          background: 'var(--color-error-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon.AlertTriangle size={36} color="var(--color-error, #EF4444)" />
      </div>
      <div>
        <h2
          style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--font-bold)',
            color: 'var(--color-text-primary)',
            marginBottom: 8,
          }}
        >
          Something went wrong
        </h2>
        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-muted)',
            maxWidth: 440,
            lineHeight: 'var(--leading-relaxed)',
          }}
        >
          An unexpected error occurred while loading this page.
          {error.digest && (
            <span style={{ display: 'block', marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
              Error ID: {error.digest}
            </span>
          )}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <button
          className="btn btn-primary"
          onClick={() => reset()}
          type="button"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Icon.Refresh size={14} /> Try Again
        </button>
        <a href="/admin" className="btn btn-secondary">
          &larr; Back to Dashboard
        </a>
      </div>
    </div>
  );
}
