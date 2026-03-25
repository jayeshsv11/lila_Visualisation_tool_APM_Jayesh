# Architecture

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | Vite + React + TypeScript | Fast builds, type-safe data handling, no SSR needed |
| Data Pipeline | Python (pyarrow + pandas) | One-time preprocessing of parquet files into static JSON |
| Visualization | HTML5 Canvas + simpleheat | Full pixel control, zero heavy dependencies, handles 89K points |
| Styling | Tailwind CSS | Dark theme out of the box |
| Hosting | Vercel | Static CDN, auto gzip, zero config for Vite |

**Why not deck.gl/Leaflet?** They assume geographic lat/lng coordinates — wrong abstraction for game minimaps. **Why not browser-side parquet?** Pre-processing to JSON eliminates runtime bugs (parsing, bytes decoding, coordinate math) entirely.

## Data Flow

A Python script (`scripts/preprocess.py`) reads 1,243 `.nakama-0` parquet files, decodes event bytes, classifies humans vs bots, pre-computes pixel coordinates, and normalizes timestamps. It outputs per-day JSON arrays, match metadata (796 matches), and a manifest under `public/data/`. The React frontend fetches these on demand, applies filters, and renders onto Canvas overlaid on the minimap.

## Coordinate Mapping

Each map has a unique scale and origin. The conversion uses x and z world coordinates (not y — that's elevation):

```
u = (x − origin_x) / scale
v = (z − origin_z) / scale
pixel_x = u × 1024
pixel_y = (1 − v) × 1024
```

Y-axis is flipped because image origin is top-left. Coordinates are pre-computed in Python and validated against the README's known example (x=−301.45, z=−355.55 → pixel 78, 890), so the frontend just plots pre-computed values.

## Assumptions

- **Bot detection**: Pure numeric user_ids = bots, UUIDs = humans. Aligns with the README but not guaranteed for all edge cases.
- **Timestamps**: Raw ts values are batch-recorded (sub-second ranges per match). Preprocessing assigns synthetic elapsed timestamps to make playback meaningful while preserving event order.
- **Feb 14**: Partial day, included as-is.

## Trade-offs

| Decision | Trade-off |
|----------|-----------|
| Pre-computed coords over frontend math | Extra build step, but guarantees correctness |
| Static JSON over parquet-in-browser | Duplicates data, but eliminates WASM dependency and runtime parsing bugs |
| Canvas over SVG/WebGL | No hover/click interactivity, but handles 89K points with simpler code |
| Single-match default | Users must select manually, but prevents canvas overload |
| Synthetic timeline | Doesn't reflect real match duration, but raw timestamps are batch-recorded and unusable for playback |
| Collapsible panels + fullscreen | More UI state, but Level Designers need maximum map area |

## With More Time

- Hover tooltips on event markers (player name, event details)
- Real-time telemetry pipeline: ingest live match data via WebSocket so designers can watch ongoing matches, not just historical replays
- Click-to-select a player and highlight their full journey
- Side-by-side match comparison view
- 3D terrain visualization: use the y (elevation) data to analyze vertical combat patterns (multi-floor fights, elevation advantage hotspots)
