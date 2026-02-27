'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Trash2, Play, Clock, X, Filter, Building2 } from 'lucide-react';
import { SavedSearch, SearchFilters } from '@/types';
import { generateId } from '@/lib/utils';

export default function SavedSearchesPage() {
  const router = useRouter();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [showSave, setShowSave] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [companyNameFilter, setCompanyNameFilter] = useState('');
  const [queryFilter, setQueryFilter] = useState('');
  const [currentFilters] = useState<SearchFilters>({
    query: 'AI SaaS', stage: ['Seed', 'Series A'], sector: [], status: ['watching'],
    minScore: 75, location: '', tags: [],
  });

  useEffect(() => {
    const stored = localStorage.getItem('vc_saved_searches');
    if (stored) setSearches(JSON.parse(stored));
    else {
      const examples: SavedSearch[] = [
        {
          id: generateId(),
          name: 'High-Score AI SaaS',
          filters: { query: 'AI', stage: ['Seed', 'Series A'], sector: [], status: [], minScore: 80, location: '', tags: [] },
          createdAt: new Date().toISOString(),
          lastRun: new Date().toISOString(),
        },
        {
          id: generateId(),
          name: 'Watching List',
          filters: { query: '', stage: [], sector: [], status: ['watching'], minScore: 0, location: '', tags: [] },
          createdAt: new Date().toISOString(),
          lastRun: new Date().toISOString(),
        },
        {
          id: generateId(),
          name: 'Productivity Tools',
          filters: { query: 'productivity', stage: [], sector: [], status: [], minScore: 0, location: '', tags: [] },
          createdAt: new Date().toISOString(),
          lastRun: new Date().toISOString(),
        },
      ];
      setSearches(examples);
      localStorage.setItem('vc_saved_searches', JSON.stringify(examples));
    }
  }, []);

  const save = (updated: SavedSearch[]) => {
    setSearches(updated);
    localStorage.setItem('vc_saved_searches', JSON.stringify(updated));
  };

  const saveSearch = () => {
    if (!searchName.trim()) return;
    const s: SavedSearch = {
      id: generateId(), name: searchName.trim(), filters: currentFilters,
      createdAt: new Date().toISOString(),
    };
    save([...searches, s]);
    setSearchName(''); setShowSave(false);
  };

  const runSearch = (search: SavedSearch) => {
    save(searches.map(s => s.id === search.id ? { ...s, lastRun: new Date().toISOString() } : s));
    const params = new URLSearchParams();
    if (search.filters.query) params.set('q', search.filters.query);
    if (search.filters.stage.length) params.set('stage', search.filters.stage.join(','));
    if (search.filters.sector.length) params.set('sector', search.filters.sector.join(','));
    if (search.filters.status.length) params.set('status', search.filters.status.join(','));
    if (search.filters.minScore > 0) params.set('minScore', String(search.filters.minScore));
    router.push(`/companies?${params.toString()}`);
  };

  const runCustomSearch = () => {
    const params = new URLSearchParams();
    if (companyNameFilter.trim()) params.set('name', companyNameFilter.trim());
    if (queryFilter.trim()) params.set('q', queryFilter.trim());
    router.push(`/companies?${params.toString()}`);
  };

  const deleteSearch = (id: string) => save(searches.filter(s => s.id !== id));

  const formatFilters = (f: SearchFilters) => {
    const parts: string[] = [];
    if (f.query) parts.push(`"${f.query}"`);
    if (f.stage.length) parts.push(`Stage: ${f.stage.join(', ')}`);
    if (f.sector.length) parts.push(`Sector: ${f.sector.join(', ')}`);
    if (f.status.length) parts.push(`Status: ${f.status.join(', ')}`);
    if (f.minScore > 0) parts.push(`Score >= ${f.minScore}`);
    if (f.location) parts.push(`Location: ${f.location}`);
    return parts.length > 0 ? parts.join(' · ') : 'No filters applied';
  };

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-700 text-xl text-white">Saved Searches</h1>
          <p className="text-surface-500 text-sm mt-0.5">Save filter combinations for quick access</p>
        </div>
        <button onClick={() => setShowSave(!showSave)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent-500 text-white text-sm font-500 hover:bg-accent-400 transition-all shadow-lg shadow-accent-900/30">
          <Plus className="w-4 h-4" /> Save Current Search
        </button>
      </div>

      {/* Quick Search Bar */}
      <div className="mb-6 p-5 bg-surface-900/60 border border-surface-800/60 rounded-xl backdrop-blur-sm">
        <h3 className="font-display font-600 text-sm text-white mb-4 flex items-center gap-2">
          <Search className="w-4 h-4 text-accent-400" /> Quick Search
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Building2 className="w-4 h-4 text-surface-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={companyNameFilter}
              onChange={e => setCompanyNameFilter(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runCustomSearch()}
              placeholder="Company name..."
              className="w-full bg-surface-800 border border-surface-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-surface-500 focus:outline-none focus:border-accent-500/50 transition-colors"
            />
          </div>
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-surface-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={queryFilter}
              onChange={e => setQueryFilter(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runCustomSearch()}
              placeholder="Search query (e.g. productivity, AI, fintech)..."
              className="w-full bg-surface-800 border border-surface-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-surface-500 focus:outline-none focus:border-accent-500/50 transition-colors"
            />
          </div>
          <button
            onClick={runCustomSearch}
            disabled={!companyNameFilter.trim() && !queryFilter.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent-500 text-white text-sm font-600 hover:bg-accent-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-accent-900/30 flex-shrink-0">
            <Play className="w-4 h-4" /> Run Search
          </button>
        </div>
        <p className="text-xs text-surface-600 mt-2">
          Tip: Query mein "productivity" likho — Companies page sirf wahi companies dikhayega
        </p>
      </div>

      {/* Save Form */}
      {showSave && (
        <div className="mb-5 p-5 bg-surface-900/60 border border-surface-800/60 rounded-xl backdrop-blur-sm animate-slide-up">
          <h3 className="font-display font-600 text-sm text-white mb-3">Save Search</h3>
          <div className="mb-3 p-3 bg-surface-800/60 rounded-lg border border-surface-700">
            <div className="text-[10px] uppercase tracking-wider text-surface-500 mb-1">Current Filters Preview</div>
            <div className="text-xs text-surface-300">{formatFilters(currentFilters)}</div>
          </div>
          <div className="flex gap-2">
            <input value={searchName} onChange={e => setSearchName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveSearch()}
              placeholder="Search name (e.g. Q3 AI Prospects)"
              className="flex-1 bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-surface-500 focus:outline-none focus:border-accent-500/50"
              autoFocus
            />
            <button onClick={saveSearch} disabled={!searchName.trim()}
              className="px-4 py-2 rounded-lg bg-accent-500 text-white text-sm font-500 hover:bg-accent-400 disabled:opacity-40 transition-all">
              Save
            </button>
            <button onClick={() => setShowSave(false)} className="p-2 text-surface-500 hover:text-surface-300 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Saved Searches List */}
      {searches.length === 0 ? (
        <div className="bg-surface-900/60 border border-surface-800/60 rounded-2xl p-12 text-center backdrop-blur-sm">
          <div className="w-12 h-12 rounded-xl bg-surface-800 flex items-center justify-center mx-auto mb-4">
            <Search className="w-6 h-6 text-surface-500" />
          </div>
          <h3 className="font-display font-600 text-lg text-white mb-2">No saved searches</h3>
          <p className="text-surface-400 text-sm">Save filter combinations to quickly re-run your favorite searches.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {searches.map(search => (
            <div key={search.id} className="bg-surface-900/60 border border-surface-800/60 rounded-xl p-5 backdrop-blur-sm hover:border-surface-700/60 transition-all group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Search className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-display font-600 text-base text-white">{search.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Filter className="w-3 h-3 text-surface-600" />
                      <span className="text-xs text-surface-500">{formatFilters(search.filters)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {search.lastRun && (
                    <div className="flex items-center gap-1 text-[11px] text-surface-600">
                      <Clock className="w-3 h-3" />
                      Last run {new Date(search.lastRun).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  )}
                  <button onClick={() => runSearch(search)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-500/10 border border-accent-500/30 text-accent-400 text-xs font-500 hover:bg-accent-500/20 transition-all">
                    <Play className="w-3 h-3" /> Run
                  </button>
                  <button onClick={() => deleteSearch(search.id)}
                    className="p-1.5 rounded-lg text-surface-600 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
