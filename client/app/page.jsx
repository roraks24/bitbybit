'use client';
// React hooks removed
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Shield, Bot, Lock, TrendingUp, ArrowRight } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';

const ParticleCanvas = dynamic(() => import('@/components/ui/ParticleCanvas'), { ssr: false });

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

export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg)', transition: 'background 0.4s ease' }}>
      <ParticleCanvas />
      <ThemeToggle />

      {/* Nav */}
      <nav className="relative z-10 w-full anim-nav">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border-[1.5px] border-[var(--cyan)] flex items-center justify-center"
              style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', background: 'var(--cyan-dim)' }}>
            </div>
            <span className="text-[13px] font-bold tracking-[0.15em]" style={{ color: 'var(--cyan)' }}>TRUSTLAYER</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login"
              className="text-[11px] tracking-[0.12em] px-4 py-1.5 rounded-full border transition-all duration-200 hover:tracking-[0.18em]"
              style={{ color: 'var(--nav-link-color)', borderColor: 'var(--nav-link-border)' }}>
              SIGN IN
            </Link>
            <Link href="/register" className="btn-primary text-[11px] tracking-[0.12em] !py-1.5 !px-4 !rounded-full">
              GET STARTED
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 pt-12 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-display font-black leading-[1.1] mb-4 tracking-[0.12em] anim-h1"
            style={{ fontSize: 'clamp(36px, 7vw, 64px)', color: 'var(--text-main)' }}>
            TRUSTLAYER
          </h1>

          <p className="text-[13px] max-w-[460px] mx-auto leading-[1.8] anim-desc" style={{ color: 'var(--text-muted)' }}>
            An AI-powered intermediary that breaks projects into milestones &bull; holds funds in escrow &bull; evaluates submitted work &bull; releases payments automatically.
          </p>
        </div>
      </section>

      {/* Role selection label */}
      <div className="relative z-10 text-center mb-6">
        <span className="text-[11px] tracking-[0.28em] font-bold anim-label"
          style={{ color: 'var(--cyan)', animation: 'label-glow 2.5s ease-in-out infinite' }}>
          — SELECT YOUR ROLE TO CONTINUE —
        </span>
      </div>

      {/* Role Cards */}
      <section className="relative z-10 flex flex-wrap justify-center gap-6 px-6 mb-20">
        {[
          {
            title: 'FREELANCER',
            desc: 'Accept projects, submit milestone deliverables, and build your reputation score.',
            icon: (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            ),
            iconBg: 'linear-gradient(135deg, rgba(3,105,161,0.12), rgba(14,165,233,0.18))',
            iconShadow: '0 4px 14px rgba(3,105,161,0.15)',
            href: '/register?role=freelancer',
            anim: 'anim-card-1',
          },
          {
            title: 'EMPLOYER',
            desc: 'Deploy projects, let AI generate milestones, and manage escrow payments.',
            icon: (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
              </svg>
            ),
            iconBg: 'linear-gradient(135deg, rgba(146,64,14,0.10), rgba(180,83,9,0.16))',
            iconShadow: '0 4px 14px rgba(146,64,14,0.13)',
            href: '/register?role=employer',
            anim: 'anim-card-2',
          },
        ].map((card) => (
          <Link key={card.title} href={card.href} className={card.anim}>
            <div className="w-[230px] glass-card glass-card-hover rounded-[20px] p-9 pb-7 text-center cursor-pointer relative overflow-hidden group">
              {/* Top accent bar on hover */}
              <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'linear-gradient(90deg, var(--cyan), #38bdf8)' }} />
              {/* Hover glow */}
              <div className="absolute inset-0 rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'linear-gradient(145deg, rgba(56,189,248,0.06) 0%, rgba(14,165,233,0.03) 100%)' }} />

              <div className="w-[58px] h-[58px] rounded-2xl flex items-center justify-center mx-auto mb-[18px] transition-transform duration-300 group-hover:scale-[1.12] group-hover:-rotate-[4deg]"
                style={{ background: card.iconBg, boxShadow: card.iconShadow }}>
                {card.icon}
              </div>
              <h3 className="text-[13px] tracking-[0.18em] font-extrabold font-display mb-2.5" style={{ color: 'var(--text-main)' }}>
                {card.title}
              </h3>
              <p className="text-[11.5px] leading-[1.7]" style={{ color: 'var(--text-muted)' }}>
                {card.desc}
              </p>
              <span className="inline-block mt-[18px] text-[10px] tracking-[0.18em] font-bold opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-250"
                style={{ color: 'var(--cyan)' }}>
                GET STARTED →
              </span>
            </div>
          </Link>
        ))}
      </section>

      {/* Features */}
      <section className="relative z-10 py-20 px-6" style={{ borderTop: '1px solid var(--divider)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[11px] tracking-[0.28em] font-bold mb-3" style={{ color: 'var(--cyan)' }}>PLATFORM CAPABILITIES</p>
            <h2 className="text-3xl font-display font-bold" style={{ color: 'var(--text-main)' }}>Everything handled autonomously</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc, color }, i) => (
              <div key={title} className={`glass-card glass-card-hover rounded-xl p-5 relative overflow-hidden group anim-card-${i + 1}`}>
                <div className={`w-10 h-10 rounded-lg bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 text-${color}-400`} />
                </div>
                <h3 className="font-semibold text-sm mb-2" style={{ color: 'var(--text-main)' }}>{title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                <div className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-${color}-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="relative z-10 py-20 px-6" style={{ borderTop: '1px solid var(--divider)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[11px] tracking-[0.28em] font-bold mb-3" style={{ color: 'var(--cyan)' }}>HOW IT WORKS</p>
            <h2 className="text-3xl font-display font-bold" style={{ color: 'var(--text-main)' }}>Six steps to complete automation</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {STEPS.map((step, i) => (
              <div key={step.num} className="glass-card glass-card-hover rounded-xl p-5 relative overflow-hidden">
                <div className="flex items-start gap-4">
                  <span className="text-4xl font-bold leading-none select-none" style={{ color: 'var(--cyan)', opacity: 0.15 }}>{step.num}</span>
                  <div>
                    <h3 className="font-semibold text-sm mb-1.5" style={{ color: 'var(--text-main)' }}>{step.title}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{step.desc}</p>
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="absolute right-3 bottom-3">
                    <ArrowRight className="w-3 h-3" style={{ color: 'var(--cyan)', opacity: 0.2 }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-20 px-6" style={{ borderTop: '1px solid var(--divider)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <div className="glass-card rounded-2xl p-12 relative overflow-hidden neon-border">
            <div className="absolute inset-0 opacity-5 pointer-events-none"
              style={{ background: 'radial-gradient(circle at 50% 0%, var(--cyan), transparent 70%)' }} />
            <h2 className="text-3xl font-display font-bold mb-4 z-10 relative" style={{ color: 'var(--text-main)' }}>
              Ready to deploy <span style={{ color: 'var(--cyan)' }}>trust</span>?
            </h2>
            <p className="text-sm mb-8 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
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
      <footer className="relative z-10 py-8 px-6" style={{ borderTop: '1px solid var(--divider)' }}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border border-[var(--cyan)] flex items-center justify-center"
              style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', background: 'var(--cyan-dim)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>TRUSTLAYER © 2025</span>
          </div>
          <p className="text-xs text-center sm:text-left" style={{ color: 'var(--text-muted)' }}>Autonomous AI Payment & Project Agent</p>
        </div>
      </footer>
    </div>
  );
}
