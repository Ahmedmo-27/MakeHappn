import pymupdf
import sys
sys.stdout.reconfigure(encoding='utf-8')

doc = pymupdf.open("MakeHappn [Dashboard].pdf")

for i, page in enumerate(doc):
    lines = [l.strip() for l in page.get_text().splitlines() if l.strip()]
    for l in lines:
        if any(w in l.lower() for w in ["feedback", "revision", "change request", "perspective", "principle", "rule", "7.", "8.", "13.", "14."]):
            print(f"P{i+1}: {l}")
