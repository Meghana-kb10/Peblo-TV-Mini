export interface Show {
  id: string;
  slug: string;
  title: string;
  section: string | null;
  categories: string[];
  synopsis: string;
  status: 'published' | 'draft';
  episodes_count?: number;
  artwork?: Record<string, string>;
  created_at?: string | null;
}

export interface Season {
  id: string;
  show_id: string;
  season_number: number;
  title: string;
  episodes_count?: number;
  created_at?: string | null;
}

export interface Episode {
  id: string;
  show_id: string;
  show_title: string;
  section?: string | null;
  season_number: number;
  episode_number: number;
  episode_title: string;
  duration_seconds: number | null;
  language: string;
  content_group: string;
  status: 'published' | 'draft';
  artwork?: Record<string, string>;
  artwork_available?: string[];
}

export interface ValidationBlocker {
  entity_type: 'show' | 'episode' | 'content_group';
  entity_id: string;
  show_id?: string | null;
  show_title?: string;
  title?: string;
  season_number?: number | null;
  episode_number?: number | null;
  issue_type: string;
  severity: 'critical' | 'warning';
  message: string;
  resolution: string;
  language?: string;
}

export interface ValidationReport {
  is_publishable: boolean;
  total_issues: number;
  blocking_count: number;
  warning_count: number;
  blockers: ValidationBlocker[];
  warnings: ValidationBlocker[];
  grouped_by_show: Record<string, ValidationBlocker[]>;
  summary: string;
}

export interface PublishRun {
  id: string;
  triggered_by: string;
  status: 'success' | 'failed';
  show_count: number;
  episode_count: number;
  duration_ms: number;
  error_details: string | null;
  catalogue_path: string | null;
  created_at: string | null;
}

export interface ArtworkUploadResponse {
  id: string;
  artwork_type: string;
  url: string;
  width: number;
  height: number;
  aspect_ratio: number;
  file_size_bytes: number;
  message: string;
}
