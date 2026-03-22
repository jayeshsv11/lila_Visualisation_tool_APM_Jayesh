import type { MapId, EventType } from './types';

export const MAP_MINIMAP_FILES: Record<MapId, string> = {
  AmbroseValley: '/minimaps/AmbroseValley.webp',
  GrandRift: '/minimaps/GrandRift.webp',
  Lockdown: '/minimaps/Lockdown.webp',
};

export const EVENT_COLORS: Record<EventType, string> = {
  Kill: '#ef4444',
  Killed: '#dc2626',
  BotKill: '#f97316',
  BotKilled: '#ea580c',
  KilledByStorm: '#a855f7',
  Loot: '#22c55e',
  Position: '#3b82f6',
  BotPosition: '#fbbf24',
};

export const EVENT_LABELS: Record<EventType, string> = {
  Kill: 'Kill (Human)',
  Killed: 'Death (by Human)',
  BotKill: 'Kill (Bot)',
  BotKilled: 'Death (by Bot)',
  KilledByStorm: 'Storm Death',
  Loot: 'Loot Pickup',
  Position: 'Movement (Human)',
  BotPosition: 'Movement (Bot)',
};

export const PLAYER_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#a855f7',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#8b5cf6',
  '#14b8a6', '#e11d48', '#0ea5e9', '#d946ef', '#facc15',
  '#10b981', '#f43f5e', '#6366f1', '#fb923c', '#2dd4bf',
];

export const DAY_LABELS: Record<string, string> = {
  feb10: 'Feb 10',
  feb11: 'Feb 11',
  feb12: 'Feb 12',
  feb13: 'Feb 13',
  feb14: 'Feb 14',
};

export const MAP_SIZE = 1024;
