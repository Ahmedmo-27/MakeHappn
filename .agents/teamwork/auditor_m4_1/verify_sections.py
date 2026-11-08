import pymupdf
import sys

sys.stdout.reconfigure(encoding='utf-8')

doc = pymupdf.open("MakeHappn [Dashboard].pdf")
text = ""
for page in doc:
    text += "\n" + page.get_text()

def find_section(title):
    print(f"\n=================== SECTION: {title} ===================")
    idx = text.lower().find(title.lower())
    if idx != -1:
        print(text[idx:idx+800])
    else:
        print("NOT FOUND")

find_section("4. The End-to-End Project Workflow")
find_section("7. Feedback, Revisions & Change Requests")
find_section("9. Financial Flow: From Estimate to Actual")
find_section("10. Dashboard Modules")
find_section("11. Recommended Status Logic")
find_section("12. Core Project Record: Required Fields")
find_section("13. Four Management Perspectives")
find_section("14. Practical Operating Principles")
