import { useState, useEffect } from 'react';
import { EVENT_COLORS, EVENT_LABELS } from '../lib/constants';
import type { EventType } from '../lib/types';

const LEGEND_EVENTS: EventType[] = [
  'Kill', 'Killed', 'BotKill', 'BotKilled', 'KilledByStorm', 'Loot',
];

const SHAPES: Record<string, string> = {
  Kill: '\u25B2',
  BotKill: '\u25B2',
  Killed: '\u2717',
  BotKilled: '\u2717',
  KilledByStorm: '\u25CF',
  Loot: '\u25C6',
};

export default function EventLegend() {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('lila-legend-collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('lila-legend-collapsed', String(collapsed));
  }, [collapsed]);

  return (
    <div className="absolute top-14 right-2 md:top-3 md:right-3 bg-[#1a1d27]/90 backdrop-blur-sm border border-gray-700 rounded-lg p-2 md:p-3">
      <div
        className="flex items-center justify-between cursor-pointer select-none gap-3"
        onClick={() => setCollapsed(c => !c)}
      >
        <h3 className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Legend</h3>
        <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 text-gray-500 transition-transform ${collapsed ? '' : 'rotate-180'}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
      </div>
      {!collapsed && (
        <div className="space-y-1 mt-2">
          {LEGEND_EVENTS.map(event => (
            <div key={event} className="flex items-center gap-2 text-xs">
              <span style={{ color: EVENT_COLORS[event] }} className="text-sm w-4 text-center">
                {SHAPES[event]}
              </span>
              <span className="text-gray-300">{EVENT_LABELS[event]}</span>
            </div>
          ))}
          <div className="border-t border-gray-600 my-1 pt-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-4 h-0.5 bg-blue-500 inline-block"></span>
              <span className="text-gray-300">Human path</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-4 h-0.5 bg-amber-400 inline-block opacity-70"></span>
              <span className="text-gray-300">Bot path</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
