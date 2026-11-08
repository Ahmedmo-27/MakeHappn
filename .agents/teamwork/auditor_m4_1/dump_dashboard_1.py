import pymupdf, sys
sys.stdout.reconfigure(encoding='utf-8')
doc = pymupdf.open('MakeHappn [Dashboard].pdf')
for idx in range(len(doc)):
    print(f"=== PAGE {idx+1} ===")
    print(doc[idx].get_text())
