import type { GameEvent, EventType } from './types';

export function filterByMatch(events: GameEvent[], matchId: string): GameEvent[] {
  return events.filter(e => e.match_id === matchId);
}

export function filterByTime(events: GameEvent[], maxSeconds: number): GameEvent[] {
  return events.filter(e => e.ts_seconds <= maxSeconds);
}

export function isMovementEvent(event: EventType): boolean {
  return event === 'Position' || event === 'BotPosition';
}

export function isCombatEvent(event: EventType): boolean {
  return event === 'Kill' || event === 'Killed' || event === 'BotKill' || event === 'BotKilled';
}

export function groupByPlayer(events: GameEvent[]): Map<string, GameEvent[]> {
  const map = new Map<string, GameEvent[]>();
  for (const e of events) {
    const existing = map.get(e.user_id);
    if (existing) {
      existing.push(e);
    } else {
      map.set(e.user_id, [e]);
    }
  }
  return map;
}

export function getKillEvents(events: GameEvent[]): GameEvent[] {
  return events.filter(e => e.event === 'Kill' || e.event === 'BotKill');
}

export function getDeathEvents(events: GameEvent[]): GameEvent[] {
  return events.filter(e => e.event === 'Killed' || e.event === 'BotKilled' || e.event === 'KilledByStorm');
}

export function getTrafficEvents(events: GameEvent[]): GameEvent[] {
  return events.filter(e => e.event === 'Position' || e.event === 'BotPosition');
}
