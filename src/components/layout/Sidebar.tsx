'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Building2, Bookmark, Search, LayoutDashboard,
  Zap, Settings, ChevronRight, Target, TrendingUp, LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOCK_COMPANIES } from '@/lib/mockData';

const NAV_ITEMS = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/companies', icon: Building2, label: 'Companies' },
  { href: '/lists', icon: Bookmark, label: 'Lists' },
  { href: '/saved', icon: Search, label: 'Saved Searches' },
];

export function Sidebar() {
  const pathname = usePathname();

  const [weekStats, setWeekStats] = useState({
    newCount: 0,
    enrichedCount: 0,
    contactedCount: 0,
    topScore: 0,
  });

  useEffect(() => {
    function computeStats() {
      const newCount = MOCK_COMPANIES.filter(c => {
        const saved = localStorage.getItem(`status_${c.id}`);
        if (saved) return saved === 'new';
        return c.status === 'new';
      }).length;

      const enrichedRaw = localStorage.getItem('vc_enriched_this_week');
      const enrichedCount = enrichedRaw ? JSON.parse(enrichedRaw).length : 0;

      const contactedCount = MOCK_COMPANIES.filter(c => {
        const saved = localStorage.getItem(`status_${c.id}`);
        return saved ? saved === 'contacted' : c.status === 'contacted';
      }).length;

      const topScore = Math.max(...MOCK_COMPANIES.map(c => c.thesisScore));
      setWeekStats({ newCount, enrichedCount, contactedCount, topScore });
    }

    computeStats();
    window.addEventListener('storage', computeStats);
    const interval = setInterval(computeStats, 2000);
    return () => {
      window.removeEventListener('storage', computeStats);
      clearInterval(interval);
    };
  }, []);

  function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.clear();
      window.location.href = '/login';
    }
  }

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col border-r border-surface-800/60 bg-surface-950">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-surface-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center shadow-lg shadow-accent-900/30">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <span className="font-display font-700 text-sm text-white tracking-tight">VC Dashboard</span>
            <div className="text-[10px] text-surface-500 -mt-0.5">Precision AI</div>
          </div>
        </div>
      </div>

      {/* Thesis badge */}
      <div className="mx-3 mt-3 mb-1 p-2.5 rounded-lg bg-accent-500/8 border border-accent-500/20">
        <div className="flex items-center gap-1.5 mb-1">
          <Target className="w-3 h-3 text-accent-400" />
          <span className="text-[10px] font-600 text-accent-400 uppercase tracking-wider">Active Thesis</span>
        </div>
        <p className="text-[11px] text-surface-300 leading-relaxed">AI-first B2B SaaS — Seed to Series A — $500K–$15M</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 space-y-0.5">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all group',
                active
                  ? 'bg-accent-500/10 text-accent-300 font-500'
                  : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-accent-400' : '')} />
              <span>{label}</span>
              {active && <ChevronRight className="w-3 h-3 ml-auto text-accent-500" />}
            </Link>
          );
        })}
      </nav>

      {/* This Week Stats */}
      <div className="mx-3 mb-3 p-3 rounded-lg bg-surface-900 border border-surface-800/60">
        <div className="flex items-center gap-1.5 mb-2.5">
          <TrendingUp className="w-3 h-3 text-surface-500" />
          <span className="text-[10px] uppercase tracking-wider text-surface-500 font-500">This Week</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div title="Companies not yet opened">
            <div className="font-display font-600 text-sm text-white">{weekStats.newCount}</div>
            <div className="text-[10px] text-surface-500">New</div>
          </div>
          <div title="Companies enriched with AI">
            <div className="font-display font-600 text-sm text-white">{weekStats.enrichedCount}</div>
            <div className="text-[10px] text-surface-500">Enriched</div>
          </div>
          <div title="Companies with contacted status">
            <div className="font-display font-600 text-sm text-accent-400">{weekStats.contactedCount}</div>
            <div className="text-[10px] text-surface-500">Contacted</div>
          </div>
          <div title="Highest thesis score">
            <div className="font-display font-600 text-sm text-green-400">{weekStats.topScore}</div>
            <div className="text-[10px] text-surface-500">Top Score</div>
          </div>
        </div>
      </div>

      {/* Footer — Settings + Logout */}
      <div className="px-3 pb-4 pt-2 space-y-0.5 border-t border-surface-800/40">
        <Link
          href="/settings"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-surface-500 hover:text-surface-300 hover:bg-surface-800/50 transition-all"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-500/70 hover:text-red-400 hover:bg-red-500/8 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
