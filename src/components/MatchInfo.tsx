import type { GameEvent } from '../lib/types';

interface Props {
  matchId: string;
  events: GameEvent[];
}

export default function MatchInfo({ matchId, events }: Props) {
  const humans = new Set(events.filter(e => !e.is_bot).map(e => e.user_id)).size;
  const bots = new Set(events.filter(e => e.is_bot).map(e => e.user_id)).size;
  const kills = events.filter(e => e.event === 'Kill').length;
  const botKills = events.filter(e => e.event === 'BotKill').length;
  const deaths = events.filter(e => e.event === 'Killed' || e.event === 'BotKilled').length;
  const stormDeaths = events.filter(e => e.event === 'KilledByStorm').length;
  const loots = events.filter(e => e.event === 'Loot').length;
  const duration = Math.max(...events.map(e => e.ts_seconds));

  return (
    <div className="absolute top-3 left-3 bg-[#1a1d27]/90 backdrop-blur-sm border border-gray-700 rounded-lg p-3 max-w-xs">
      <h3 className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Match Info</h3>
      <div className="text-xs text-gray-300 font-mono mb-2">{matchId.slice(0, 16)}...</div>
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
    </div>
  );
}
