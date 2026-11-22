import type { APIRoute } from 'astro';
import { GITHUB_TOKEN } from 'astro:env/server';
import { site } from '../../data/site';
import { GITHUB_QUERY, aggregate, type GitHubQueryResult } from '../../lib/github';

export const prerender = false;

const CACHE_OK = 'public, s-maxage=3600, stale-while-revalidate=86400';
// Erros ficam pouco tempo no cache da borda, para não martelar a API do GitHub.
const CACHE_ERROR = 'public, s-maxage=60';

function json(body: object, status: number, cache: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cache },
  });
}

export const GET: APIRoute = async () => {
  if (!GITHUB_TOKEN) {
    console.error('[github] GITHUB_TOKEN ausente');
    return json({ error: 'unavailable' }, 503, CACHE_ERROR);
  }

  try {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'viniciusps.tech',
      },
      body: JSON.stringify({ query: GITHUB_QUERY, variables: { login: site.github.user } }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.error('[github] resposta', res.status);
      return json({ error: 'unavailable' }, 502, CACHE_ERROR);
    }

    const payload = (await res.json()) as { data?: GitHubQueryResult; errors?: unknown[] };
    const activity = payload.data ? aggregate(payload.data, site.github.user) : null;
    if (!activity) {
      console.error('[github] GraphQL sem dados', payload.errors?.length ?? 0, 'erro(s)');
      return json({ error: 'unavailable' }, 502, CACHE_ERROR);
    }

    return json(activity, 200, CACHE_OK);
  } catch {
    console.error('[github] falha ao consultar a API');
    return json({ error: 'unavailable' }, 502, CACHE_ERROR);
  }
};
