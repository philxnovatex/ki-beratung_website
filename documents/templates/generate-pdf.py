"""
HTML zu PDF Konverter für Neuratex Dokumente
Nutzt playwright für exakte CSS-Wiedergabe
"""

import subprocess
import sys
import os

def install_and_import(package, import_name=None):
    """Installiert ein Paket falls nicht vorhanden"""
    if import_name is None:
        import_name = package
    try:
        return __import__(import_name)
    except ImportError:
        print(f"Installiere {package}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", package, "-q"])
        return __import__(import_name)

def main():
    # Playwright installieren falls nötig
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Installiere playwright...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "playwright", "-q"])
        print("Installiere Browser...")
        subprocess.check_call([sys.executable, "-m", "playwright", "install", "chromium"])
        from playwright.sync_api import sync_playwright
    
    # Pfade
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Welche Version soll konvertiert werden?
    print("\n" + "="*50)
    print("  NEURATEX HTML → PDF Konverter")
    print("="*50)
    print("\nWelche Version möchtest du als PDF?")
    print("  [1] Farbversion (onepager-kraemer24.html)")
    print("  [2] Schwarz-Weiß (onepager-kraemer24-sw.html)")
    
    choice = input("\nAuswahl (1 oder 2): ").strip()
    
    if choice == "2":
        html_file = os.path.join(script_dir, "onepager-kraemer24-sw.html")
        pdf_file = os.path.join(script_dir, "OnePager-Kraemer24-SW.pdf")
    else:
        html_file = os.path.join(script_dir, "onepager-kraemer24.html")
        pdf_file = os.path.join(script_dir, "OnePager-Kraemer24.pdf")
    
    if not os.path.exists(html_file):
        print(f"\n❌ Fehler: {html_file} nicht gefunden!")
        return
    
    print(f"\nKonvertiere: {os.path.basename(html_file)}")
    print("Bitte warten...")
    
    # HTML zu PDF mit Playwright
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        # HTML laden
        file_url = f"file:///{html_file.replace(os.sep, '/')}"
        page.goto(file_url, wait_until="networkidle")
        
        # Kurz warten für Fonts
        page.wait_for_timeout(1000)
        
        # PDF generieren
        page.pdf(
            path=pdf_file,
            format="A4",
            print_background=True,
            margin={
                "top": "0mm",
                "right": "0mm", 
                "bottom": "0mm",
                "left": "0mm"
            }
        )
        
        browser.close()
    
    print(f"\n✅ PDF erfolgreich erstellt!")
    print(f"   📄 {pdf_file}")
    
    # PDF öffnen?
    open_pdf = input("\nPDF jetzt öffnen? (j/n): ").strip().lower()
    if open_pdf == "j":
        os.startfile(pdf_file)

if __name__ == "__main__":
    main()
