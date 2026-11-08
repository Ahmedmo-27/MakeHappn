import pymupdf

docs = [
    ("MakeHappn [Dashboard].pdf", "Dashboard_1"),
    ("Makehappn [Dashboard 2].pdf", "Dashboard_2"),
    ("MH [WORKFLOW & OPERATING STRUCTURE].pdf", "Workflow")
]

for filename, tag in docs:
    doc = pymupdf.open(filename)
    print(f"=== Document: {filename} (Pages: {len(doc)}) ===")
    for page_idx in range(len(doc)):
        page = doc[page_idx]
        text = page.get_text()
        print(f"--- Page {page_idx + 1} (chars: {len(text)}) ---")
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        for l in lines[:5]:
            print(f"  {l}")
    print()
