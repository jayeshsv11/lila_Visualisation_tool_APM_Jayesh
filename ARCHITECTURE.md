# Architecture

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | Vite + React + TypeScript | Single-page data visualization tool with no SSR needs. Vite provides fast HMR and sub-second builds. TypeScript catches data schema bugs at compile time. |
| Data Pipeline | Python (pyarrow + pandas) | One-time preprocessing of 1,243 parquet files into static JSON. Handles bytes decoding, coordinate transformation, and data validation before the frontend ever sees the data. |
| Visualization | HTML5 Canvas | Full pixel-level control for rendering paths and markers on a 1024x1024 minimap. Zero dependencies. Handles ~89K points without performance issues. |
| Heatmaps | simpleheat | 3KB canvas-based heatmap library. Takes [x, y, intensity] arrays and renders density overlays. No heavyweight WebGL stack needed for this data volume. |
| Styling | Tailwind CSS | Rapid UI development with consistent dark theme. No custom CSS debugging. |
| Hosting | Vercel | Static file deployment with automatic gzip compression and global CDN. Zero configuration for Vite projects. |

### Why NOT alternatives

- **deck.gl / Leaflet**: Both are designed for geographic maps (lat/lng, tile layers). Forcing game minimap coordinates into these systems creates unnecessary complexity. deck.gl also adds 200KB+ to the bundle for a problem that raw Canvas handles easily.
- **Next.js**: No server-side rendering, API routes, or dynamic routing needed. Would add a Node.js runtime to what is fundamentally a static site.
- **Browser-side parquet parsing**: The total dataset is ~4MB compressed. Pre-processing to JSON eliminates three categories of bugs (parquet parsing, bytes decoding, coordinate math) from the frontend entirely.

## Data Flow

```
Raw Parquet Files (1,243 files, ~89K events)
        │
        ▼
  scripts/preprocess.py
  ┌─────────────────────────────┐
  │ 1. Read all .nakama-0 files │
  │ 2. Decode event bytes       │
  │ 3. Detect bots (user_id)    │
  │ 4. Compute pixel coords     │
  │ 5. Compute elapsed time     │
  │ 6. Validate all outputs     │
  └─────────────────────────────┘
        │
        ▼
  Static JSON (public/data/)
  ├── feb10.json ... feb14.json  (per-day event arrays)
  ├── matches.json               (match metadata for dropdowns)
  └── manifest.json              (global stats + map configs)
        │
        ▼
  React Frontend (Vite)
  ┌─────────────────────────────┐
  │ useDataLoader: fetch + cache│
  │ FilterPanel: map/date/match │
  │ MapViewer: canvas rendering │
  │ HeatmapOverlay: simpleheat  │
  │ Timeline: playback control  │
  └─────────────────────────────┘
        │
        ▼
  Browser Canvas (1024x1024)
```

## Coordinate Mapping

This was the trickiest part. Each map has a different scale and origin:

| Map | Scale | Origin X | Origin Z |
|-----|-------|----------|----------|
| AmbroseValley | 900 | -370 | -473 |
| GrandRift | 581 | -290 | -290 |
| Lockdown | 1000 | -500 | -500 |

The conversion uses the `x` and `z` world coordinates (NOT `y`, which is elevation):

```
u = (x - origin_x) / scale
v = (z - origin_z) / scale
pixel_x = u * 1024
pixel_y = (1 - v) * 1024    // Y-axis flipped (image origin is top-left)
```

**Critical decision**: Pixel coordinates are pre-computed in Python during preprocessing, not in the frontend. This means the coordinate math is validated once (against the README's known example: x=-301.45, z=-355.55 → pixel 78, 890), and the frontend simply plots pre-computed values. This eliminates an entire class of bugs.

## Assumptions

- **Bot detection**: User IDs matching `/^\d+$/` are bots; UUIDs are humans. This aligns with the README but was not explicitly guaranteed for all edge cases.
- **Timestamps**: The `ts` field represents batch-recorded server timestamps, not real-time match progression. Events within a match span sub-second ranges (~0.3-0.8s). The timeline still provides meaningful event ordering.
- **February 14 partial day**: Included as-is; the tool shows reduced data for this day without special handling.

## Trade-offs

| Decision | Trade-off | Why |
|----------|-----------|-----|
| Pre-compute coordinates in Python | Extra build step required | Guarantees correctness; frontend can't get coords wrong |
| Static JSON instead of parquet-in-browser | Data is duplicated (raw + JSON) | Eliminates WASM dependency, faster load, simpler debugging |
| Canvas over SVG/WebGL | No built-in interactivity (hover/click) | Performance at scale; full rendering control; simpler code |
| Single-match default view | Users must select matches manually | Prevents overwhelming canvas with 89K points |
| WebP minimap compression | Older browsers may not support WebP | 60KB vs 10MB per image; WebP support is >97% globally |

## What I'd Do Differently With More Time

- Add hover tooltips on event markers (player name, event details)
- Implement click-to-select a player and highlight their journey
- Add a "compare matches" view (side-by-side maps)
- Build a server-side data pipeline for larger datasets (DuckDB or Polars)
- Add zoom/pan controls on the canvas for detailed inspection
- Implement URL-based state (shareable links to specific match views)
