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
import type { MapId, ViewMode, HeatmapMode, EventType } from './lib/types';

function App() {
  const { manifest, matches, events, allEvents, allEventsLoaded, loading, error, loadDays, loadAllDays } = useDataLoader();
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const stored = localStorage.getItem('lila-sidebar-open');
    return stored !== null ? stored === 'true' : true;
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [selectedMap, setSelectedMap] = useState<MapId>('AmbroseValley');
  const [selectedDays, setSelectedDays] = useState<string[]>(['feb10']);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('paths');
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>('kills');
  const [showBots, setShowBots] = useState(false);
  const [visibleEventTypes, setVisibleEventTypes] = useState<Set<EventType>>(
    new Set(['Position', 'BotPosition', 'Kill', 'Killed', 'BotKill', 'BotKilled', 'KilledByStorm', 'Loot'])
  );

  // Track fullscreen state
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem('lila-sidebar-open', String(sidebarOpen));
  }, [sidebarOpen]);

  // Keyboard shortcut: [ to toggle sidebar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '[') setSidebarOpen(prev => !prev);
      if (e.key === 'f') toggleFullscreen();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Load data when selected days change
  useEffect(() => {
    if (selectedDays.length > 0) {
      loadDays(selectedDays);
    }
  }, [selectedDays, loadDays]);

  // Load all days when entering heatmap mode for full data coverage
  useEffect(() => {
    if (viewMode === 'heatmap' && !allEventsLoaded) {
      loadAllDays();
    }
  }, [viewMode, allEventsLoaded, loadAllDays]);

  // Filter events by selected map
  const mapEvents = useMemo(
    () => events.filter(e => e.map_id === selectedMap),
    [events, selectedMap]
  );

  // Heatmap events filtered by map (uses all days data)
  const heatmapMapEvents = useMemo(
    () => (allEventsLoaded ? allEvents : events).filter(e => e.map_id === selectedMap),
    [allEvents, allEventsLoaded, events, selectedMap]
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
      .sort((a, b) => {
        // Prefer matches with bots when showBots is enabled
        if (showBots) {
          const aHasBots = a.bot_count > 0 ? 1 : 0;
          const bHasBots = b.bot_count > 0 ? 1 : 0;
          if (bHasBots !== aHasBots) return bHasBots - aHasBots;
        }
        return (b.human_count + b.bot_count) - (a.human_count + a.bot_count);
      });
    if (available.length > 0 && (!selectedMatch || !available.find(m => m.match_id === selectedMatch))) {
      setSelectedMatch(available[0].match_id);
    }
  }, [matches, selectedMap, selectedDays, viewMode, selectedMatch, showBots]);

  const matchDuration = useMemo(() => {
    if (matchEvents.length === 0) return 60;
    return Math.max(...matchEvents.map(e => e.ts_seconds));
  }, [matchEvents]);

  // Compute match position for MatchInfo display
  const filteredMatchList = useMemo(() =>
    matches
      .filter(m => m.map_id === selectedMap && selectedDays.includes(m.day))
      .sort((a, b) => (b.human_count + b.bot_count) - (a.human_count + a.bot_count)),
    [matches, selectedMap, selectedDays]
  );
  const matchNumber = selectedMatch
    ? filteredMatchList.findIndex(m => m.match_id === selectedMatch) + 1
    : undefined;
  const matchTotal = filteredMatchList.length;

  const playback = usePlayback(matchDuration);

  // Reset playback when switching matches
  useEffect(() => {
    playback.reset();
  }, [selectedMatch]); // eslint-disable-line react-hooks/exhaustive-deps

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

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0f1117]">
        <div className="bg-[#1a1d27] border border-red-500/50 rounded-lg p-6 max-w-md text-center">
          <h2 className="text-red-400 text-lg font-semibold mb-2">Failed to Load Data</h2>
          <p className="text-gray-400 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!manifest) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0f1117]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-400 text-sm">Loading LILA BLACK data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0f1117]">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar open button — visible on all screen sizes when collapsed */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="fixed top-3 left-3 z-50 w-10 h-10 flex items-center justify-center bg-[#1a1d27] border border-gray-700 rounded-lg text-gray-300 hover:text-white transition-colors"
            aria-label="Open sidebar"
            title="Open sidebar ( [ )"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
          </button>
        )}

        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 z-30 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
        )}

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
          visibleEventTypes={visibleEventTypes}
          onVisibleEventTypesChange={setVisibleEventTypes}
          loading={loading}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex-1 flex flex-col relative">
          <div className="flex-1 flex relative overflow-hidden">
            {viewMode === 'paths' ? (
              <MapViewer
                minimapUrl={MAP_MINIMAP_FILES[selectedMap]}
                events={matchEvents}
                showBots={showBots}
                currentTime={playback.currentTime}
                selectedMap={selectedMap}
                visibleEventTypes={visibleEventTypes}
              />
            ) : (
              <HeatmapOverlay
                minimapUrl={MAP_MINIMAP_FILES[selectedMap]}
                events={heatmapMapEvents}
                mode={heatmapMode}
                showBots={showBots}
                selectedMap={selectedMap}
              />
            )}
            {viewMode === 'paths' && <EventLegend />}
            {viewMode === 'paths' && selectedMatch && matchEvents.length > 0 && (
              <MatchInfo matchId={selectedMatch} events={matchEvents} matchNumber={matchNumber} matchTotal={matchTotal} />
            )}
            <button
              onClick={toggleFullscreen}
              className="absolute bottom-3 right-3 z-10 w-8 h-8 flex items-center justify-center bg-[#1a1d27]/90 backdrop-blur-sm border border-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              title={isFullscreen ? 'Exit fullscreen ( F )' : 'Fullscreen ( F )'}
            >
              {isFullscreen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H5v3a1 1 0 01-2 0V4zm12-1a1 1 0 011 1v3a1 1 0 01-2 0V5h-3a1 1 0 010-2h4zM4 16a1 1 0 001 1h4a1 1 0 000-2H6v-3a1 1 0 00-2 0v4zm12 1a1 1 0 01-1-1v-3a1 1 0 012 0v3h3a1 1 0 010 2h-4z" clipRule="evenodd" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9-1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zM5 13.586l-2.293 2.293A1 1 0 004 17h4a1 1 0 000-2H6.414l2.293-2.293a1 1 0 00-1.414-1.414L5 13.586zm10 0l2.293 2.293A1 1 0 0116 17h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586z" clipRule="evenodd" /></svg>
              )}
            </button>
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
