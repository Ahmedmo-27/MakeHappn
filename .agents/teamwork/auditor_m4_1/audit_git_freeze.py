import subprocess
import os
import datetime

task_start = datetime.datetime.fromisoformat('2026-11-08T20:37:03+00:00')

print(f"Task approved at: {task_start.isoformat()}")

status = subprocess.check_output(['git', 'status', '--porcelain']).decode('utf-8')
lines = [l.strip() for l in status.splitlines() if l.strip()]

print(f"Total entries in git status: {len(lines)}")

src_modifications_during_task = []
all_status_entries = []

for line in lines:
    parts = line.split(maxsplit=1)
    code = parts[0]
    fname = parts[1].strip('"')
    if os.path.exists(fname):
        mtime = datetime.datetime.fromtimestamp(os.path.getmtime(fname), tz=datetime.timezone.utc)
        is_after_task_start = (mtime >= task_start)
        all_status_entries.append((code, fname, mtime, is_after_task_start))
        if fname.startswith('src/') or fname.startswith('src\\') or not ('/' in fname or '\\' in fname or fname.startswith('.')):
            if is_after_task_start:
                src_modifications_during_task.append((fname, mtime))
    else:
        all_status_entries.append((code, fname, None, False))

print("\n--- Summary of Modified Files in Working Tree ---")
for code, fname, mtime, is_after in all_status_entries:
    mtime_str = mtime.isoformat() if mtime else "N/A"
    print(f"[{code}] {fname} -> modified: {mtime_str} | after task start: {is_after}")

print("\n--- Files modified in src/ or root AFTER task start ---")
print(f"Count: {len(src_modifications_during_task)}")
for fname, mtime in src_modifications_during_task:
    print(f"VIOLATION: {fname} modified at {mtime.isoformat()}")
