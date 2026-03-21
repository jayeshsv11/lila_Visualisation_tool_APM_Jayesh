export interface GameEvent {
  user_id: string;
  match_id: string;
  map_id: MapId;
  event: EventType;
  is_bot: boolean;
  pixel_x: number;
  pixel_y: number;
  ts_seconds: number;
}

export type MapId = 'AmbroseValley' | 'GrandRift' | 'Lockdown';

export type EventType =
  | 'Position'
  | 'BotPosition'
  | 'Kill'
  | 'Killed'
  | 'BotKill'
  | 'BotKilled'
  | 'KilledByStorm'
  | 'Loot';

export interface MatchMeta {
  match_id: string;
  map_id: MapId;
  day: string;
  human_count: number;
  bot_count: number;
  total_events: number;
  duration_seconds: number;
}

export interface Manifest {
  days: { label: string; file: string }[];
  maps: MapId[];
  map_configs: Record<MapId, { scale: number; origin_x: number; origin_z: number }>;
  total_events: number;
  total_players: number;
  total_matches: number;
}

export type ViewMode = 'paths' | 'heatmap';
export type HeatmapMode = 'kills' | 'deaths' | 'traffic';
