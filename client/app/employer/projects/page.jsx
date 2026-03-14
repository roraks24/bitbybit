'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, FolderKanban, Search } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProjectCard from '@/components/dashboard/ProjectCard';
import { GlassCard, EmptyState, Spinner } from '@/components/ui';
import { AuthProvider } from '@/lib/auth';
import api from '@/lib/api';

function EmployerProjectsContent() {
  const [projects, setProjects] = useState([]);
  const [milestonesMap, setMilestonesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/projects');
        setProjects(res.data.projects);
        const map = {};
        await Promise.all(
          res.data.projects.map(async (p) => {
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

  const filtered = projects
    .filter((p) => filter === 'all' || p.status === filter)
    .filter((p) => !search || p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-100">Projects</h1>
            <p className="text-sm text-slate-500 font-mono mt-0.5">{projects.length} total projects</p>
          </div>
          <Link href="/employer/projects/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Project
          </Link>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="input-quantum pl-9 w-48 h-9 text-xs"
            />
          </div>
          <div className="flex items-center gap-1">
            {['all', 'pending', 'active', 'completed', 'cancelled'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-mono transition-all
                  ${filter === s ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-600 hover:text-slate-400'}`}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <GlassCard>
            <EmptyState icon={FolderKanban} title="No projects found" desc={search ? 'Try a different search' : 'Create your first project'} />
          </GlassCard>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <ProjectCard key={p._id} project={p} milestones={milestonesMap[p._id] || []} role="employer" onDelete={handleDeleteProject} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function EmployerProjectsPage() {
  return <AuthProvider><EmployerProjectsContent /></AuthProvider>;
}
