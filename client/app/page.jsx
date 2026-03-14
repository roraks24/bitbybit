'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Zap, Shield, Bot, CreditCard, CheckCircle2, ArrowRight, Star, Lock, TrendingUp } from 'lucide-react';

const STEPS = [
  { num: '01', title: 'Describe Your Project', desc: 'Employer submits project requirements in natural language.' },
  { num: '02', title: 'AI Generates Milestones', desc: 'GPT-4o breaks the project into verifiable deliverables with deadlines and payment splits.' },
  { num: '03', title: 'Funds Held in Escrow', desc: 'Total budget is locked autonomously — no manual releases needed.' },
  { num: '04', title: 'Freelancer Submits Work', desc: 'Freelancer delivers each milestone via GitHub link or submission notes.' },
  { num: '05', title: 'AI Quality Assurance', desc: 'The AI agent verifies work quality and returns a confidence score (0–1).' },
  { num: '06', title: 'Autonomous Payment', desc: 'Funds are released, partially released, or refunded based on AI verdict.' },
];

const FEATURES = [
  {
    icon: Bot,
    title: 'AI Requirement Analysis',
    desc: 'GPT-4o parses your project description and auto-generates milestones with deadlines, checklists, and payment distribution.',
    color: 'cyan',
  },
  {
    icon: Lock,
    title: 'Autonomous Escrow',
    desc: 'Funds are locked at project start and released programmatically — no manual approvals, no disputes.',
    color: 'violet',
  },
  {
    icon: Shield,
    title: 'Automated Quality Assurance',
    desc: 'Every submission is evaluated by AI for completeness and quality. Confidence score drives payment decisions automatically.',
    color: 'emerald',
  },
  {
    icon: TrendingUp,
    title: 'Professional Fidelity Index',
    desc: 'A 300–850 reputation score that tracks completion rate, deadline adherence, and AI quality scores across all projects.',
    color: 'amber',
  },
];

function Particle({ style }) {
  return <div className="absolute w-px h-px bg-cyan-400 rounded-full opacity-60 animate-pulse-slow" style={style} />;
}

export default function HomePage() {
  const [particles, setParticles] = useState([]);
  const [count, setCount] = useState({ projects: 0, paid: 0, score: 0 });

  useEffect(() => {
    const p = Array.from({ length: 40 }, (_, i) => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      width: `${Math.random() * 2 + 1}px`,
      height: `${Math.random() * 2 + 1}px`,
      animationDelay: `${Math.random() * 3}s`,
      animationDuration: `${2 + Math.random() * 3}s`,
    }));
    setParticles(p);

    // Counter animation
    const target = { projects: 1284, paid: 4820000, score: 97 };
    const duration = 2000;
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount({
        projects: Math.round(target.projects * ease),
        paid: Math.round(target.paid * ease),
        score: Math.round(target.score * ease),
      });
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#020408] quantum-grid overflow-hidden">
      {/* Particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        {particles.map((p, i) => <Particle key={i} style={p} />)}
      </div>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-cyan-500/10 bg-[#020408]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <Zap className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="font-display font-bold text-base tracking-wider text-slate-200">
              TRUST<span className="text-cyan-400">LAYER</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost text-sm">Sign In</Link>
            <Link href="/register" className="btn-primary text-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 z-10">
        <div className="max-w-6xl mx-auto text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[11px] font-mono text-cyan-400 tracking-widest uppercase">AI-Powered Freelance Infrastructure</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-display font-extrabold leading-[1.05] mb-6 tracking-tight">
            Programmable{' '}
            <span className="gradient-text glow-text">Trust</span>
            <br />
            for Freelance Work
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            An autonomous AI agent that manages milestones, holds payments in escrow, and verifies 
            quality — so employers and freelancers never have to dispute again.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/register?role=employer" className="btn-primary text-sm flex items-center gap-2">
              Start as Employer <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/register?role=freelancer" className="btn-ghost text-sm flex items-center gap-2">
              Join as Freelancer <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-6 max-w-xl mx-auto mt-16">
            {[
              { value: count.projects.toLocaleString(), label: 'Projects Completed' },
              { value: `$${(count.paid / 1000000).toFixed(1)}M`, label: 'Funds Processed' },
              { value: `${count.score}%`, label: 'AI Accuracy Rate' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-display font-bold text-cyan-400">{value}</p>
                <p className="text-xs font-mono text-slate-600 mt-1 tracking-wide">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Hero glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.04] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }} />
      </section>

      {/* Features */}
      <section className="py-24 px-6 border-t border-cyan-500/8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[11px] font-mono text-cyan-500 tracking-widest uppercase mb-3">PLATFORM CAPABILITIES</p>
            <h2 className="text-4xl font-display font-bold text-slate-100">Everything handled autonomously</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="glass-card glass-card-hover rounded-xl p-5 relative overflow-hidden group">
                <div className={`w-10 h-10 rounded-lg bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 text-${color}-400`} />
                </div>
                <h3 className="font-semibold text-slate-200 text-sm mb-2">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                <div className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-${color}-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-24 px-6 border-t border-cyan-500/8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[11px] font-mono text-cyan-500 tracking-widest uppercase mb-3">HOW IT WORKS</p>
            <h2 className="text-4xl font-display font-bold text-slate-100">Six steps to complete automation</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {STEPS.map((step, i) => (
              <div key={step.num} className="glass-card rounded-xl p-5 relative overflow-hidden glass-card-hover">
                <div className="flex items-start gap-4">
                  <span className="font-mono text-4xl font-bold text-cyan-500/15 leading-none select-none">{step.num}</span>
                  <div>
                    <h3 className="font-semibold text-slate-200 text-sm mb-1.5">{step.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="absolute right-3 bottom-3">
                    <ArrowRight className="w-3 h-3 text-cyan-500/20" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-cyan-500/8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="glass-card rounded-2xl p-12 relative overflow-hidden neon-border">
            <div className="absolute inset-0 opacity-5 pointer-events-none"
              style={{ background: 'radial-gradient(circle at 50% 0%, #06b6d4, transparent 70%)' }} />
            <h2 className="text-4xl font-display font-bold text-slate-100 mb-4 z-10 relative">
              Ready to deploy <span className="text-cyan-400">trust</span>?
            </h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              Join thousands of teams using TrustLayer to eliminate payment disputes and ship faster.
            </p>
            <div className="flex flex-wrap justify-center gap-3 relative z-10">
              <Link href="/login?role=employer" className="btn-primary text-sm flex items-center gap-2">
                Login as Employer <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login?role=freelancer" className="btn-ghost text-sm flex items-center gap-2">
                Login as Freelancer <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-cyan-500/8 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-500" />
            <span className="text-xs font-mono text-slate-600">TRUSTLAYER © 2025</span>
          </div>
          <p className="text-xs font-mono text-slate-700 text-center sm:text-left">Autonomous AI Payment & Project Agent</p>
        </div>
      </footer>
    </div>
  );
}
