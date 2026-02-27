'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bookmark, Plus, Trash2, Download, X, Edit2, Check } from 'lucide-react';
import { MOCK_COMPANIES } from '@/lib/mockData';
import { List } from '@/types';
import { generateId } from '@/lib/utils';

const LIST_COLORS = ['#14b066', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ListsPage() {
  const [lists, setLists] = useState<List[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('vc_lists');
    if (stored) setLists(JSON.parse(stored));
  }, []);

  const save = (updated: List[]) => {
    setLists(updated);
    localStorage.setItem('vc_lists', JSON.stringify(updated));
  };

  const createList = () => {
    if (!newName.trim()) return;
    const list: List = {
      id: generateId(),
      name: newName.trim(),
      description: newDesc.trim(),
      companyIds: [],
      createdAt: new Date().toISOString(),
      color: LIST_COLORS[lists.length % LIST_COLORS.length],
    };
    save([...lists, list]);
    setNewName(''); setNewDesc(''); setShowCreate(false);
  };

  const deleteList = (id: string) => save(lists.filter(l => l.id !== id));

  const removeCompany = (listId: string, companyId: string) => {
    save(lists.map(l => l.id === listId ? { ...l, companyIds: l.companyIds.filter(c => c !== companyId) } : l));
  };

  const exportList = (list: List, format: 'csv' | 'json') => {
    const companies = MOCK_COMPANIES.filter(c => list.companyIds.includes(c.id));
    let content: string, filename: string, type: string;
    if (format === 'json') {
      content = JSON.stringify(companies, null, 2);
      filename = `${list.name}.json`;
      type = 'application/json';
    } else {
      content = [
        ['Name', 'Stage', 'Sector', 'Score', 'Funding', 'Location', 'Website'].join(','),
        ...companies.map(c => [c.name, c.stage, c.sector, c.thesisScore, c.funding.total, c.location, c.website].join(','))
      ].join('\n');
      filename = `${list.name}.csv`;
      type = 'text/csv';
    }
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const saveEdit = (id: string) => {
    if (!editName.trim()) return;
    save(lists.map(l => l.id === id ? { ...l, name: editName.trim() } : l));
    setEditingId(null);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-700 text-xl text-white">Lists</h1>
          <p className="text-surface-500 text-sm mt-0.5">{lists.length} lists · organize and track companies</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent-500 text-white text-sm font-500 hover:bg-accent-400 transition-all shadow-lg shadow-accent-900/30">
          <Plus className="w-4 h-4" /> New List
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="mb-5 p-5 bg-surface-900/60 border border-surface-800/60 rounded-xl backdrop-blur-sm animate-slide-up">
          <h3 className="font-display font-600 text-sm text-white mb-3">Create New List</h3>
          <div className="flex gap-3">
            <input value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createList()}
              placeholder="List name (e.g. Q3 Pipeline, Hot AI Deals)"
              className="flex-1 bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-surface-500 focus:outline-none focus:border-accent-500/50"
            />
            <input value={newDesc} onChange={e => setNewDesc(e.target.value)}
              placeholder="Optional description"
              className="flex-1 bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-surface-500 focus:outline-none focus:border-accent-500/50"
            />
            <button onClick={createList} disabled={!newName.trim()}
              className="px-4 py-2 rounded-lg bg-accent-500 text-white text-sm font-500 hover:bg-accent-400 disabled:opacity-40 transition-all">
              Create
            </button>
            <button onClick={() => setShowCreate(false)} className="p-2 text-surface-500 hover:text-surface-300 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Lists Grid */}
      {lists.length === 0 ? (
        <div className="bg-surface-900/60 border border-surface-800/60 rounded-2xl p-12 text-center backdrop-blur-sm">
          <div className="w-12 h-12 rounded-xl bg-surface-800 flex items-center justify-center mx-auto mb-4">
            <Bookmark className="w-6 h-6 text-surface-500" />
          </div>
          <h3 className="font-display font-600 text-lg text-white mb-2">No lists yet</h3>
          <p className="text-surface-400 text-sm mb-5">Create lists to organize companies — Hot AI Deals, Q3 Pipeline, etc.</p>
          <button onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-xl bg-accent-500 text-white text-sm font-500 hover:bg-accent-400 transition-all">
            Create your first list
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {lists.map(list => {
            const companies = MOCK_COMPANIES.filter(c => list.companyIds.includes(c.id));
            return (
              <div key={list.id} className="bg-surface-900/60 border border-surface-800/60 rounded-xl p-5 backdrop-blur-sm hover:border-surface-700/60 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: list.color }} />
                    {editingId === list.id ? (
                      <div className="flex items-center gap-2">
                        <input value={editName} onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveEdit(list.id); if (e.key === 'Escape') setEditingId(null); }}
                          className="bg-surface-800 border border-surface-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-accent-500/50"
                          autoFocus
                        />
                        <button onClick={() => saveEdit(list.id)} className="text-accent-400 hover:text-accent-300">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-surface-500 hover:text-surface-300">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-600 text-base text-white">{list.name}</h3>
                          <button onClick={() => { setEditingId(list.id); setEditName(list.name); }}
                            className="opacity-0 group-hover:opacity-100 text-surface-600 hover:text-surface-400 transition-all">
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                        {list.description && <p className="text-xs text-surface-500 mt-0.5">{list.description}</p>}
                      </div>
                    )}
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-surface-800 text-surface-400">{companies.length} companies</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => exportList(list, 'csv')}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-surface-400 hover:text-white hover:bg-surface-800 transition-all">
                      <Download className="w-3 h-3" /> CSV
                    </button>
                    <button onClick={() => exportList(list, 'json')}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-surface-400 hover:text-white hover:bg-surface-800 transition-all">
                      <Download className="w-3 h-3" /> JSON
                    </button>
                    <button onClick={() => deleteList(list.id)}
                      className="p-1.5 rounded-lg text-surface-600 hover:text-red-400 hover:bg-red-400/10 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {companies.length === 0 ? (
                  <div className="py-6 text-center text-surface-600 text-sm border border-dashed border-surface-800 rounded-lg">
                    No companies added yet — open a company profile and click "Save to List"
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {companies.map(company => (
                      <div key={company.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-surface-800/50 border border-surface-700/50 group">
                        <div className="w-6 h-6 rounded bg-surface-700 flex items-center justify-center text-[10px] font-700 text-white flex-shrink-0">
                          {company.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link href={`/companies/${company.id}`} className="text-xs font-500 text-white hover:text-accent-300 transition-colors truncate block">{company.name}</Link>
                          <div className="text-[10px] text-surface-500">{company.stage} · {company.sector}</div>
                        </div>
                        <button onClick={() => removeCompany(list.id, company.id)}
                          className="opacity-0 group-hover:opacity-100 text-surface-600 hover:text-red-400 transition-all">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3 text-[10px] text-surface-600">
                  Created {new Date(list.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
