'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Globe, Linkedin, Zap, Bookmark, ExternalLink,
  Users, Calendar, MapPin, CheckCircle,
  AlertCircle, Clock, FileText, Plus, Trash2,
  RefreshCw, Monitor, Pencil, StickyNote
} from 'lucide-react';
import { MOCK_COMPANIES } from '@/lib/mockData';
import { Company, EnrichmentData, List } from '@/types';
import { cn, formatCurrency, formatDate, scoreColor, statusColor, signalIcon, generateId } from '@/lib/utils';

const STATUSES = ['new', 'watching', 'contacted', 'passed', 'portfolio'];
const LIST_COLORS = ['#14b066', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface Note {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Status auto-logic ──────────────────────────────────────────────────────────
// 'new'       → never opened
// 'watching'  → opened/visited (auto-set on first open)
// 'contacted' → manually set by user
// 'passed'    → manually set by user
// 'portfolio' → manually set by user
//
// Rule: if current status is 'new', auto-upgrade to 'watching' on page load
// ──────────────────────────────────────────────────────────────────────────────

export default function CompanyProfile() {
  const params = useParams();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [enrichment, setEnrichment] = useState<EnrichmentData | null>(null);
  const [enriching, setEnriching] = useState(false);
  const [enrichError, setEnrichError] = useState<string | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [showAddToList, setShowAddToList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'signals' | 'enrichment'>('overview');
  const [status, setStatus] = useState<string>('');
  const [websiteLoading, setWebsiteLoading] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  useEffect(() => {
    const found = MOCK_COMPANIES.find(c => c.id === params.id);
    if (!found) return;

    setCompany(found);

    // ── Auto status logic ──────────────────────────────────────────────────
    // Check if user has manually set a status for this company
    const savedStatus = localStorage.getItem(`status_${found.id}`);
    
    if (savedStatus) {
      // User had previously set a status — use it
      setStatus(savedStatus);
    } else if (found.status === 'new') {
      // First time opening — auto-upgrade from 'new' → 'watching'
      setStatus('watching');
      localStorage.setItem(`status_${found.id}`, 'watching');
      // Track visited companies for "This Week" sidebar stats
      trackVisit(found.id);
    } else {
      // Company has a non-new status already (contacted/passed/etc from mock data)
      setStatus(found.status);
      localStorage.setItem(`status_${found.id}`, found.status);
    }
    // ── end auto status ────────────────────────────────────────────────────

    // Load notes
    const stored = localStorage.getItem(`notes_v2_${found.id}`);
    if (stored) {
      setNotes(JSON.parse(stored));
    } else if (found.notes) {
      const migrated: Note[] = [{
        id: generateId(),
        text: found.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }];
      setNotes(migrated);
      localStorage.setItem(`notes_v2_${found.id}`, JSON.stringify(migrated));
    }

    // Load enrichment
    const storedEnrich = localStorage.getItem(`enrichment_${found.id}`);
    if (storedEnrich) setEnrichment(JSON.parse(storedEnrich));

    // Load lists
    const storedLists = localStorage.getItem('vc_lists');
    if (storedLists) setLists(JSON.parse(storedLists));
  }, [params.id]);

  // Track which company IDs were visited this week (for sidebar stats)
  function trackVisit(companyId: string) {
    const key = 'vc_visited_this_week';
    const stored = localStorage.getItem(key);
    const visited: string[] = stored ? JSON.parse(stored) : [];
    if (!visited.includes(companyId)) {
      localStorage.setItem(key, JSON.stringify([...visited, companyId]));
    }
  }

  if (!company) return (
    <div className="min-h-screen p-6 flex items-center justify-center">
      <div className="text-surface-500">Company not found.</div>
    </div>
  );

  // ── Status change handler ──────────────────────────────────────────────────
  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    localStorage.setItem(`status_${company.id}`, newStatus);

    // If user manually sets 'contacted', track it for sidebar
    if (newStatus === 'contacted') {
      const key = 'vc_contacted_this_week';
      const stored = localStorage.getItem(key);
      const contacted: string[] = stored ? JSON.parse(stored) : [];
      if (!contacted.includes(company.id)) {
        localStorage.setItem(key, JSON.stringify([...contacted, company.id]));
      }
    }
  };

  // ── Notes handlers ─────────────────────────────────────────────────────────
  const persistNotes = (updated: Note[]) => {
    setNotes(updated);
    localStorage.setItem(`notes_v2_${company.id}`, JSON.stringify(updated));
  };

  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const note: Note = {
      id: generateId(),
      text: newNoteText.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    persistNotes([note, ...notes]);
    setNewNoteText('');
    setShowNoteInput(false);
  };

  const handleEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setEditingNoteText(note.text);
  };

  const handleSaveEdit = (id: string) => {
    if (!editingNoteText.trim()) return;
    persistNotes(notes.map(n =>
      n.id === id ? { ...n, text: editingNoteText.trim(), updatedAt: new Date().toISOString() } : n
    ));
    setEditingNoteId(null);
    setEditingNoteText('');
  };

  const handleDeleteNote = (id: string) => {
    persistNotes(notes.filter(n => n.id !== id));
    setDeletingNoteId(null);
  };

  // ── Other handlers ─────────────────────────────────────────────────────────
  const handleEnrich = async () => {
    setEnriching(true);
    setEnrichError(null);
    try {
      const res = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: company.website, companyName: company.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Enrichment failed');
      setEnrichment(data);
      localStorage.setItem(`enrichment_${company.id}`, JSON.stringify(data));
      // Track enriched for sidebar
      const key = 'vc_enriched_this_week';
      const stored = localStorage.getItem(key);
      const enriched: string[] = stored ? JSON.parse(stored) : [];
      if (!enriched.includes(company.id)) {
        localStorage.setItem(key, JSON.stringify([...enriched, company.id]));
      }
      setActiveTab('enrichment');
    } catch (err: any) {
      setEnrichError(err.message || 'Failed to enrich company data');
    } finally {
      setEnriching(false);
    }
  };

  const handleVisitWebsite = () => {
    setWebsiteLoading(true);
    setTimeout(() => setWebsiteLoading(false), 1500);
    window.open(company.website, '_blank', 'noopener,noreferrer');
  };

  const handleAddToList = (listId: string) => {
    const updated = lists.map(l =>
      l.id === listId
        ? { ...l, companyIds: l.companyIds.includes(company.id) ? l.companyIds.filter(id => id !== company.id) : [...l.companyIds, company.id] }
        : l
    );
    setLists(updated);
    localStorage.setItem('vc_lists', JSON.stringify(updated));
  };

  const handleCreateList = () => {
    if (!newListName.trim()) return;
    const newList: List = {
      id: generateId(),
      name: newListName.trim(),
      description: '',
      companyIds: [company.id],
      createdAt: new Date().toISOString(),
      color: LIST_COLORS[lists.length % LIST_COLORS.length],
    };
    const updated = [...lists, newList];
    setLists(updated);
    localStorage.setItem('vc_lists', JSON.stringify(updated));
    setNewListName('');
    setShowAddToList(false);
  };

  const isInList = (listId: string) => lists.find(l => l.id === listId)?.companyIds.includes(company.id);
  const totalInLists = lists.filter(l => l.companyIds.includes(company.id)).length;

  return (
    <div className="min-h-screen">
      {/* Top Bar */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-surface-800/60 bg-surface-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-surface-400 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <span className="text-surface-700">/</span>
          <span className="text-sm text-surface-300">{company.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleVisitWebsite}
            className={cn(
              'flex items-center gap-2 px-4 py-1.5 rounded-lg border text-xs font-600 transition-all',
              websiteLoading
                ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20 hover:border-blue-400/50 hover:text-blue-300'
            )}
          >
            {websiteLoading ? <Monitor className="w-3.5 h-3.5 animate-pulse" /> : <Globe className="w-3.5 h-3.5" />}
            {websiteLoading ? 'Opening...' : 'Live Website'}
            <ExternalLink className="w-3 h-3 opacity-70" />
          </button>

          <div className="relative">
            <button onClick={() => setShowAddToList(!showAddToList)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-500 transition-all',
                totalInLists > 0
                  ? 'bg-accent-500/10 border-accent-500/30 text-accent-400 hover:bg-accent-500/20'
                  : 'bg-surface-800 border-surface-700 text-surface-300 hover:bg-surface-700'
              )}>
              <Bookmark className="w-3.5 h-3.5" />
              Save to List
              {totalInLists > 0 && (
                <span className="w-4 h-4 rounded-full bg-accent-500 text-white text-[10px] flex items-center justify-center font-700">
                  {totalInLists}
                </span>
              )}
            </button>
            {showAddToList && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-surface-900 border border-surface-700 rounded-xl p-2 z-20 shadow-2xl animate-slide-up">
                {lists.length > 0 && lists.map(l => (
                  <button key={l.id} onClick={() => handleAddToList(l.id)}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-surface-800 transition-all text-left">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: l.color }} />
                    <span className="text-xs text-surface-200 flex-1">{l.name}</span>
                    <span className="text-[10px] text-surface-500">{l.companyIds.length}</span>
                    {isInList(l.id) && <CheckCircle className="w-3 h-3 text-accent-400 flex-shrink-0" />}
                  </button>
                ))}
                {lists.length === 0 && (
                  <div className="px-2.5 py-2 text-xs text-surface-500">No lists yet. Create one below.</div>
                )}
                <div className="border-t border-surface-700/60 mt-1.5 pt-1.5">
                  <input value={newListName} onChange={e => setNewListName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreateList()}
                    placeholder="New list name..."
                    className="w-full bg-surface-800 border border-surface-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-surface-500 focus:outline-none focus:border-accent-500/50 mb-1.5"
                  />
                  <button onClick={handleCreateList} disabled={!newListName.trim()}
                    className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-accent-500/10 text-accent-400 text-xs hover:bg-accent-500/20 transition-all disabled:opacity-40">
                    <Plus className="w-3 h-3" /> Create & Add
                  </button>
                </div>
              </div>
            )}
          </div>

          <button onClick={handleEnrich} disabled={enriching}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-500 transition-all', enriching
              ? 'bg-accent-500/5 border border-accent-500/20 text-accent-600 cursor-not-allowed'
              : 'bg-accent-500 text-white hover:bg-accent-400 shadow-lg shadow-accent-900/30')}>
            {enriching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            {enriching ? 'Enriching...' : enrichment ? 'Re-Enrich' : 'Enrich with AI'}
          </button>
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto">
        {/* Header Card */}
        <div className="bg-surface-900/60 border border-surface-800/60 rounded-2xl p-6 mb-6 backdrop-blur-sm">
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-surface-700 to-surface-800 border border-surface-700 flex items-center justify-center text-2xl font-800 text-white flex-shrink-0">
              {company.name[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="font-display font-700 text-2xl text-white">{company.name}</h1>
                    {enrichment && <span className="flex items-center gap-1 text-[10px] font-600 uppercase tracking-wider text-accent-400 bg-accent-400/10 px-2 py-0.5 rounded-full"><Zap className="w-2.5 h-2.5" /> Enriched</span>}
                  </div>
                  <p className="text-surface-400 text-sm mb-3">{company.tagline}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-surface-500">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{company.location}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Founded {company.founded}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{company.headcount} employees</span>
                    <button onClick={handleVisitWebsite} className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors font-500">
                      <Globe className="w-3 h-3" />
                      {company.website.replace('https://', '').replace('http://', '')}
                      <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="relative w-16 h-16">
                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#222843" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15.9" fill="none"
                        stroke={company.thesisScore >= 90 ? '#38cc84' : company.thesisScore >= 75 ? '#f59e0b' : '#4e5678'}
                        strokeWidth="3"
                        strokeDasharray={`${company.thesisScore} ${100 - company.thesisScore}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`font-display font-700 text-lg ${scoreColor(company.thesisScore)}`}>{company.thesisScore}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-surface-500 mt-1 uppercase tracking-wider">Thesis Score</div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {company.thesisReasons.map((r, i) => (
                  <span key={i} className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-accent-500/8 border border-accent-500/20 text-accent-400">
                    <CheckCircle className="w-3 h-3" />{r}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-5 pt-5 border-t border-surface-800/60 grid grid-cols-5 gap-4">
            {[
              { label: 'Stage', value: company.stage },
              { label: 'Sector', value: company.sector },
              { label: 'Total Funding', value: formatCurrency(company.funding.total) },
              { label: 'Last Round', value: `${formatCurrency(company.funding.lastRound)} ${company.funding.lastRoundType}` },
              { label: 'Round Date', value: formatDate(company.funding.lastRoundDate) },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-[10px] uppercase tracking-wider text-surface-600 font-500 mb-1">{label}</div>
                <div className="text-sm font-500 text-surface-200">{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Status Row ── */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-surface-500">Status:</span>
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-500 capitalize transition-all',
                  status === s
                    ? statusColor(s)
                    : 'bg-surface-800 text-surface-500 hover:text-surface-300'
                )}
              >
                {s}
              </button>
            ))}
          </div>
          {/* Auto-status hint */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] text-surface-600 italic">Auto-tracked · changes saved</span>
            <div className="flex flex-wrap gap-1">
              {company.tags.map(tag => (
                <span key={tag} className="tag-pill">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-4 bg-surface-900/60 border border-surface-800/60 rounded-xl p-1 w-fit">
          {(['overview', 'signals', 'enrichment'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn('px-4 py-1.5 rounded-lg text-sm font-500 capitalize transition-all', activeTab === tab ? 'bg-surface-800 text-white' : 'text-surface-500 hover:text-surface-300')}>
              {tab}
              {tab === 'enrichment' && enrichment && <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-accent-400 inline-block" />}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-3 gap-5 animate-fade-in">
            <div className="col-span-2 bg-surface-900/60 border border-surface-800/60 rounded-xl p-5">
              <h3 className="font-display font-600 text-sm text-white mb-3">About</h3>
              <p className="text-sm text-surface-300 leading-relaxed">{company.description}</p>
            </div>

            <div className="bg-surface-900/60 border border-surface-800/60 rounded-xl p-5">
              <h3 className="font-display font-600 text-sm text-white mb-3">Founders</h3>
              <div className="space-y-3">
                {company.founders.map((f, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-surface-600 to-surface-800 flex items-center justify-center text-xs font-700 text-white flex-shrink-0">
                      {f.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="text-sm font-500 text-white">{f.name}</div>
                      <div className="text-xs text-surface-500">{f.role} · ex-{f.previousCompany}</div>
                    </div>
                    <a href={f.linkedin} className="ml-auto text-surface-600 hover:text-blue-400 transition-colors">
                      <Linkedin className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Notes Section ── */}
            <div className="col-span-3 bg-surface-900/60 border border-surface-800/60 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-surface-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <StickyNote className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-display font-600 text-sm text-white">Notes</h3>
                    <p className="text-[11px] text-surface-500">{notes.length} {notes.length === 1 ? 'note' : 'notes'} · auto-saved</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowNoteInput(true); setEditingNoteId(null); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-500 hover:bg-amber-500/20 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Note
                </button>
              </div>

              <div className="p-5 space-y-3">
                {showNoteInput && (
                  <div className="bg-surface-800/60 border border-amber-500/30 rounded-xl p-4 animate-slide-up">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      <span className="text-[11px] text-amber-400 font-500 uppercase tracking-wider">New Note</span>
                    </div>
                    <textarea
                      value={newNoteText}
                      onChange={e => setNewNoteText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddNote();
                        if (e.key === 'Escape') { setShowNoteInput(false); setNewNoteText(''); }
                      }}
                      placeholder="Write your note here... (Ctrl+Enter to save)"
                      rows={3}
                      autoFocus
                      className="w-full bg-transparent text-sm text-white placeholder:text-surface-600 focus:outline-none resize-none leading-relaxed"
                    />
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-700/60">
                      <span className="text-[10px] text-surface-600">Ctrl+Enter to save · Esc to cancel</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setShowNoteInput(false); setNewNoteText(''); }}
                          className="px-3 py-1 rounded-lg text-xs text-surface-400 hover:text-surface-200 border border-surface-700 hover:border-surface-600 transition-all">
                          Cancel
                        </button>
                        <button onClick={handleAddNote} disabled={!newNoteText.trim()}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-500 hover:bg-amber-500/30 disabled:opacity-40 transition-all">
                          <CheckCircle className="w-3 h-3" /> Save Note
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {notes.length === 0 && !showNoteInput ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-10 h-10 rounded-xl bg-surface-800/60 border border-surface-700/50 flex items-center justify-center mb-3">
                      <FileText className="w-5 h-5 text-surface-600" />
                    </div>
                    <p className="text-sm text-surface-500 font-500">No notes yet</p>
                    <p className="text-xs text-surface-600 mt-1">Click "Add Note" to capture your thoughts</p>
                  </div>
                ) : (
                  notes.map((note) => (
                    <div key={note.id} className="group relative bg-surface-800/40 border border-surface-700/50 rounded-xl p-4 hover:border-surface-600/60 transition-all">
                      {editingNoteId === note.id ? (
                        <div>
                          <textarea
                            value={editingNoteText}
                            onChange={e => setEditingNoteText(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSaveEdit(note.id);
                              if (e.key === 'Escape') { setEditingNoteId(null); setEditingNoteText(''); }
                            }}
                            rows={3}
                            autoFocus
                            className="w-full bg-surface-800/60 border border-amber-500/30 rounded-lg p-3 text-sm text-white focus:outline-none resize-none leading-relaxed"
                          />
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-[10px] text-surface-600">Ctrl+Enter to save</span>
                            <div className="flex items-center gap-2">
                              <button onClick={() => { setEditingNoteId(null); setEditingNoteText(''); }}
                                className="px-3 py-1 rounded-lg text-xs text-surface-400 hover:text-surface-200 border border-surface-700 hover:border-surface-600 transition-all">
                                Cancel
                              </button>
                              <button onClick={() => handleSaveEdit(note.id)} disabled={!editingNoteText.trim()}
                                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-500 hover:bg-amber-500/30 disabled:opacity-40 transition-all">
                                <CheckCircle className="w-3 h-3" /> Save Changes
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : deletingNoteId === note.id ? (
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-surface-300">Delete this note?</p>
                          <div className="flex items-center gap-2">
                            <button onClick={() => setDeletingNoteId(null)}
                              className="px-3 py-1 rounded-lg text-xs text-surface-400 hover:text-surface-200 border border-surface-700 transition-all">
                              Keep
                            </button>
                            <button onClick={() => handleDeleteNote(note.id)}
                              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-500 hover:bg-red-500/20 transition-all">
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-surface-200 leading-relaxed whitespace-pre-wrap pr-16">{note.text}</p>
                          <div className="flex items-center gap-3 mt-3">
                            <Clock className="w-3 h-3 text-surface-600" />
                            <span className="text-[11px] text-surface-600">
                              {formatRelativeTime(note.createdAt)}
                              {note.updatedAt !== note.createdAt && (
                                <span className="ml-1 text-surface-700">· edited {formatRelativeTime(note.updatedAt)}</span>
                              )}
                            </span>
                          </div>
                          <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => handleEditNote(note)} title="Edit note"
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-700/80 text-surface-400 hover:text-white hover:bg-surface-600 transition-all">
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button onClick={() => setDeletingNoteId(note.id)} title="Delete note"
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-700/80 text-surface-400 hover:text-red-400 hover:bg-red-400/10 transition-all">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'signals' && (
          <div className="animate-fade-in">
            <div className="bg-surface-900/60 border border-surface-800/60 rounded-xl p-5">
              <h3 className="font-display font-600 text-sm text-white mb-4">Signal Timeline</h3>
              <div className="space-y-4">
                {company.signals.map((signal, i) => (
                  <div key={i} className="flex items-start gap-3 group">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-surface-800 border border-surface-700 flex items-center justify-center text-base">
                      {signalIcon(signal.type)}
                    </div>
                    <div className="flex-1 pb-4 border-b border-surface-800/60 last:border-0 last:pb-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-500 text-white">{signal.title}</div>
                          <div className="text-xs text-surface-500 mt-0.5 flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />{formatDate(signal.date)}
                            <span className="text-surface-700">·</span>
                            <span className="text-surface-500">{signal.source}</span>
                          </div>
                        </div>
                        <span className={cn('text-[10px] font-600 uppercase px-2 py-0.5 rounded-full capitalize flex-shrink-0',
                          signal.type === 'funding' ? 'bg-accent-400/10 text-accent-400' :
                          signal.type === 'hiring' ? 'bg-blue-400/10 text-blue-400' :
                          signal.type === 'product' ? 'bg-purple-400/10 text-purple-400' :
                          signal.type === 'partnership' ? 'bg-amber-400/10 text-amber-400' : 'bg-surface-700 text-surface-400'
                        )}>{signal.type}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'enrichment' && (
          <div className="animate-fade-in">
            {enrichError && (
              <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {enrichError}
              </div>
            )}
            {!enrichment && !enriching && (
              <div className="bg-surface-900/60 border border-surface-800/60 rounded-2xl p-12 text-center backdrop-blur-sm">
                <div className="w-12 h-12 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-accent-400" />
                </div>
                <h3 className="font-display font-600 text-lg text-white mb-2">No Enrichment Data</h3>
                <p className="text-surface-400 text-sm mb-6 max-w-sm mx-auto">Click "Enrich with AI" to fetch and analyze {company.name}'s public web presence in real-time.</p>
                <button onClick={handleEnrich} className="px-5 py-2.5 rounded-xl bg-accent-500 text-white text-sm font-600 hover:bg-accent-400 transition-all shadow-lg shadow-accent-900/30">
                  Enrich with AI Now
                </button>
              </div>
            )}
            {enriching && (
              <div className="bg-surface-900/60 border border-surface-800/60 rounded-2xl p-12 text-center backdrop-blur-sm">
                <div className="w-12 h-12 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse-slow">
                  <Zap className="w-6 h-6 text-accent-400" />
                </div>
                <h3 className="font-display font-600 text-lg text-white mb-2">Enriching {company.name}...</h3>
                <p className="text-surface-400 text-sm">Scraping public pages and extracting signals with AI</p>
                <div className="mt-6 flex items-center justify-center gap-4">
                  {['Fetching website', 'Analyzing content', 'Extracting signals', 'Scoring'].map((step, i) => (
                    <div key={step} className="flex items-center gap-1.5 text-xs text-surface-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {enrichment && !enriching && (
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2 bg-surface-900/60 border border-surface-800/60 rounded-xl p-5 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-accent-400" />
                      <h3 className="font-display font-600 text-sm text-white">AI Summary</h3>
                    </div>
                    <span className="text-[10px] text-surface-600 font-mono">{new Date(enrichment.enrichedAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-surface-300 leading-relaxed">{enrichment.summary}</p>
                </div>
                <div className="bg-surface-900/60 border border-surface-800/60 rounded-xl p-5 backdrop-blur-sm">
                  <h3 className="font-display font-600 text-sm text-white mb-3">What They Do</h3>
                  <ul className="space-y-2">
                    {enrichment.whatTheyDo.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-surface-300">
                        <span className="text-accent-500 mt-0.5 flex-shrink-0">•</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-4">
                  <div className="bg-surface-900/60 border border-surface-800/60 rounded-xl p-5 backdrop-blur-sm">
                    <h3 className="font-display font-600 text-sm text-white mb-3">Keywords</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {enrichment.keywords.map((kw, i) => (
                        <span key={i} className="tag-pill">{kw}</span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-surface-900/60 border border-surface-800/60 rounded-xl p-5 backdrop-blur-sm">
                    <h3 className="font-display font-600 text-sm text-white mb-3">Derived Signals</h3>
                    <ul className="space-y-2">
                      {enrichment.signals.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-surface-300">
                          <CheckCircle className="w-3.5 h-3.5 text-accent-400 mt-0.5 flex-shrink-0" />{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="col-span-2 bg-surface-900/60 border border-surface-800/60 rounded-xl p-5 backdrop-blur-sm">
                  <h3 className="font-display font-600 text-sm text-white mb-3">Sources Scraped</h3>
                  <div className="space-y-2">
                    {enrichment.sources.map((src, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <Globe className="w-3 h-3 text-surface-600 flex-shrink-0" />
                        <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors font-mono truncate">{src.url}</a>
                        <span className="text-surface-600 ml-auto flex-shrink-0">{new Date(src.fetchedAt).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                  {enrichment.sources.length === 0 && (
                    <p className="text-xs text-surface-600">Analysis based on company name only — live website was unavailable at enrichment time.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
