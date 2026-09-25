'use client';

import React from 'react';
import { ToastProvider } from '@/components/ui/Toast';

/**
 * Client-side providers wrapper.
 * Wraps the entire app with global context providers (Toast, etc.)
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
}
