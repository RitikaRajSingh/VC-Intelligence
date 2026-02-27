'use client';

import { useState, useMemo, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, ArrowUpDown, ArrowUp, ArrowDown, Download, ChevronLeft, ChevronRight, X, Globe, BookmarkPlus, Check } from 'lucide-react';
import { MOCK_COMPANIES } from '@/lib/mockData';
import { Company, SearchFilters, SavedSearch } from '@/types';
import { cn, formatCurrency, scoreColor, scoreBarColor, statusColor, generateId } from '@/lib/utils';

const STAGES = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C+'];
const SECTORS = ['Fintech', 'Healthtech', 'Developer Tools', 'Climatetech', 'Legal Tech', 'Cloud Infrastructure', 'E-commerce', 'Deep Tech'];
const STATUSES = ['new', 'watching', 'contacted', 'passed', 'portfolio'];
const PAGE_SIZE = 10;
type SortKey = 'name' | 'thesisScore' | 'founded' | 'funding.total' | 'headcount';

function CompaniesContent() {
  const searchParams = useSearchParams();
  const [statusTick, setStatusTick] = useState(0);

  useEffect(() => {
    // Re-read statuses every 2s so companies list stays in sync after visiting a company
    const interval = setInterval(() => setStatusTick(t => t + 1), 2000);
    return () => clearInterval(interval);
  }, []);

  // Get effective status: localStorage override > mock data default
  const getStatus = (companyId: string, fallback: string) => {
    try { return localStorage.getItem(`status_${companyId}`) || fallback; } catch { return fallback; }
  };

  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get('q') || searchParams.get('name') || '',
    stage: searchParams.get('stage') ? searchParams.get('stage')!.split(',') : [],
    sector: searchParams.get('sector') ? searchParams.get('sector')!.split(',') : [],
    status: searchParams.get('status') ? searchParams.get('status')!.split(',') : [],
    minScore: searchParams.get('minScore') ? Number(searchParams.get('minScore')) : 0,
    location: searchParams.get('location') || '',
    tags: [],
  });
  const [showFilters, setShowFilters] = useState(
    !!(searchParams.get('stage') || searchParams.get('sector') || searchParams.get('status') || searchParams.get('minScore'))
  );
  const [sortKey, setSortKey] = useState<SortKey>('thesisScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    // statusTick forces re-evaluation when localStorage changes
    void statusTick;
    let result = [...MOCK_COMPANIES];
    if (filters.query) {
      const q = filters.query.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.tagline.toLowerCase().includes(q) ||
        c.sector.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (filters.stage.length > 0) result = result.filter(c => filters.stage.includes(c.stage));
    if (filters.sector.length > 0) result = result.filter(c => filters.sector.includes(c.sector));
    if (filters.status.length > 0) result = result.filter(c => filters.status.includes(getStatus(c.id, c.status)));
    if (filters.minScore > 0) result = result.filter(c => c.thesisScore >= filters.minScore);
    if (filters.location) result = result.filter(c => c.location.toLowerCase().includes(filters.location.toLowerCase()));

    result.sort((a, b) => {
      let av: number | string, bv: number | string;
      if (sortKey === 'funding.total') { av = a.funding.total; bv = b.funding.total; }
      else if (sortKey === 'name') { av = a.name; bv = b.name; }
      else { av = (a as any)[sortKey]; bv = (b as any)[sortKey]; }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [filters, sortKey, sortDir]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const toggleFilter = (key: 'stage' | 'sector' | 'status', val: string) => {
    setFilters(f => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter((v: string) => v !== val) : [...f[key], val],
    }));
    setPage(1);
  };

  const exportCSV = () => {
    const rows = (selected.size > 0 ? filtered.filter(c => selected.has(c.id)) : filtered);
    const csv = [
      ['Name', 'Stage', 'Sector', 'Score', 'Status', 'Funding', 'Founded', 'Location', 'Website'].join(','),
      ...rows.map(c => [c.name, c.stage, c.sector, c.thesisScore, c.status, formatCurrency(c.funding.total), c.founded, c.location, c.website].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'companies.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown className="w-3 h-3 text-surface-600" />;
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-accent-400" /> : <ArrowDown className="w-3 h-3 text-accent-400" />;
  };

  const activeFilterCount = filters.stage.length + filters.sector.length + filters.status.length + (filters.minScore > 0 ? 1 : 0) + (filters.location ? 1 : 0);
  const [showSaveSearch, setShowSaveSearch] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [searchSaved, setSearchSaved] = useState(false);

  const saveCurrentSearch = () => {
    if (!saveSearchName.trim()) return;
    const search: SavedSearch = {
      id: generateId(),
      name: saveSearchName.trim(),
      filters,
      createdAt: new Date().toISOString(),
      lastRun: new Date().toISOString(),
    };
    const stored = localStorage.getItem('vc_saved_searches');
    const existing: SavedSearch[] = stored ? JSON.parse(stored) : [];
    localStorage.setItem('vc_saved_searches', JSON.stringify([...existing, search]));
    setSaveSearchName('');
    setShowSaveSearch(false);
    setSearchSaved(true);
    setTimeout(() => setSearchSaved(false), 2500);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-700 text-xl text-white">Companies</h1>
          <p className="text-surface-500 text-sm mt-0.5">{filtered.length} companies in pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-500/10 border border-accent-500/30 text-accent-400 text-xs font-500 hover:bg-accent-500/20 transition-all">
              <Download className="w-3.5 h-3.5" /> Export {selected.size} selected
            </button>
          )}
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-800 border border-surface-700 text-surface-300 text-xs font-500 hover:bg-surface-700 transition-all">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button onClick={() => setShowSaveSearch(!showSaveSearch)}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-500 transition-all",
              searchSaved ? "bg-accent-500/20 border-accent-500/30 text-accent-400" : "bg-surface-800 border-surface-700 text-surface-300 hover:bg-surface-700"
            )}>
            {searchSaved ? <Check className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
            {searchSaved ? "Search Saved!" : "Save Search"}
          </button>
        </div>
      </div>

      {/* Save Search Modal */}
      {showSaveSearch && (
        <div className="mb-3 p-4 bg-surface-900/80 border border-surface-700/60 rounded-xl backdrop-blur-sm animate-slide-up flex items-center gap-3">
          <BookmarkPlus className="w-4 h-4 text-accent-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-surface-500 mb-1">Save current filters as named search</div>
            <input
              autoFocus
              value={saveSearchName}
              onChange={e => setSaveSearchName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveCurrentSearch(); if (e.key === 'Escape') setShowSaveSearch(false); }}
              placeholder="e.g. High-Score AI Seed Companies"
              className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-surface-500 focus:outline-none focus:border-accent-500/50"
            />
          </div>
          <button onClick={saveCurrentSearch} disabled={!saveSearchName.trim()}
            className="px-4 py-1.5 rounded-lg bg-accent-500 text-white text-xs font-500 hover:bg-accent-400 disabled:opacity-40 transition-all flex-shrink-0">
            Save
          </button>
          <button onClick={() => setShowSaveSearch(false)} className="text-surface-500 hover:text-surface-300 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-surface-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search companies, sectors, tags..."
            value={filters.query}
            onChange={e => { setFilters(f => ({ ...f, query: e.target.value })); setPage(1); }}
            className="w-full bg-surface-900 border border-surface-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-surface-500 focus:outline-none focus:border-accent-500/50 transition-colors"
          />
          {filters.query && (
            <button onClick={() => setFilters(f => ({ ...f, query: '' }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn('flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-500 transition-all',
            showFilters || activeFilterCount > 0
              ? 'bg-accent-500/10 border-accent-500/30 text-accent-400'
              : 'bg-surface-900 border-surface-700 text-surface-400 hover:text-surface-200 hover:border-surface-600'
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-accent-500 text-white text-[10px] font-700 flex items-center justify-center">{activeFilterCount}</span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="mb-4 p-4 bg-surface-900/60 border border-surface-800/60 rounded-xl backdrop-blur-sm animate-slide-up">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-surface-500 font-500 mb-2">Stage</div>
              <div className="flex flex-wrap gap-1.5">
                {STAGES.map(s => (
                  <button key={s} onClick={() => toggleFilter('stage', s)}
                    className={cn('px-2 py-1 rounded-md text-xs font-500 transition-all', filters.stage.includes(s) ? 'bg-accent-500/20 text-accent-300 border border-accent-500/40' : 'bg-surface-800 text-surface-400 border border-surface-700 hover:text-surface-200')}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-surface-500 font-500 mb-2">Sector</div>
              <div className="flex flex-wrap gap-1.5">
                {SECTORS.map(s => (
                  <button key={s} onClick={() => toggleFilter('sector', s)}
                    className={cn('px-2 py-1 rounded-md text-xs font-500 transition-all', filters.sector.includes(s) ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'bg-surface-800 text-surface-400 border border-surface-700 hover:text-surface-200')}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-surface-500 font-500 mb-2">Status</div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {STATUSES.map(s => (
                  <button key={s} onClick={() => toggleFilter('status', s)}
                    className={cn('px-2 py-1 rounded-md text-xs font-500 capitalize transition-all', filters.status.includes(s) ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-surface-800 text-surface-400 border border-surface-700 hover:text-surface-200')}>
                    {s}
                  </button>
                ))}
              </div>
              <div className="text-[11px] uppercase tracking-wider text-surface-500 font-500 mb-1">Min Score: {filters.minScore}</div>
              <input type="range" min="0" max="100" value={filters.minScore}
                onChange={e => { setFilters(f => ({ ...f, minScore: Number(e.target.value) })); setPage(1); }}
                className="w-full accent-accent-500"
              />
              <input placeholder="Filter by location..." value={filters.location}
                onChange={e => { setFilters(f => ({ ...f, location: e.target.value })); setPage(1); }}
                className="w-full mt-2 bg-surface-800 border border-surface-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-surface-500 focus:outline-none focus:border-accent-500/50"
              />
            </div>
          </div>
          {activeFilterCount > 0 && (
            <button onClick={() => { setFilters({ query: '', stage: [], sector: [], status: [], minScore: 0, location: '', tags: [] }); setPage(1); }}
              className="mt-3 text-xs text-surface-500 hover:text-red-400 transition-colors flex items-center gap-1">
              <X className="w-3 h-3" /> Clear all filters
            </button>
          )}
        </div>
      )}

      <div className="bg-surface-900/60 border border-surface-800/60 rounded-xl overflow-hidden backdrop-blur-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-800/60">
              <th className="py-3 px-4 w-8">
                <input type="checkbox" className="accent-accent-500" onChange={e => setSelected(e.target.checked ? new Set(paginated.map(c => c.id)) : new Set())} />
              </th>
              {([
                ['Company', 'name'],
                ['Stage', null],
                ['Sector', null],
                ['Score', 'thesisScore'],
                ['Funding', 'funding.total'],
                ['Founded', 'founded'],
                ['Status', null],
              ] as [string, SortKey | null][]).map(([label, key]) => (
                <th key={label} className="py-3 px-4 text-left">
                  {key ? (
                    <button onClick={() => handleSort(key)} className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-surface-500 font-500 hover:text-surface-300 transition-colors">
                      {label} <SortIcon k={key} />
                    </button>
                  ) : (
                    <span className="text-[11px] uppercase tracking-wider text-surface-500 font-500">{label}</span>
                  )}
                </th>
              ))}
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody>
            {paginated.map((company) => (
              <tr key={company.id} className="border-b border-surface-800/40 table-row-hover transition-colors">
                <td className="py-3 px-4">
                  <input type="checkbox" className="accent-accent-500" checked={selected.has(company.id)}
                    onChange={e => setSelected(prev => { const s = new Set(prev); e.target.checked ? s.add(company.id) : s.delete(company.id); return s; })} />
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-surface-700 to-surface-800 border border-surface-700 flex items-center justify-center text-xs font-700 text-white flex-shrink-0">
                      {company.name[0]}
                    </div>
                    <div>
                      <Link href={`/companies/${company.id}`} className="text-sm font-500 text-white hover:text-accent-300 transition-colors">
                        {company.name}
                      </Link>
                      <div className="text-xs text-surface-500 truncate max-w-[160px]">{company.tagline}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-surface-800 text-surface-300 border border-surface-700">{company.stage}</span>
                </td>
                <td className="py-3 px-4 text-xs text-surface-400">{company.sector}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className={`font-display font-700 text-sm ${scoreColor(company.thesisScore)}`}>{company.thesisScore}</div>
                    <div className="flex-1 h-1 bg-surface-800 rounded-full overflow-hidden w-12">
                      <div className={`h-full rounded-full ${scoreBarColor(company.thesisScore)}`} style={{ width: `${company.thesisScore}%` }} />
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-xs font-mono text-surface-300">{formatCurrency(company.funding.total)}</td>
                <td className="py-3 px-4 text-xs text-surface-400">{company.founded}</td>
                <td className="py-3 px-4">
                  {(() => {
                    const s = getStatus(company.id, company.status);
                    return <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusColor(s)}`}>{s}</span>;
                  })()}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <a href={company.website} target="_blank" rel="noopener noreferrer"
                      title="Visit live website"
                      className="flex items-center gap-1 text-xs text-surface-500 hover:text-blue-400 transition-colors">
                      <Globe className="w-3.5 h-3.5" />
                    </a>
                    <Link href={`/companies/${company.id}`} className="text-xs text-accent-500 hover:text-accent-300 transition-colors">View →</Link>
                  </div>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={9} className="py-12 text-center text-surface-500 text-sm">No companies match your filters.</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-4 py-3 border-t border-surface-800/60">
          <div className="text-xs text-surface-500">
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-surface-700 text-surface-400 hover:text-white hover:border-surface-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={cn('w-7 h-7 flex items-center justify-center rounded-lg text-xs font-500 transition-all', page === p ? 'bg-accent-500 text-white' : 'border border-surface-700 text-surface-400 hover:text-white hover:border-surface-600')}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-surface-700 text-surface-400 hover:text-white hover:border-surface-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CompaniesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen p-6 flex items-center justify-center text-surface-500">Loading...</div>}>
      <CompaniesContent />
    </Suspense>
  );
}
