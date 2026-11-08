import sys

for pkg in ['pypdf', 'pdfplumber', 'fitz', 'pypdf2']:
    try:
        __import__(pkg)
        print(f"Package {pkg}: available")
    except ImportError:
        print(f"Package {pkg}: NOT available")
