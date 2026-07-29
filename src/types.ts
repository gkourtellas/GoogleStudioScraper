export interface TipItem {
  tip: string;
  date?: string;
  url?: string;
}

export interface TipsBySite {
  [site: string]: TipItem[];
}

export interface SystemStats {
  uptime: string;
  load: string;
  memory: string;
  disk: string;
}

export interface ScraperStatus {
  available: boolean;
  message: string;
  active: boolean;
  sub: string;
  loaded: string;
  bot_uptime: string;
  bot_since: string;
  instances: number;
  status_output: string;
  last_run?: string;
  total_tips_count?: number;
  schedule_interval_minutes?: number;
  schedule_window_enabled?: boolean;
  schedule_start_hour?: number;
  schedule_end_hour?: number;
  next_scheduled_run?: string | null;
}

export interface ScraperTarget {
  id: number;
  url: string;
  type: string;
  selector: string;
  date_format?: string;
  lines_to_trim?: number;
  enabled: boolean;
  site_name: string;
}
