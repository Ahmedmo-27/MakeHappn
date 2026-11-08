import pymupdf
import re

pdf_texts = {}
for fname in ["MakeHappn [Dashboard].pdf", "Makehappn [Dashboard 2].pdf", "MH [WORKFLOW & OPERATING STRUCTURE].pdf"]:
    doc = pymupdf.open(fname)
    full_text = ""
    for idx, page in enumerate(doc):
        full_text += f"\n--- [PAGE {idx+1}] ---\n" + page.get_text()
    pdf_texts[fname] = full_text

checks = [
    # Document 1 checks
    ("MakeHappn [Dashboard].pdf", "multidisciplinary creative studio"),
    ("MakeHappn [Dashboard].pdf", "A product is the service or group of services"),
    ("MakeHappn [Dashboard].pdf", "The dashboard must therefore allow multiple products to be attached to a single project"),
    ("MakeHappn [Dashboard].pdf", "Curation"),
    ("MakeHappn [Dashboard].pdf", "Design"),
    ("MakeHappn [Dashboard].pdf", "Brand Design"),
    ("MakeHappn [Dashboard].pdf", "Brand Communication"),
    ("MakeHappn [Dashboard].pdf", "Production"),
    ("MakeHappn [Dashboard].pdf", "Turnkey Experience"),
    ("MakeHappn [Dashboard].pdf", "unique project code"),
    ("MakeHappn [Dashboard].pdf", "Do not treat an unapproved proposal as an active delivery project"),
    ("MakeHappn [Dashboard].pdf", "New · Contacted · Qualified · Proposal in progress · Won · Lost · On hold"),
    ("MakeHappn [Dashboard].pdf", "Draft · Internal review · Sent · Under discussion · Approved · Declined · Expired"),
    ("MakeHappn [Dashboard].pdf", "Not started · Planning · In progress · Waiting for client · At risk · On hold · Delivered · Closed"),
    ("MakeHappn [Dashboard].pdf", "To do · In progress · Waiting · In review · Approved · Done · Blocked"),
    ("MakeHappn [Dashboard].pdf", "Draft · Internal review · Sent to client · Revision required · Approved · Final"),
    ("MakeHappn [Dashboard].pdf", "Not invoiced · Invoiced · Partially paid · Paid · Overdue"),
    ("MakeHappn [Dashboard].pdf", "The dashboard should clearly distinguish estimated, committed and actual costs"),
    ("MakeHappn [Dashboard].pdf", "These are different figures and should not be combined into one number"),
    ("MakeHappn [Dashboard].pdf", "Overview"),
    ("MakeHappn [Dashboard].pdf", "Sales"),
    ("MakeHappn [Dashboard].pdf", "Projects"),
    ("MakeHappn [Dashboard].pdf", "Tasks & Team"),
    ("MakeHappn [Dashboard].pdf", "Creative & Design"),
    ("MakeHappn [Dashboard].pdf", "Production & Procurement"),
    ("MakeHappn [Dashboard].pdf", "Collective & Resources"),
    ("MakeHappn [Dashboard].pdf", "Finance & Reports"),
    ("MakeHappn [Dashboard].pdf", "Business view"),
    ("MakeHappn [Dashboard].pdf", "Project view"),
    ("MakeHappn [Dashboard].pdf", "Team view"),
    ("MakeHappn [Dashboard].pdf", "Financial view"),
    ("MakeHappn [Dashboard].pdf", "Each project and task must have a clear owner"),
    ("MakeHappn [Dashboard].pdf", "shared responsibility should not mean unclear accountability"),
    ("MakeHappn [Dashboard].pdf", "No material scope, cost or timeline change should be treated as approved"),
    ("MakeHappn [Dashboard].pdf", "Delivered' means the work has been handed over"),
    ("MakeHappn [Dashboard].pdf", "Closed' means the project"),
    # Document 3 checks
    ("MH [WORKFLOW & OPERATING STRUCTURE].pdf", "Sohila"),
    ("MH [WORKFLOW & OPERATING STRUCTURE].pdf", "Nadine"),
    ("MH [WORKFLOW & OPERATING STRUCTURE].pdf", "Hamdy"),
    ("MH [WORKFLOW & OPERATING STRUCTURE].pdf", "Mariam documents throughout every stage in parallel"),
    ("MH [WORKFLOW & OPERATING STRUCTURE].pdf", "NEW HIRE"),
    ("MH [WORKFLOW & OPERATING STRUCTURE].pdf", "ART DIRECTION / SENIOR 3D DESIGNER"),
    ("MH [WORKFLOW & OPERATING STRUCTURE].pdf", "Sara Dawoud"),
    ("MH [WORKFLOW & OPERATING STRUCTURE].pdf", "Sara M."),
    ("MH [WORKFLOW & OPERATING STRUCTURE].pdf", "Mai"),
    ("MH [WORKFLOW & OPERATING STRUCTURE].pdf", "Vision & Design"),
    ("MH [WORKFLOW & OPERATING STRUCTURE].pdf", "Project & Delivery"),
    ("MH [WORKFLOW & OPERATING STRUCTURE].pdf", "Communication"),
    # Document 2 checks
    ("Makehappn [Dashboard 2].pdf", "Design Development"),
    ("Makehappn [Dashboard 2].pdf", "01. Inquiry & Qualification"),
]

print("=== RUNNING VERBATIM CITATION AUDIT ===")
all_passed = True
for doc_name, phrase in checks:
    content = pdf_texts[doc_name]
    # normalise spaces/newlines
    clean_content = " ".join(content.split())
    clean_phrase = " ".join(phrase.split())
    if clean_phrase.lower() in clean_content.lower():
        print(f"PASS: [{doc_name}] found: '{phrase}'")
    else:
        print(f"FAIL: [{doc_name}] NOT found: '{phrase}'")
        all_passed = False

print(f"\nFinal Citation Audit Result: {'ALL PASS' if all_passed else 'SOME FAILED'}")
