import { useState, useCallback, useRef } from 'react';

interface ZoomPanState {
  zoom: number;
  panX: number;
  panY: number;
}

export function useCanvasZoom(canvasSize: number) {
  const [state, setState] = useState<ZoomPanState>({ zoom: 1, panX: 0, panY: 0 });
  const isPanning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setState(prev => {
      const zoomFactor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      const newZoom = Math.max(1, Math.min(8, prev.zoom * zoomFactor));

      // Zoom toward mouse position
      const scale = newZoom / prev.zoom;
      let newPanX = mouseX - scale * (mouseX - prev.panX);
      let newPanY = mouseY - scale * (mouseY - prev.panY);

      // Clamp pan to keep canvas in view
      const maxPan = canvasSize * (newZoom - 1);
      newPanX = Math.max(-maxPan, Math.min(0, newPanX));
      newPanY = Math.max(-maxPan, Math.min(0, newPanY));

      if (newZoom === 1) {
        return { zoom: 1, panX: 0, panY: 0 };
      }

      return { zoom: newZoom, panX: newPanX, panY: newPanY };
    });
  }, [canvasSize]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (state.zoom <= 1) return;
    isPanning.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.style.cursor = 'grabbing';
  }, [state.zoom]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPanning.current) return;

    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };

    setState(prev => {
      const maxPan = canvasSize * (prev.zoom - 1);
      return {
        ...prev,
        panX: Math.max(-maxPan, Math.min(0, prev.panX + dx)),
        panY: Math.max(-maxPan, Math.min(0, prev.panY + dy)),
      };
    });
  }, [canvasSize]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    isPanning.current = false;
    e.currentTarget.style.cursor = state.zoom > 1 ? 'grab' : 'default';
  }, [state.zoom]);

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    isPanning.current = false;
    e.currentTarget.style.cursor = 'default';
  }, []);

  const zoomIn = useCallback(() => {
    setState(prev => {
      const newZoom = Math.min(8, prev.zoom * 1.3);
      const center = canvasSize / 2;
      const scale = newZoom / prev.zoom;
      let newPanX = center - scale * (center - prev.panX);
      let newPanY = center - scale * (center - prev.panY);
      const maxPan = canvasSize * (newZoom - 1);
      newPanX = Math.max(-maxPan, Math.min(0, newPanX));
      newPanY = Math.max(-maxPan, Math.min(0, newPanY));
      return { zoom: newZoom, panX: newPanX, panY: newPanY };
    });
  }, [canvasSize]);

  const zoomOut = useCallback(() => {
    setState(prev => {
      const newZoom = Math.max(1, prev.zoom / 1.3);
      if (newZoom <= 1.01) return { zoom: 1, panX: 0, panY: 0 };
      const center = canvasSize / 2;
      const scale = newZoom / prev.zoom;
      let newPanX = center - scale * (center - prev.panX);
      let newPanY = center - scale * (center - prev.panY);
      const maxPan = canvasSize * (newZoom - 1);
      newPanX = Math.max(-maxPan, Math.min(0, newPanX));
      newPanY = Math.max(-maxPan, Math.min(0, newPanY));
      return { zoom: newZoom, panX: newPanX, panY: newPanY };
    });
  }, [canvasSize]);

  const resetZoom = useCallback(() => {
    setState({ zoom: 1, panX: 0, panY: 0 });
  }, []);

  const applyTransform = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.translate(state.panX, state.panY);
    ctx.scale(state.zoom, state.zoom);
  }, [state]);

  return {
    zoom: state.zoom,
    panX: state.panX,
    panY: state.panY,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    zoomIn,
    zoomOut,
    resetZoom,
    applyTransform,
  };
}
