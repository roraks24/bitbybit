'use client';
import { Check, Lock, Clock, Loader2, DollarSign, AlertCircle } from 'lucide-react';
import { StatusBadge } from '@/components/ui';

const iconMap = {
  locked: Lock,
  active: Clock,
  submitted: Loader2,
  ai_reviewing: Loader2,
  approved: Check,
  paid: DollarSign,
  rejected: AlertCircle,
};

export default function MilestoneTimeline({ milestones = [], onMilestoneClick }) {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-5 top-5 bottom-5 w-px bg-gradient-to-b from-cyan-500/40 via-cyan-500/10 to-transparent" />

      <div className="space-y-3">
        {milestones.map((m, i) => {
          const Icon = iconMap[m.status] || Clock;
          const isActive = ['active', 'submitted', 'ai_reviewing'].includes(m.status);
          const isDone = ['approved', 'paid'].includes(m.status);
          const isLocked = m.status === 'locked';
          const completedItems = m.checklist?.filter((c) => c.completed).length || 0;
          const totalItems = m.checklist?.length || 0;

          return (
            <div
              key={m._id}
              onClick={() => !isLocked && onMilestoneClick?.(m)}
              className={`relative flex gap-4 p-4 rounded-xl border transition-all duration-200 
                ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${isActive ? 'border-cyan-500/30 bg-cyan-500/5 hover:border-cyan-500/50' : ''}
                ${isDone ? 'border-emerald-500/20 bg-emerald-500/3' : ''}
                ${isLocked ? 'border-slate-800 bg-transparent' : ''}
                ${m.status === 'rejected' ? 'border-red-500/20 bg-red-500/3' : ''}
              `}
            >
              {/* Icon */}
              <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border
                ${isDone ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : ''}
                ${isActive ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' : ''}
                ${isLocked ? 'bg-slate-800 border-slate-700 text-slate-600' : ''}
                ${m.status === 'rejected' ? 'bg-red-500/20 border-red-500/40 text-red-400' : ''}
              `}>
                <Icon className={`w-4 h-4 ${['submitted', 'ai_reviewing'].includes(m.status) ? 'animate-spin' : ''}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-600">M{i + 1}</span>
                    <h3 className={`font-semibold text-sm ${isLocked ? 'text-slate-600' : 'text-slate-200'}`}>
                      {m.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={m.status} />
                    <span className="text-xs font-mono text-emerald-400 font-semibold">${m.paymentAmount?.toLocaleString()}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-1 line-clamp-1">{m.description}</p>

                <div className="flex items-center gap-4 mt-2">
                  {totalItems > 0 && (
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 w-20 bg-slate-800 rounded-full h-1">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500"
                          style={{ width: `${(completedItems / totalItems) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">{completedItems}/{totalItems}</span>
                    </div>
                  )}
                  {m.deadline && (
                    <span className="text-[10px] font-mono text-slate-600">
                      Due {new Date(m.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  {m.aiScore !== null && m.aiScore !== undefined && (
                    <span className="text-[10px] font-mono text-violet-400">
                      AI: {Math.round(m.aiScore * 100)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
