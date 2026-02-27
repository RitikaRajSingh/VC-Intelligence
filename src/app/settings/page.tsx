'use client';

import { Settings, Key, Target, Bell, Palette } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="min-h-screen p-6">
      <div className="mb-6">
        <h1 className="font-display font-700 text-xl text-white">Settings</h1>
        <p className="text-surface-500 text-sm mt-0.5">Configure your fund's thesis and API connections</p>
      </div>

      <div className="space-y-4 max-w-2xl">
        {/* API Keys */}
        <div className="bg-surface-900/60 border border-surface-800/60 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-4 h-4 text-amber-400" />
            <h3 className="font-display font-600 text-sm text-white">API Configuration</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Anthropic API Key', placeholder: 'sk-ant-...', env: 'ANTHROPIC_API_KEY', desc: 'Powers live AI enrichment of company profiles' },
              { label: 'Firecrawl API Key', placeholder: 'fc-...', env: 'FIRECRAWL_API_KEY', desc: 'Enhanced web scraping (optional)' },
            ].map(({ label, placeholder, env, desc }) => (
              <div key={env}>
                <div className="text-xs font-500 text-surface-300 mb-1">{label}</div>
                <input
                  placeholder={placeholder}
                  disabled
                  className="w-full bg-surface-800/60 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-500 font-mono focus:outline-none cursor-not-allowed"
                />
                <p className="text-[11px] text-surface-600 mt-1">{desc} — set via <code className="font-mono text-accent-500">{env}</code> in <code className="font-mono text-accent-500">.env.local</code></p>
              </div>
            ))}
          </div>
        </div>

        {/* Thesis */}
        <div className="bg-surface-900/60 border border-surface-800/60 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-accent-400" />
            <h3 className="font-display font-600 text-sm text-white">Investment Thesis</h3>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-xs font-500 text-surface-300 mb-1">Thesis Statement</div>
              <textarea
                defaultValue="AI-first B2B SaaS companies at Seed to Series A, solving workflow automation problems for mid-market and enterprise customers. Check size $500K–$15M."
                rows={3}
                className="w-full bg-surface-800/60 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-500/50 resize-none leading-relaxed"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs font-500 text-surface-300 mb-1">Preferred Stages</div>
                <input defaultValue="Seed, Series A" className="w-full bg-surface-800/60 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-500/50" />
              </div>
              <div>
                <div className="text-xs font-500 text-surface-300 mb-1">Check Size Range</div>
                <input defaultValue="$500K – $15M" className="w-full bg-surface-800/60 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-500/50" />
              </div>
            </div>
          </div>
          <button className="mt-3 px-3 py-1.5 rounded-lg bg-accent-500/10 border border-accent-500/30 text-accent-400 text-xs font-500 hover:bg-accent-500/20 transition-all">
            Save Thesis
          </button>
        </div>

        {/* Notifications */}
        <div className="bg-surface-900/60 border border-surface-800/60 rounded-xl p-5 backdrop-blur-sm opacity-60">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-surface-500" />
            <h3 className="font-display font-600 text-sm text-white">Alerts & Notifications</h3>
            <span className="text-[10px] font-600 px-2 py-0.5 rounded-full bg-surface-800 text-surface-500">Coming Soon</span>
          </div>
          <p className="text-xs text-surface-500">Email digests, Slack alerts, and webhook integrations for new high-score matches.</p>
        </div>
      </div>
    </div>
  );
}
