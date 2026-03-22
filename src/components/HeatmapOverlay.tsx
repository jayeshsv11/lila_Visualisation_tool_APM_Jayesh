import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import type { GameEvent, HeatmapMode, MapId } from '../lib/types';
import { MAP_SIZE, MAP_CONFIGS } from '../lib/constants';
import { getKillEvents, getDeathEvents, getTrafficEvents } from '../lib/filters';
import { useCanvasZoom } from '../hooks/useCanvasZoom';

// simpleheat doesn't have types, import as any
// @ts-expect-error simpleheat has no type defs
import simpleheat from 'simpleheat';

interface Props {
  minimapUrl: string;
  events: GameEvent[];
  mode: HeatmapMode;
  showBots: boolean;
  selectedMap: MapId;
}

export default function HeatmapOverlay({ minimapUrl, events, mode, showBots, selectedMap }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heatCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState(700);
  const zoomPan = useCanvasZoom(canvasSize);
  const [worldCoords, setWorldCoords] = useState<{ x: number; z: number } | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
    };
    img.src = minimapUrl;
    setImgLoaded(false);
  }, [minimapUrl]);

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

  const heatmapStats = useMemo(() => {
    const sourceEvents = showBots ? events : events.filter(e => !e.is_bot);
    let count: number;
    let label: string;
    switch (mode) {
      case 'kills':
        count = getKillEvents(sourceEvents).length;
        label = 'kill events';
        break;
      case 'deaths':
        count = getDeathEvents(sourceEvents).length;
        label = 'death events';
        break;
      case 'traffic':
        count = getTrafficEvents(sourceEvents).length;
        label = 'position events';
        break;
    }
    return { count, label };
  }, [events, mode, showBots]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const heatCanvas = heatCanvasRef.current;
    const img = imgRef.current;
    if (!canvas || !heatCanvas || !img || !imgLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = canvasSize / MAP_SIZE;

    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Apply zoom/pan transform
    ctx.save();
    zoomPan.applyTransform(ctx);

    // Draw minimap
    ctx.drawImage(img, 0, 0, canvasSize, canvasSize);

    // Optionally exclude bot events
    const sourceEvents = showBots ? events : events.filter(e => !e.is_bot);

    // Get relevant events
    let filtered: GameEvent[];
    switch (mode) {
      case 'kills':
        filtered = getKillEvents(sourceEvents);
        break;
      case 'deaths':
        filtered = getDeathEvents(sourceEvents);
        break;
      case 'traffic':
        // For traffic, sample every 3rd event to avoid overwhelming
        filtered = getTrafficEvents(sourceEvents).filter((_, i) => i % 3 === 0);
        break;
    }

    if (filtered.length > 0) {
      // Generate heatmap on separate canvas
      heatCanvas.width = canvasSize;
      heatCanvas.height = canvasSize;

      const heat = simpleheat(heatCanvas);
      const radius = mode === 'traffic' ? 8 : 15;
      heat.radius(radius * scale, radius * scale * 1.5);

      const points: [number, number, number][] = filtered.map(e => [
        e.pixel_x * scale,
        e.pixel_y * scale,
        1,
      ]);
      heat.data(points);
      heat.draw(0.05);

      // Overlay heatmap on minimap
      ctx.globalAlpha = 0.6;
      ctx.drawImage(heatCanvas, 0, 0);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }, [events, mode, showBots, imgLoaded, canvasSize, zoomPan.applyTransform]);

  const handleCoordMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const pixelX = (mouseX - zoomPan.panX) / zoomPan.zoom;
    const pixelY = (mouseY - zoomPan.panY) / zoomPan.zoom;
    const cfg = MAP_CONFIGS[selectedMap];
    const u = pixelX / canvasSize;
    const v = 1 - (pixelY / canvasSize);
    const worldX = u * cfg.scale + cfg.origin_x;
    const worldZ = v * cfg.scale + cfg.origin_z;
    setWorldCoords({ x: Math.round(worldX * 10) / 10, z: Math.round(worldZ * 10) / 10 });
  }, [zoomPan.panX, zoomPan.panY, zoomPan.zoom, canvasSize, selectedMap]);

  const handleMouseMoveWithCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    zoomPan.handleMouseMove(e);
    handleCoordMove(e);
  }, [zoomPan.handleMouseMove, handleCoordMove]);

  const handleMouseLeaveWithCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setWorldCoords(null);
    zoomPan.handleMouseLeave(e);
  }, [zoomPan.handleMouseLeave]);

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
      <canvas ref={heatCanvasRef} className="hidden" />
      <div className="absolute top-14 right-2 md:top-3 md:right-3 bg-[#1a1d27]/90 backdrop-blur-sm border border-gray-700 rounded-lg px-3 py-2">
        <span className="text-xs text-gray-300">{heatmapStats.count.toLocaleString()} {heatmapStats.label}</span>
      </div>
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
