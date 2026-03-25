import { useState, useEffect } from 'react';
import type { GameEvent } from '../lib/types';

interface Props {
  matchId: string;
  events: GameEvent[];
  matchNumber?: number;
  matchTotal?: number;
}

export default function MatchInfo({ matchId, events, matchNumber, matchTotal }: Props) {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('lila-matchinfo-collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('lila-matchinfo-collapsed', String(collapsed));
  }, [collapsed]);

  const copyMatchId = () => {
    navigator.clipboard.writeText(matchId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const humans = new Set(events.filter(e => !e.is_bot).map(e => e.user_id)).size;
  const bots = new Set(events.filter(e => e.is_bot).map(e => e.user_id)).size;
  const kills = events.filter(e => e.event === 'Kill').length;
  const botKills = events.filter(e => e.event === 'BotKill').length;
  const deaths = events.filter(e => e.event === 'Killed' || e.event === 'BotKilled').length;
  const stormDeaths = events.filter(e => e.event === 'KilledByStorm').length;
  const loots = events.filter(e => e.event === 'Loot').length;
  const duration = Math.max(...events.map(e => e.ts_seconds));

  return (
    <div className="absolute top-14 left-2 md:top-3 md:left-3 bg-[#1a1d27]/90 backdrop-blur-sm border border-gray-700 rounded-lg p-2 md:p-3 max-w-[200px] md:max-w-xs">
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setCollapsed(c => !c)}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Match Info</h3>
          {matchNumber != null && matchTotal != null && (
            <span className="text-[10px] text-gray-500">#{matchNumber} of {matchTotal}</span>
          )}
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 text-gray-500 transition-transform ${collapsed ? '' : 'rotate-180'}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
      </div>
      {!collapsed && (
        <>
          <div className="flex items-center gap-1.5 mt-1 mb-2">
            <span className="text-[10px] text-gray-400 font-mono select-all break-all leading-tight">{matchId}</span>
            <button
              onClick={(e) => { e.stopPropagation(); copyMatchId(); }}
              className="shrink-0 text-gray-500 hover:text-white transition-colors"
              title="Copy match ID"
            >
              {copied ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" /><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" /></svg>
              )}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <span className="text-gray-400">Humans:</span>
            <span className="text-white font-semibold">{humans}</span>
            <span className="text-gray-400">Bots:</span>
            <span className="text-white font-semibold">{bots}</span>
            <span className="text-gray-400">PvP Kills:</span>
            <span className="text-red-400 font-semibold">{kills}</span>
            <span className="text-gray-400">Bot Kills:</span>
            <span className="text-orange-400 font-semibold">{botKills}</span>
            <span className="text-gray-400">Deaths:</span>
            <span className="text-red-400 font-semibold">{deaths}</span>
            <span className="text-gray-400">Storm Deaths:</span>
            <span className="text-purple-400 font-semibold">{stormDeaths}</span>
            <span className="text-gray-400">Loot Events:</span>
            <span className="text-green-400 font-semibold">{loots}</span>
            <span className="text-gray-400">Duration:</span>
            <span className="text-white font-semibold">{duration < 10 ? `${duration.toFixed(2)}s` : `${Math.floor(duration / 60)}m ${Math.floor(duration % 60)}s`}</span>
          </div>
        </>
      )}
    </div>
  );
}
