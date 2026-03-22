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
    <div className="bg-[#1a1d27] border-t border-gray-700 px-2 md:px-4 py-2 md:py-3 flex items-center gap-2 md:gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <button
          onClick={onTogglePlay}
          className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-bold transition-colors text-sm md:text-base"
        >
          {playing ? '\u275A\u275A' : '\u25B6'}
        </button>
        <button
          onClick={onReset}
          className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300 transition-colors"
          title="Reset"
        >
          {'\u25A0'}
        </button>
      </div>

      <span className="text-xs md:text-sm text-gray-400 w-10 md:w-12 text-right font-mono">
        {formatTime(currentTime)}
      </span>

      <input
        type="range"
        min={0}
        max={maxTime}
        step={0.1}
        value={currentTime}
        onChange={e => onSeek(parseFloat(e.target.value))}
        className="flex-1 min-w-[100px] accent-blue-500 h-2"
      />

      <span className="text-xs md:text-sm text-gray-400 w-10 md:w-12 font-mono">
        {formatTime(maxTime)}
      </span>

      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500 hidden md:inline">Speed:</span>
        {[1, 2, 5, 10].map(s => (
          <button
            key={s}
            onClick={() => onSpeedChange(s)}
            className={`px-1.5 md:px-2 py-1 text-xs rounded transition-colors ${
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
