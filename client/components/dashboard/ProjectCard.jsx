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
    e.preventDefault(); // prevent the outer Link from navigating
    if (onDelete && window.confirm('Are you sure you want to delete this project?')) {
      onDelete(project._id);
    }
  };

  return (
    <Link href={href} className="block group">
      <div className="glass-card glass-card-hover rounded-xl p-5 cursor-pointer relative overflow-hidden h-full">
        {/* Ambient glow on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 50% 0%, rgba(6,182,212,0.04), transparent 70%)' }} />

        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-200 text-sm truncate group-hover:text-cyan-400 transition-colors">
              {project.title}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{project.description}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={project.status} />
            {role === 'employer' && (
              <button 
                onClick={handleDelete}
                className="p-1.5 text-red-500/60 hover:text-red-400 bg-red-500/5 hover:bg-red-500/10 rounded-md transition-colors"
                title="Delete Project"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Meta info */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
            <Wallet className="w-3 h-3 text-emerald-500" />
            <span className="text-emerald-400 font-semibold">${project.totalFunds?.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
            <Wallet className="w-3 h-3 text-cyan-500" />
            Escrow: <span className="text-cyan-400">${project.escrowBalance?.toLocaleString()}</span>
          </div>
          {project.freelancerId && (
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 col-span-2">
              <User className="w-3 h-3" />
              {project.freelancerId?.name || 'Assigned'}
            </div>
          )}
          {/* Deadline countdown */}
          {dlInfo && (
            <div className={`flex items-center gap-1.5 text-[11px] font-mono col-span-2 ${
              dlInfo.color === 'red' ? 'text-red-400' :
              dlInfo.color === 'amber' ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {dlInfo.color === 'red' ? (
                <AlertTriangle className="w-3 h-3" />
              ) : (
                <CalendarClock className="w-3 h-3" />
              )}
              <span className="font-semibold">{dlInfo.label}</span>
              <span className="text-slate-600 ml-1">
                ({new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
              </span>
            </div>
          )}
        </div>

        {/* Progress */}
        {total > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-mono text-slate-600">
              <span>MILESTONE PROGRESS</span>
              <span className="text-cyan-500">{paid}/{total} • {pct}%</span>
            </div>
            <ProgressBar value={paid} max={total} />
          </div>
        )}

        {/* Tech stack */}
        {project.techStack?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {project.techStack.slice(0, 4).map((t) => (
              <span key={t} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/8 text-cyan-600 border border-cyan-500/10">
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-end mt-3 pt-3 border-t border-slate-800">
          <span className="text-[11px] font-mono text-slate-600 group-hover:text-cyan-500 transition-colors flex items-center gap-1">
            VIEW PROJECT <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
