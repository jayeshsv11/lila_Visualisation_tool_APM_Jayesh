import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameEvent, MatchMeta, Manifest } from '../lib/types';

const cache = new Map<string, GameEvent[]>();

export function useDataLoader() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [matches, setMatches] = useState<MatchMeta[]>([]);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const loadedDays = useRef<Set<string>>(new Set());

  useEffect(() => {
    fetch('/data/manifest.json')
      .then(r => r.json())
      .then(setManifest);
    fetch('/data/matches.json')
      .then(r => r.json())
      .then(setMatches);
  }, []);

  const loadDay = useCallback(async (dayLabel: string) => {
    if (cache.has(dayLabel)) {
      return cache.get(dayLabel)!;
    }
    const resp = await fetch(`/data/${dayLabel}.json`);
    const data: GameEvent[] = await resp.json();
    cache.set(dayLabel, data);
    return data;
  }, []);

  const loadDays = useCallback(async (dayLabels: string[]) => {
    setLoading(true);
    const allEvents: GameEvent[] = [];
    for (const day of dayLabels) {
      const dayEvents = await loadDay(day);
      allEvents.push(...dayEvents);
    }
    setEvents(allEvents);
    loadedDays.current = new Set(dayLabels);
    setLoading(false);
  }, [loadDay]);

  return { manifest, matches, events, loading, loadDays };
}
