import os

citations = [
    ("src/models/Event.ts", 3, 25),
    ("src/models/EventType.ts", 3, 15),
    ("scripts/seed.ts", 9, 19),
    ("src/components/event-form.tsx", 20, 35),
    ("src/components/rail.tsx", 9, 20),
    ("src/app/(app)/dashboard/page.tsx", 14, 25),
    ("src/app/(app)/dashboard/page.tsx", 55, 75),
    ("src/app/(app)/dashboard/page.tsx", 105, 120),
    ("src/lib/format.ts", 20, 58),
    ("src/lib/domain.ts", 1, 10),
    ("src/models/User.ts", 1, 35),
    ("src/models/Team.ts", 1, 20),
    ("src/services/org.ts", 65, 85),
    ("src/services/org.ts", 190, 200),
    ("src/lib/permissions.ts", 10, 50),
    ("src/models/Task.ts", 1, 30),
    ("src/services/tasks.ts", 25, 40),
    ("src/services/tasks.ts", 130, 140),
    ("src/components/board.tsx", 180, 195),
    ("src/components/event-tabs.tsx", 1, 20),
    ("src/app/(app)/events/[id]/page.tsx", 1, 20),
]

for path, start, end in citations:
    print(f"=== {path} (lines {start}-{end}) ===")
    if not os.path.exists(path):
        print(f"FILE NOT FOUND: {path}")
        continue
    with open(path, "r", encoding="utf-8") as f:
        lines = f.readlines()
    for idx in range(start - 1, min(end, len(lines))):
        print(f"{idx+1:4d}: {lines[idx].rstrip()}")
    print()
