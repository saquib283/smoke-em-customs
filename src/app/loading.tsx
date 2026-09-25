import { Skeleton } from '@/components/ui';

export default function HomeLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* Hero skeleton */}
      <div
        style={{
          minHeight: '90vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-8)',
          background: 'linear-gradient(180deg, var(--color-bg-primary), var(--color-bg-secondary))',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 720, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
          <Skeleton width="200px" height="28px" borderRadius="var(--radius-full)" />
          <Skeleton width="90%" height="48px" />
          <Skeleton width="70%" height="48px" />
          <Skeleton width="60%" height="16px" style={{ marginTop: 8 }} />
          <Skeleton width="50%" height="16px" />
          <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-6)' }}>
            <Skeleton width="160px" height="48px" borderRadius="var(--radius-md)" />
            <Skeleton width="160px" height="48px" borderRadius="var(--radius-md)" />
          </div>
        </div>
      </div>
      {/* Services section skeleton */}
      <div style={{ padding: 'var(--space-16) var(--space-6)', maxWidth: 1280, margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-10)' }}>
          <Skeleton width="240px" height="30px" style={{ margin: '0 auto' }} />
          <Skeleton width="360px" height="14px" style={{ margin: '12px auto 0' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <Skeleton height="200px" borderRadius="0" />
              <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                <Skeleton width="70%" height="18px" />
                <Skeleton width="90%" height="12px" />
                <Skeleton width="50%" height="12px" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
