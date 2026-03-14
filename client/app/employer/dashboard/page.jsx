'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, FolderKanban, Wallet, TrendingUp, Bot, ArrowRight, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProjectCard from '@/components/dashboard/ProjectCard';
import { MetricCard, GlassCard, EmptyState, Spinner } from '@/components/ui';
import { AuthProvider, useAuth } from '@/lib/auth';
import api from '@/lib/api';

function EmployerDashboardContent() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [milestonesMap, setMilestonesMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/projects');
        setProjects(res.data.projects);

        // Fetch milestones for each project
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
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDeleteProject = async (id) => {
    try {
      await api.delete(`/projects/${id}`);
      setProjects((prev) => prev.filter((p) => p._id !== id));
      // Optional: clean up the milestones map
      setMilestonesMap((prev) => {
        const newMap = { ...prev };
        delete newMap[id];
        return newMap;
      });
    } catch (err) {
      console.error('Failed to delete project:', err);
      alert('Could not delete project: ' + (err.response?.data?.error || err.message));
    }
  };

  const totalEscrow = projects.reduce((s, p) => s + (p.escrowBalance || 0), 0);
  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const completedProjects = projects.filter((p) => p.status === 'completed').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-100">
              Good morning, <span className="text-cyan-400">{user?.name?.split(' ')[0]}</span>
            </h1>
            <p className="text-sm text-slate-500 font-mono mt-0.5">Your autonomous project dashboard</p>
          </div>
          <Link href="/employer/projects/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Project
          </Link>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total Projects"
            value={projects.length}
            sub={`${activeProjects} active`}
            icon={FolderKanban}
            color="cyan"
          />
          <MetricCard
            label="Escrow Balance"
            value={`$${totalEscrow.toLocaleString()}`}
            sub="Locked in escrow"
            icon={Wallet}
            color="emerald"
          />
          <MetricCard
            label="Completed"
            value={completedProjects}
            sub="Projects finished"
            icon={TrendingUp}
            color="violet"
          />
          <MetricCard
            label="AI Verifications"
            value={Object.values(milestonesMap).flat().filter((m) => m.aiScore !== null).length}
            sub="Milestones reviewed"
            icon={Bot}
            color="amber"
          />
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { href: '/employer/projects/new', icon: Bot, label: 'Create AI Project', desc: 'Let AI generate milestones', color: 'cyan' },
            { href: '/employer/projects', icon: FolderKanban, label: 'View All Projects', desc: 'Manage your portfolio', color: 'violet' },
            { href: '/employer/escrow', icon: Wallet, label: 'Escrow Manager', desc: 'Deposit & track funds', color: 'emerald' },
          ].map(({ href, icon: Icon, label, desc, color }) => (
            <Link key={href} href={href}>
              <div className="glass-card glass-card-hover rounded-xl p-4 flex items-center gap-4 cursor-pointer group">
                <div className={`w-10 h-10 rounded-lg bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 text-${color}-400`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-300 group-hover:text-slate-100 transition-colors">{label}</p>
                  <p className="text-xs font-mono text-slate-600">{desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-cyan-500 transition-colors" />
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Projects */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-mono text-slate-400 tracking-widest uppercase">Recent Projects</h2>
            <Link href="/employer/projects" className="text-xs font-mono text-cyan-500 hover:text-cyan-400 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : projects.length === 0 ? (
            <GlassCard>
              <EmptyState
                icon={FolderKanban}
                title="No projects yet"
                desc="Create your first AI-powered project"
              />
              <div className="flex justify-center mt-4">
                <Link href="/employer/projects/new" className="btn-primary text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Create Project
                </Link>
              </div>
            </GlassCard>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {projects.slice(0, 6).map((p) => (
                <ProjectCard key={p._id} project={p} milestones={milestonesMap[p._id] || []} role="employer" onDelete={handleDeleteProject} />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function EmployerDashboard() {
  return <AuthProvider><EmployerDashboardContent /></AuthProvider>;
}
