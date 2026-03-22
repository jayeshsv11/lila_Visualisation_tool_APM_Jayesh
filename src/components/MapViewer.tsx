import { useRef, useEffect, useState, useCallback } from 'react';
import type { GameEvent, EventType, MapId } from '../lib/types';
import { MAP_SIZE, EVENT_COLORS, PLAYER_COLORS, MAP_CONFIGS } from '../lib/constants';
import { groupByPlayer, isMovementEvent } from '../lib/filters';
import { useCanvasZoom } from '../hooks/useCanvasZoom';

interface Props {
  minimapUrl: string;
  events: GameEvent[];
  showBots: boolean;
  currentTime: number | null; // null = show all
  selectedMap: MapId;
  visibleEventTypes: Set<EventType>;
}

function drawMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  event: EventType,
  scale: number
) {
  const color = EVENT_COLORS[event];
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  const s = 5 * scale;

  switch (event) {
    case 'Kill':
    case 'BotKill':
      // Triangle up
      ctx.beginPath();
      ctx.moveTo(x, y - s);
      ctx.lineTo(x - s, y + s);
      ctx.lineTo(x + s, y + s);
      ctx.closePath();
      ctx.fill();
      break;
    case 'Killed':
    case 'BotKilled':
      // X mark
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.moveTo(x - s, y - s);
      ctx.lineTo(x + s, y + s);
      ctx.moveTo(x + s, y - s);
      ctx.lineTo(x - s, y + s);
      ctx.stroke();
      break;
    case 'KilledByStorm':
      // Purple circle
      ctx.beginPath();
      ctx.arc(x, y, s, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'Loot':
      // Diamond
      ctx.beginPath();
      ctx.moveTo(x, y - s);
      ctx.lineTo(x + s, y);
      ctx.lineTo(x, y + s);
      ctx.lineTo(x - s, y);
      ctx.closePath();
      ctx.fill();
      break;
    default:
      break;
  }
}

export default function MapViewer({ minimapUrl, events, showBots, currentTime, selectedMap, visibleEventTypes }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState(700);
  const zoomPan = useCanvasZoom(canvasSize);
  const [worldCoords, setWorldCoords] = useState<{ x: number; z: number } | null>(null);

  // Load minimap image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
    };
    img.src = minimapUrl;
    setImgLoaded(false);
  }, [minimapUrl]);

  // Resize canvas to fit container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      const size = Math.min(width, height, 1024);
      setCanvasSize(Math.floor(size));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Draw everything
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imgLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = canvasSize / MAP_SIZE;

    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Apply zoom/pan transform
    ctx.save();
    zoomPan.applyTransform(ctx);

    ctx.drawImage(img, 0, 0, canvasSize, canvasSize);

    // Filter events by time if playback active
    let visibleEvents = events;
    if (currentTime !== null) {
      visibleEvents = events.filter(e => e.ts_seconds <= currentTime);
    }

    // Filter out bots if disabled
    if (!showBots) {
      visibleEvents = visibleEvents.filter(e => !e.is_bot);
    }

    // Filter by visible event types
    visibleEvents = visibleEvents.filter(e => visibleEventTypes.has(e.event));

    // Group by player and draw paths
    const playerGroups = groupByPlayer(visibleEvents);
    let playerIdx = 0;

    playerGroups.forEach((playerEvents, _userId) => {
      const isBot = playerEvents[0]?.is_bot;
      const movements = playerEvents
        .filter(e => isMovementEvent(e.event))
        .sort((a, b) => a.ts_seconds - b.ts_seconds);

      if (movements.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = isBot
          ? '#fbbf24'
          : PLAYER_COLORS[playerIdx % PLAYER_COLORS.length];
        ctx.lineWidth = 2;
        ctx.globalAlpha = isBot ? 0.55 : 0.85;

        ctx.moveTo(movements[0].pixel_x * scale, movements[0].pixel_y * scale);
        for (let i = 1; i < movements.length; i++) {
          ctx.lineTo(movements[i].pixel_x * scale, movements[i].pixel_y * scale);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      if (!isBot) playerIdx++;
    });

    // Draw event markers (non-movement events)
    for (const e of visibleEvents) {
      if (!isMovementEvent(e.event)) {
        drawMarker(ctx, e.pixel_x * scale, e.pixel_y * scale, e.event, scale);
      }
    }

    ctx.restore();
  }, [events, showBots, currentTime, imgLoaded, canvasSize, zoomPan.applyTransform, visibleEventTypes]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleCoordMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    // Convert mouse position to pixel coords accounting for zoom/pan
    const pixelX = (mouseX - zoomPan.panX) / zoomPan.zoom;
    const pixelY = (mouseY - zoomPan.panY) / zoomPan.zoom;
    // Convert pixel to world coords
    const cfg = MAP_CONFIGS[selectedMap];
    const u = pixelX / canvasSize;
    const v = 1 - (pixelY / canvasSize);
    const worldX = u * cfg.scale + cfg.origin_x;
    const worldZ = v * cfg.scale + cfg.origin_z;
    setWorldCoords({ x: Math.round(worldX * 10) / 10, z: Math.round(worldZ * 10) / 10 });
  }, [zoomPan.panX, zoomPan.panY, zoomPan.zoom, canvasSize, selectedMap]);

  const handleMouseLeaveWithCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setWorldCoords(null);
    zoomPan.handleMouseLeave(e);
  }, [zoomPan.handleMouseLeave]);

  const handleMouseMoveWithCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    zoomPan.handleMouseMove(e);
    handleCoordMove(e);
  }, [zoomPan.handleMouseMove, handleCoordMove]);

  // Determine if there are visible events to show
  const hasVisibleEvents = events.length > 0 && (showBots || events.some(e => !e.is_bot));

  return (
    <div ref={containerRef} className="flex-1 flex items-center justify-center bg-[#0a0c10] overflow-hidden relative">
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        className="border border-gray-700 rounded"
        style={{ cursor: zoomPan.zoom > 1 ? 'grab' : 'default' }}
        onWheel={zoomPan.handleWheel}
        onMouseDown={zoomPan.handleMouseDown}
        onMouseMove={handleMouseMoveWithCoords}
        onMouseUp={zoomPan.handleMouseUp}
        onMouseLeave={handleMouseLeaveWithCoords}
      />
      {!hasVisibleEvents && imgLoaded && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[#1a1d27]/90 border border-gray-700 rounded text-xs text-gray-400">
          {events.length === 0 ? 'Select a match to view player journeys' : 'No human events — enable "Show Bots" to see bot paths'}
        </div>
      )}
      {/* Coordinate Readout */}
      {worldCoords && (
        <div className="absolute bottom-3 left-3 bg-[#1a1d27]/90 backdrop-blur-sm border border-gray-700 rounded px-2 py-1">
          <span className="text-[11px] text-gray-300 font-mono">X: {worldCoords.x.toFixed(1)}  Z: {worldCoords.z.toFixed(1)}</span>
        </div>
      )}
      {/* Zoom Controls */}
      <div className="absolute bottom-3 right-3 flex flex-col items-center gap-1">
        <button
          onClick={zoomPan.zoomIn}
          disabled={zoomPan.zoom >= 8}
          className="w-8 h-8 flex items-center justify-center bg-[#1a1d27]/90 border border-gray-700 rounded text-gray-300 hover:text-white hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg font-bold"
          title="Zoom in"
        >+</button>
        <span className="text-[10px] text-gray-400 select-none font-mono">{zoomPan.zoom.toFixed(1)}x</span>
        <button
          onClick={zoomPan.zoomOut}
          disabled={zoomPan.zoom <= 1}
          className="w-8 h-8 flex items-center justify-center bg-[#1a1d27]/90 border border-gray-700 rounded text-gray-300 hover:text-white hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg font-bold"
          title="Zoom out"
        >−</button>
        {zoomPan.zoom > 1 && (
          <button
            onClick={zoomPan.resetZoom}
            className="w-8 h-8 flex items-center justify-center bg-[#1a1d27]/90 border border-gray-700 rounded text-gray-300 hover:text-white hover:bg-gray-600 transition-colors"
            title="Reset zoom"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>
          </button>
        )}
      </div>
    </div>
  );
}
