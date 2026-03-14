'use client';
import { useEffect, useState } from 'react';
import { Wallet, TrendingUp, CheckCircle2, Clock, Shield, Bot } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { GlassCard, StatusBadge, Spinner, MetricCard } from '@/components/ui';
import { AuthProvider, useAuth } from '@/lib/auth';
import api from '@/lib/api';

function EarningsContent() {
  const { user } = useAuth();
  const [pfiData, setPfiData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?._id) return;
      try {
        const res = await api.get(`/pfi/${user._id}`);
        setPfiData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?._id]);

  const score = pfiData?.pfiScore || user?.pfiScore || 600;
  const stats = pfiData?.stats || {};

  // Score color based on range
  const scoreColor =
    score >= 750 ? 'text-emerald-400' :
    score >= 650 ? 'text-cyan-400' :
    score >= 550 ? 'text-amber-400' : 'text-red-400';

  const scoreLabel =
    score >= 750 ? 'Exceptional' :
    score >= 650 ? 'Professional' :
    score >= 550 ? 'Reliable' :
    score >= 450 ? 'Developing' : 'New';

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100">Earnings & Reputation</h1>
          <p className="text-sm text-slate-500 font-mono mt-0.5">Track your payments and Professional Fidelity Index</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : (
          <>
            {/* PFI Hero */}
            <GlassCard className="relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none opacity-10"
                style={{ background: 'radial-gradient(circle at 30% 50%, #06b6d4, transparent 60%)' }} />
              <div className="relative grid md:grid-cols-2 gap-6 items-center">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-mono text-slate-500 tracking-widest uppercase">Professional Fidelity Index</span>
                  </div>
                  <div className="flex items-end gap-3">
                    <span className={`text-7xl font-display font-black ${scoreColor}`}>{score}</span>
                    <div className="pb-2">
                      <span className={`text-sm font-semibold ${scoreColor}`}>{scoreLabel}</span>
                      <p className="text-[10px] font-mono text-slate-600">300 – 850 scale</p>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div className="mt-4">
                    <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${((score - 300) / 550) * 100}%`,
                          background: 'linear-gradient(90deg, #ef4444 0%, #f59e0b 35%, #06b6d4 65%, #10b981 100%)',
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-mono text-slate-700 mt-1 px-0.5">
                      <span>300 — Poor</span>
                      <span>550 — Fair</span>
                      <span>700 — Good</span>
                      <span>850 — Elite</span>
                    </div>
                  </div>
                </div>

                {/* Score breakdown */}
                <div className="space-y-3">
                  {[
                    {
                      label: 'Completion Rate',
                      value: `${stats.completionRate ?? 0}%`,
                      sub: `${stats.completedMilestones ?? 0} of ${stats.totalMilestones ?? 0} milestones`,
                      icon: CheckCircle2,
                      weight: '40%',
                      color: 'emerald',
                    },
                    {
                      label: 'On-Time Delivery',
                      value: `${stats.onTimeRate ?? 0}%`,
                      sub: 'Deadline adherence',
                      icon: Clock,
                      weight: '25%',
                      color: 'cyan',
                    },
                    {
                      label: 'AI Quality Score',
                      value: `${stats.avgAiScore ?? 0}%`,
                      sub: 'Average confidence score',
                      icon: Bot,
                      weight: '35%',
                      color: 'violet',
                    },
                  ].map(({ label, value, sub, icon: Icon, weight, color }) => (
                    <div key={label} className={`flex items-center gap-3 p-3 rounded-lg bg-${color}-500/5 border border-${color}-500/10`}>
                      <div className={`w-8 h-8 rounded-lg bg-${color}-500/10 flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-4 h-4 text-${color}-400`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-slate-300">{label}</p>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold font-mono text-${color}-400`}>{value}</span>
                            <span className="text-[10px] font-mono text-slate-700">×{weight}</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-600 font-mono mt-0.5">{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label="Total Milestones" value={stats.totalMilestones ?? 0} sub="Across all projects" icon={CheckCircle2} color="cyan" />
              <MetricCard label="Completed" value={stats.completedMilestones ?? 0} sub="Successfully paid" icon={Wallet} color="emerald" />
              <MetricCard label="Completion %" value={`${stats.completionRate ?? 0}%`} sub="Success rate" icon={TrendingUp} color="violet" />
              <MetricCard label="On-Time %" value={`${stats.onTimeRate ?? 0}%`} sub="Deadline adherence" icon={Clock} color="amber" />
            </div>

            {/* Recent submissions */}
            {pfiData?.recentSubmissions?.length > 0 && (
              <GlassCard>
                <h3 className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-4">Recent AI Evaluations</h3>
                <div className="space-y-2">
                  {pfiData.recentSubmissions.map((sub) => {
                    const score = sub.aiScore;
                    const color = score >= 0.8 ? 'emerald' : score >= 0.5 ? 'amber' : 'red';
                    return (
                      <div key={sub._id} className="flex items-center justify-between py-2.5 px-3 rounded-lg border border-slate-800 bg-slate-900/40">
                        <div className="flex items-center gap-3">
                          <Bot className={`w-4 h-4 text-${color}-400`} />
                          <span className="text-xs font-mono text-slate-400">
                            {new Date(sub.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-800 rounded-full h-1">
                            <div
                              className={`h-full rounded-full bg-${color}-500`}
                              style={{ width: `${score * 100}%` }}
                            />
                          </div>
                          <span className={`text-sm font-bold font-mono text-${color}-400 w-10 text-right`}>
                            {Math.round(score * 100)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            )}

            {/* PFI tiers reference */}
            <GlassCard>
              <h3 className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-4">PFI Score Reference</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {[
                  { range: '750–850', label: 'Exceptional', color: 'emerald', desc: 'Top 5% of freelancers' },
                  { range: '650–749', label: 'Professional', color: 'cyan', desc: 'Consistent performer' },
                  { range: '550–649', label: 'Reliable', color: 'blue', desc: 'Solid track record' },
                  { range: '450–549', label: 'Developing', color: 'amber', desc: 'Building reputation' },
                  { range: '300–449', label: 'New', color: 'slate', desc: 'Getting started' },
                ].map(({ range, label, color, desc }) => (
                  <div key={range} className={`p-3 rounded-lg border border-${color}-500/15 bg-${color}-500/5 text-center`}>
                    <p className={`text-xs font-bold font-mono text-${color}-400`}>{range}</p>
                    <p className={`text-[11px] font-semibold text-${color}-300 mt-0.5`}>{label}</p>
                    <p className="text-[10px] text-slate-600 mt-1">{desc}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function EarningsPage() {
  return <AuthProvider><EarningsContent /></AuthProvider>;
}
