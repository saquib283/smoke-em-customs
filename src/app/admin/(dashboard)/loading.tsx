import { KpiGridSkeleton, PageSkeleton } from '@/components/ui';
import { Skeleton } from '@/components/ui';

export default function DashboardLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
        <div>
          <Skeleton width="280px" height="32px" />
          <Skeleton width="360px" height="14px" style={{ marginTop: 6 }} />
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Skeleton width="140px" height="36px" borderRadius="var(--radius-md)" />
          <Skeleton width="120px" height="36px" borderRadius="var(--radius-md)" />
        </div>
      </div>

      {/* KPI Grid */}
      <KpiGridSkeleton count={4} />

      {/* Two-column panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-5)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--color-border)' }}>
            <Skeleton width="200px" height="20px" />
            <Skeleton width="120px" height="30px" borderRadius="var(--radius-md)" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', marginBottom: 'var(--space-3)', display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
                <Skeleton width="140px" height="14px" />
                <Skeleton width="200px" height="12px" />
              </div>
              <Skeleton width="80px" height="24px" borderRadius="var(--radius-full)" />
            </div>
          ))}
        </div>
        <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-5)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--color-border)' }}>
            <Skeleton width="200px" height="20px" />
            <Skeleton width="120px" height="30px" borderRadius="var(--radius-md)" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', marginBottom: 'var(--space-3)', display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
                <Skeleton width="120px" height="14px" />
                <Skeleton width="160px" height="12px" />
              </div>
              <Skeleton width="90px" height="24px" borderRadius="var(--radius-full)" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
