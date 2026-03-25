# LILA BLACK: Player Journey Visualization Tool

A web-based tool for Level Designers to explore player behavior across 3 maps in LILA BLACK, an extraction shooter.

**Live Demo:** [https://lila-visualisation-tool-apm-jayesh.vercel.app/](https://lila-visualisation-tool-apm-jayesh.vercel.app/)

## Features

- **Player Journey Paths:** Visualize individual player movement paths on minimaps with correct coordinate mapping
- **Human vs Bot Distinction:** Humans shown in color, bots in gray (toggleable)
- **Event Markers:** Kill, death, loot, and storm death events rendered as distinct colored shapes
- **Filter by Map / Date / Match:** Drill down to specific matches or aggregate across days
- **Timeline Playback:** Watch a match unfold event-by-event with play/pause and speed controls
- **Heatmap Overlays:** Kill zones, death zones, and traffic density aggregated across all matches
- **3 Maps Supported:** AmbroseValley, GrandRift, Lockdown with accurate coordinate mapping

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite + React + TypeScript |
| Visualization | HTML5 Canvas + simpleheat |
| Styling | Tailwind CSS |
| Data Pipeline | Python (pyarrow + pandas) |
| Hosting | Vercel |

## Local Setup

### Prerequisites
- Node.js 18+
- Python 3.10+ (only needed to re-run preprocessing)

### Run the frontend
```bash
npm install
npm run dev
```
Opens at http://localhost:5173

### Re-run data preprocessing (optional)
Only needed if you have the raw parquet files in `player_data/February_*/`:
```bash
pip install pyarrow pandas
python scripts/preprocess.py
```
Pre-processed JSON data is already committed in `public/data/`.

### Build for production
```bash
npm run build
npm run preview   # test the production build locally
```

## Project Structure

```
├── public/
│   ├── data/           # Pre-processed JSON (events, matches, manifest)
│   └── minimaps/       # Compressed WebP minimap images (1024x1024)
├── scripts/
│   ├── preprocess.py   # Parquet → JSON preprocessing pipeline
│   └── verify_coords.py# Coordinate verification plot
├── src/
│   ├── components/     # React components (MapViewer, Heatmap, Timeline, etc.)
│   ├── hooks/          # Custom hooks (data loading, playback)
│   └── lib/            # Types, constants, filter utilities
├── ARCHITECTURE.md     # Tech stack decisions and data flow
├── INSIGHTS.md         # 3 game insights from the data
└── README.md           # This file
```

## Data

- **89,104 events** across 5 days (Feb 10-14, 2026)
- **339 unique players**, **796 matches**, **3 maps**
- 8 event types: Position, BotPosition, Kill, Killed, BotKill, BotKilled, KilledByStorm, Loot
- Raw parquet files are excluded from git (too large); pre-processed JSON is included
