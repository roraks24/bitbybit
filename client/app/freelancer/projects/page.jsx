'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderKanban, ArrowRight, Clock, CheckSquare, CalendarClock, AlertTriangle } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { GlassCard, StatusBadge, EmptyState, Spinner, ProgressBar } from '@/components/ui';
import { AuthProvider } from '@/lib/auth';
import api from '@/lib/api';

function getDeadlineInfo(deadline) {
  if (!deadline) return null;
  const now = new Date();
  const dl = new Date(deadline);
  const diffDays = Math.ceil((dl - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: 'OVERDUE', color: 'red', days: diffDays };
  if (diffDays <= 3) return { label: `${diffDays} days left`, color: 'amber', days: diffDays };
  return { label: `${diffDays} days left`, color: 'emerald', days: diffDays };
}

function FreelancerProjectsContent() {
  const [projects, setProjects] = useState([]);
  const [milestonesMap, setMilestonesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/projects');
        setProjects(res.data.projects);
        const map = {};
        await Promise.all(
          res.data.projects.map(async (p) => {
            const m = await api.get(`/milestones/${p._id}`);
            map[p._id] = m.data.milestones;
          })
        );
        setMilestonesMap(map);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100">My Projects</h1>
          <p className="text-sm text-slate-500 font-mono mt-0.5">All projects assigned to you</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : projects.length === 0 ? (
          <GlassCard>
            <EmptyState icon={FolderKanban} title="No projects yet" desc="Employers will assign you to projects" />
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => {
              const milestones = milestonesMap[project._id] || [];
              const active = milestones.find((m) => m.status === 'active');
              const paid = milestones.filter((m) => m.status === 'paid').length;
              const dlInfo = getDeadlineInfo(project.deadline);
              return (
                <div
                  key={project._id}
                  className="glass-card glass-card-hover rounded-xl p-5 cursor-pointer"
                  onClick={() => active
                    ? router.push(`/milestone/${active._id}`)
                    : router.push(`/freelancer/projects/${project._id}`)
                  }
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-200 text-sm">{project.title}</h3>
                        <StatusBadge status={project.status} />
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">{project.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold font-mono text-emerald-400">${project.totalFunds?.toLocaleString()}</p>
                      <p className="text-[10px] font-mono text-slate-600">total value</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-600">
                      <span>MILESTONES</span>
                      <span className="text-cyan-500">{paid}/{milestones.length} COMPLETE</span>
                    </div>
                    <ProgressBar value={paid} max={milestones.length || 1} />
                  </div>

                  {active && (
                    <div className="mt-3 flex items-center justify-between p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/15">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-xs font-mono text-cyan-400">Active: {active.title}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
                        Submit work <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  )}

                  {/* Deadline warning */}
                  {dlInfo && (
                    <div className={`mt-3 flex items-center gap-2 p-3 rounded-lg border ${
                      dlInfo.color === 'red'
                        ? 'bg-red-500/5 border-red-500/20'
                        : dlInfo.color === 'amber'
                        ? 'bg-amber-500/5 border-amber-500/20'
                        : 'bg-emerald-500/5 border-emerald-500/20'
                    }`}>
                      {dlInfo.color === 'red' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                      ) : (
                        <CalendarClock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      )}
                      <span className={`text-xs font-mono font-semibold ${
                        dlInfo.color === 'red' ? 'text-red-400' :
                        dlInfo.color === 'amber' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {dlInfo.label}
                      </span>
                      <span className="text-[10px] font-mono text-slate-600 ml-auto">
                        Due {new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function FreelancerProjectsPage() {
  return <AuthProvider><FreelancerProjectsContent /></AuthProvider>;
}
