import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

async function fetchPageContent(url: string): Promise<{ content: string; finalUrl: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; VCScout/1.0)',
      'Accept': 'text/html,application/xhtml+xml,*/*',
    },
    signal: controller.signal,
    redirect: 'follow',
  });
  clearTimeout(timeout);

  const html = await res.text();
  const text = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 6000);

  return { content: text, finalUrl: res.url };
}

export async function POST(req: NextRequest) {
  try {
    const { url, companyName } = await req.json();
    if (!url || !companyName) {
      return NextResponse.json({ error: 'url and companyName are required' }, { status: 400 });
    }

    const fetchedAt = new Date().toISOString();
    const sources: { url: string; fetchedAt: string }[] = [];

    // If no API key, return mock data
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === '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') {
      return NextResponse.json(getMockEnrichment(companyName, url));
    }

    // Fetch main page
    let mainContent = '';
    let finalUrl = url;
    try {
      const result = await fetchPageContent(url);
      mainContent = result.content;
      finalUrl = result.finalUrl;
      sources.push({ url: finalUrl, fetchedAt });
    } catch {
      mainContent = `Could not fetch ${url}`;
    }

    // Try about page
    let aboutContent = '';
    try {
      const aboutUrl = url.replace(/\/$/, '') + '/about';
      const result = await fetchPageContent(aboutUrl);
      aboutContent = result.content;
      sources.push({ url: aboutUrl, fetchedAt });
    } catch {
      // ignore
    }

    const combinedContent = `MAIN PAGE:\n${mainContent}\n\n${aboutContent ? `ABOUT PAGE:\n${aboutContent}` : ''}`.trim();

    const prompt = `You are a venture capital analyst. Analyze this scraped web content for "${companyName}" and return ONLY valid JSON:

CONTENT:
${combinedContent}

Return this JSON structure only (no markdown, no extra text):
{
  "summary": "1-2 sentence investor-focused description",
  "whatTheyDo": ["specific bullet 1", "specific bullet 2", "specific bullet 3", "specific bullet 4"],
  "keywords": ["kw1", "kw2", "kw3", "kw4", "kw5", "kw6"],
  "signals": ["observable signal 1", "observable signal 2", "observable signal 3"]
}`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await res.json();
    const responseText = data.content?.[0]?.text?.trim() || '{}';

    let extracted;
    try {
      const match = responseText.match(/\{[\s\S]*\}/);
      extracted = JSON.parse(match ? match[0] : responseText);
    } catch {
      extracted = {
        summary: `${companyName} is a technology company.`,
        whatTheyDo: ['Building technology products', 'Serving business customers'],
        keywords: ['Technology', 'SaaS'],
        signals: ['Website content available'],
      };
    }

    return NextResponse.json({ ...extracted, sources, enrichedAt: new Date().toISOString() });

  } catch (err: any) {
    console.error('Enrichment error:', err);
    return NextResponse.json({ error: err.message || 'Enrichment failed' }, { status: 500 });
  }
}

function getMockEnrichment(companyName: string, url: string) {
  return {
    summary: `${companyName} is an AI-powered B2B SaaS platform that automates complex enterprise workflows, reducing operational overhead and enabling teams to focus on high-value work.`,
    whatTheyDo: [
      'AI-driven automation for repetitive business processes',
      'Native integrations with popular enterprise tools (Slack, Salesforce, HubSpot)',
      'No-code workflow builder for non-technical teams',
      'Real-time analytics and audit trail dashboard',
      'Enterprise-grade SSO, SOC 2 Type II compliance',
    ],
    keywords: ['AI', 'SaaS', 'Automation', 'Enterprise', 'B2B', 'Workflow', 'Integration', 'Analytics'],
    signals: [
      'Active careers page with multiple open engineering roles — growth signal',
      'Recent blog posts within last 30 days — active content/product cadence',
      'No public pricing page — enterprise/sales-led GTM motion',
      'Integrations page lists 10+ connectors — ecosystem-first strategy',
    ],
    sources: [{ url, fetchedAt: new Date().toISOString() }],
    enrichedAt: new Date().toISOString(),
    _note: 'Demo data — add ANTHROPIC_API_KEY to .env.local for live AI enrichment',
  };
}
