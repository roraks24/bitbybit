'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, Bot, DollarSign, Clock } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MilestoneTimeline from '@/components/dashboard/MilestoneTimeline';
import { GlassCard, StatusBadge, Spinner, ProgressBar } from '@/components/ui';
import { AuthProvider, useAuth } from '@/lib/auth';
import api from '@/lib/api';

function FreelancerProjectContent() {
  const { user } = useAuth();
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/projects/${id}`);
        setProject(res.data.project);
        setMilestones(res.data.milestones);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleMilestoneClick = (m) => {
    router.push(`/milestone/${m._id}`);
  };

  if (loading) return <DashboardLayout><div className="flex justify-center py-20"><Spinner size="lg" /></div></DashboardLayout>;
  if (!project) return <DashboardLayout><p className="text-slate-500 font-mono text-sm">Project not found</p></DashboardLayout>;

  const paid = milestones.filter((m) => m.status === 'paid').length;
  const activeMilestone = milestones.find((m) => m.status === 'active');
  const totalEarned = milestones
    .filter((m) => m.status === 'paid')
    .reduce((s, m) => s + (m.paymentAmount || 0), 0);

  const isUnassigned = project.status === 'pending' && !project.freelancerId;

  const handleAcceptProject = async () => {
    try {
      if (!window.confirm('Are you sure you want to accept this project? You will be held responsible for delivering the milestones.')) return;
      await api.patch(`/projects/${project._id}/assign`, { freelancerId: user._id });
      router.push('/freelancer/dashboard');
    } catch (err) {
      alert('Failed to accept project. It may have already been assigned to someone else.');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-display font-bold text-slate-100">{project.title}</h1>
            <StatusBadge status={project.status} />
          </div>
          <p className="text-sm text-slate-500 leading-relaxed max-w-xl">{project.description}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Value', value: `$${project.totalFunds?.toLocaleString()}`, color: 'cyan', icon: DollarSign },
            { label: 'Earned', value: `$${totalEarned.toLocaleString()}`, color: 'emerald', icon: DollarSign },
            { label: 'Progress', value: `${paid}/${milestones.length}`, color: 'violet', icon: Bot },
            { label: 'Remaining', value: `$${(project.totalFunds - totalEarned).toLocaleString()}`, color: 'amber', icon: Clock },
          ].map(({ label, value, color, icon: Icon }) => (
            <GlassCard key={label} className="p-4">
              <p className="text-[10px] font-mono text-slate-600 tracking-widest uppercase mb-1">{label}</p>
              <p className={`text-xl font-bold font-mono text-${color}-400`}>{value}</p>
            </GlassCard>
          ))}
        </div>

        {/* Progress bar */}
        {milestones.length > 0 && (
          <GlassCard className="p-4">
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-2">
              <span>PROJECT PROGRESS</span>
              <span className="text-cyan-400">{Math.round((paid / milestones.length) * 100)}% COMPLETE</span>
            </div>
            <ProgressBar value={paid} max={milestones.length} />
          </GlassCard>
        )}

        {/* Unassigned Project CTA */}
        {isUnassigned && (
          <div className="flex flex-col md:flex-row items-center justify-between p-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 gap-4">
            <div>
              <p className="text-sm font-semibold text-emerald-400 mb-1">Open for Assignment</p>
              <p className="text-xs text-slate-400 max-w-lg leading-relaxed">This project is currently open. If you have the required skills, you can instantly accept it and begin work. The escrow funds will be locked upon assignment.</p>
            </div>
            <button onClick={handleAcceptProject} className="btn-primary w-full md:w-auto flex items-center justify-center gap-2 whitespace-nowrap bg-emerald-500 hover:bg-emerald-400 text-slate-900 border-none">
              <Bot className="w-4 h-4" /> Accept Project
            </button>
          </div>
        )}

        {/* Active milestone CTA */}
        {!isUnassigned && activeMilestone && (
          <div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 cursor-pointer hover:border-cyan-500/50 transition-all"
            onClick={() => router.push(`/milestone/${activeMilestone._id}`)}
          >
            <div>
              <p className="text-xs font-mono text-cyan-500 mb-0.5 tracking-widest uppercase">Current Task</p>
              <p className="text-sm font-semibold text-slate-200">{activeMilestone.title}</p>
              <p className="text-xs font-mono text-emerald-400 mt-0.5">${activeMilestone.paymentAmount?.toLocaleString()} upon approval</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              Submit work <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* Milestone timeline */}
        <GlassCard>
          <h2 className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-4">Milestone Timeline</h2>
          <MilestoneTimeline milestones={milestones} onMilestoneClick={handleMilestoneClick} />
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}

export default function FreelancerProjectPage() {
  return <AuthProvider><FreelancerProjectContent /></AuthProvider>;
}
