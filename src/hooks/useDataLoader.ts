import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameEvent, MatchMeta, Manifest } from '../lib/types';

const cache = new Map<string, GameEvent[]>();

const ALL_DAYS = ['feb10', 'feb11', 'feb12', 'feb13', 'feb14'];

export function useDataLoader() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [matches, setMatches] = useState<MatchMeta[]>([]);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [allEvents, setAllEvents] = useState<GameEvent[]>([]);
  const [allEventsLoaded, setAllEventsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedDays = useRef<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([
      fetch('/data/manifest.json').then(r => {
        if (!r.ok) throw new Error(`Failed to load manifest: ${r.status}`);
        return r.json();
      }),
      fetch('/data/matches.json').then(r => {
        if (!r.ok) throw new Error(`Failed to load matches: ${r.status}`);
        return r.json();
      }),
    ])
      .then(([m, mt]) => {
        setManifest(m);
        setMatches(mt);
      })
      .catch(err => setError(err.message));
  }, []);

  const loadDay = useCallback(async (dayLabel: string) => {
    if (cache.has(dayLabel)) {
      return cache.get(dayLabel)!;
    }
    const resp = await fetch(`/data/${dayLabel}.json`);
    if (!resp.ok) throw new Error(`Failed to load ${dayLabel}: ${resp.status}`);
    const data: GameEvent[] = await resp.json();
    cache.set(dayLabel, data);
    return data;
  }, []);

  const loadDays = useCallback(async (dayLabels: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(dayLabels.map(loadDay));
      setEvents(results.flat());
      loadedDays.current = new Set(dayLabels);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [loadDay]);

  const loadAllDays = useCallback(async () => {
    if (allEventsLoaded) return;
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(ALL_DAYS.map(loadDay));
      setAllEvents(results.flat());
      setAllEventsLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [loadDay, allEventsLoaded]);

  return { manifest, matches, events, allEvents, allEventsLoaded, loading, error, loadDays, loadAllDays };
}
