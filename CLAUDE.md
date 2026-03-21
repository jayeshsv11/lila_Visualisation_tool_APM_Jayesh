# CLAUDE.md - LILA Player Journey Visualization Tool

## ABSOLUTE RULES (never violate)

1. **Never invent data schemas.** The schema is in `player_data/README.md`. Read it before writing ANY data-handling code. Columns: user_id, match_id, map_id, x, y, z, ts, event.

2. **The `event` column is BYTES, not strings.** Every code path that reads events must decode: `.decode('utf-8')` in Python, or equivalent cast in JS/TS. If you skip this, filtering silently breaks.

3. **2D mapping uses x and z. NOT x and y.** The `y` column is elevation/height. For minimap plotting: horizontal = x, vertical = z. Getting this wrong puts every dot in the wrong place.

4. **Coordinate conversion must match this formula exactly:**
   ```
   u = (x - origin_x) / scale
   v = (z - origin_z) / scale
   pixel_x = u * 1024
   pixel_y = (1 - v) * 1024    ← Y is flipped
   ```
   Map configs:
   | Map | Scale | Origin X | Origin Z |
   |-----|-------|----------|----------|
   | AmbroseValley | 900 | -370 | -473 |
   | GrandRift | 581 | -290 | -290 |
   | Lockdown | 1000 | -500 | -500 |

   **After implementing, verify visually:** AmbroseValley positions must cluster on roads/buildings, not in empty space or off-map.

5. **Bot detection:** UUID user_id = human. Short numeric user_id = bot. Use regex `/^[0-9]+$/`. Do NOT rely solely on event type.

6. **Files have no .parquet extension.** They end in `.nakama-0`. Parquet readers accept them by path.

7. **Timestamps are match-relative, not wall-clock.** ts=0 is match start. Display as mm:ss or seconds elapsed. Never display as dates.

8. **Never hardcode data.** All statistics, player counts, map lists must come from the actual loaded data.

9. **Never create placeholder or mock data.** Always use real data from player_data/.

10. **Before writing any component, read the assignment requirements** in `Lila APM Written Test.txt` to ensure nothing is missed.

---

## Tech Stack (use exactly this — do not deviate)

| Layer | Tool | Why |
|-------|------|-----|
| Frontend | Vite + React + TypeScript | Single-page app, no SSR needed. Fast builds. |
| Data Pipeline | Python preprocessing → static JSON | Pre-compute pixel coords, decode bytes, validate data ONCE |
| Visualization | HTML5 Canvas (custom React components) | Full control, zero deps, handles 89K points easily |
| Heatmaps | simpleheat library | 3KB, canvas-based, no dependencies |
| Timeline | Custom range slider + requestAnimationFrame | 50 lines of code, fully controllable |
| Styling | Tailwind CSS | Fast, consistent, dark theme support |
| Hosting | Vercel (static deploy) | Free, zero config for Vite, global CDN |

### Why NOT these alternatives:
- **Next.js:** No SSR/routing needs. Adds server runtime for a static site.
- **deck.gl:** 200KB+ bundle for 89K points. Massive overkill.
- **Leaflet:** Forces lat/lng geographic assumptions. Fights game coordinate systems.
- **D3 with SVG:** Chokes on thousands of path elements. Canvas is correct for this volume.
- **Browser-side parquet (parquet-wasm):** Adds WASM loading delay + dependency complexity for 4MB of data. Just preprocess to JSON.

---

## Data Preprocessing (scripts/preprocess.py)

This is the MOST CRITICAL code in the project. If it's wrong, everything is wrong.

### Must do:
1. Read all .nakama-0 files from all 5 day folders
2. Decode event bytes to strings
3. Determine is_bot from user_id (regex, not event type)
4. **Pre-compute pixel_x and pixel_y** using the coordinate formula above
5. Convert ts to seconds elapsed (float) from minimum ts in that match
6. Output per-day JSON: `feb10.json` through `feb14.json` into `public/data/`
7. Output `manifest.json` with metadata (dates, map counts, totals)
8. Output `matches.json` with per-match metadata (match_id, map_id, date, human_count, bot_count, duration)

### Validation (run after preprocessing, print results):
- Total events ≈ 89,000
- Unique players = 339
- Unique matches = 796
- All pixel_x/pixel_y in range [0, 1024] (warn if >5% out of range)
- All 8 event types present
- Print per-map event counts

### JSON Event Schema:
```json
{
  "user_id": "f4e072fa-...",
  "match_id": "b71aaad8-...",
  "map_id": "AmbroseValley",
  "event": "Position",
  "is_bot": false,
  "pixel_x": 78,
  "pixel_y": 890,
  "ts_seconds": 42.7
}
```

---

## Frontend Architecture

```
src/
  components/
    MapViewer.tsx        -- Canvas + minimap image, zoom/pan
    JourneyRenderer.tsx  -- Player paths and event markers
    HeatmapOverlay.tsx   -- Heatmap using simpleheat
    Timeline.tsx         -- Playback slider, play/pause, speed
    FilterPanel.tsx      -- Map, date, match selectors
    EventLegend.tsx      -- Color/icon legend
    MatchInfo.tsx        -- Stats for selected match
  hooks/
    useDataLoader.ts     -- Fetch + cache JSON
    usePlayback.ts       -- requestAnimationFrame logic
  lib/
    types.ts             -- TypeScript interfaces
    constants.ts         -- Map configs, event colors
    filters.ts           -- Pure filter functions
  App.tsx
  main.tsx
```

---

## Visual Design Rules

- **The minimap is the hero.** It fills most of the viewport.
- **Sidebar** for filters/controls, collapsible, on the left.
- **Dark UI theme.** Minimaps are dark-toned; light UI clashes.
- **Default view:** One match at a time (not all 89K points).
- **Desktop only.** Min width 1280px. Don't waste time on mobile.

### Event Marker Colors:
| Event | Color | Shape |
|-------|-------|-------|
| Kill | Red | Triangle up |
| Killed | Red | X mark |
| BotKill | Orange | Triangle up |
| BotKilled | Orange | X mark |
| KilledByStorm | Purple | Circle |
| Loot | Green | Diamond |
| Position (human) | Blue | Small dot |
| BotPosition | Gray | Smaller dot, 50% opacity |

### Player Paths:
- Human: Colored lines (distinct color per player in match)
- Bot: Gray, 50% opacity, hidden by default (toggle to show)

### Heatmap Modes (aggregate across ALL matches on selected map):
1. **Kill zones:** Kill + BotKill events
2. **Death zones:** Killed + BotKilled + KilledByStorm
3. **Traffic:** Position + BotPosition

---

## Common Failure Modes (AVOID THESE)

1. Swapping x/y instead of x/z for 2D mapping
2. Forgetting to flip v: `pixel_y = (1-v) * 1024` not `v * 1024`
3. Not decoding event bytes — filters fail silently
4. Plotting all 89K points at once — canvas becomes a blob
5. Heatmap on single match — too few points, looks empty
6. Timeline showing wall-clock dates instead of elapsed time
7. Deploying without visually verifying coordinate mapping on all 3 maps
8. Ignoring bots entirely (they're 60-70% of entities)

---

## Quality Checklist (verify EACH before marking done)

- [ ] Dots appear on roads/buildings on AmbroseValley, not empty space
- [ ] All 3 maps render correctly with correct coordinate mapping
- [ ] Bot paths visually distinct from human paths
- [ ] Kill/death/loot/storm markers clearly distinguishable
- [ ] Filtering by date reduces visible data correctly
- [ ] Match selector shows match_id + map + player count
- [ ] Timeline scrubbing updates canvas in real-time
- [ ] Heatmap shows clear hotspots, not uniform noise
- [ ] No console errors in production build
- [ ] Deployed URL loads within 5 seconds

---

## Deployment Rules

1. **Compress minimap images** to WebP or optimized PNG. Target <500KB each (originals are 9-11MB).
2. JSON data files must be gzip-served (Vercel does this automatically).
3. Test production build locally with `vite preview` before deploying.
4. Deployed URL must work without any login, API key, or setup.
5. Do NOT commit raw parquet files. DO commit preprocessed JSON + compressed minimaps.

---

## Implementation Order (follow exactly)

1. Python preprocessing script → validate output
2. Verify coordinates visually (quick Python matplotlib plot)
3. Vite + React + TS scaffold
4. Data loading + MapViewer with minimap display
5. Plot positions for ONE match on ONE map → verify correctness
6. Event markers with distinct styles
7. Filter panel (map, date, match)
8. Timeline/playback
9. Heatmap overlay
10. Human vs bot toggle
11. Polish: legend, match info, dark theme, responsive sidebar
12. Compress images, optimize bundle
13. Deploy to Vercel
14. Write ARCHITECTURE.md, INSIGHTS.md, README.md
15. Final verification at deployed URL

---

## Git Rules

- Commit after each working feature
- .gitignore: node_modules, dist, .env, __pycache__, .venv, player_data/February_*
- DO commit: public/data/*.json, compressed minimap images, all source code
- Repository must include: ARCHITECTURE.md, INSIGHTS.md, README.md
