'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, FolderKanban } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProjectCard from '@/components/dashboard/ProjectCard';
import { GlassCard, EmptyState, Spinner } from '@/components/ui';
import { AuthProvider } from '@/lib/auth';
import api from '@/lib/api';

function FindWorkContent() {
  const [projects, setProjects] = useState([]);
  const [milestonesMap, setMilestonesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/projects');
        // We only want to show projects that are unassigned and open to work
        const openProjects = res.data.projects.filter(p => p.status === 'pending' && !p.freelancerId);
        setProjects(openProjects);

        const map = {};
        await Promise.all(
          openProjects.map(async (p) => {
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

  const filtered = projects.filter((p) => !search || p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-100">Find Work</h1>
            <p className="text-sm text-slate-500 font-mono mt-0.5">{projects.length} open projects available</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search available projects..."
              className="input-quantum has-icon w-64 h-9 text-xs"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <GlassCard>
            <EmptyState icon={FolderKanban} title="No open projects" desc={search ? 'Try a different search' : 'Check back later for new opportunities'} />
          </GlassCard>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <ProjectCard key={p._id} project={p} milestones={milestonesMap[p._id] || []} role="freelancer" />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function FindWorkPage() {
  return <AuthProvider><FindWorkContent /></AuthProvider>;
}
