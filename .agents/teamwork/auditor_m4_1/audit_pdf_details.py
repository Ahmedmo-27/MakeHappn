import pymupdf

doc1 = pymupdf.open("MakeHappn [Dashboard].pdf")
print("=== Search in MakeHappn [Dashboard].pdf Page 7 (Section 10 Modules) ===")
p7 = doc1[6].get_text() # page 7 is index 6
for line in p7.splitlines():
    if any(k in line.lower() for k in ["module", "overview", "sales", "project", "task", "creative", "production", "collective", "finance", "report"]):
        print(f"  {line.strip()}")

doc2 = pymupdf.open("Makehappn [Dashboard 2].pdf")
print("\n=== Search in Makehappn [Dashboard 2].pdf Page 3 ===")
p3 = doc2[2].get_text()
for line in p3.splitlines():
    if any(k in line.lower() for k in ["01", "02", "03", "04", "05", "stage", "inquiry"]):
        print(f"  {line.strip()}")
