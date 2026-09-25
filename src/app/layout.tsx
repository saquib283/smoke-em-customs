import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/public/Navbar';
import { Footer } from '@/components/public/Footer';
import { MobileStickyBar } from '@/components/public/MobileStickyBar';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    default: 'Smoke M Customs — Premium Car Detailing & Customization',
    template: '%s | Smoke M Customs',
  },
  description:
    'Professional car detailing, ceramic coating, paint protection film, and vehicle customization services. Book your appointment today.',
  keywords: [
    'car detailing',
    'ceramic coating',
    'paint protection film',
    'PPF',
    'car customization',
    'auto detailing',
    'vehicle care',
  ],
  authors: [{ name: 'Smoke M Customs' }],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'Smoke M Customs',
    title: 'Smoke M Customs — Premium Car Detailing & Customization',
    description:
      'Professional car detailing, ceramic coating, paint protection film, and vehicle customization services.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FFFFFF',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        <Providers>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <Navbar />
          <main id="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {children}
          </main>
          <MobileStickyBar />
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
