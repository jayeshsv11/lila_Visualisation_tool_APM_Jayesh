"""
Preprocess LILA BLACK parquet data into static JSON for the visualization tool.

Reads all .nakama-0 parquet files, decodes events, computes pixel coordinates,
and outputs JSON files ready for the frontend.
"""

import os
import re
import json
import pyarrow.parquet as pq
import pandas as pd
from pathlib import Path

# ──────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────

BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "player_data"
OUTPUT_DIR = BASE_DIR / "public" / "data"

DAY_FOLDERS = {
    "February_10": "feb10",
    "February_11": "feb11",
    "February_12": "feb12",
    "February_13": "feb13",
    "February_14": "feb14",
}

MAP_CONFIGS = {
    "AmbroseValley": {"scale": 900, "origin_x": -370, "origin_z": -473},
    "GrandRift":     {"scale": 581, "origin_x": -290, "origin_z": -290},
    "Lockdown":      {"scale": 1000, "origin_x": -500, "origin_z": -500},
}

BOT_PATTERN = re.compile(r"^\d+$")


def is_bot(user_id: str) -> bool:
    return bool(BOT_PATTERN.match(user_id))


def world_to_pixel(x: float, z: float, map_id: str) -> tuple[float, float]:
    cfg = MAP_CONFIGS[map_id]
    u = (x - cfg["origin_x"]) / cfg["scale"]
    v = (z - cfg["origin_z"]) / cfg["scale"]
    pixel_x = u * 1024
    pixel_y = (1 - v) * 1024
    return round(pixel_x, 1), round(pixel_y, 1)


def load_day(folder_path: Path) -> pd.DataFrame:
    frames = []
    for f in os.listdir(folder_path):
        filepath = folder_path / f
        try:
            table = pq.read_table(str(filepath))
            df = table.to_pandas()
            frames.append(df)
        except Exception as e:
            print(f"  WARNING: Could not read {f}: {e}")
            continue
    if not frames:
        return pd.DataFrame()
    return pd.concat(frames, ignore_index=True)


def process_dataframe(df: pd.DataFrame, day_label: str) -> pd.DataFrame:
    # Decode event bytes to string
    df["event"] = df["event"].apply(
        lambda x: x.decode("utf-8") if isinstance(x, bytes) else str(x)
    )

    # Bot detection from user_id
    df["is_bot"] = df["user_id"].apply(is_bot)

    # Compute pixel coordinates (using x and z, NOT x and y)
    pixels = df.apply(
        lambda row: world_to_pixel(row["x"], row["z"], row["map_id"]),
        axis=1,
    )
    df["pixel_x"] = [p[0] for p in pixels]
    df["pixel_y"] = [p[1] for p in pixels]

    # Convert timestamps to seconds elapsed within each match
    # Raw timestamps are batch-recorded (sub-second ranges per match), so we create
    # a synthetic timeline that distributes events evenly over an estimated duration.
    # This makes the playback feature meaningful for Level Designers.
    df["ts_ms"] = df["ts"].astype("int64")
    min_ts_per_match = df.groupby("match_id")["ts_ms"].transform("min")
    df["ts_raw"] = (df["ts_ms"] - min_ts_per_match) / 1000.0

    # Synthetic timeline: distribute events evenly over estimated match duration
    # Duration estimate: ~0.5s per event, clamped to [60, 300] seconds
    df = df.sort_values(["match_id", "ts_raw", "user_id"]).reset_index(drop=True)
    df["ts_seconds"] = 0.0
    for match_id, group_idx in df.groupby("match_id").groups.items():
        n = len(group_idx)
        estimated_duration = max(60.0, min(300.0, n * 0.5))
        if n == 1:
            df.loc[group_idx, "ts_seconds"] = 0.0
        else:
            positions = pd.Series(range(n), index=group_idx)
            df.loc[group_idx, "ts_seconds"] = (positions / (n - 1) * estimated_duration).round(3)

    # Clean match_id: strip .nakama-0 suffix for cleaner display
    df["match_id_clean"] = df["match_id"].str.replace(".nakama-0", "", regex=False)

    # Add day label
    df["day"] = day_label

    return df


def build_matches_metadata(all_df: pd.DataFrame) -> list[dict]:
    matches = []
    grouped = all_df.groupby("match_id_clean")
    for match_id, group in grouped:
        humans = group[~group["is_bot"]]["user_id"].nunique()
        bots = group[group["is_bot"]]["user_id"].nunique()
        duration = group["ts_seconds"].max()
        matches.append({
            "match_id": match_id,
            "map_id": group["map_id"].iloc[0],
            "day": group["day"].iloc[0],
            "human_count": int(humans),
            "bot_count": int(bots),
            "total_events": len(group),
            "duration_seconds": round(float(duration), 1),
        })
    return sorted(matches, key=lambda m: (m["day"], m["match_id"]))


def df_to_json_records(df: pd.DataFrame) -> list[dict]:
    records = []
    for _, row in df.iterrows():
        records.append({
            "user_id": row["user_id"],
            "match_id": row["match_id_clean"],
            "map_id": row["map_id"],
            "event": row["event"],
            "is_bot": bool(row["is_bot"]),
            "pixel_x": row["pixel_x"],
            "pixel_y": row["pixel_y"],
            "ts_seconds": row["ts_seconds"],
        })
    return records


def validate(all_df: pd.DataFrame):
    print("\n" + "=" * 60)
    print("VALIDATION RESULTS")
    print("=" * 60)

    total_events = len(all_df)
    unique_players = all_df["user_id"].nunique()
    unique_matches = all_df["match_id_clean"].nunique()
    event_types = sorted(all_df["event"].unique())
    maps = sorted(all_df["map_id"].unique())

    print(f"Total events:    {total_events:,} (expected ~89,000)")
    print(f"Unique players:  {unique_players} (expected 339)")
    print(f"Unique matches:  {unique_matches} (expected 796)")
    print(f"Maps:            {maps}")
    print(f"Event types:     {event_types}")
    print(f"Expected events: ['BotKill', 'BotKilled', 'BotPosition', 'Kill', 'Killed', 'KilledByStorm', 'Loot', 'Position']")

    # Check pixel coordinates in range
    in_range_x = ((all_df["pixel_x"] >= 0) & (all_df["pixel_x"] <= 1024)).mean()
    in_range_y = ((all_df["pixel_y"] >= 0) & (all_df["pixel_y"] <= 1024)).mean()
    print(f"\npixel_x in [0, 1024]: {in_range_x*100:.1f}%")
    print(f"pixel_y in [0, 1024]: {in_range_y*100:.1f}%")

    if in_range_x < 0.95 or in_range_y < 0.95:
        print("WARNING: >5% of coordinates are out of range!")

    # Per-map event counts
    print("\nPer-map event counts:")
    for map_id in maps:
        count = len(all_df[all_df["map_id"] == map_id])
        print(f"  {map_id}: {count:,}")

    # Per-day event counts
    print("\nPer-day event counts:")
    for day in sorted(all_df["day"].unique()):
        count = len(all_df[all_df["day"] == day])
        print(f"  {day}: {count:,}")

    # Bot vs human breakdown
    bots = all_df["is_bot"].sum()
    humans = len(all_df) - bots
    print(f"\nHuman events: {humans:,} ({humans/total_events*100:.1f}%)")
    print(f"Bot events:   {bots:,} ({bots/total_events*100:.1f}%)")

    # Verify coordinate formula with known example from README
    # AmbroseValley: x=-301.45, z=-355.55 → pixel (78, 890)
    px, py = world_to_pixel(-301.45, -355.55, "AmbroseValley")
    print(f"\nCoordinate verification (AmbroseValley):")
    print(f"  Input: x=-301.45, z=-355.55")
    print(f"  Output: pixel_x={px}, pixel_y={py}")
    print(f"  Expected: pixel_x~78, pixel_y~890")
    print(f"  Match: {'OK' if abs(px - 78) < 2 and abs(py - 890) < 2 else 'MISMATCH!'}")

    print("=" * 60)


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    all_frames = []

    for folder_name, day_label in DAY_FOLDERS.items():
        folder_path = DATA_DIR / folder_name
        if not folder_path.exists():
            print(f"WARNING: {folder_path} not found, skipping")
            continue

        print(f"Processing {folder_name}...")
        df = load_day(folder_path)
        if df.empty:
            print(f"  No data in {folder_name}")
            continue

        df = process_dataframe(df, day_label)
        all_frames.append(df)

        # Write per-day JSON
        records = df_to_json_records(df)
        output_path = OUTPUT_DIR / f"{day_label}.json"
        with open(output_path, "w") as f:
            json.dump(records, f, separators=(",", ":"))
        print(f"  -> {output_path} ({len(records):,} events, {output_path.stat().st_size / 1024:.0f} KB)")

    if not all_frames:
        print("ERROR: No data loaded!")
        return

    all_df = pd.concat(all_frames, ignore_index=True)

    # Build and write matches metadata
    matches = build_matches_metadata(all_df)
    matches_path = OUTPUT_DIR / "matches.json"
    with open(matches_path, "w") as f:
        json.dump(matches, f, separators=(",", ":"))
    print(f"\n-> {matches_path} ({len(matches)} matches)")

    # Build and write manifest
    manifest = {
        "days": [
            {"label": day_label, "file": f"{day_label}.json"}
            for _, day_label in DAY_FOLDERS.items()
        ],
        "maps": list(MAP_CONFIGS.keys()),
        "map_configs": MAP_CONFIGS,
        "total_events": len(all_df),
        "total_players": int(all_df["user_id"].nunique()),
        "total_matches": int(all_df["match_id_clean"].nunique()),
    }
    manifest_path = OUTPUT_DIR / "manifest.json"
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"-> {manifest_path}")

    # Validate
    validate(all_df)


if __name__ == "__main__":
    main()
