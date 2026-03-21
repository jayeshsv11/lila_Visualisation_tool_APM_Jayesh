"""Quick visual verification: plot positions on minimap images."""
import json
import matplotlib.pyplot as plt
import matplotlib.image as mpimg
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "public" / "data"
MINIMAP_DIR = BASE_DIR / "player_data" / "minimaps"

MINIMAP_FILES = {
    "AmbroseValley": "AmbroseValley_Minimap.png",
    "GrandRift": "GrandRift_Minimap.png",
    "Lockdown": "Lockdown_Minimap.jpg",
}

# Load feb10 data
with open(DATA_DIR / "feb10.json") as f:
    events = json.load(f)

fig, axes = plt.subplots(1, 3, figsize=(18, 6))

for idx, (map_id, minimap_file) in enumerate(MINIMAP_FILES.items()):
    ax = axes[idx]

    # Load minimap
    img = mpimg.imread(str(MINIMAP_DIR / minimap_file))
    ax.imshow(img, extent=[0, 1024, 1024, 0])

    # Filter Position events for this map
    positions = [e for e in events if e["map_id"] == map_id and e["event"] in ("Position", "BotPosition")]

    if positions:
        xs = [p["pixel_x"] for p in positions]
        ys = [p["pixel_y"] for p in positions]
        ax.scatter(xs, ys, s=0.5, alpha=0.3, c="cyan")

    ax.set_title(f"{map_id} ({len(positions)} pts)")
    ax.set_xlim(0, 1024)
    ax.set_ylim(1024, 0)

plt.tight_layout()
plt.savefig(str(BASE_DIR / "scripts" / "coord_verification.png"), dpi=150)
print("Saved coord_verification.png")
plt.close()
