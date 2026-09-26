import Link from 'next/link';

export default function NotFound() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 'var(--space-24) var(--space-8)',
        minHeight: '70vh',
        backgroundColor: 'var(--color-bg-base)',
        background: 'radial-gradient(circle at 50% 30%, rgba(201, 162, 75, 0.08) 0%, transparent 60%)',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          letterSpacing: '0.2em',
          color: 'var(--color-accent)',
          textTransform: 'uppercase',
          marginBottom: 'var(--space-2)',
        }}
      >
        ERROR 404 &bull; ROUTE UNRESOLVED
      </span>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(5rem, 12vw, 8rem)',
          fontWeight: 700,
          color: 'var(--color-accent)',
          lineHeight: 1,
          letterSpacing: '0.04em',
          marginBottom: 'var(--space-2)',
        }}
      >
        404
      </div>
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-2xl)',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--color-text-primary)',
            letterSpacing: '0.02em',
            marginBottom: 'var(--space-3)',
          }}
        >
          Destination Not Found
        </h1>
        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-secondary)',
            maxWidth: 440,
            lineHeight: 'var(--leading-relaxed)',
            margin: '0 auto',
          }}
        >
          The atelier route or specification you requested does not exist or may have been relocated.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/" className="btn btn-primary btn-md">
          Return to Atelier
        </Link>
        <Link href="/services" className="btn btn-secondary btn-md">
          Explore Services
        </Link>
      </div>
    </main>
  );
}
