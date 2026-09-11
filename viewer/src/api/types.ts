export interface ArtworkSlots {
  poster?: string;
  banner?: string;
  thumbnail?: string;
}

export interface EpisodeVariant {
  episode_id: string;
  language: string;
  title: string;
  duration_seconds: number;
  artwork?: ArtworkSlots;
}

export interface CollapsedEpisode {
  content_group: string;
  episode_number: number;
  title: string;
  duration_seconds: number;
  languages: string[];
  variants: EpisodeVariant[];
  artwork?: ArtworkSlots;
}

export interface Season {
  season_number: number;
  title: string;
  episodes: CollapsedEpisode[];
}

export interface Trailer {
  episode_id: string;
  title: string;
  duration_seconds: number;
  language: string;
  artwork?: ArtworkSlots;
}

export interface CatalogShow {
  id: string;
  slug: string;
  title: string;
  section: string;
  categories: string[];
  synopsis: string;
  artwork?: ArtworkSlots;
  trailers?: Trailer[];
  seasons?: Season[];
}

export interface CatalogSection {
  section_id: string;
  title: string;
  shows: CatalogShow[];
}

export interface PublishedCatalog {
  catalogue_version: string;
  published_at: string;
  published_by: string;
  counts: {
    shows: number;
    episodes: number;
  };
  sections: CatalogSection[];
}

export interface SearchCatalogResponse {
  total_matches: number;
  query: {
    q?: string;
    category?: string;
    language?: string;
    section?: string;
  };
  results: CatalogShow[];
}
