'use client';

export function StatusBadge({ status }) {
  const map = {
    active: { label: 'ACTIVE', cls: 'badge-active' },
    pending: { label: 'PENDING', cls: 'badge-pending' },
    locked: { label: 'LOCKED', cls: 'badge-locked' },
    paid: { label: 'PAID', cls: 'badge-paid' },
    completed: { label: 'COMPLETE', cls: 'badge-paid' },
    failed: { label: 'FAILED', cls: 'badge-failed' },
    rejected: { label: 'REJECTED', cls: 'badge-failed' },
    submitted: { label: 'SUBMITTED', cls: 'badge-pending' },
    ai_reviewing: { label: 'AI REVIEW', cls: 'badge-paid' },
    in_review: { label: 'IN REVIEW', cls: 'badge-paid' },
    cancelled: { label: 'CANCELLED', cls: 'badge-failed' },
    approved: { label: 'APPROVED', cls: 'badge-active' },
    needs_revision: { label: 'REVISION', cls: 'badge-pending' },
  };
  const s = map[status] || { label: status?.toUpperCase() || 'UNKNOWN', cls: 'badge-locked' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-widest ${s.cls}`}>
      {s.label}
    </span>
  );
}

export function GlassCard({ children, className = '', hover = true, glow = false }) {
  return (
    <div className={`glass-card rounded-xl p-6 ${hover ? 'glass-card-hover' : ''} ${glow ? 'glow-cyan' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function Spinner({ size = 'md' }) {
  const s = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';
  return (
    <div className={`${s} border-2 rounded-full animate-spin`}
      style={{ borderColor: 'var(--card-border)', borderTopColor: 'var(--cyan)' }} />
  );
}

export function ProgressBar({ value, max = 100 }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
      <div
        className="h-full rounded-full progress-bar transition-all duration-700"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function MetricCard({ label, value, sub, icon: Icon, trend, color = 'cyan' }) {
  return (
    <GlassCard className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>{label}</p>
          <p className="text-3xl font-display font-bold" style={{ color: 'var(--cyan)' }}>{value}</p>
          {sub && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
        </div>
        {Icon && (
          <div className="p-2.5 rounded-lg" style={{ background: 'var(--cyan-dim)' }}>
            <Icon className="w-5 h-5" style={{ color: 'var(--cyan)' }} />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <p className="text-xs mt-3" style={{ color: trend >= 0 ? 'var(--badge-active-text)' : 'var(--badge-failed-text)' }}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
        </p>
      )}
    </GlassCard>
  );
}

export function EmptyState({ icon: Icon, title, desc }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {Icon && <Icon className="w-12 h-12 mb-4" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />}
      <p className="text-sm" style={{ color: 'var(--text-main)' }}>{title}</p>
      {desc && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{desc}</p>}
    </div>
  );
}
