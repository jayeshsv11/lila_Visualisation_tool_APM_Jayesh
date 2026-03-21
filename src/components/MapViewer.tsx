import { useRef, useEffect, useState, useCallback } from 'react';
import type { GameEvent, EventType } from '../lib/types';
import { MAP_SIZE, EVENT_COLORS, PLAYER_COLORS } from '../lib/constants';
import { groupByPlayer, isMovementEvent } from '../lib/filters';

interface Props {
  minimapUrl: string;
  events: GameEvent[];
  showBots: boolean;
  currentTime: number | null; // null = show all
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

export default function MapViewer({ minimapUrl, events, showBots, currentTime }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState(700);

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

    // Group by player and draw paths
    const playerGroups = groupByPlayer(visibleEvents);
    let playerIdx = 0;

    playerGroups.forEach((playerEvents, userId) => {
      const isBot = playerEvents[0]?.is_bot;
      const movements = playerEvents
        .filter(e => isMovementEvent(e.event))
        .sort((a, b) => a.ts_seconds - b.ts_seconds);

      if (movements.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = isBot
          ? 'rgba(107, 114, 128, 0.3)'
          : PLAYER_COLORS[playerIdx % PLAYER_COLORS.length];
        ctx.lineWidth = isBot ? 1 : 1.5;
        ctx.globalAlpha = isBot ? 0.3 : 0.7;

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
  }, [events, showBots, currentTime, imgLoaded, canvasSize]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div ref={containerRef} className="flex-1 flex items-center justify-center bg-[#0a0c10] overflow-hidden">
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        className="border border-gray-700 rounded"
      />
    </div>
  );
}
