import { useState, useMemo, useRef, useEffect } from 'react';
import type { MatchMeta } from '../lib/types';
import { DAY_LABELS } from '../lib/constants';

type SortBy = 'players' | 'events' | 'duration';

interface Props {
  matches: MatchMeta[];
  selectedMatch: string | null;
  onMatchChange: (matchId: string | null) => void;
}

function formatDuration(seconds: number): string {
  if (seconds < 10) return `${seconds.toFixed(1)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function MatchSelector({ matches, selectedMatch, onMatchChange }: Props) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('players');
  const selectedRef = useRef<HTMLButtonElement>(null);

  const sorted = useMemo(() => {
    const copy = [...matches];
    switch (sortBy) {
      case 'players':
        copy.sort((a, b) => (b.human_count + b.bot_count) - (a.human_count + a.bot_count));
        break;
      case 'events':
        copy.sort((a, b) => b.total_events - a.total_events);
        break;
      case 'duration':
        copy.sort((a, b) => b.duration_seconds - a.duration_seconds);
        break;
    }
    return copy;
  }, [matches, sortBy]);

  const filtered = useMemo(() => {
    if (!search.trim()) return sorted;
    const q = search.toLowerCase().trim();
    return sorted.filter((m, i) => {
      const num = `#${i + 1}`;
      return (
        num.includes(q) ||
        m.match_id.toLowerCase().includes(q) ||
        m.map_id.toLowerCase().includes(q) ||
        (DAY_LABELS[m.day] || m.day).toLowerCase().includes(q)
      );
    });
  }, [sorted, search]);

  // Find current match index in sorted list for prev/next
  const currentIndex = selectedMatch ? sorted.findIndex(m => m.match_id === selectedMatch) : -1;

  const goToMatch = (delta: number) => {
    if (sorted.length === 0) return;
    let next = currentIndex + delta;
    if (next < 0) next = sorted.length - 1;
    if (next >= sorted.length) next = 0;
    onMatchChange(sorted[next].match_id);
  };

  // Scroll selected match into view
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest' });
  }, [selectedMatch]);

  return (
    <div className="space-y-2">
      {/* Prev / Next navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => goToMatch(-1)}
          disabled={sorted.length === 0}
          className="w-7 h-7 flex items-center justify-center bg-gray-700 rounded text-gray-400 hover:text-white hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
          title="Previous match"
        >&lsaquo;</button>
        <span className="text-xs text-gray-400">
          {currentIndex >= 0 ? `${currentIndex + 1} of ${sorted.length}` : `${sorted.length} matches`}
        </span>
        <button
          onClick={() => goToMatch(1)}
          disabled={sorted.length === 0}
          className="w-7 h-7 flex items-center justify-center bg-gray-700 rounded text-gray-400 hover:text-white hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
          title="Next match"
        >&rsaquo;</button>
      </div>

      {/* Search */}
      <div className="relative">
        <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search matches..."
          className="w-full bg-gray-700 text-gray-200 text-xs rounded pl-7 pr-2 py-1.5 border border-gray-600 focus:border-blue-500 focus:outline-none placeholder-gray-500"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs"
          >&times;</button>
        )}
      </div>

      {/* Sort */}
      <div className="flex gap-1">
        {([['players', 'Players'], ['events', 'Events'], ['duration', 'Duration']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSortBy(key)}
            className={`flex-1 py-1 text-[10px] rounded transition-colors ${
              sortBy === key ? 'bg-blue-600/60 text-blue-200' : 'bg-gray-700/50 text-gray-500 hover:text-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Match List */}
      <div className="max-h-[250px] overflow-y-auto space-y-0.5 scrollbar-thin">
        {filtered.length === 0 ? (
          <div className="text-xs text-gray-500 text-center py-3">
            {search ? 'No matches found' : 'No matches available'}
          </div>
        ) : (
          filtered.map(m => {
            const globalIdx = sorted.findIndex(s => s.match_id === m.match_id);
            const isSelected = m.match_id === selectedMatch;
            return (
              <button
                key={m.match_id}
                ref={isSelected ? selectedRef : undefined}
                onClick={() => onMatchChange(m.match_id)}
                title={m.match_id}
                className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                  isSelected
                    ? 'bg-blue-600/20 border-l-2 border-blue-500 pl-1.5'
                    : 'hover:bg-gray-700/50 border-l-2 border-transparent pl-1.5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${isSelected ? 'text-blue-300' : 'text-gray-300'}`}>
                    #{globalIdx + 1}
                  </span>
                  <span className="text-gray-500">{DAY_LABELS[m.day] || m.day}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-gray-400">
                  <span className="text-green-400/80">{m.human_count}H</span>
                  <span>{m.bot_count}B</span>
                  <span>&middot;</span>
                  <span>{m.total_events} evt</span>
                  <span>&middot;</span>
                  <span>{formatDuration(m.duration_seconds)}</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
