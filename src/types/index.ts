export interface Founder {
  name: string;
  role: string;
  linkedin: string;
  previousCompany: string;
}

export interface Signal {
  date: string;
  type: 'funding' | 'hiring' | 'product' | 'partnership' | 'news';
  title: string;
  source: string;
}

export interface Funding {
  total: number;
  lastRound: number;
  lastRoundType: string;
  lastRoundDate: string;
}

export type CompanyStatus = 'new' | 'watching' | 'contacted' | 'passed' | 'portfolio';

export interface Company {
  id: string;
  name: string;
  website: string;
  logo?: string;
  tagline: string;
  description: string;
  stage: string;
  sector: string;
  subSectors: string[];
  founded: number;
  headcount: number;
  location: string;
  country: string;
  funding: Funding;
  founders: Founder[];
  thesisScore: number;
  thesisReasons: string[];
  signals: Signal[];
  tags: string[];
  status: CompanyStatus;
  notes: string;
  enriched: boolean;
  enrichmentData?: EnrichmentData;
  createdAt: string;
}

export interface EnrichmentData {
  summary: string;
  whatTheyDo: string[];
  keywords: string[];
  signals: string[];
  sources: { url: string; fetchedAt: string }[];
  enrichedAt: string;
}

export interface List {
  id: string;
  name: string;
  description: string;
  companyIds: string[];
  createdAt: string;
  color: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  createdAt: string;
  lastRun?: string;
}

export interface SearchFilters {
  query: string;
  stage: string[];
  sector: string[];
  status: string[];
  minScore: number;
  location: string;
  tags: string[];
}
