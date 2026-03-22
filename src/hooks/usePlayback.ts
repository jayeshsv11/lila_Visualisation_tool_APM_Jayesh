import { useState, useRef, useCallback, useEffect } from 'react';

export function usePlayback(maxTime: number) {
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const animRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);

  const tick = useCallback((timestamp: number) => {
    if (lastFrameRef.current === 0) {
      lastFrameRef.current = timestamp;
    }
    const delta = (timestamp - lastFrameRef.current) / 1000;
    lastFrameRef.current = timestamp;

    setCurrentTime(prev => {
      const next = prev + delta * speed;
      if (next >= maxTime) {
        setPlaying(false);
        return maxTime;
      }
      return next;
    });

    animRef.current = requestAnimationFrame(tick);
  }, [maxTime, speed]);

  useEffect(() => {
    if (playing) {
      lastFrameRef.current = 0;
      animRef.current = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(animRef.current);
    }
    return () => cancelAnimationFrame(animRef.current);
  }, [playing, tick]);

  const togglePlay = useCallback(() => {
    setPlaying(p => {
      if (!p && currentTime >= maxTime) {
        setCurrentTime(0);
      }
      return !p;
    });
  }, [currentTime, maxTime]);

  const seek = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const reset = useCallback(() => {
    setPlaying(false);
    setCurrentTime(0);
  }, []);

  return { currentTime, playing, speed, setSpeed, togglePlay, seek, reset };
}
