import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function scoreColor(score: number): string {
  if (score >= 90) return 'text-accent-400';
  if (score >= 75) return 'text-amber-400';
  return 'text-surface-400';
}

export function scoreBarColor(score: number): string {
  if (score >= 90) return 'bg-accent-400';
  if (score >= 75) return 'bg-amber-400';
  return 'bg-surface-500';
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    new: 'bg-surface-700 text-surface-300',
    watching: 'bg-amber-500/20 text-amber-400',
    contacted: 'bg-blue-500/20 text-blue-400',
    passed: 'bg-red-500/20 text-red-400',
    portfolio: 'bg-accent-500/20 text-accent-400',
  };
  return map[status] || 'bg-surface-700 text-surface-300';
}

export function signalIcon(type: string): string {
  const map: Record<string, string> = {
    funding: '💰',
    hiring: '👥',
    product: '🚀',
    partnership: '🤝',
    news: '📰',
  };
  return map[type] || '📌';
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}
