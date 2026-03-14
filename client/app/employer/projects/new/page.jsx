'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Sparkles, DollarSign, Check, Loader2, AlertCircle, ArrowRight, ChevronRight, CalendarClock } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { GlassCard, StatusBadge, Spinner } from '@/components/ui';
import { AuthProvider } from '@/lib/auth';
import api from '@/lib/api';

const STAGES = ['Details', 'AI Analysis', 'Review & Launch'];

function NewProjectContent() {
  const router = useRouter();
  const [stage, setStage] = useState(0);
  const [form, setForm] = useState({ title: '', description: '', totalFunds: '', deadline: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setStage(1);
    try {
      const res = await api.post('/projects', {
        title: form.title,
        description: form.description,
        totalFunds: parseFloat(form.totalFunds),
        deadline: form.deadline,
      });
      setResult(res.data);
      setStage(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
      setStage(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--text-main)' }}>New Project</h1>
          <p className="text-sm font-mono mt-1" style={{ color: 'var(--text-muted)' }}>AI will automatically generate milestones</p>
        </div>

        {/* Stage indicator */}
        <div className="flex items-center gap-2 flex-wrap">
          {STAGES.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono transition-all border`}
                style={{
                  background: i < stage ? 'rgba(16,185,129,0.1)' : i === stage ? 'var(--cyan-dim)' : 'var(--bg-secondary)',
                  color: i < stage ? '#10b981' : i === stage ? 'var(--cyan)' : 'var(--text-muted)',
                  borderColor: i < stage ? 'rgba(16,185,129,0.2)' : i === stage ? 'var(--card-border)' : 'var(--divider)',
                }}>
                {i < stage ? <Check className="w-3 h-3" /> : <span>{i + 1}</span>}
                {s}
              </div>
              {i < STAGES.length - 1 && <ChevronRight className="w-3 h-3" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />}
            </div>
          ))}
        </div>

        {/* Stage 0: Form */}
        {stage === 0 && (
          <GlassCard>
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-6">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-xs font-mono text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-mono mb-1.5 tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                  Project Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input-quantum"
                  placeholder="e.g. E-commerce Platform with Payment Integration"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono mb-1.5 tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                  Project Description
                </label>
                <p className="text-[11px] font-mono mb-2" style={{ color: 'var(--text-muted)' }}>
                  Be detailed — the AI uses this to generate accurate milestones
                </p>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-quantum min-h-[180px] resize-none leading-relaxed"
                  placeholder="Describe the full scope of work: features, tech stack preferences, deliverables, integrations needed, performance requirements..."
                  required
                  minLength={50}
                />
                <p className="text-[10px] font-mono mt-1" style={{ color: 'var(--text-muted)' }}>{form.description.length} characters</p>
              </div>

              <div>
                <label className="block text-xs font-mono mb-1.5 tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                  Total Budget (USD)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  <input
                    type="number"
                    value={form.totalFunds}
                    onChange={(e) => setForm({ ...form, totalFunds: e.target.value })}
                    className="input-quantum has-icon"
                    placeholder="5000"
                    min="100"
                    required
                  />
                </div>
                <p className="text-[11px] font-mono mt-1" style={{ color: 'var(--text-muted)' }}>
                  AI will distribute this budget across milestones automatically
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono mb-1.5 tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                  Project Deadline
                </label>
                <div className="relative">
                  <CalendarClock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                  <input
                    type="datetime-local"
                    value={form.deadline}
                    onChange={(e) => {
                      const val = e.target.value;
                      const yearPart = val.split('-')[0];
                      if (yearPart && yearPart.length > 4) return;
                      setForm({ ...form, deadline: val });
                    }}
                    className="input-quantum has-icon"
                    required
                    min={new Date().toISOString().slice(0, 16)}
                    max="9999-12-31T23:59"
                  />
                </div>
                <p className="text-[11px] font-mono mt-1" style={{ color: 'var(--text-muted)' }}>
                  If no freelancer picks this up before the deadline, it will be auto-removed
                </p>
              </div>

              {/* AI info */}
              <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'var(--cyan-dim)', borderColor: 'var(--cyan-border)' }}>
                <Bot className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--cyan)' }} />
                <div>
                  <p className="text-xs font-semibold mb-1" style={{ color: 'var(--cyan)' }}>AI Milestone Generation</p>
                   <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    GPT-4o will analyze your description and create 3–5 structured milestones with 
                    checklists, deadlines, and payment splits. Review and edit before launching.
                  </p>
                </div>
              </div>

              <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" /> Generate with AI
              </button>
            </form>
          </GlassCard>
        )}

        {/* Stage 1: AI Processing */}
        {stage === 1 && (
          <GlassCard className="text-center py-16">
            <div className="inline-flex w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 items-center justify-center mb-6 mx-auto">
              <Bot className="w-8 h-8 text-cyan-400 animate-pulse" />
            </div>
            <h2 className="text-xl font-display font-bold mb-2" style={{ color: 'var(--text-main)' }}>AI Agent Running</h2>
            <p className="text-sm font-mono mb-8" style={{ color: 'var(--text-muted)' }}>Analyzing project requirements...</p>
            <div className="space-y-2 max-w-xs mx-auto text-left">
              {[
                'Parsing project requirements',
                'Identifying deliverable components',
                'Generating milestone structure',
                'Allocating payment distribution',
                'Setting deadline estimates',
              ].map((step, i) => (
                <div key={step} className="flex items-center gap-2 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                  <Loader2 className="w-3 h-3 text-cyan-500 animate-spin flex-shrink-0" style={{ animationDelay: `${i * 0.2}s` }} />
                  {step}
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Stage 2: Review */}
        {stage === 2 && result && (
          <div className="space-y-4">
            {/* Project created */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Check className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-400">Project Created</p>
                <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{result.milestones?.length || 0} milestones generated by AI</p>
              </div>
            </div>

            {/* Deadline info */}
            {result.project?.deadline && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/8 border border-amber-500/20">
                <CalendarClock className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div>
                  <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>PROJECT DEADLINE</p>
                  <p className="text-sm font-semibold text-amber-400">
                    {new Date(result.project.deadline).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              </div>
            )}

            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-mono tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Generated Milestones</h2>
                <div className="flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-cyan-500" />
                  <span className="text-[11px] font-mono text-cyan-500">AI GENERATED</span>
                </div>
              </div>

              <div className="space-y-3">
                {result.milestones?.map((m, i) => (
                  <div key={m._id} className="p-4 rounded-xl" style={{ border: '1px solid var(--card-border)', background: 'var(--cyan-dim)' }}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-cyan-500/50">M{i + 1}</span>
                        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>{m.title}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold font-mono text-emerald-400">${m.paymentAmount?.toLocaleString()}</span>
                        <StatusBadge status={m.status} />
                      </div>
                    </div>
                    <p className="text-xs mb-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{m.description}</p>
                    <div className="flex items-center gap-4 text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                      <span>Due: {new Date(m.deadline).toLocaleDateString()}</span>
                      <span>{m.checklist?.length} checklist items</span>
                    </div>
                    {m.checklist?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {m.checklist.slice(0, 3).map((c, ci) => (
                          <span key={ci} className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px solid var(--divider)' }}>
                            {c.item}
                          </span>
                        ))}
                        {m.checklist.length > 3 && (
                          <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>+{m.checklist.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </GlassCard>

            <div className="flex gap-3">
              <button
                onClick={() => router.push(`/employer/projects/${result.project._id}`)}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                View Project Dashboard <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setStage(0); setResult(null); }}
                className="btn-ghost px-4"
              >
                Create Another
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function NewProjectPage() {
  return <AuthProvider><NewProjectContent /></AuthProvider>;
}
