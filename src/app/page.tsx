'use client';

import Link from 'next/link';
import {
  ArrowRight, ArrowUpRight, Zap, TrendingUp, Building2, Star,
  Clock, Calendar, Activity, Target, DollarSign, Users,
  BarChart3, Flame, ChevronRight, Globe, Briefcase
} from 'lucide-react';
import { MOCK_COMPANIES } from '@/lib/mockData';
import { formatCurrency, scoreColor, statusColor } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';

/* ─── IST Clock ─────────────────────────────────────────────────────────── */
function useIST() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function getGreetingData(date: Date) {
  const h = parseInt(
    date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false })
  );
  if (h >= 5 && h < 12) return { text: 'Good Morning', emoji: '☀️', sub: 'Start strong — your pipeline awaits.' };
  if (h >= 12 && h < 17) return { text: 'Good Afternoon', emoji: '🌤️', sub: 'Mid-day check-in on your deals.' };
  if (h >= 17 && h < 21) return { text: 'Good Evening', emoji: '🌆', sub: 'Wrap up the day with key insights.' };
  return { text: 'Good Night', emoji: '🌙', sub: 'Late scouting session — stay sharp.' };
}

/* ─── Animated Counter ───────────────────────────────────────────────────── */
function AnimatedNumber({ value, prefix = '' }: { value: number | string; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  const isNum = typeof value === 'number';

  useEffect(() => {
    if (!isNum) return;
    let start = 0;
    const end = value as number;
    const duration = 1200;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value, isNum]);

  if (!isNum) return <span>{value}</span>;
  return <span>{prefix}{display.toLocaleString()}</span>;
}

/* ─── Sparkline ─────────────────────────────────────────────────────────── */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 64, h = 24;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} className="opacity-70">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Score Arc ─────────────────────────────────────────────────────────── */
function ScoreArc({ score }: { score: number }) {
  const r = 18, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? '#38cc84' : score >= 60 ? '#fbbf24' : '#f87171';
  return (
    <svg width="48" height="48" className="-rotate-90">
      <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
      <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="3"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }} />
      <text x="24" y="24" textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize="10" fontWeight="700"
        style={{ transform: 'rotate(90deg)', transformOrigin: '24px 24px' }}>
        {score}
      </text>
    </svg>
  );
}

/* ─── Main Dashboard ─────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const now = useIST();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const topCompanies = [...MOCK_COMPANIES].sort((a, b) => b.thesisScore - a.thesisScore).slice(0, 5);
  const recentSignals = MOCK_COMPANIES
    .flatMap(c => c.signals.map(s => ({ ...s, company: c.name, companyId: c.id })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const totalFunding = MOCK_COMPANIES.reduce((s, c) => s + c.funding.total, 0);
  const avgScore = Math.round(MOCK_COMPANIES.reduce((s, c) => s + c.thesisScore, 0) / MOCK_COMPANIES.length);
  const hotDeals = MOCK_COMPANIES.filter(c => c.thesisScore >= 80).length;
  const stages = [...new Set(MOCK_COMPANIES.map(c => c.stage))];
  const sectorMap: Record<string, number> = {};
  MOCK_COMPANIES.forEach(c => { sectorMap[c.sector] = (sectorMap[c.sector] || 0) + 1; });
  const topSectors = Object.entries(sectorMap).sort((a, b) => b[1] - a[1]).slice(0, 4);

  const sparkData = [12, 18, 14, 22, 19, 28, 24, 32, 29, 35, 31, 40];

  const kpis = [
    {
      label: 'Total Companies',
      value: MOCK_COMPANIES.length,
      icon: Building2,
      color: '#60a5fa',
      bg: 'rgba(96,165,250,0.08)',
      border: 'rgba(96,165,250,0.2)',
      spark: [4, 7, 5, 9, 8, 11, 10, 13, 12, MOCK_COMPANIES.length],
      change: '+3 this week',
      up: true,
    },
    {
      label: 'Watching',
      value: MOCK_COMPANIES.filter(c => c.status === 'watching').length,
      icon: Star,
      color: '#fbbf24',
      bg: 'rgba(251,191,36,0.08)',
      border: 'rgba(251,191,36,0.2)',
      spark: [2, 3, 2, 4, 3, 5, 4, 6, 5, MOCK_COMPANIES.filter(c => c.status === 'watching').length],
      change: 'Active pipeline',
      up: true,
    },
    {
      label: 'Funding Tracked',
      value: formatCurrency(totalFunding),
      icon: DollarSign,
      color: '#38cc84',
      bg: 'rgba(56,204,132,0.08)',
      border: 'rgba(56,204,132,0.2)',
      spark: sparkData,
      change: 'Across all stages',
      up: true,
    },
    {
      label: 'Avg Thesis Score',
      value: avgScore,
      icon: Zap,
      color: '#a78bfa',
      bg: 'rgba(167,139,250,0.08)',
      border: 'rgba(167,139,250,0.2)',
      spark: [60, 65, 62, 70, 68, 72, 69, 75, 73, avgScore],
      change: `${hotDeals} hot deals`,
      up: avgScore >= 70,
    },
  ];

  const istDate = now?.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }) ?? '';
  const istTime = now?.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  }) ?? '-- : -- : --';
  const greet = now ? getGreetingData(now) : { text: 'Welcome', emoji: '👋', sub: 'Loading your dashboard...' };

  const signalIcon: Record<string, string> = {
    funding: '💰', hiring: '👥', product: '🚀', partnership: '🤝', news: '📰'
  };
  const signalBadge: Record<string, string> = {
    funding: 'text-green-400 bg-green-400/10 border-green-400/20',
    hiring: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    product: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    partnership: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    news: 'text-surface-400 bg-surface-400/10 border-surface-400/20',
  };

  return (
    <div className="min-h-screen p-6 grid-bg relative overflow-hidden">

      {/* Ambient glow blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div style={{
          position: 'absolute', top: '-10%', right: '5%', width: 480, height: 480,
          background: 'radial-gradient(circle, rgba(56,204,132,0.04) 0%, transparent 70%)',
          borderRadius: '50%'
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', left: '5%', width: 360, height: 360,
          background: 'radial-gradient(circle, rgba(96,165,250,0.04) 0%, transparent 70%)',
          borderRadius: '50%'
        }} />
      </div>

      {/* ── TOP HEADER BAR ───────────────────────────────────────────────── */}
      <div className="mb-6 flex items-center justify-between gap-4">
        {/* Left: Greeting */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-600 uppercase tracking-widest text-accent-400">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse-slow" />
              VC Dashboard · Live
            </span>
          </div>
          <h1 className="font-display text-2xl font-700 text-white leading-tight">
            {greet.text}, Partner {greet.emoji}
          </h1>
          <p className="text-surface-400 mt-0.5 text-sm">{greet.sub}</p>
        </div>

        {/* Right: Clock + Date */}
        <div className="flex items-stretch gap-3 flex-shrink-0">
          {/* Clock */}
          <div style={{
            background: 'rgba(19,24,41,0.8)',
            border: '1px solid rgba(54,61,92,0.6)',
            backdropFilter: 'blur(12px)',
          }} className="rounded-xl px-4 py-3 text-right">
            <div className="flex items-center justify-end gap-2 mb-0.5">
              <Clock className="w-3.5 h-3.5 text-accent-400" />
              <span className="font-mono text-xl font-700 text-white tracking-tight tabular-nums">
                {istTime}
              </span>
            </div>
            <div className="flex items-center justify-end gap-1.5">
              <Calendar className="w-3 h-3 text-surface-500" />
              <span className="text-[11px] text-surface-400 font-400">{istDate}</span>
            </div>
            <div className="text-[9px] text-surface-600 mt-0.5 uppercase tracking-widest">India Standard Time</div>
          </div>

          {/* Quick stats pill */}
          <div style={{
            background: 'rgba(56,204,132,0.06)',
            border: '1px solid rgba(56,204,132,0.18)',
          }} className="rounded-xl px-4 py-3 flex flex-col justify-center">
            <div className="flex items-center gap-1.5 mb-1">
              <Flame className="w-3.5 h-3.5 text-accent-400" />
              <span className="text-[10px] font-600 text-accent-400 uppercase tracking-wider">Hot Deals</span>
            </div>
            <div className="font-display font-700 text-2xl text-white">{hotDeals}</div>
            <div className="text-[10px] text-surface-500">Score ≥ 80</div>
          </div>
        </div>
      </div>

      {/* ── KPI CARDS ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {kpis.map(({ label, value, icon: Icon, color, bg, border, spark, change, up }) => (
          <div key={label}
            className="rounded-2xl p-4 relative overflow-hidden group hover:scale-[1.01] transition-all duration-200"
            style={{ background: bg, border: `1px solid ${border}` }}>
            {/* Top row */}
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <Sparkline data={spark} color={color} />
            </div>
            {/* Value */}
            <div className="font-display font-800 text-2xl text-white mb-0.5">
              {mounted ? <AnimatedNumber value={typeof value === 'number' ? value : value} /> : value}
            </div>
            <div className="text-xs text-surface-500 mb-2">{label}</div>
            {/* Change */}
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" style={{ color: up ? '#38cc84' : '#f87171' }} />
              <span className="text-[11px]" style={{ color: up ? '#38cc84' : '#9aa2bc' }}>{change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── MAIN GRID ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-4 mb-4">

        {/* Top Thesis Matches — col 8 */}
        <div className="col-span-8 rounded-2xl overflow-hidden"
          style={{ background: 'rgba(13,16,30,0.7)', border: '1px solid rgba(54,61,92,0.5)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-800/40">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-accent-500/12 border border-accent-500/20 flex items-center justify-center">
                <Target className="w-3.5 h-3.5 text-accent-400" />
              </div>
              <div>
                <h2 className="font-display font-600 text-sm text-white">Top Thesis Matches</h2>
                <p className="text-[11px] text-surface-500">Highest alignment with your investment thesis</p>
              </div>
            </div>
            <Link href="/companies"
              className="flex items-center gap-1 text-xs text-accent-400 hover:text-accent-300 transition-colors group">
              View all
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Table header */}
          <div className="grid px-5 py-2.5 text-[10px] font-600 uppercase tracking-widest text-surface-600"
            style={{ gridTemplateColumns: '24px 1fr 100px 80px 80px 60px' }}>
            <span>#</span>
            <span>Company</span>
            <span>Stage</span>
            <span>Sector</span>
            <span>Status</span>
            <span className="text-right">Score</span>
          </div>

          <div className="divide-y divide-surface-800/30">
            {topCompanies.map((company, i) => (
              <Link key={company.id} href={`/companies/${company.id}`}
                className="grid px-5 py-3 hover:bg-surface-800/30 transition-all group items-center"
                style={{ gridTemplateColumns: '24px 1fr 100px 80px 80px 60px' }}>
                {/* Rank */}
                <span className="text-xs font-mono text-surface-600">{i + 1}</span>

                {/* Company */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-surface-800 border border-surface-700/60 flex items-center justify-center text-xs font-700 text-surface-300 flex-shrink-0 group-hover:border-accent-500/40 transition-colors">
                    {company.name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="font-500 text-sm text-surface-200 group-hover:text-accent-300 transition-colors truncate">
                      {company.name}
                    </div>
                    <div className="text-[11px] text-surface-500 truncate">{company.tagline}</div>
                  </div>
                </div>

                {/* Stage */}
                <span className="text-xs text-surface-400">{company.stage}</span>

                {/* Sector */}
                <span className="text-xs text-surface-400 truncate">{company.sector}</span>

                {/* Status */}
                <span className={`text-[11px] px-2 py-0.5 rounded-full w-fit ${statusColor(company.status)}`}>
                  {company.status}
                </span>

                {/* Score arc */}
                <div className="flex justify-end">
                  <ScoreArc score={company.thesisScore} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right col — col 4 */}
        <div className="col-span-4 flex flex-col gap-4">

          {/* Sector Breakdown */}
          <div className="rounded-2xl p-4"
            style={{ background: 'rgba(13,16,30,0.7)', border: '1px solid rgba(54,61,92,0.5)', backdropFilter: 'blur(12px)' }}>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-3.5 h-3.5 text-surface-500" />
              <h3 className="font-display font-600 text-sm text-white">Sector Breakdown</h3>
            </div>
            <div className="space-y-2.5">
              {topSectors.map(([sector, count]) => {
                const pct = Math.round((count / MOCK_COMPANIES.length) * 100);
                return (
                  <div key={sector}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-surface-300">{sector}</span>
                      <span className="text-xs font-600 text-surface-400">{count} co · {pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-800 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-accent-500 to-accent-400 transition-all duration-700"
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stage Distribution */}
          <div className="rounded-2xl p-4"
            style={{ background: 'rgba(13,16,30,0.7)', border: '1px solid rgba(54,61,92,0.5)', backdropFilter: 'blur(12px)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-3.5 h-3.5 text-surface-500" />
              <h3 className="font-display font-600 text-sm text-white">Stage Distribution</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {stages.map(stage => {
                const cnt = MOCK_COMPANIES.filter(c => c.stage === stage).length;
                return (
                  <div key={stage} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                    style={{ background: 'rgba(54,61,92,0.3)', border: '1px solid rgba(54,61,92,0.6)' }}>
                    <span className="text-xs font-500 text-surface-300">{stage}</span>
                    <span className="text-[10px] font-700 text-accent-400 bg-accent-500/10 px-1.5 py-0.5 rounded-full">{cnt}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-4">

        {/* Recent Signals — col 7 */}
        <div className="col-span-7 rounded-2xl overflow-hidden"
          style={{ background: 'rgba(13,16,30,0.7)', border: '1px solid rgba(54,61,92,0.5)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-800/40">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Activity className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div>
                <h2 className="font-display font-600 text-sm text-white">Recent Signals</h2>
                <p className="text-[11px] text-surface-500">Latest activity across your pipeline</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-slow" />
              <span className="text-[10px] text-surface-500">Live</span>
            </div>
          </div>
          <div className="divide-y divide-surface-800/30">
            {recentSignals.map((signal, i) => (
              <Link key={i} href={`/companies/${signal.companyId}`}
                className="flex items-start gap-3.5 px-5 py-3.5 hover:bg-surface-800/30 transition-all group">
                <div className="text-lg mt-0.5 flex-shrink-0 leading-none">
                  {signalIcon[signal.type] ?? '📡'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-500 text-surface-200 group-hover:text-accent-300 transition-colors leading-snug">
                      {signal.title}
                    </span>
                    <span className={`text-[10px] font-600 px-2 py-0.5 rounded-full border flex-shrink-0 capitalize ${signalBadge[signal.type] ?? ''}`}>
                      {signal.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-surface-500">{signal.company}</span>
                    <span className="text-[10px] text-surface-700">·</span>
                    <span className="text-[11px] text-surface-600">
                      {new Date(signal.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-surface-700 group-hover:text-accent-400 mt-0.5 flex-shrink-0 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* Portfolio Health + Quick Actions — col 5 */}
        <div className="col-span-5 flex flex-col gap-4">

          {/* Portfolio Health */}
          <div className="rounded-2xl p-4"
            style={{ background: 'rgba(13,16,30,0.7)', border: '1px solid rgba(54,61,92,0.5)', backdropFilter: 'blur(12px)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-3.5 h-3.5 text-surface-500" />
              <h3 className="font-display font-600 text-sm text-white">Pipeline Health</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'New', value: MOCK_COMPANIES.filter(c => c.status === 'new').length, color: '#60a5fa' },
                { label: 'Watching', value: MOCK_COMPANIES.filter(c => c.status === 'watching').length, color: '#fbbf24' },
                { label: 'Contacted', value: MOCK_COMPANIES.filter(c => c.status === 'contacted').length, color: '#38cc84' },
                { label: 'Passed', value: MOCK_COMPANIES.filter(c => c.status === 'passed').length, color: '#f87171' },
                { label: 'Invested', value: MOCK_COMPANIES.filter(c => c.status === 'invested').length, color: '#a78bfa' },
                { label: 'Enriched', value: MOCK_COMPANIES.filter(c => c.enriched).length, color: '#34d399' },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center p-2.5 rounded-xl"
                  style={{ background: `${color}08`, border: `1px solid ${color}18` }}>
                  <div className="font-display font-700 text-xl" style={{ color }}>{value}</div>
                  <div className="text-[10px] text-surface-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl p-4"
            style={{ background: 'rgba(13,16,30,0.7)', border: '1px solid rgba(54,61,92,0.5)', backdropFilter: 'blur(12px)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-3.5 h-3.5 text-surface-500" />
              <h3 className="font-display font-600 text-sm text-white">Quick Actions</h3>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Browse All Companies', href: '/companies', icon: Building2, color: '#60a5fa' },
                { label: 'Saved Searches', href: '/saved', icon: Star, color: '#fbbf24' },
                { label: 'Manage Lists', href: '/lists', icon: Users, color: '#38cc84' },
              ].map(({ label, href, icon: Icon, color }) => (
                <Link key={href} href={href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-800/50 transition-all group"
                  style={{ border: '1px solid rgba(54,61,92,0.4)' }}>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}12` }}>
                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                  </div>
                  <span className="text-sm text-surface-300 group-hover:text-white transition-colors flex-1">{label}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-surface-600 group-hover:text-accent-400 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
