import { PublishedCatalog, SearchCatalogResponse } from './types';

const BASE_URL = ''; // Proxied via Vite to http://127.0.0.1:8000

export async function fetchPublishedCatalog(): Promise<PublishedCatalog> {
  const res = await fetch(`${BASE_URL}/catalog`, {
    headers: {
      'Accept': 'application/json'
    }
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('No catalogue published yet. Please publish the catalogue from CMS.');
    }
    throw new Error(`Failed to load catalog (${res.status} ${res.statusText})`);
  }

  return res.json();
}

export interface SearchParams {
  q?: string;
  category?: string;
  language?: string;
  section?: string;
}

export async function searchCatalog(params: SearchParams): Promise<SearchCatalogResponse> {
  const url = new URL(`${window.location.origin}/catalog/search`);
  if (params.q) url.searchParams.set('q', params.q);
  if (params.category && params.category !== 'all') url.searchParams.set('category', params.category);
  if (params.language && params.language !== 'all') url.searchParams.set('language', params.language);
  if (params.section && params.section !== 'all') url.searchParams.set('section', params.section);

  const res = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json'
    }
  });

  if (!res.ok) {
    throw new Error(`Search failed (${res.status})`);
  }

  return res.json();
}
