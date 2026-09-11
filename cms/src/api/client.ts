import {
  Show,
  Episode,
  Season,
  ValidationReport,
  PublishRun,
  ArtworkUploadResponse
} from './types';

const BASE_URL = '';

function getAuthHeaders(): HeadersInit {
  const role = localStorage.getItem('peblo_cms_role') || 'editor';
  return {
    'X-User-Role': role,
    'Content-Type': 'application/json'
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = res.statusText;
    try {
      const data = await res.json();
      errorDetail = data.detail || JSON.stringify(data);
    } catch {
      // ignore
    }
    const error: any = new Error(errorDetail);
    error.status = res.status;
    error.detail = errorDetail;
    throw error;
  }
  return res.json();
}

// ----------------------------------------------------
// Shows API
// ----------------------------------------------------

export async function fetchShows(params?: { section?: string; status?: string; search?: string }): Promise<Show[]> {
  const query = new URLSearchParams();
  if (params?.section && params.section !== 'all') query.set('section', params.section);
  if (params?.status && params.status !== 'all') query.set('status', params.status);
  if (params?.search) query.set('search', params.search);

  const res = await fetch(`${BASE_URL}/admin/shows?${query.toString()}`, {
    headers: getAuthHeaders()
  });
  return handleResponse<Show[]>(res);
}

export async function fetchShow(showId: string): Promise<Show> {
  const res = await fetch(`${BASE_URL}/admin/shows/${showId}`, {
    headers: getAuthHeaders()
  });
  return handleResponse<Show>(res);
}

export async function createShow(data: {
  title: string;
  slug: string;
  section?: string | null;
  categories: string[];
  synopsis?: string;
  status: string;
}): Promise<Show> {
  const res = await fetch(`${BASE_URL}/admin/shows`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  return handleResponse<Show>(res);
}

export async function updateShow(showId: string, data: Partial<Show>): Promise<Show> {
  const res = await fetch(`${BASE_URL}/admin/shows/${showId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  return handleResponse<Show>(res);
}

export async function deleteShow(showId: string): Promise<{ deleted: boolean; show_id: string }> {
  const res = await fetch(`${BASE_URL}/admin/shows/${showId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return handleResponse(res);
}

// ----------------------------------------------------
// Seasons API
// ----------------------------------------------------

export async function fetchSeasons(showId: string): Promise<Season[]> {
  const res = await fetch(`${BASE_URL}/admin/shows/${showId}/seasons`, {
    headers: getAuthHeaders()
  });
  return handleResponse<Season[]>(res);
}

export async function createSeason(showId: string, data: { season_number: number; title?: string }): Promise<Season> {
  const res = await fetch(`${BASE_URL}/admin/shows/${showId}/seasons`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  return handleResponse<Season>(res);
}

// ----------------------------------------------------
// Episodes API
// ----------------------------------------------------

export interface EpisodeListResponse {
  total: number;
  page: number;
  limit: number;
  items: Episode[];
}

export async function fetchEpisodes(params?: {
  show_id?: string;
  section?: string;
  status?: string;
  language?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<EpisodeListResponse> {
  const query = new URLSearchParams();
  if (params?.show_id && params.show_id !== 'all') query.set('show_id', params.show_id);
  if (params?.section && params.section !== 'all') query.set('section', params.section);
  if (params?.status && params.status !== 'all') query.set('status', params.status);
  if (params?.language && params.language !== 'all') query.set('language', params.language);
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', params.page.toString());
  if (params?.limit) query.set('limit', params.limit.toString());

  const res = await fetch(`${BASE_URL}/admin/episodes?${query.toString()}`, {
    headers: getAuthHeaders()
  });
  return handleResponse<EpisodeListResponse>(res);
}

export async function fetchEpisode(episodeId: string): Promise<Episode> {
  const res = await fetch(`${BASE_URL}/admin/episodes/${episodeId}`, {
    headers: getAuthHeaders()
  });
  return handleResponse<Episode>(res);
}

export async function createEpisode(data: {
  id?: string;
  show_id: string;
  season_number: number;
  episode_number: number;
  episode_title: string;
  duration_seconds?: number | null;
  language: string;
  content_group: string;
  status: string;
}): Promise<Episode> {
  const res = await fetch(`${BASE_URL}/admin/episodes`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  return handleResponse<Episode>(res);
}

export async function updateEpisode(episodeId: string, data: Partial<Episode>): Promise<Episode> {
  const res = await fetch(`${BASE_URL}/admin/episodes/${episodeId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  return handleResponse<Episode>(res);
}

export async function deleteEpisode(episodeId: string): Promise<{ deleted: boolean; episode_id: string }> {
  const res = await fetch(`${BASE_URL}/admin/episodes/${episodeId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return handleResponse(res);
}

// ----------------------------------------------------
// Artwork Upload API
// ----------------------------------------------------

export async function uploadArtwork(
  file: File,
  artworkType: 'poster' | 'banner' | 'thumbnail',
  showId?: string,
  episodeId?: string
): Promise<ArtworkUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('artwork_type', artworkType);
  if (showId) formData.append('show_id', showId);
  if (episodeId) formData.append('episode_id', episodeId);

  const role = localStorage.getItem('peblo_cms_role') || 'editor';
  const res = await fetch(`${BASE_URL}/admin/artwork/upload`, {
    method: 'POST',
    headers: {
      'X-User-Role': role
    },
    body: formData
  });

  return handleResponse<ArtworkUploadResponse>(res);
}

// ----------------------------------------------------
// Publish & Validation API
// ----------------------------------------------------

export async function fetchValidationReport(): Promise<ValidationReport> {
  const res = await fetch(`${BASE_URL}/admin/validation-report`, {
    headers: getAuthHeaders()
  });
  return handleResponse<ValidationReport>(res);
}

export async function publishCatalog(): Promise<{
  success: boolean;
  run_id: string;
  published_at: string;
  show_count: number;
  episode_count: number;
  duration_ms: number;
  catalogue_path: string;
}> {
  const res = await fetch(`${BASE_URL}/admin/catalog/publish`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  return handleResponse(res);
}

export async function fetchPublishHistory(limit: number = 20): Promise<PublishRun[]> {
  const res = await fetch(`${BASE_URL}/admin/catalog/history?limit=${limit}`, {
    headers: getAuthHeaders()
  });
  return handleResponse<PublishRun[]>(res);
}

export async function syncGeneratedArtwork(): Promise<{
  success: boolean;
  result: { shows_updated: number; episodes_updated: number };
  catalogue_published: boolean;
  message: string;
}> {
  const res = await fetch(`${BASE_URL}/admin/artwork/sync-generated`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  return handleResponse(res);
}
