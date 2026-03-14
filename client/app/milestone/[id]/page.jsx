'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Github, Link2, FileText, Bot, Send, CheckSquare, Square, Loader2, AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { GlassCard, StatusBadge, Spinner } from '@/components/ui';
import { AuthProvider, useAuth } from '@/lib/auth';
import api from '@/lib/api';

function VerdictDisplay({ submission }) {
  if (!submission) return null;
  const { aiVerdict, aiScore, aiAnalysis } = submission;
  if (submission.status === 'ai_reviewing') {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-violet-500/8 border border-violet-500/20">
        <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
        <div>
          <p className="text-sm font-semibold text-violet-400">AI Agent Reviewing</p>
          <p className="text-xs font-mono text-slate-500">Quality verification in progress...</p>
        </div>
      </div>
    );
  }
  if (!aiVerdict) return null;

  const configs = {
    COMPLETE: { icon: CheckCircle2, color: 'emerald', label: 'Complete' },
    PARTIAL: { icon: AlertCircle, color: 'amber', label: 'Partial' },
    FAILED: { icon: XCircle, color: 'red', label: 'Failed' },
  };
  const cfg = configs[aiVerdict] || configs.PARTIAL;
  const Icon = cfg.icon;

  return (
    <div className={`p-4 rounded-xl border bg-${cfg.color}-500/8 border-${cfg.color}-500/20`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 text-${cfg.color}-400`} />
          <p className={`text-sm font-semibold text-${cfg.color}-400`}>AI Verdict: {cfg.label}</p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-display font-bold text-${cfg.color}-400`}>{Math.round(aiScore * 100)}%</p>
          <p className="text-[10px] font-mono text-slate-600">CONFIDENCE</p>
        </div>
      </div>
      {aiAnalysis && <p className="text-xs text-slate-400 leading-relaxed">{aiAnalysis}</p>}
    </div>
  );
}

function MilestoneContent() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [milestone, setMilestone] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ repoLink: '', deployLink: '', notes: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    try {
      const res = await api.get(`/milestones/single/${id}`);
      setMilestone(res.data.milestone);
      const sub = await api.get(`/submissions/${id}`);
      setSubmissions(sub.data.submissions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  // Poll if AI reviewing
  useEffect(() => {
    const latest = submissions[0];
    if (latest?.status === 'ai_reviewing') {
      const timer = setInterval(load, 4000);
      return () => clearInterval(timer);
    }
  }, [submissions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/submissions', {
        milestoneId: id,
        repoLink: form.repoLink,
        deployLink: form.deployLink,
        notes: form.notes,
      });
      setSuccess('Submission received! AI is evaluating your work...');
      setForm({ repoLink: '', deployLink: '', notes: '' });
      setTimeout(load, 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <DashboardLayout><div className="flex justify-center py-20"><Spinner size="lg" /></div></DashboardLayout>;
  if (!milestone) return <DashboardLayout><p className="text-slate-500 font-mono">Milestone not found</p></DashboardLayout>;

  const project = milestone.projectId;
  const completedItems = milestone.checklist?.filter((c) => c.completed).length || 0;
  const latestSub = submissions[0];
  const canSubmit = user?.role === 'freelancer' && ['active', 'rejected'].includes(milestone.status);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-600 mb-2">
            <span>{project?.title}</span>
            <span>/</span>
            <span className="text-slate-400">{milestone.title}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-bold text-slate-100">{milestone.title}</h1>
            <StatusBadge status={milestone.status} />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: milestone info */}
          <div className="lg:col-span-2 space-y-4">
            {/* Description */}
            <GlassCard>
              <h3 className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-3">Description</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{milestone.description || 'No description provided.'}</p>
            </GlassCard>

            {/* Checklist */}
            {milestone.checklist?.length > 0 && (
              <GlassCard>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-mono text-slate-500 tracking-widest uppercase">Deliverable Checklist</h3>
                  <span className="text-[11px] font-mono text-cyan-500">{completedItems}/{milestone.checklist.length}</span>
                </div>
                <div className="space-y-2">
                  {milestone.checklist.map((item, i) => (
                    <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all
                      ${item.completed ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-slate-800 bg-slate-900/30'}
                    `}>
                      {item.completed
                        ? <CheckSquare className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        : <Square className="w-4 h-4 text-slate-600 flex-shrink-0" />
                      }
                      <span className={`text-sm ${item.completed ? 'text-slate-300' : 'text-slate-500'}`}>{item.item}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* AI Verdict */}
            {latestSub && <VerdictDisplay submission={latestSub} />}

            {/* Submission form */}
            {canSubmit && (
              <GlassCard>
                <div className="flex items-center gap-2 mb-4">
                  <Send className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-slate-200">Submit Your Work</h3>
                </div>

                {success && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mb-4">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <p className="text-xs font-mono text-emerald-400">{success}</p>
                  </div>
                )}
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <p className="text-xs font-mono text-red-400">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-500 mb-1.5 tracking-widest uppercase">
                      GitHub Repository *
                    </label>
                    <div className="relative">
                      <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                      <input
                        type="url"
                        value={form.repoLink}
                        onChange={(e) => setForm({ ...form, repoLink: e.target.value })}
                        className="input-quantum pl-10"
                        placeholder="https://github.com/username/repo"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-500 mb-1.5 tracking-widest uppercase">
                      Live Demo URL
                    </label>
                    <div className="relative">
                      <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                      <input
                        type="url"
                        value={form.deployLink}
                        onChange={(e) => setForm({ ...form, deployLink: e.target.value })}
                        className="input-quantum pl-10"
                        placeholder="https://your-demo.vercel.app"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-500 mb-1.5 tracking-widest uppercase">
                      Notes for AI Reviewer
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
                      <textarea
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        className="input-quantum pl-10 min-h-[100px] resize-none"
                        placeholder="Describe what you built, any known limitations, testing instructions..."
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-violet-500/5 border border-violet-500/15">
                    <Bot className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Your submission will be evaluated by GPT-4o. Based on the confidence score, 
                      payment will be released automatically — full, partial, or refunded.
                    </p>
                  </div>

                  <button type="submit" disabled={submitting || (!form.repoLink && !form.notes)} className="btn-primary w-full flex items-center justify-center gap-2">
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Send className="w-4 h-4" /> Submit for AI Review</>}
                  </button>
                </form>
              </GlassCard>
            )}
          </div>

          {/* Right: payment & deadline */}
          <div className="space-y-4">
            <GlassCard>
              <h3 className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-4">Payment Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-mono text-slate-600 mb-0.5">MILESTONE VALUE</p>
                  <p className="text-3xl font-display font-bold text-emerald-400">${milestone.paymentAmount?.toLocaleString()}</p>
                </div>
                <div className="h-px bg-slate-800" />
                <div>
                  <p className="text-[10px] font-mono text-slate-600 mb-0.5">DEADLINE</p>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <p className="text-sm font-mono text-amber-400">
                      {new Date(milestone.deadline).toLocaleDateString('en-US', {
                        month: 'long', day: 'numeric', year: 'numeric'
                      })}
                    </p>
                  </div>
                  <p className="text-[10px] font-mono text-slate-600 mt-0.5">
                    {Math.ceil((new Date(milestone.deadline) - new Date()) / (1000 * 60 * 60 * 24))} days remaining
                  </p>
                </div>
                <div className="h-px bg-slate-800" />
                <div>
                  <p className="text-[10px] font-mono text-slate-600 mb-1.5">PAYMENT LOGIC</p>
                  <div className="space-y-1.5 text-[11px] font-mono">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-slate-500">≥80% confidence → Full payment</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="text-slate-500">50–79% → Partial payment</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-400" />
                      <span className="text-slate-500">&lt;50% → Employer refund</span>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Submission history */}
            {submissions.length > 0 && (
              <GlassCard>
                <h3 className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-3">Submission History</h3>
                <div className="space-y-2">
                  {submissions.map((sub, i) => (
                    <div key={sub._id} className="flex items-center justify-between text-xs font-mono py-2 border-b border-slate-800 last:border-0">
                      <div>
                        <StatusBadge status={sub.status} />
                        <p className="text-[10px] text-slate-600 mt-1">
                          {new Date(sub.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      {sub.aiScore !== null && (
                        <span className={`font-bold text-sm ${sub.aiScore >= 0.8 ? 'text-emerald-400' : sub.aiScore >= 0.5 ? 'text-amber-400' : 'text-red-400'}`}>
                          {Math.round(sub.aiScore * 100)}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function MilestonePage() {
  return <AuthProvider><MilestoneContent /></AuthProvider>;
}
