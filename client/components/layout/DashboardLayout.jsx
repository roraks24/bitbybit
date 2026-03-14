'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, FolderKanban, Plus, Wallet, Settings,
  LogOut, ChevronRight, Zap, Bell, User, Shield, Search
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import ChatWidget from '@/components/chat/ChatWidget';

const employerNav = [
  { href: '/employer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/employer/projects', icon: FolderKanban, label: 'Projects' },
  { href: '/employer/projects/new', icon: Plus, label: 'New Project' },
  { href: '/employer/escrow', icon: Wallet, label: 'Escrow' },
];

const freelancerNav = [
  { href: '/freelancer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/freelancer/find-work', icon: Search, label: 'Find Work' },
  { href: '/freelancer/projects', icon: FolderKanban, label: 'My Projects' },
  { href: '/freelancer/earnings', icon: Wallet, label: 'Earnings' },
];

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const nav = user?.role === 'employer' ? employerNav : freelancerNav;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#020408] quantum-grid flex overflow-hidden">
      {/* Mobile overlay */}
      {!collapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative z-50 h-full
        ${collapsed ? '-translate-x-full md:translate-x-0 md:w-16' : 'translate-x-0 w-64'} 
        transition-all duration-300 flex flex-col border-r border-cyan-500/10 bg-[#060d14]/95 backdrop-blur-xl
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-cyan-500/10">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-cyan-400" />
            </div>
            {(!collapsed || isMobile) && (
              <span className="font-display font-bold text-sm tracking-wider text-slate-200">
                TRUST<span className="text-cyan-400">LAYER</span>
              </span>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-slate-600 hover:text-cyan-400 transition-colors hidden md:block"
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
          </button>
          <button
            onClick={() => setCollapsed(true)}
            className="ml-auto text-slate-600 hover:text-cyan-400 transition-colors md:hidden"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
        </div>

        {/* Role badge */}
        {(!collapsed || isMobile) && (
          <div className="px-4 py-3 border-b border-cyan-500/10">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <User className="w-3 h-3 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-300 truncate max-w-[140px]">{user?.name}</p>
                <p className="text-[10px] font-mono text-cyan-500/70 uppercase tracking-widest">{user?.role}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
          {nav.map(({ href, icon: Icon, label }) => {
            // Exact match takes priority; prefix match only if no other item exactly matches
            const exactMatch = pathname === href;
            const prefixMatch = pathname.startsWith(href + '/');
            const active = exactMatch || (prefixMatch && !nav.some(n => n.href !== href && pathname === n.href));
            const showLabel = !collapsed || isMobile;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => { if (typeof window !== 'undefined' && window.innerWidth < 768) setCollapsed(true); }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-mono transition-all duration-150 group
                  ${active
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-cyan-400' : 'text-slate-600 group-hover:text-slate-400'}`} />
                {showLabel && <span className="tracking-wide">{label}</span>}
                {active && showLabel && <ChevronRight className="w-3 h-3 ml-auto text-cyan-500/50" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-2 border-t border-cyan-500/10 space-y-0.5 flex-shrink-0">
          {user?.role === 'freelancer' && (!collapsed || isMobile) && (
            <div className="px-3 py-2 mb-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-slate-500 tracking-widest">PFI SCORE</span>
                <Shield className="w-3 h-3 text-cyan-500" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold font-mono text-cyan-400">{user?.pfiScore ?? 0}</span>
                <div className="flex-1 bg-void-700 rounded-full h-1">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500"
                    style={{ width: `${((user?.pfiScore ?? 0) / 850) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-mono text-slate-600 hover:text-red-400 hover:bg-red-500/5 transition-all ${collapsed && !isMobile ? 'justify-center' : ''}`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {(!collapsed || isMobile) && 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-0 h-screen overflow-hidden">
        {/* Top bar */}
        <header className="h-16 border-b border-cyan-500/10 bg-[#060d14]/60 backdrop-blur-xl flex items-center px-4 md:px-6 gap-4 flex-shrink-0 md:static sticky top-0 z-30">
          <button 
            className="md:hidden p-2 -ml-2 text-slate-400 hover:text-cyan-400 transition-colors"
            onClick={() => setCollapsed(false)}
          >
            <span className="sr-only">Open sidebar</span>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="flex-1" />
          
          <button
            className="relative p-2 text-slate-600 hover:text-cyan-400 transition-colors"
            title="Notifications coming soon"
            onClick={() => alert('Notifications are not yet implemented.')}
          >
            <Bell className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-slate-800 hidden sm:block" />
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-300">{user?.name}</p>
            <p className="text-[10px] font-mono text-slate-600">{user?.email}</p>
          </div>
          {/* Mobile user icon */}
          <div className="sm:hidden w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
             <User className="w-4 h-4 text-cyan-400" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
      <ChatWidget />
    </div>
  );
}
