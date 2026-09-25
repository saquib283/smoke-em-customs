import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 'var(--space-24) var(--space-8)',
        gap: 'var(--space-6)',
        flex: 1,
      }}
    >
      <div
        style={{
          fontSize: 96,
          fontWeight: 'var(--font-bold)',
          background: 'linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-hover))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1,
        }}
      >
        404
      </div>
      <div>
        <h1
          style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--font-bold)',
            color: 'var(--color-text-primary)',
            marginBottom: 8,
          }}
        >
          Page Not Found
        </h1>
        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-muted)',
            maxWidth: 400,
            lineHeight: 'var(--leading-relaxed)',
          }}
        >
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <Link href="/" className="btn btn-primary">
          ← Back to Home
        </Link>
        <Link href="/services" className="btn btn-secondary">
          Browse Services
        </Link>
      </div>
    </div>
  );
}
