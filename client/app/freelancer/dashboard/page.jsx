'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shield, FolderKanban, Wallet, TrendingUp, ArrowRight } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProjectCard from '@/components/dashboard/ProjectCard';
import { MetricCard, GlassCard, EmptyState, Spinner } from '@/components/ui';
import { AuthProvider, useAuth } from '@/lib/auth';
import api from '@/lib/api';

function PFIGauge({ score = 0 }) {
  const pct = (score / 850) * 100;
  const color = score >= 750 ? '#10b981' : score >= 600 ? 'var(--cyan)' : score >= 400 ? '#f59e0b' : score >= 200 ? '#fb923c' : 'var(--text-muted)';
  const label = score >= 750 ? 'Exceptional' : score >= 600 ? 'Professional' : score >= 400 ? 'Reliable' : score >= 200 ? 'Developing' : 'New';

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Professional Fidelity Index</h3>
        <Shield className="w-4 h-4" style={{ color: 'var(--cyan)' }} />
      </div>
      <div className="flex items-end gap-4">
        <div>
          <div className="text-5xl font-display font-black" style={{ color }}>{score}</div>
          <div className="text-xs mt-0.5" style={{ color }}>{label}</div>
        </div>
        <div className="flex-1 pb-1">
          <div className="relative h-3 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${pct}%`, background: `linear-gradient(90deg, #ef4444, #f59e0b, var(--cyan), ${color})` }}
            />
          </div>
          <div className="flex justify-between text-[9px] mt-1" style={{ color: 'var(--text-muted)' }}>
            <span>0</span><span>300</span><span>600</span><span>850</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-4 pt-4" style={{ borderTop: '1px solid var(--divider)' }}>
        {[
          { label: 'Completion', value: '—' },
          { label: 'On-Time', value: '—' },
          { label: 'AI Score', value: '—' },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <p className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>{value}</p>
            <p className="text-[9px] mt-0.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function FreelancerDashboardContent() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [milestonesMap, setMilestonesMap] = useState({});
  const [pfiData, setPfiData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/projects');
        setProjects(res.data.projects);

        const map = {};
        await Promise.all(
          res.data.projects.slice(0, 6).map(async (p) => {
            try {
              const m = await api.get(`/milestones/${p._id}`);
              map[p._id] = m.data.milestones;
            } catch {}
          })
        );
        setMilestonesMap(map);

        if (user?._id) {
          try {
            const pfi = await api.get(`/pfi/${user._id}`);
            setPfiData(pfi.data);
          } catch {}
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?._id]);

  const allMilestones = Object.values(milestonesMap).flat();
  const activeMilestones = allMilestones.filter((m) => m.status === 'active').length;
  const paidMilestones = allMilestones.filter((m) => m.status === 'paid').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--text-main)' }}>
            Welcome, <span style={{ color: 'var(--cyan)' }}>{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Your freelance command center</p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Projects" value={projects.length} sub="Total assigned" icon={FolderKanban} color="cyan" />
          <MetricCard label="Active Tasks" value={activeMilestones} sub="Open milestones" icon={TrendingUp} color="emerald" />
          <MetricCard label="Completed" value={paidMilestones} sub="Paid milestones" icon={Wallet} color="violet" />
          <MetricCard label="PFI Score" value={user?.pfiScore ?? 0} sub="Your reputation" icon={Shield} color="amber" />
        </div>

        {/* PFI */}
        <PFIGauge score={pfiData?.pfiScore ?? user?.pfiScore ?? 0} />

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { href: '/freelancer/find-work', icon: FolderKanban, label: 'Find Work', desc: 'Browse available projects' },
            { href: '/freelancer/earnings', icon: Wallet, label: 'Earnings', desc: 'Track your income' },
          ].map(({ href, icon: Icon, label, desc }) => (
            <Link key={href} href={href}>
              <div className="glass-card glass-card-hover rounded-xl p-4 flex items-center gap-4 cursor-pointer group">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--cyan-dim)', border: '1px solid var(--card-border)' }}>
                  <Icon className="w-5 h-5" style={{ color: 'var(--cyan)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold transition-colors" style={{ color: 'var(--text-main)' }}>{label}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 transition-colors" style={{ color: 'var(--text-muted)' }} />
              </div>
            </Link>
          ))}
        </div>

        {/* Projects */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>My Projects</h2>
            <Link href="/freelancer/projects" className="text-xs flex items-center gap-1" style={{ color: 'var(--cyan)' }}>
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : projects.length === 0 ? (
            <GlassCard>
              <EmptyState icon={FolderKanban} title="No projects assigned" desc="Wait for employers to assign you to a project" />
            </GlassCard>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {projects.slice(0, 6).map((p) => (
                <ProjectCard key={p._id} project={p} milestones={milestonesMap[p._id] || []} role="freelancer" />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function FreelancerDashboard() {
  return <AuthProvider><FreelancerDashboardContent /></AuthProvider>;
}
