'use client';
import Link from 'next/link';
import { ArrowRight, Wallet, User, CalendarClock, Trash2, AlertTriangle } from 'lucide-react';
import { StatusBadge, ProgressBar } from '@/components/ui';

function getDeadlineInfo(deadline) {
  if (!deadline) return null;
  const now = new Date();
  const dl = new Date(deadline);
  const diffMs = dl - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: 'OVERDUE', color: 'red', days: diffDays };
  if (diffDays <= 3) return { label: `${diffDays}d left`, color: 'amber', days: diffDays };
  return { label: `${diffDays}d left`, color: 'emerald', days: diffDays };
}

export default function ProjectCard({ project, milestones = [], role, onDelete }) {
  const paid = milestones.filter((m) => ['paid', 'approved'].includes(m.status)).length;
  const total = milestones.length;
  const pct = total > 0 ? Math.round((paid / total) * 100) : 0;
  const href = role === 'employer' ? `/employer/projects/${project._id}` : `/freelancer/projects/${project._id}`;
  const dlInfo = getDeadlineInfo(project.deadline);

  const handleDelete = (e) => {
    e.preventDefault();
    if (onDelete && window.confirm('Are you sure you want to delete this project?')) {
      onDelete(project._id);
    }
  };

  return (
    <Link href={href} className="block group">
      <div className="glass-card glass-card-hover rounded-xl p-5 cursor-pointer relative overflow-hidden h-full">
        {/* Ambient glow on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 50% 0%, rgba(14,165,233,0.04), transparent 70%)' }} />

        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate transition-colors" style={{ color: 'var(--text-main)' }}>
              {project.title}
            </h3>
            <p className="text-xs mt-0.5 line-clamp-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{project.description}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={project.status} />
            {role === 'employer' && (
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-md transition-colors"
                style={{ color: 'var(--badge-failed-text)', opacity: 0.6, background: 'var(--badge-failed-bg)' }}
                title="Delete Project"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Meta info */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            <Wallet className="w-3 h-3" style={{ color: 'var(--badge-active-text)' }} />
            <span className="font-semibold" style={{ color: 'var(--badge-active-text)' }}>${project.totalFunds?.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            <Wallet className="w-3 h-3" style={{ color: 'var(--cyan)' }} />
            Escrow: <span style={{ color: 'var(--cyan)' }}>${project.escrowBalance?.toLocaleString()}</span>
          </div>
          {project.freelancerId && (
            <div className="flex items-center gap-1.5 text-[11px] col-span-2" style={{ color: 'var(--text-muted)' }}>
              <User className="w-3 h-3" />
              {project.freelancerId?.name || 'Assigned'}
            </div>
          )}
          {/* Deadline countdown */}
          {dlInfo && (
            <div className={`flex items-center gap-1.5 text-[11px] col-span-2`}
              style={{ color: dlInfo.color === 'red' ? 'var(--badge-failed-text)' : dlInfo.color === 'amber' ? 'var(--badge-pending-text)' : 'var(--badge-active-text)' }}>
              {dlInfo.color === 'red' ? (
                <AlertTriangle className="w-3 h-3" />
              ) : (
                <CalendarClock className="w-3 h-3" />
              )}
              <span className="font-semibold">{dlInfo.label}</span>
              <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>
                ({new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
              </span>
            </div>
          )}
        </div>

        {/* Progress */}
        {total > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
              <span>MILESTONE PROGRESS</span>
              <span style={{ color: 'var(--cyan)' }}>{paid}/{total} • {pct}%</span>
            </div>
            <ProgressBar value={paid} max={total} />
          </div>
        )}

        {/* Tech stack */}
        {project.techStack?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {project.techStack.slice(0, 4).map((t) => (
              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded"
                style={{ background: 'var(--cyan-dim)', color: 'var(--cyan)', border: '1px solid var(--card-border)' }}>
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-end mt-3 pt-3" style={{ borderTop: '1px solid var(--divider)' }}>
          <span className="text-[11px] flex items-center gap-1 transition-colors" style={{ color: 'var(--text-muted)' }}>
            VIEW PROJECT <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
