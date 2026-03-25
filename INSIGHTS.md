# Game Insights

## Insight 1: Players almost never fight each other

This one surprised me the most. Out of 796 matches, I found only 3 human-vs-human kills. Three. Meanwhile there were 2,415 bot kills. That's 0.12% PvP.

| Map | PvP Kills | Bot Kills |
|-----|-----------|-----------|
| AmbroseValley | 2 | 1,797 |
| GrandRift | 1 | 192 |
| Lockdown | 0 | 426 |

When I switched to the kill zone heatmap, it made sense visually too. Every hotspot was along bot patrol routes. There's nothing that looks like a PvP fight cluster anywhere on any map.

My best guess is that the maps are large enough and player counts low enough that humans rarely bump into each other. By the time they could, they've already filled their bags from bots and extracted. If the level design team wants PvP to actually happen, they'd need to either tighten spawn areas, create natural chokepoints, or thin out bots near extraction zones so players have a reason to contest each other.

**Why a level designer should care:** This means the combat loop is entirely PvE right now. For a game that's supposed to have extraction-shooter tension, that tension doesn't exist. The map layout is letting players avoid each other completely.

**Actionable items:**
- Track PvP encounter rate (how often two humans are within engagement range) — if it's near zero, the map geometry is the problem
- Tighten player spawn zones or add chokepoints that funnel humans toward each other
- Reduce bot density near extraction points so players can't fill up and leave without ever seeing another human
- **Metrics affected:** PvP kills per match, average engagement distance between humans, player retention

---

## Insight 2: The game lost 60% of its matches in 4 days

I noticed this when switching between days in the filter panel.

| Day | Matches | Change |
|-----|---------|--------|
| Feb 10 | 285 | - |
| Feb 11 | 200 | -30% |
| Feb 12 | 162 | -19% |
| Feb 13 | 112 | -31% |

That's a 61% drop in 4 days (excluding Feb 14 which was a partial day with only 37 matches). The traffic heatmaps tell the same story. Feb 13 maps look noticeably empty compared to Feb 10, with whole regions going dark.

What also stood out is that 68.5% of all events happen on AmbroseValley. GrandRift is only 7.7%. Players are barely trying the other maps. That combination of not exploring + dropping off fast suggests the core loop isn't giving people a reason to come back. If every match feels the same (same loot spots, same bot paths, no real PvP), one or two sessions is enough.

Worth investigating why GrandRift gets so little traffic. Is it locked behind progression? Hard to find in the UI? Or do players try it once and not return?

**Why a level designer should care:** If players explore a map once, find it repetitive (same loot spots, same bot paths, no PvP), there's no reason to come back. The maps may be contributing directly to churn, not just the meta or matchmaking.

**Actionable items:**
- Track day-2 and day-3 retention rate, and matches per unique player per day
- Add daily-rotating loot hotspots or dynamic map events to create a reason for return visits
- Investigate GrandRift's low play rate specifically — is it a UI discoverability issue or a map quality issue?
- **Metrics affected:** D2–D7 retention, map distribution evenness, matches per player per day

---

## Insight 3: Lockdown's storm kills way more players than it should

Lockdown and AmbroseValley both have exactly 17 storm deaths, but AmbroseValley has 3x more total events.

| Map | Storm Deaths | Total Events | Storm Death Rate |
|-----|-------------|--------------|-----------------|
| AmbroseValley | 17 | 61,013 | 0.028% |
| GrandRift | 5 | 6,853 | 0.073% |
| Lockdown | 17 | 21,238 | 0.080% |

Lockdown's rate is 2.9x higher than AmbroseValley. When I checked the death zone heatmap, the storm kills on Lockdown cluster near the map edges (average position around pixel 562, 467), which tells me players are getting caught against the boundary.

Lockdown is the smallest map, so the storm probably closes in too fast for players on the wrong side to reach extraction. Either the storm speed needs to be slower on this map, or there should be extraction points spread more evenly so nobody is stuck running across the whole map with no chance of making it.

**Why a level designer should care:** Storm deaths feel unfair — the player didn't lose a fight, they just got unlucky with positioning. On a small map, that's a design problem, not a player skill problem. These deaths drive frustration and churn.

**Actionable items:**
- Track storm death rate per map and average time-to-extract vs storm arrival time
- Slow storm speed on Lockdown, or add extraction points on the far side of the map
- Add earlier visual/audio storm warnings on Lockdown to give players more reaction time
- **Metrics affected:** Storm death rate, player satisfaction on Lockdown, per-map churn rate
