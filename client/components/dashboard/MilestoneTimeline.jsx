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
      <div className="absolute left-5 top-5 bottom-5 w-px"
        style={{ background: 'linear-gradient(to bottom, var(--cyan), var(--divider), transparent)' }} />

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
              `}
              style={{
                borderColor: isActive ? 'var(--badge-paid-border)' :
                  isDone ? 'var(--badge-active-border)' :
                    m.status === 'rejected' ? 'var(--badge-failed-border)' :
                      'var(--card-border)',
                background: isActive ? 'var(--badge-paid-bg)' :
                  isDone ? 'var(--badge-active-bg)' :
                    m.status === 'rejected' ? 'var(--badge-failed-bg)' : 'transparent',
              }}
            >
              {/* Icon */}
              <div className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border"
                style={{
                  background: isDone ? 'var(--badge-active-bg)' :
                    isActive ? 'var(--badge-paid-bg)' :
                      m.status === 'rejected' ? 'var(--badge-failed-bg)' :
                        'var(--bg-secondary)',
                  borderColor: isDone ? 'var(--badge-active-border)' :
                    isActive ? 'var(--badge-paid-border)' :
                      m.status === 'rejected' ? 'var(--badge-failed-border)' :
                        'var(--card-border)',
                  color: isDone ? 'var(--badge-active-text)' :
                    isActive ? 'var(--badge-paid-text)' :
                      m.status === 'rejected' ? 'var(--badge-failed-text)' :
                        'var(--text-muted)',
                }}>
                <Icon className={`w-4 h-4 ${['submitted', 'ai_reviewing'].includes(m.status) ? 'animate-spin' : ''}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>M{i + 1}</span>
                    <h3 className="font-semibold text-sm" style={{ color: isLocked ? 'var(--text-muted)' : 'var(--text-main)' }}>
                      {m.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={m.status} />
                    <span className="text-xs font-semibold" style={{ color: 'var(--badge-active-text)' }}>
                      ${m.paymentAmount?.toLocaleString()}
                    </span>
                  </div>
                </div>

                <p className="text-xs mt-1 line-clamp-1" style={{ color: 'var(--text-muted)' }}>{m.description}</p>

                <div className="flex items-center gap-4 mt-2">
                  {totalItems > 0 && (
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 w-20 rounded-full h-1" style={{ background: 'var(--bg-secondary)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(completedItems / totalItems) * 100}%`,
                            background: 'linear-gradient(90deg, var(--cyan), #7c3aed)',
                          }}
                        />
                      </div>
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{completedItems}/{totalItems}</span>
                    </div>
                  )}
                  {m.deadline && (
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      Due {new Date(m.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  {m.aiScore !== null && m.aiScore !== undefined && (
                    <span className="text-[10px]" style={{ color: 'var(--cyan)' }}>
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
