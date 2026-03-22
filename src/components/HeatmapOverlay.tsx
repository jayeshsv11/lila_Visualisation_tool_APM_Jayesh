import { useRef, useEffect, useState } from 'react';
import type { GameEvent, HeatmapMode } from '../lib/types';
import { MAP_SIZE } from '../lib/constants';
import { getKillEvents, getDeathEvents, getTrafficEvents } from '../lib/filters';
import { useCanvasZoom } from '../hooks/useCanvasZoom';

// simpleheat doesn't have types, import as any
// @ts-expect-error simpleheat has no type defs
import simpleheat from 'simpleheat';

interface Props {
  minimapUrl: string;
  events: GameEvent[];
  mode: HeatmapMode;
}

export default function HeatmapOverlay({ minimapUrl, events, mode }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heatCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState(700);
  const zoomPan = useCanvasZoom(canvasSize);

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

    // Get relevant events
    let filtered: GameEvent[];
    switch (mode) {
      case 'kills':
        filtered = getKillEvents(events);
        break;
      case 'deaths':
        filtered = getDeathEvents(events);
        break;
      case 'traffic':
        // For traffic, sample every 3rd event to avoid overwhelming
        filtered = getTrafficEvents(events).filter((_, i) => i % 3 === 0);
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
  }, [events, mode, imgLoaded, canvasSize, zoomPan.applyTransform]);

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
        onMouseMove={zoomPan.handleMouseMove}
        onMouseUp={zoomPan.handleMouseUp}
        onMouseLeave={zoomPan.handleMouseLeave}
      />
      <canvas ref={heatCanvasRef} className="hidden" />
      {zoomPan.zoom > 1 && (
        <button
          onClick={zoomPan.resetZoom}
          className="absolute top-2 left-2 md:top-3 md:left-3 px-2 py-1 bg-[#1a1d27]/90 border border-gray-700 rounded text-xs text-gray-300 hover:text-white transition-colors"
        >
          {zoomPan.zoom.toFixed(1)}x — Reset
        </button>
      )}
    </div>
  );
}
