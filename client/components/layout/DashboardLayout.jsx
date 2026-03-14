'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, FolderKanban, Plus, Wallet, Settings,
  LogOut, ChevronRight, Bell, User, Shield, Search
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import ChatWidget from '@/components/chat/ChatWidget';
import ThemeToggle from '@/components/ui/ThemeToggle';

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
    <div className="min-h-screen flex overflow-hidden" style={{ background: 'var(--bg)', transition: 'background 0.4s ease' }}>
      <ThemeToggle />

      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative z-50 h-full
        ${collapsed ? '-translate-x-full md:translate-x-0 md:w-16' : 'translate-x-0 w-64'}
        transition-all duration-300 flex flex-col
      `}
        style={{
          background: 'var(--sidebar-bg)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid var(--divider)',
        }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4" style={{ borderBottom: '1px solid var(--divider)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 border-[1.5px] border-[var(--cyan)] rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', background: 'var(--cyan-dim)', borderRadius: 0 }}>
            </div>
            {(!collapsed || isMobile) && (
              <span className="font-display font-bold text-sm tracking-wider" style={{ color: 'var(--cyan)' }}>
                TRUSTLAYER
              </span>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto transition-colors hidden md:block"
            style={{ color: 'var(--text-muted)' }}
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
          </button>
          <button
            onClick={() => setCollapsed(true)}
            className="ml-auto transition-colors md:hidden"
            style={{ color: 'var(--text-muted)' }}
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
        </div>

        {/* Role badge */}
        {(!collapsed || isMobile) && (
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--divider)' }}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'var(--cyan-dim)' }}>
                <User className="w-3 h-3" style={{ color: 'var(--cyan)' }} />
              </div>
              <div>
                <p className="text-xs font-semibold truncate max-w-[140px]" style={{ color: 'var(--text-main)' }}>{user?.name}</p>
                <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--cyan)', opacity: 0.7 }}>{user?.role}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
          {nav.map(({ href, icon: Icon, label }) => {
            const exactMatch = pathname === href;
            const prefixMatch = pathname.startsWith(href + '/');
            const active = exactMatch || (prefixMatch && !nav.some(n => n.href !== href && pathname === n.href));
            const showLabel = !collapsed || isMobile;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => { if (typeof window !== 'undefined' && window.innerWidth < 768) setCollapsed(true); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group"
                style={{
                  background: active ? 'var(--cyan-dim)' : 'transparent',
                  color: active ? 'var(--cyan)' : 'var(--text-muted)',
                  border: active ? '1px solid var(--card-border)' : '1px solid transparent',
                }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: active ? 'var(--cyan)' : 'var(--text-muted)' }} />
                {showLabel && <span className="tracking-wide">{label}</span>}
                {active && showLabel && <ChevronRight className="w-3 h-3 ml-auto" style={{ color: 'var(--cyan)', opacity: 0.5 }} />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-2 space-y-0.5 flex-shrink-0" style={{ borderTop: '1px solid var(--divider)' }}>
          {user?.role === 'freelancer' && (!collapsed || isMobile) && (
            <div className="px-3 py-2 mb-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] tracking-widest" style={{ color: 'var(--text-muted)' }}>PFI SCORE</span>
                <Shield className="w-3 h-3" style={{ color: 'var(--cyan)' }} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold font-display" style={{ color: 'var(--cyan)' }}>{user?.pfiScore ?? 0}</span>
                <div className="flex-1 rounded-full h-1" style={{ background: 'var(--bg-secondary)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${((user?.pfiScore ?? 0) / 850) * 100}%`,
                      background: 'linear-gradient(90deg, var(--cyan), #7c3aed)',
                    }}
                  />
                </div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all hover:bg-red-500/5 ${collapsed && !isMobile ? 'justify-center' : ''}`}
            style={{ color: 'var(--text-muted)' }}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {(!collapsed || isMobile) && 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-0 h-screen overflow-hidden">
        {/* Top bar */}
        <header className="h-16 flex items-center px-4 md:px-6 gap-4 flex-shrink-0 md:static sticky top-0 z-30"
          style={{
            background: 'var(--header-bg)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--divider)',
          }}
        >
          <button
            className="md:hidden p-2 -ml-2 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onClick={() => setCollapsed(false)}
          >
            <span className="sr-only">Open sidebar</span>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1" />

          <button
            className="relative p-2 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            title="Notifications coming soon"
            onClick={() => alert('Notifications are not yet implemented.')}
          >
            <Bell className="w-4 h-4" />
          </button>
          <div className="w-px h-5 hidden sm:block" style={{ background: 'var(--divider)' }} />
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold" style={{ color: 'var(--text-main)' }}>{user?.name}</p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
          </div>
          <div className="sm:hidden w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--cyan-dim)' }}>
            <User className="w-4 h-4" style={{ color: 'var(--cyan)' }} />
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
