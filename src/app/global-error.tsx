'use client';

import React from 'react';
import { Icon } from '@/components/common/Icons';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0A0A0A',
          color: '#F5F5F5',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
          textAlign: 'center',
          padding: 32,
        }}
      >
        <div style={{ maxWidth: 480 }}>
          <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
            <Icon.AlertTriangle size={48} color="#D4A853" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 14, color: '#787878', lineHeight: 1.6, marginBottom: 24 }}>
            A critical error has occurred. Please try refreshing the page.
            {error.digest && (
              <span style={{ display: 'block', marginTop: 4, fontFamily: 'monospace', fontSize: 12 }}>
                Error ID: {error.digest}
              </span>
            )}
          </p>
          <button
            onClick={() => reset()}
            type="button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '12px 24px',
              backgroundColor: '#D4A853',
              color: '#0A0A0A',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '0.05em',
              textTransform: 'uppercase' as const,
            }}
          >
            <Icon.Refresh size={16} /> Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
