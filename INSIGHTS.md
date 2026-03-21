# Game Insights

## Insight 1: PvP Combat is Nearly Non-Existent — The Bot Economy Dominates

**What caught my eye:** Across all 89,104 events and 796 matches over 5 days, there were only **3 PvP kills** (human vs human) across all three maps. Meanwhile, there were **2,415 bot kills**. The PvP kill rate is 0.12% of all kills.

**The numbers:**
| Map | PvP Kills | Bot Kills | PvP Kill Rate |
|-----|-----------|-----------|---------------|
| AmbroseValley | 2 | 1,797 | 0.1% |
| GrandRift | 1 | 192 | 0.5% |
| Lockdown | 0 | 426 | 0.0% |

The heatmap tool confirmed this — Kill Zone heatmaps are almost entirely driven by bot encounters, spread across predictable patrol paths. There are no human PvP "hotspots" because PvP essentially doesn't happen.

**Why a Level Designer should care:** This signals a fundamental matchmaking or map flow problem. Either:
- Human players are not encountering each other (map is too large relative to player count, or spawn points are too spread)
- Players are actively avoiding PvP (extracting before engaging)
- The bot density is so high that players fill their engagement quota on bots before finding humans

**Actionable items:**
- **Metric to track:** PvP encounter rate (how often two human players are within engagement range)
- **Action:** Tighten player spawn zones or create map chokepoints that force human-human encounters
- **Action:** Reduce bot density in areas near extraction points to force players into contested human zones
- **Expected impact:** Increased PvP kills per match, higher player engagement and retention

---

## Insight 2: Severe Player Drop-off — 60% Decline in 5 Days

**What caught my eye:** Daily match counts show a steep, consistent decline:

| Day | Matches | Change |
|-----|---------|--------|
| Feb 10 | 285 | — |
| Feb 11 | 200 | -30% |
| Feb 12 | 162 | -19% |
| Feb 13 | 112 | -31% |
| Feb 14 | 37 | -67% (partial day) |

Even excluding Feb 14 (partial), matches dropped 61% from Feb 10 to Feb 13. Unique human players also declined proportionally.

The traffic heatmap across different days confirmed this — Feb 13 heatmaps are noticeably sparser than Feb 10, with entire map regions showing zero activity.

**Why a Level Designer should care:** This isn't just a playerbase issue — the maps may be contributing to churn. If players explore the map once, find it repetitive (same loot locations, same bot encounters, no PvP), there's no reason to return. The data shows players overwhelmingly play AmbroseValley (68.5% of all events) and rarely try GrandRift (7.7%), suggesting the other maps aren't compelling enough to retain curiosity.

**Actionable items:**
- **Metric to track:** Day-2 and Day-3 retention rate, matches per unique player per day
- **Action:** Add daily-rotating loot hotspots or dynamic map events to create reason for return visits
- **Action:** Investigate why GrandRift has such low play rate — is it unlocked later, less visible in UI, or just unpopular?
- **Expected impact:** Improved D2-D7 retention, more even map distribution

---

## Insight 3: Lockdown Has Disproportionate Storm Deaths Despite Being the Smallest Map

**What caught my eye:** Lockdown and AmbroseValley have the **same number of storm deaths** (17 each), despite AmbroseValley having 3x more total events. Normalizing for player activity:

| Map | Storm Deaths | Total Events | Storm Death Rate |
|-----|-------------|--------------|-----------------|
| AmbroseValley | 17 | 61,013 | 0.028% |
| GrandRift | 5 | 6,853 | 0.073% |
| Lockdown | 17 | 21,238 | 0.080% |

Lockdown's storm death rate is **2.9x higher** than AmbroseValley's. The death zone heatmap for Lockdown shows storm deaths concentrated at the **map edges** (average pixel position 562, 467 — offset from center), suggesting players get trapped against the boundary.

**Why a Level Designer should care:** Lockdown is described as a smaller, close-quarters map. The high storm death rate suggests the storm pushes too aggressively relative to the map size, or that extraction points are poorly positioned relative to the storm's direction. Players on the wrong side of the map when the storm starts cannot reach safety in time.

**Actionable items:**
- **Metric to track:** Storm death rate per map, average time-to-extract vs storm arrival time
- **Action:** Slow the storm speed on Lockdown, or add additional extraction points on the far side of the map
- **Action:** Add visual/audio storm warnings earlier on Lockdown to give players more reaction time
- **Expected impact:** Reduced frustrating deaths, improved player satisfaction on Lockdown
