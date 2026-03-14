'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Wallet, Bot, Users, DollarSign, Loader2, CheckCircle2, AlertTriangle, Lock, Unlock, CalendarClock } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MilestoneTimeline from '@/components/dashboard/MilestoneTimeline';
import { GlassCard, StatusBadge, Spinner, ProgressBar } from '@/components/ui';
import { AuthProvider } from '@/lib/auth';
import api from '@/lib/api';

function getDeadlineDisplay(deadline) {
  if (!deadline) return { text: '—', color: 'slate' };
  const now = new Date();
  const dl = new Date(deadline);
  const diffDays = Math.ceil((dl - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { text: 'OVERDUE', color: 'red' };
  if (diffDays <= 3) return { text: `${diffDays}d left`, color: 'amber' };
  return { text: `${diffDays}d left`, color: 'emerald' };
}

function ProjectDetailContent() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositing, setDepositing] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);

  const load = async () => {
    try {
      const res = await api.get(`/projects/${id}`);
      setProject(res.data.project);
      setMilestones(res.data.milestones);

      // Load submissions for submitted milestones
      const subMap = {};
      await Promise.all(
        res.data.milestones
          .filter((m) => ['submitted', 'ai_reviewing', 'approved', 'paid', 'rejected'].includes(m.status))
          .map(async (m) => {
            const s = await api.get(`/submissions/${m._id}`);
            subMap[m._id] = s.data.submissions;
          })
      );
      setSubmissions(subMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleDeposit = async () => {
    if (!depositAmount) return;
    setDepositing(true);
    try {
      await api.post('/escrow/deposit', { projectId: id, amount: parseFloat(depositAmount) });
      setDepositAmount('');
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Deposit failed');
    } finally {
      setDepositing(false);
    }
  };

  if (loading) return <DashboardLayout><div className="flex justify-center py-20"><Spinner size="lg" /></div></DashboardLayout>;
  if (!project) return <DashboardLayout><p className="text-slate-500 font-mono">Project not found</p></DashboardLayout>;

  const paid = milestones.filter((m) => ['paid', 'approved'].includes(m.status)).length;
  const total = milestones.length;
  const dlDisplay = getDeadlineDisplay(project.deadline);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-display font-bold text-slate-100">{project.title}</h1>
              <StatusBadge status={project.status} />
            </div>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xl">{project.description}</p>
            {project.techStack?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {project.techStack.map((t) => (
                  <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/8 text-cyan-600 border border-cyan-500/10">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Budget', value: `$${project.totalFunds?.toLocaleString()}`, icon: DollarSign, color: 'cyan' },
            { label: 'Escrow Balance', value: `$${project.escrowBalance?.toLocaleString()}`, icon: Lock, color: 'emerald' },
            { label: 'Milestones', value: `${paid}/${total}`, icon: CheckCircle2, color: 'violet' },
            { label: 'AI Verified', value: milestones.filter((m) => m.aiScore !== null).length, icon: Bot, color: 'amber' },
            { label: 'Deadline', value: dlDisplay.text, icon: CalendarClock, color: dlDisplay.color },
          ].map(({ label, value, icon: Icon, color }) => (
            <GlassCard key={label} className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 text-${color}-400`} />
                </div>
                <div>
                  <p className="text-[10px] font-mono text-slate-600 tracking-widest uppercase">{label}</p>
                  <p className={`text-lg font-bold text-${color}-400 font-mono`}>{value}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Progress */}
        {total > 0 && (
          <GlassCard className="p-4">
            <div className="flex justify-between text-xs font-mono text-slate-500 mb-2">
              <span>OVERALL PROGRESS</span>
              <span className="text-cyan-400">{Math.round((paid / total) * 100)}%</span>
            </div>
            <ProgressBar value={paid} max={total} />
          </GlassCard>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Milestones */}
          <div className="lg:col-span-2">
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-mono text-slate-400 tracking-widest uppercase">Milestones</h2>
                {project.aiAnalysisComplete && (
                  <div className="flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-cyan-500" />
                    <span className="text-[10px] font-mono text-cyan-500">AI GENERATED</span>
                  </div>
                )}
              </div>
              <MilestoneTimeline
                milestones={milestones}
                onMilestoneClick={setSelectedMilestone}
              />
            </GlassCard>
          </div>

          {/* Right panel */}
          <div className="space-y-4">
            {/* Escrow deposit */}
            <GlassCard>
              <h3 className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-3">Deposit to Escrow</h3>
              <div className="relative mb-3">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="input-quantum pl-10 text-sm"
                  placeholder="Amount"
                  min="1"
                />
              </div>
              <button
                onClick={handleDeposit}
                disabled={!depositAmount || depositing}
                className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
              >
                {depositing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlock className="w-3.5 h-3.5" />}
                Deposit Funds
              </button>
            </GlassCard>

            {/* Selected milestone submissions */}
            {selectedMilestone && submissions[selectedMilestone._id]?.length > 0 && (
              <GlassCard>
                <h3 className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-3">
                  Submissions — {selectedMilestone.title}
                </h3>
                {submissions[selectedMilestone._id].map((sub) => (
                  <div key={sub._id} className="p-3 rounded-lg border border-slate-800 bg-slate-900/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <StatusBadge status={sub.status} />
                      {sub.aiScore !== null && (
                        <span className={`text-xs font-mono font-bold ${
                          sub.aiScore >= 0.8 ? 'text-emerald-400' :
                          sub.aiScore >= 0.5 ? 'text-amber-400' : 'text-red-400'
                        }`}>
                          AI: {Math.round(sub.aiScore * 100)}%
                        </span>
                      )}
                    </div>
                    {sub.repoLink && (
                      <a href={sub.repoLink} target="_blank" rel="noopener noreferrer"
                        className="text-xs font-mono text-cyan-500 hover:text-cyan-400 truncate block">
                        {sub.repoLink}
                      </a>
                    )}
                    {sub.aiAnalysis && (
                      <p className="text-[11px] text-slate-500 leading-relaxed">{sub.aiAnalysis}</p>
                    )}
                    {sub.paymentReleased && (
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        ${sub.paymentAmount?.toLocaleString()} released
                      </div>
                    )}
                  </div>
                ))}
              </GlassCard>
            )}

            {/* Freelancer info */}
            {project.freelancerId && (
              <GlassCard>
                <h3 className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-3">Freelancer</h3>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <Users className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-300">{project.freelancerId.name}</p>
                    <p className="text-xs font-mono text-cyan-400">PFI {project.freelancerId.pfiScore}</p>
                  </div>
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function ProjectDetailPage() {
  return <AuthProvider><ProjectDetailContent /></AuthProvider>;
}
