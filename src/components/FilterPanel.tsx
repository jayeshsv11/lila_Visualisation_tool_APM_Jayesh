import type { MapId, MatchMeta, ViewMode, HeatmapMode } from '../lib/types';
import { DAY_LABELS } from '../lib/constants';

interface Props {
  maps: MapId[];
  selectedMap: MapId;
  onMapChange: (map: MapId) => void;
  days: string[];
  selectedDays: string[];
  onDayToggle: (day: string) => void;
  matches: MatchMeta[];
  selectedMatch: string | null;
  onMatchChange: (matchId: string | null) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  heatmapMode: HeatmapMode;
  onHeatmapModeChange: (mode: HeatmapMode) => void;
  showBots: boolean;
  onShowBotsChange: (show: boolean) => void;
  totalEvents: number;
  loading: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export default function FilterPanel({
  maps,
  selectedMap,
  onMapChange,
  days,
  selectedDays,
  onDayToggle,
  matches,
  selectedMatch,
  onMatchChange,
  viewMode,
  onViewModeChange,
  heatmapMode,
  onHeatmapModeChange,
  showBots,
  onShowBotsChange,
  totalEvents,
  loading,
  isOpen,
  onClose,
}: Props) {
  const filteredMatches = matches
    .filter(m => m.map_id === selectedMap)
    .filter(m => selectedDays.includes(m.day))
    .sort((a, b) => (b.human_count + b.bot_count) - (a.human_count + a.bot_count));

  return (
    <div className={`fixed inset-y-0 left-0 z-40 w-72 bg-[#1a1d27] border-r border-gray-700 flex flex-col overflow-y-auto transform transition-transform duration-300 md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">LILA BLACK</h1>
          <p className="text-xs text-gray-500 mt-1">Player Journey Visualization</p>
        </div>
        <button onClick={onClose} className="md:hidden w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white rounded transition-colors" aria-label="Close sidebar">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
        </button>
      </div>

      {/* View Mode */}
      <div className="p-4 border-b border-gray-700">
        <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">View Mode</label>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => onViewModeChange('paths')}
            className={`flex-1 py-2 text-sm rounded transition-colors ${
              viewMode === 'paths' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            Paths
          </button>
          <button
            onClick={() => onViewModeChange('heatmap')}
            className={`flex-1 py-2 text-sm rounded transition-colors ${
              viewMode === 'heatmap' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            Heatmap
          </button>
        </div>
      </div>

      {/* Heatmap Mode (only in heatmap view) */}
      {viewMode === 'heatmap' && (
        <div className="p-4 border-b border-gray-700">
          <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Heatmap Type</label>
          <div className="flex flex-col gap-1 mt-2">
            {([['kills', 'Kill Zones'], ['deaths', 'Death Zones'], ['traffic', 'Traffic']] as const).map(
              ([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => onHeatmapModeChange(mode)}
                  className={`px-3 py-2 text-sm rounded text-left transition-colors ${
                    heatmapMode === mode ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  {label}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* Map Selector */}
      <div className="p-4 border-b border-gray-700">
        <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Map</label>
        <div className="flex flex-col gap-1 mt-2">
          {maps.map(map => (
            <button
              key={map}
              onClick={() => onMapChange(map)}
              className={`px-3 py-2 text-sm rounded text-left transition-colors ${
                selectedMap === map ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              {map}
            </button>
          ))}
        </div>
      </div>

      {/* Day Filter */}
      <div className="p-4 border-b border-gray-700">
        <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Date</label>
        <div className="flex flex-wrap gap-1 mt-2">
          {days.map(day => (
            <button
              key={day}
              onClick={() => onDayToggle(day)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                selectedDays.includes(day) ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              {DAY_LABELS[day] || day}
            </button>
          ))}
        </div>
      </div>

      {/* Match Selector */}
      {viewMode === 'paths' && (
        <div className="p-4 border-b border-gray-700">
          <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
            Match ({filteredMatches.length} available)
          </label>
          <select
            value={selectedMatch || ''}
            onChange={e => onMatchChange(e.target.value || null)}
            className="w-full mt-2 bg-gray-700 text-gray-200 text-sm rounded px-2 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="">Select a match...</option>
            {filteredMatches.map(m => (
              <option key={m.match_id} value={m.match_id}>
                {m.match_id.slice(0, 8)}... | {m.human_count}H {m.bot_count}B | {Math.round(m.duration_seconds)}s
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Show Bots Toggle */}
      <div className="p-4 border-b border-gray-700">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={showBots}
            onChange={e => onShowBotsChange(e.target.checked)}
            className="w-4 h-4 accent-blue-500"
          />
          <span className="text-sm text-gray-300">Show Bots</span>
        </label>
      </div>

      {/* Stats */}
      <div className="p-4 mt-auto">
        <div className="text-xs text-gray-500 space-y-1">
          <div>Events loaded: {totalEvents.toLocaleString()}</div>
          {loading && <div className="text-blue-400">Loading data...</div>}
        </div>
      </div>
    </div>
  );
}
