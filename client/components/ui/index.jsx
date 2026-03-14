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
    ai_reviewing: { label: 'AI REVIEW', cls: 'bg-violet-500/10 text-violet-400 border border-violet-500/20' },
    in_review: { label: 'IN REVIEW', cls: 'bg-violet-500/10 text-violet-400 border border-violet-500/20' },
    cancelled: { label: 'CANCELLED', cls: 'badge-failed' },
    approved: { label: 'APPROVED', cls: 'badge-active' },
    needs_revision: { label: 'REVISION', cls: 'badge-pending' },
  };
  const s = map[status] || { label: status?.toUpperCase() || 'UNKNOWN', cls: 'badge-locked' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold tracking-widest ${s.cls}`}>
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
    <div className={`${s} border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin`} />
  );
}

export function ProgressBar({ value, max = 100, color = 'cyan' }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full bg-void-700 rounded-full h-1.5 overflow-hidden">
      <div
        className="h-full rounded-full progress-bar transition-all duration-700"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function MetricCard({ label, value, sub, icon: Icon, trend, color = 'cyan' }) {
  const colorMap = {
    cyan: 'text-cyan-400 bg-cyan-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    violet: 'text-violet-400 bg-violet-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
  };
  return (
    <GlassCard className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-2">{label}</p>
          <p className={`text-3xl font-display font-bold text-${color}-400`}>{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1 font-mono">{sub}</p>}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${colorMap[color]}`}>
            <Icon className={`w-5 h-5 text-${color}-400`} />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <p className={`text-xs font-mono mt-3 ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
        </p>
      )}
    </GlassCard>
  );
}

export function EmptyState({ icon: Icon, title, desc }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {Icon && <Icon className="w-12 h-12 text-slate-600 mb-4" />}
      <p className="text-slate-400 font-mono text-sm">{title}</p>
      {desc && <p className="text-slate-600 text-xs mt-1 font-mono">{desc}</p>}
    </div>
  );
}
