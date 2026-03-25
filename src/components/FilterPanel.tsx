import type { MapId, MatchMeta, ViewMode, HeatmapMode, EventType } from '../lib/types';
import { DAY_LABELS, EVENT_COLORS, EVENT_LABELS } from '../lib/constants';
import MatchSelector from './MatchSelector';

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
  visibleEventTypes: Set<EventType>;
  onVisibleEventTypesChange: (types: Set<EventType>) => void;
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
  visibleEventTypes,
  onVisibleEventTypesChange,
  loading,
  isOpen,
  onClose,
}: Props) {
  const filteredMatches = matches
    .filter(m => m.map_id === selectedMap)
    .filter(m => selectedDays.includes(m.day));

  return (
    <div className={`fixed inset-y-0 left-0 z-40 w-72 bg-[#1a1d27] border-r border-gray-700 flex flex-col transform transition-transform duration-300 ${isOpen ? 'md:relative translate-x-0' : '-translate-x-full'}`}>
      {/* Fixed top region — always visible, no scrolling */}
      <div className="shrink-0">
        {/* Header */}
        <div className="p-3 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/lila-logo.png" alt="Lila Games" className="w-8 h-8 rounded" />
            <div>
              <h1 className="text-lg font-bold text-white">LILA BLACK</h1>
              <p className="text-xs text-gray-500 mt-0.5">Player Journey Visualization</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white rounded transition-colors" aria-label="Collapse sidebar" title="Collapse sidebar ( [ )">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
          </button>
        </div>

        {/* View Mode */}
        <div className="p-3 border-b border-gray-700">
          <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">View Mode</label>
          <div className="flex gap-2 mt-1.5">
            <button
              onClick={() => onViewModeChange('paths')}
              className={`flex-1 py-1.5 text-sm rounded transition-colors ${
                viewMode === 'paths' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              Paths
            </button>
            <button
              onClick={() => onViewModeChange('heatmap')}
              className={`flex-1 py-1.5 text-sm rounded transition-colors ${
                viewMode === 'heatmap' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              Heatmap
            </button>
          </div>
        </div>

        {/* Heatmap Mode (only in heatmap view) */}
        {viewMode === 'heatmap' && (
          <div className="p-3 border-b border-gray-700">
            <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Heatmap Type</label>
            <div className="flex gap-1 mt-1.5">
              {([['kills', 'Kill Zones'], ['deaths', 'Death Zones'], ['traffic', 'Traffic']] as const).map(
                ([mode, label]) => (
                  <button
                    key={mode}
                    onClick={() => onHeatmapModeChange(mode)}
                    className={`flex-1 px-2 py-1.5 text-xs rounded text-center transition-colors ${
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

        {/* Map Selector + Show Bots */}
        <div className="p-3 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Map</label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showBots}
                onChange={e => onShowBotsChange(e.target.checked)}
                className="w-3 h-3 accent-blue-500"
              />
              <span className="text-[10px] text-gray-400">Show Bots</span>
            </label>
          </div>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {maps.map(map => (
              <button
                key={map}
                onClick={() => onMapChange(map)}
                className={`px-2.5 py-1.5 text-xs rounded transition-colors ${
                  selectedMap === map ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                {map}
              </button>
            ))}
          </div>
        </div>

        {/* Day Filter (paths mode only — heatmap aggregates all days) */}
        {viewMode === 'paths' && (
          <div className="p-3 border-b border-gray-700">
            <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Date</label>
            <div className="flex flex-wrap gap-1 mt-1.5">
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
        )}
      </div>

      {/* Scrollable bottom region — match list, event types, footer */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Match Selector */}
        {viewMode === 'paths' && (
          <div className="p-3 border-b border-gray-700">
            <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2 block">
              Match
            </label>
            <MatchSelector
              matches={filteredMatches}
              selectedMatch={selectedMatch}
              onMatchChange={onMatchChange}
            />
          </div>
        )}

        {/* Event Type Toggles (paths mode only) */}
        {viewMode === 'paths' && (
          <div className="p-3 border-b border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Event Types</label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const all = new Set<EventType>(['Position', 'BotPosition', 'Kill', 'Killed', 'BotKill', 'BotKilled', 'KilledByStorm', 'Loot']);
                    onVisibleEventTypesChange(all);
                  }}
                  className="text-[10px] text-blue-400 hover:text-blue-300"
                >All</button>
                <button
                  onClick={() => onVisibleEventTypesChange(new Set())}
                  className="text-[10px] text-gray-500 hover:text-gray-300"
                >None</button>
              </div>
            </div>
            <div className="space-y-0.5">
              {(Object.keys(EVENT_LABELS) as EventType[]).map(eventType => (
                <label key={eventType} className="flex items-center gap-2 cursor-pointer py-0.5">
                  <input
                    type="checkbox"
                    checked={visibleEventTypes.has(eventType)}
                    onChange={() => {
                      const next = new Set(visibleEventTypes);
                      if (next.has(eventType)) next.delete(eventType);
                      else next.add(eventType);
                      onVisibleEventTypesChange(next);
                    }}
                    className="w-3 h-3 accent-blue-500"
                  />
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: EVENT_COLORS[eventType] }}
                  />
                  <span className="text-xs text-gray-300">{EVENT_LABELS[eventType]}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 mt-auto border-t border-gray-700">
          {loading && <div className="text-xs text-blue-400 mb-2">Loading data...</div>}
          <div className="text-[10px] text-gray-600">Built by Jayesh</div>
        </div>
      </div>
    </div>
  );
}
