interface Props {
  currentTime: number;
  maxTime: number;
  playing: boolean;
  speed: number;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onSpeedChange: (speed: number) => void;
  onReset: () => void;
}

function formatTime(seconds: number): string {
  if (seconds < 10) {
    return `${seconds.toFixed(2)}s`;
  }
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function Timeline({
  currentTime,
  maxTime,
  playing,
  speed,
  onTogglePlay,
  onSeek,
  onSpeedChange,
  onReset,
}: Props) {
  return (
    <div className="bg-[#1a1d27] border-t border-gray-700 px-4 py-3 flex items-center gap-4">
      <button
        onClick={onTogglePlay}
        className="w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-bold transition-colors"
      >
        {playing ? '\u275A\u275A' : '\u25B6'}
      </button>
      <button
        onClick={onReset}
        className="w-8 h-8 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300 transition-colors"
        title="Reset"
      >
        {'\u25A0'}
      </button>

      <span className="text-sm text-gray-400 w-12 text-right font-mono">
        {formatTime(currentTime)}
      </span>

      <input
        type="range"
        min={0}
        max={maxTime}
        step={0.1}
        value={currentTime}
        onChange={e => onSeek(parseFloat(e.target.value))}
        className="flex-1 accent-blue-500 h-2"
      />

      <span className="text-sm text-gray-400 w-12 font-mono">
        {formatTime(maxTime)}
      </span>

      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">Speed:</span>
        {[0.1, 0.25, 0.5, 1].map(s => (
          <button
            key={s}
            onClick={() => onSpeedChange(s)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              speed === s
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}
