import { useState, useEffect, useMemo } from 'react';
import { useDataLoader } from './hooks/useDataLoader';
import { usePlayback } from './hooks/usePlayback';
import FilterPanel from './components/FilterPanel';
import MapViewer from './components/MapViewer';
import HeatmapOverlay from './components/HeatmapOverlay';
import Timeline from './components/Timeline';
import EventLegend from './components/EventLegend';
import MatchInfo from './components/MatchInfo';
import { MAP_MINIMAP_FILES } from './lib/constants';
import type { MapId, ViewMode, HeatmapMode } from './lib/types';

function App() {
  const { manifest, matches, events, loading, loadDays } = useDataLoader();

  const [selectedMap, setSelectedMap] = useState<MapId>('AmbroseValley');
  const [selectedDays, setSelectedDays] = useState<string[]>(['feb10']);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('paths');
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>('kills');
  const [showBots, setShowBots] = useState(false);

  // Load data when selected days change
  useEffect(() => {
    if (selectedDays.length > 0) {
      loadDays(selectedDays);
    }
  }, [selectedDays, loadDays]);

  // Filter events by selected map
  const mapEvents = useMemo(
    () => events.filter(e => e.map_id === selectedMap),
    [events, selectedMap]
  );

  // Filter events by selected match (for path view)
  const matchEvents = useMemo(() => {
    if (!selectedMatch) return [];
    return mapEvents.filter(e => e.match_id === selectedMatch);
  }, [mapEvents, selectedMatch]);

  // Auto-select first match when map/days change
  useEffect(() => {
    if (viewMode !== 'paths') return;
    const available = matches
      .filter(m => m.map_id === selectedMap && selectedDays.includes(m.day))
      .sort((a, b) => (b.human_count + b.bot_count) - (a.human_count + a.bot_count));
    if (available.length > 0 && (!selectedMatch || !available.find(m => m.match_id === selectedMatch))) {
      setSelectedMatch(available[0].match_id);
    }
  }, [matches, selectedMap, selectedDays, viewMode, selectedMatch]);

  const matchDuration = useMemo(() => {
    if (matchEvents.length === 0) return 60;
    return Math.max(...matchEvents.map(e => e.ts_seconds));
  }, [matchEvents]);

  const playback = usePlayback(matchDuration);

  const handleDayToggle = (day: string) => {
    setSelectedDays(prev => {
      if (prev.includes(day)) {
        if (prev.length === 1) return prev;
        return prev.filter(d => d !== day);
      }
      return [...prev, day];
    });
  };

  const days = manifest?.days.map(d => d.label) || [];
  const maps = (manifest?.maps || ['AmbroseValley', 'GrandRift', 'Lockdown']) as MapId[];

  return (
    <div className="h-screen flex flex-col bg-[#0f1117]">
      <div className="flex flex-1 overflow-hidden">
        <FilterPanel
          maps={maps}
          selectedMap={selectedMap}
          onMapChange={m => { setSelectedMap(m); setSelectedMatch(null); }}
          days={days}
          selectedDays={selectedDays}
          onDayToggle={handleDayToggle}
          matches={matches}
          selectedMatch={selectedMatch}
          onMatchChange={setSelectedMatch}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          heatmapMode={heatmapMode}
          onHeatmapModeChange={setHeatmapMode}
          showBots={showBots}
          onShowBotsChange={setShowBots}
          totalEvents={events.length}
          loading={loading}
        />

        <div className="flex-1 flex flex-col relative">
          <div className="flex-1 flex relative overflow-hidden">
            {viewMode === 'paths' ? (
              <MapViewer
                minimapUrl={MAP_MINIMAP_FILES[selectedMap]}
                events={matchEvents}
                showBots={showBots}
                currentTime={playback.currentTime}
              />
            ) : (
              <HeatmapOverlay
                minimapUrl={MAP_MINIMAP_FILES[selectedMap]}
                events={mapEvents}
                mode={heatmapMode}
              />
            )}
            <EventLegend />
            {viewMode === 'paths' && selectedMatch && matchEvents.length > 0 && (
              <MatchInfo matchId={selectedMatch} events={matchEvents} />
            )}
          </div>

          {viewMode === 'paths' && selectedMatch && (
            <Timeline
              currentTime={playback.currentTime}
              maxTime={matchDuration}
              playing={playback.playing}
              speed={playback.speed}
              onTogglePlay={playback.togglePlay}
              onSeek={playback.seek}
              onSpeedChange={playback.setSpeed}
              onReset={playback.reset}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
