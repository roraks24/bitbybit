'use client';
import { useEffect, useState } from 'react';
import { Wallet, Lock, Unlock, RefreshCw, DollarSign, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { GlassCard, StatusBadge, Spinner, MetricCard } from '@/components/ui';
import { AuthProvider } from '@/lib/auth';
import api from '@/lib/api';

function EscrowContent() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionStates, setActionStates] = useState({});
  const [depositForms, setDepositForms] = useState({});
  const [messages, setMessages] = useState({});

  const load = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data.projects);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const setMsg = (id, msg, type = 'success') => {
    setMessages((prev) => ({ ...prev, [id]: { msg, type } }));
    setTimeout(() => setMessages((prev) => { const n = { ...prev }; delete n[id]; return n; }), 4000);
  };

  const handleDeposit = async (projectId) => {
    const amount = depositForms[projectId];
    if (!amount || isNaN(amount)) return;
    setActionStates((p) => ({ ...p, [projectId]: 'loading' }));
    try {
      await api.post('/escrow/deposit', { projectId, amount: parseFloat(amount) });
      setDepositForms((p) => ({ ...p, [projectId]: '' }));
      setMsg(projectId, `$${amount} deposited to escrow`);
      load();
    } catch (err) {
      setMsg(projectId, err.response?.data?.error || 'Deposit failed', 'error');
    } finally {
      setActionStates((p) => { const n = { ...p }; delete n[projectId]; return n; });
    }
  };

  const handleRefund = async (projectId) => {
    if (!confirm('Refund all escrow and cancel this project?')) return;
    setActionStates((p) => ({ ...p, [projectId + '_refund']: 'loading' }));
    try {
      await api.post('/escrow/refund', { projectId });
      setMsg(projectId, 'Escrow refunded and project cancelled');
      load();
    } catch (err) {
      setMsg(projectId, err.response?.data?.error || 'Refund failed', 'error');
    } finally {
      setActionStates((p) => { const n = { ...p }; delete n[projectId + '_refund']; return n; });
    }
  };

  const totalEscrow = projects.reduce((s, p) => s + (p.escrowBalance || 0), 0);
  const activeProjects = projects.filter((p) => p.escrowBalance > 0).length;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--text-main)' }}>Escrow Manager</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Manage funds locked in autonomous escrow</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard label="Total Escrow" value={`$${totalEscrow.toLocaleString()}`} sub="Locked in escrow" icon={Lock} color="cyan" />
          <MetricCard label="Total Committed" value={`$0`} sub="Across all projects" icon={Wallet} color="emerald" />
          <MetricCard label="Active Escrows" value={activeProjects} sub="Projects with funds" icon={DollarSign} color="violet" />
        </div>

        {/* How it works */}
        <GlassCard className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--cyan-dim)', border: '1px solid var(--card-border)' }}>
              <Lock className="w-4 h-4" style={{ color: 'var(--cyan)' }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-main)' }}>Autonomous Escrow Logic</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Funds deposited here are released automatically by the AI agent upon milestone approval.
                If a freelancer's submission scores ≥80%, full payment is released. Between 50–79%, partial
                payment based on confidence. Below 50%, funds are returned to escrow for revision.
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Project escrow list */}
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : (
          <div className="space-y-3">
            {projects.length === 0 ? (
              <GlassCard className="text-center py-12">
                <Wallet className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No projects yet</p>
              </GlassCard>
            ) : projects.map((project) => {
              const isLoading = actionStates[project._id] === 'loading';
              const isRefundLoading = actionStates[project._id + '_refund'] === 'loading';
              const msg = messages[project._id];
              const escrowPct = project.totalFunds > 0
                ? Math.round((project.escrowBalance / project.totalFunds) * 100)
                : 0;

              return (
                <GlassCard key={project._id} className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm" style={{ color: 'var(--text-main)' }}>{project.title}</h3>
                        <StatusBadge status={project.status} />
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span style={{ color: 'var(--text-muted)' }}>Budget: <span style={{ color: 'var(--text-main)' }}>${project.totalFunds?.toLocaleString()}</span></span>
                        <span style={{ color: 'var(--text-muted)' }}>Escrow: <span className="font-semibold" style={{ color: 'var(--cyan)' }}>${project.escrowBalance?.toLocaleString()}</span></span>
                        <span style={{ color: 'var(--text-muted)' }}>{escrowPct}% funded</span>
                      </div>
                    </div>
                  </div>

                  {/* Escrow bar */}
                  <div className="mb-4">
                    <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${escrowPct}%`,
                          background: 'linear-gradient(90deg, var(--cyan), #7c3aed)',
                          boxShadow: '0 0 8px rgba(14,165,233,0.3)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Message */}
                  {msg && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg mb-3 text-xs"
                      style={{
                        background: msg.type === 'error' ? 'var(--badge-failed-bg)' : 'var(--badge-active-bg)',
                        border: `1px solid ${msg.type === 'error' ? 'var(--badge-failed-border)' : 'var(--badge-active-border)'}`,
                        color: msg.type === 'error' ? 'var(--badge-failed-text)' : 'var(--badge-active-text)',
                      }}
                    >
                      {msg.type === 'error'
                        ? <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        : <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      }
                      {msg.msg}
                    </div>
                  )}

                  {/* Actions */}
                  {project.status !== 'cancelled' && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="relative flex-1">
                          <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--badge-active-text)' }} />
                          <input
                            type="number"
                            value={depositForms[project._id] || ''}
                            onChange={(e) => setDepositForms((p) => ({ ...p, [project._id]: e.target.value }))}
                            className="input-quantum has-icon h-9 text-xs"
                            placeholder="Amount to deposit"
                            min="1"
                          />
                        </div>
                        <button
                          onClick={() => handleDeposit(project._id)}
                          disabled={isLoading || !depositForms[project._id]}
                          className="btn-primary h-9 px-4 text-xs flex items-center gap-1.5 whitespace-nowrap"
                        >
                          {isLoading
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Unlock className="w-3.5 h-3.5" />
                          }
                          Deposit
                        </button>
                      </div>
                      {project.escrowBalance > 0 && (
                        <button
                          onClick={() => handleRefund(project._id)}
                          disabled={isRefundLoading}
                          className="btn-ghost h-9 px-3 text-xs flex items-center gap-1.5"
                          style={{ color: 'var(--badge-failed-text)', borderColor: 'var(--badge-failed-border)' }}
                        >
                          {isRefundLoading
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <RefreshCw className="w-3 h-3" />
                          }
                          Refund
                        </button>
                      )}
                    </div>
                  )}
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function EscrowPage() {
  return <AuthProvider><EscrowContent /></AuthProvider>;
}
