"""
HTML zu PDF Konverter - Automatische Version
Generiert beide PDFs ohne Benutzerinteraktion
"""

import subprocess
import sys
import os

# Pfade
script_dir = os.path.dirname(os.path.abspath(__file__))

# Playwright installieren falls nötig
try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("Installiere playwright...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "playwright", "-q"])
    print("Installiere Browser...")
    subprocess.check_call([sys.executable, "-m", "playwright", "install", "chromium"])
    from playwright.sync_api import sync_playwright

def convert_to_pdf(html_filename, pdf_filename):
    """Konvertiert HTML zu PDF"""
    html_file = os.path.join(script_dir, html_filename)
    pdf_file = os.path.join(script_dir, pdf_filename)
    
    if not os.path.exists(html_file):
        print(f"❌ {html_filename} nicht gefunden!")
        return None
    
    print(f"Konvertiere {html_filename}...")
    
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        file_url = f"file:///{html_file.replace(os.sep, '/')}"
        page.goto(file_url, wait_until="networkidle")
        page.wait_for_timeout(1500)
        
        page.pdf(
            path=pdf_file,
            format="A4",
            print_background=True,
            margin={"top": "0mm", "right": "0mm", "bottom": "0mm", "left": "0mm"}
        )
        
        browser.close()
    
    print(f"✅ {pdf_filename} erstellt!")
    return pdf_file

print("\n" + "="*50)
print("  NEURATEX PDF Generator")
print("="*50 + "\n")

# Schwarz-Weiß Version generieren
pdf_path = convert_to_pdf("onepager-kraemer24-sw.html", "OnePager-Kraemer24-SW.pdf")

if pdf_path:
    print(f"\n📄 PDF bereit: {pdf_path}")
    os.startfile(pdf_path)
