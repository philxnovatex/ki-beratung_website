#!/usr/bin/env python3
"""
Neuratex AI Präsentation - PowerPoint Generator v3
CI-Farben: Navy #0A1931, Gold #FFC947, Blau #185ADB
Einheitliches Typografie-System
"""

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
import os

# ============ CI FARBEN ============
NAVY = RGBColor(0x0A, 0x19, 0x31)
GOLD = RGBColor(0xFF, 0xC9, 0x47)
BLUE = RGBColor(0x18, 0x5A, 0xDB)
TEXT_LIGHT = RGBColor(0xCB, 0xD5, 0xE1)
WHITE = RGBColor(0xF8, 0xFA, 0xFC)
CARD_BG = RGBColor(0x11, 0x22, 0x40)
BORDER = RGBColor(0x1E, 0x29, 0x3B)

# ============ EINHEITLICHE SCHRIFTGRÖSSEN ============
FONT_SECTION = 11          # Section Header (gold, uppercase)
FONT_TITLE = 32            # Haupttitel
FONT_SUBTITLE = 14         # Untertitel / Karten-Titel
FONT_BODY = 14             # Normaler Text / Bullets
FONT_HIGHLIGHT = 17        # Highlight-Box Text
FONT_SMALL = 11            # Kleine Beschreibungen
FONT_BIG_NUMBER = 44       # Große Nummern (01, 02, 03)
FONT_FOOTER = 10           # Fußzeile

# ============ EINHEITLICHE POSITIONEN (Y-Achse) ============
Y_SECTION = Inches(0.4)    # Section Header
Y_TITLE = Inches(0.75)     # Haupttitel
Y_CONTENT = Inches(1.8)    # Content-Bereich Start
Y_HIGHLIGHT = Inches(5.4)  # Highlight-Box
Y_FOOTER_LINE = Inches(7.05)
Y_FOOTER_TEXT = Inches(7.12)

# ============ PFADE ============
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
LOGO_PATH = os.path.join(SCRIPT_DIR, "../public/assets/images/neuratex-logo.jpg")
OUTPUT_PATH = os.path.join(SCRIPT_DIR, "Neuratex_AI_Praesentation.pptx")

# ============ SLIDE DIMENSIONEN ============
SLIDE_WIDTH = Inches(10)
SLIDE_HEIGHT = Inches(7.5)


# ============ HELPER FUNCTIONS ============

def set_background(slide):
    """Navy Hintergrund"""
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = NAVY


def add_logo(slide):
    """Logo oben rechts"""
    if os.path.exists(LOGO_PATH):
        slide.shapes.add_picture(LOGO_PATH, Inches(8.3), Inches(0.25), width=Inches(1.3))


def add_footer(slide):
    """Goldene Linie + Neuratex AI"""
    # Linie
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Y_FOOTER_LINE, SLIDE_WIDTH, Pt(2))
    line.fill.solid()
    line.fill.fore_color.rgb = GOLD
    line.line.fill.background()
    # Text
    box = slide.shapes.add_textbox(Inches(0.4), Y_FOOTER_TEXT, Inches(9), Inches(0.25))
    p = box.text_frame.paragraphs[0]
    p.text = "Neuratex AI"
    p.font.size = Pt(FONT_FOOTER)
    p.font.color.rgb = TEXT_LIGHT
    p.font.name = "Arial"


def add_section(slide, text):
    """Section Header in Gold"""
    box = slide.shapes.add_textbox(Inches(0.4), Y_SECTION, Inches(8), Inches(0.3))
    p = box.text_frame.paragraphs[0]
    p.text = text.upper()
    p.font.size = Pt(FONT_SECTION)
    p.font.bold = True
    p.font.color.rgb = GOLD
    p.font.name = "Arial"


def add_title(slide, text):
    """Haupttitel"""
    box = slide.shapes.add_textbox(Inches(0.4), Y_TITLE, Inches(9), Inches(0.9))
    box.text_frame.word_wrap = True
    p = box.text_frame.paragraphs[0]
    p.text = text
    p.font.size = Pt(FONT_TITLE)
    p.font.bold = True
    p.font.color.rgb = WHITE
    p.font.name = "Arial"


def add_text(slide, text, left, top, width, height, size=FONT_BODY, color=TEXT_LIGHT, bold=False, align=PP_ALIGN.LEFT):
    """Einfacher Text"""
    box = slide.shapes.add_textbox(left, top, width, height)
    box.text_frame.word_wrap = True
    p = box.text_frame.paragraphs[0]
    p.text = text
    p.font.size = Pt(size)
    p.font.bold = bold
    p.font.color.rgb = color
    p.font.name = "Arial"
    p.alignment = align
    p.line_spacing = 1.3
    return box


def add_bullets(slide, items, left, top, width, height, size=FONT_BODY):
    """Bullet-Liste"""
    box = slide.shapes.add_textbox(left, top, width, height)
    box.text_frame.word_wrap = True
    for i, item in enumerate(items):
        p = box.text_frame.paragraphs[0] if i == 0 else box.text_frame.add_paragraph()
        p.text = f"•  {item}"
        p.font.size = Pt(size)
        p.font.color.rgb = TEXT_LIGHT
        p.font.name = "Arial"
        p.line_spacing = 1.5
        p.space_after = Pt(4)
    return box


def add_card(slide, title, items, left, top, width, height):
    """Karte mit Rahmen"""
    # Hintergrund
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    card.fill.solid()
    card.fill.fore_color.rgb = CARD_BG
    card.line.color.rgb = BORDER
    card.line.width = Pt(1)
    # Titel
    add_text(slide, title, left + Inches(0.15), top + Inches(0.12), width - Inches(0.3), Inches(0.35),
             size=FONT_SUBTITLE, color=GOLD, bold=True)
    # Bullets
    if items:
        add_bullets(slide, items, left + Inches(0.15), top + Inches(0.45), width - Inches(0.3), height - Inches(0.55),
                   size=FONT_BODY)
    return card


def add_highlight(slide, text, top=Y_HIGHLIGHT):
    """Gold Highlight-Box"""
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.4), top, Inches(9.2), Inches(1))
    shape.fill.solid()
    shape.fill.fore_color.rgb = GOLD
    shape.line.fill.background()
    shape.adjustments[0] = 0.08
    tf = shape.text_frame
    tf.word_wrap = True
    tf.anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.text = text
    p.font.size = Pt(FONT_HIGHLIGHT)
    p.font.bold = True
    p.font.color.rgb = NAVY
    p.font.name = "Arial"
    p.alignment = PP_ALIGN.CENTER
    p.line_spacing = 1.2
    return shape


def add_number_circle(slide, num, left, top):
    """Nummerierter Kreis"""
    circle = slide.shapes.add_shape(MSO_SHAPE.OVAL, left, top, Inches(0.45), Inches(0.45))
    circle.fill.solid()
    circle.fill.fore_color.rgb = GOLD
    circle.line.fill.background()
    tf = circle.text_frame
    tf.anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.text = str(num)
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = NAVY
    p.alignment = PP_ALIGN.CENTER


def add_big_number(slide, text, left=Inches(0.3), top=Inches(0.25)):
    """Große Nummer für Lösungsfolien"""
    box = slide.shapes.add_textbox(left, top, Inches(1.2), Inches(0.8))
    p = box.text_frame.paragraphs[0]
    p.text = text
    p.font.size = Pt(FONT_BIG_NUMBER)
    p.font.bold = True
    p.font.color.rgb = GOLD
    p.font.name = "Arial"


def add_gold_line(slide, left, top, height):
    """Vertikale Goldlinie"""
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, Pt(3), height)
    line.fill.solid()
    line.fill.fore_color.rgb = GOLD
    line.line.fill.background()


def add_divider(slide, left, top, width):
    """Horizontale Trennlinie"""
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, Pt(1))
    line.fill.solid()
    line.fill.fore_color.rgb = BORDER
    line.line.fill.background()


def add_notes(slide, text):
    """Sprechernotizen"""
    if text:
        slide.notes_slide.notes_text_frame.text = text


# ============ PRÄSENTATION ERSTELLEN ============

def create_presentation():
    prs = Presentation()
    prs.slide_width = SLIDE_WIDTH
    prs.slide_height = SLIDE_HEIGHT
    blank = prs.slide_layouts[6]

    # ===== FOLIE 1: TITEL =====
    s1 = prs.slides.add_slide(blank)
    set_background(s1)

    # Dekorativer Balken
    bar = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(2.8), Inches(0.12), Inches(2))
    bar.fill.solid()
    bar.fill.fore_color.rgb = GOLD
    bar.line.fill.background()

    add_text(s1, "Wissen nutzbar machen.", Inches(0.7), Inches(1.6), Inches(8), Inches(0.4), size=24, color=TEXT_LIGHT)
    add_text(s1, "Suche eliminieren.", Inches(0.7), Inches(2.1), Inches(8), Inches(0.4), size=24, color=TEXT_LIGHT)
    add_text(s1, "Service beschleunigen.", Inches(0.7), Inches(2.6), Inches(8), Inches(0.4), size=24, color=TEXT_LIGHT)
    add_text(s1, "Neuratex AI", Inches(0.7), Inches(3.5), Inches(8), Inches(0.8), size=48, color=GOLD, bold=True)
    add_text(s1, "Philipp Koch", Inches(0.7), Inches(4.5), Inches(8), Inches(0.4), size=18, color=TEXT_LIGHT)

    if os.path.exists(LOGO_PATH):
        s1.shapes.add_picture(LOGO_PATH, Inches(6.5), Inches(1.3), width=Inches(3))

    add_footer(s1)
    add_notes(s1, "Ich helfe technischen Unternehmen dabei, Informationen schnell auffindbar zu machen, ohne ihre Systeme umzubauen.")

    # ===== FOLIE 2: DIE REALITÄT =====
    s2 = prs.slides.add_slide(blank)
    set_background(s2)
    add_section(s2, "Die Realität in technischen Unternehmen")
    add_title(s2, "Warum es heute oft unnötig langsam ist")

    add_card(s2, "Kritisches Wissen liegt verteilt in:",
             ["PDFs und Scans", "Tabellen und Listen", "Zeichnungen und Katalogen",
              "E-Mails, Ordnern, SharePoint", "Köpfen einzelner Mitarbeiter"],
             Inches(0.4), Y_CONTENT, Inches(4.4), Inches(2.8))

    add_card(s2, "Das Ergebnis im Alltag:",
             ["Suchen statt arbeiten", "Rückfragen statt Lösungen",
              "Abhängigkeit von Schlüsselpersonen", "Lange Antwortzeiten im Service"],
             Inches(5.2), Y_CONTENT, Inches(4.4), Inches(2.8))

    add_highlight(s2, "Wenn Information existiert, aber nicht auffindbar ist,\nist sie wirtschaftlich wertlos.")
    add_logo(s2)
    add_footer(s2)

    # ===== FOLIE 3: WAS ES KOSTET =====
    s3 = prs.slides.add_slide(blank)
    set_background(s3)
    add_section(s3, "Was es wirklich kostet")
    add_title(s3, "Zeitverlust ist nur die Oberfläche")

    add_gold_line(s3, Inches(0.4), Y_CONTENT, Inches(2.8))
    add_text(s3, "Direkte Kosten", Inches(0.6), Y_CONTENT, Inches(4), Inches(0.35), size=FONT_SUBTITLE, color=GOLD, bold=True)
    add_bullets(s3, [
        "Suchzeit im Service und Vertrieb",
        "Unterbrechungen und Kontextwechsel",
        "Doppelte Arbeit durch wiederholte Recherche"
    ], Inches(0.6), Inches(2.2), Inches(4.2), Inches(2))

    add_gold_line(s3, Inches(5.2), Y_CONTENT, Inches(2.8))
    add_text(s3, "Indirekte Kosten", Inches(5.4), Y_CONTENT, Inches(4), Inches(0.35), size=FONT_SUBTITLE, color=GOLD, bold=True)
    add_bullets(s3, [
        "Langsamer Service wirkt inkompetent",
        "Kunden springen ab",
        "Experten werden zum Flaschenhals",
        "Einarbeitung dauert zu lange"
    ], Inches(5.4), Inches(2.2), Inches(4.2), Inches(2.2))

    add_highlight(s3, "Wachstum scheitert selten an Nachfrage.\nEs scheitert an Zugriff auf Wissen.")
    add_logo(s3)
    add_footer(s3)

    # ===== FOLIE 4: KLASSISCHE ANSÄTZE =====
    s4 = prs.slides.add_slide(blank)
    set_background(s4)
    add_section(s4, "Warum klassische Ansätze nicht reichen")
    add_title(s4, "Warum Teams, SharePoint und Ablage das Problem nicht lösen")

    add_text(s4, "Ablage ist nicht Zugriff", Inches(0.4), Inches(1.9), Inches(9), Inches(0.4),
             size=20, color=GOLD, bold=True)
    add_divider(s4, Inches(0.4), Inches(2.4), Inches(9.2))

    add_bullets(s4, [
        "Wer nicht weiß, wonach er suchen muss, findet nichts",
        "Gescannte Tabellen und Zeichnungen sind nicht zuverlässig durchsuchbar",
        "Wissen aus gelösten Fällen wird selten standardisiert festgehalten",
        "Ergebnisse landen in Chats, Telefonaten oder WhatsApp – und verschwinden"
    ], Inches(0.4), Inches(2.7), Inches(9.2), Inches(2.4))

    add_highlight(s4, "Viele Unternehmen haben Speicher. Was fehlt, ist ein Gedächtnis.")
    add_logo(s4)
    add_footer(s4)

    # ===== FOLIE 5: WAS WIR LIEFERN =====
    s5 = prs.slides.add_slide(blank)
    set_background(s5)
    add_section(s5, "Was wir konkret liefern")
    add_title(s5, "Keine Tool-Show. Konkrete Ergebnisse.")

    add_text(s5, "Wir liefern drei Dinge, je nach Ausgangslage:", Inches(0.4), Y_CONTENT, Inches(9), Inches(0.35),
             size=FONT_BODY, color=TEXT_LIGHT)

    steps = ["Dokumente werden nutzbar gemacht",
             "Erfahrungswissen wird strukturiert gesichert",
             "Zugriff wird drastisch beschleunigt"]
    y = 2.3
    for i, step in enumerate(steps, 1):
        add_number_circle(s5, i, Inches(0.4), Inches(y))
        add_text(s5, step, Inches(1.0), Inches(y + 0.08), Inches(8), Inches(0.4), size=18, color=WHITE)
        y += 0.65

    add_highlight(s5, "Wir ersetzen keine Systeme.\nWir bauen eine Zugriffsebene auf Ihren Bestand.")
    add_logo(s5)
    add_footer(s5)

    # ===== FOLIE 6: LÖSUNG 1 =====
    s6 = prs.slides.add_slide(blank)
    set_background(s6)
    add_big_number(s6, "01")
    add_section(s6, "Lösung 1: Altunterlagen nutzbar machen")
    add_title(s6, "Von Scan-Chaos zu Arbeitsdaten")

    add_card(s6, "Typische Inputs",
             ["Gescannte Kataloge", "PDF-Tabellen", "Stücklisten",
              "Kennlinien", "Ersatzteilseiten", "Zeichnungen"],
             Inches(0.4), Y_CONTENT, Inches(4.4), Inches(2.8))

    add_card(s6, "Outputs, die im Alltag zählen",
             ["Durchsuchbare Dokumente", "Saubere Tabellen (Excel/CSV)",
              "Importdaten für ERP oder Shop", "Strukturierte Daten"],
             Inches(5.2), Y_CONTENT, Inches(4.4), Inches(2.8))

    add_highlight(s6, "Jemand findet in 30 Sekunden, was er heute in 15 Minuten sucht.")
    add_logo(s6)
    add_footer(s6)

    # ===== FOLIE 7: LÖSUNG 2 =====
    s7 = prs.slides.add_slide(blank)
    set_background(s7)
    add_big_number(s7, "02")
    add_section(s7, "Lösung 2: Erfahrungswissen sichern")
    add_title(s7, "Wissen geht sonst in Rente")

    add_card(s7, "Das Problem",
             ["Trefferquote hängt an Personen, nicht am System",
              "Lösungen sind implizit und undokumentiert",
              "Neue Mitarbeiter müssen fragen statt handeln"],
             Inches(0.4), Y_CONTENT, Inches(4.4), Inches(2.0))

    add_card(s7, "Unsere Lösung: Schlanke Fallkarten",
             ["Maschine / Baureihe", "Symptom / Anfrage",
              "Lösungsschritte", "Teile und Hinweise"],
             Inches(5.2), Y_CONTENT, Inches(4.4), Inches(2.0))

    add_divider(s7, Inches(0.4), Inches(4.0), Inches(9.2))
    add_text(s7, "Ergebnis:", Inches(0.4), Inches(4.15), Inches(1.2), Inches(0.3), size=FONT_BODY, color=GOLD, bold=True)
    add_text(s7, "Wissen bleibt im Unternehmen  •  Einarbeitung schneller  •  Qualität stabiler",
             Inches(1.5), Inches(4.15), Inches(8), Inches(0.3), size=FONT_BODY, color=TEXT_LIGHT)

    add_highlight(s7, "Gute Leute sollen Probleme lösen. Nicht Wissen wiederfinden.", top=Inches(4.7))
    add_logo(s7)
    add_footer(s7)

    # ===== FOLIE 8: LÖSUNG 3 =====
    s8 = prs.slides.add_slide(blank)
    set_background(s8)
    add_big_number(s8, "03")
    add_section(s8, "Lösung 3: Internes Assistenzsystem")
    add_title(s8, "Schnelle Antworten aus eigenen Quellen")

    add_card(s8, "Was es ist",
             ["Internes System für Service & Vertrieb",
              "Beantwortet Fragen aus Ihren Dokumenten"],
             Inches(0.4), Y_CONTENT, Inches(2.95), Inches(1.9))

    add_card(s8, "Was es NICHT ist",
             ["Kein Endkundentool",
              "Kein Chatbot ohne Nachweise",
              "Keine Fantasie-Antworten"],
             Inches(3.5), Y_CONTENT, Inches(2.95), Inches(1.9))

    add_card(s8, "Vertrauen durch",
             ["Antworten mit Quellenbezug",
              "Verlinkung zur Originalstelle",
              "Nachvollziehbar für Mitarbeiter"],
             Inches(6.6), Y_CONTENT, Inches(2.95), Inches(1.9))

    add_divider(s8, Inches(0.4), Inches(3.9), Inches(9.2))
    add_text(s8, "Ergebnis:", Inches(0.4), Inches(4.05), Inches(1.2), Inches(0.3), size=FONT_BODY, color=GOLD, bold=True)
    add_text(s8, "Minuten statt Viertelstunden  •  Weniger Rückfragen  •  Experten entlastet",
             Inches(1.5), Inches(4.05), Inches(8), Inches(0.3), size=FONT_BODY, color=TEXT_LIGHT)

    add_highlight(s8, "Schneller Zugriff auf vorhandenes Wissen.", top=Inches(4.6))
    add_logo(s8)
    add_footer(s8)

    # ===== FOLIE 9: VERBINDUNG =====
    s9 = prs.slides.add_slide(blank)
    set_background(s9)
    add_section(s9, "So verbinden sich die drei Lösungen")
    add_title(s9, "Ein System. Drei Einstiegspunkte.")

    # Drei Boxen
    boxes = [("Dokumente", "sind die Basis", 0.4),
             ("Erfahrungswissen", "macht es praxisnah", 3.5),
             ("Assistenz", "macht Zugriff schnell", 6.6)]
    for title, sub, x in boxes:
        box = s9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Y_CONTENT, Inches(2.95), Inches(1))
        box.fill.solid()
        box.fill.fore_color.rgb = CARD_BG
        box.line.color.rgb = GOLD
        box.line.width = Pt(2)
        add_text(s9, title, Inches(x + 0.1), Inches(1.9), Inches(2.75), Inches(0.35),
                size=FONT_SUBTITLE, color=GOLD, bold=True, align=PP_ALIGN.CENTER)
        add_text(s9, sub, Inches(x + 0.1), Inches(2.3), Inches(2.75), Inches(0.3),
                size=FONT_BODY, color=TEXT_LIGHT, align=PP_ALIGN.CENTER)

    # Pfeile
    for x in [3.35, 6.45]:
        arr = s9.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, Inches(x), Inches(2.15), Inches(0.2), Inches(0.2))
        arr.fill.solid()
        arr.fill.fore_color.rgb = GOLD
        arr.line.fill.background()

    add_text(s9, "Man kann starten mit:", Inches(0.4), Inches(3.2), Inches(9), Inches(0.35),
             size=FONT_BODY, color=WHITE, bold=True)
    add_bullets(s9, [
        "Altunterlagen → wenn Dokumentchaos dominiert",
        "Wissensfällen → wenn Experten Engpass sind",
        "Assistenz → wenn Suche im Alltag Zeit frisst"
    ], Inches(0.4), Inches(3.6), Inches(9), Inches(1.5))

    add_highlight(s9, "Das ist kein Bauchladen. Es ist eine klare Stufenlogik.")
    add_logo(s9)
    add_footer(s9)

    # ===== FOLIE 10: WARUM JETZT =====
    s10 = prs.slides.add_slide(blank)
    set_background(s10)
    add_section(s10, "Warum jetzt sinnvoll")
    add_title(s10, "Timing ist gerade ideal")

    reasons = [
        "Neue ERP-/CRM-Einführungen erhöhen Sichtbarkeit von Datenproblemen",
        "Ohne saubere Dokumentbasis werden neue Systeme langsamer akzeptiert",
        "Wissensverlust durch Renteneintritte ist planbar, aber oft unvorbereitet",
        "Service-Anfragen steigen, während Fachkräfte knapp sind"
    ]
    y = 1.9
    for i, reason in enumerate(reasons, 1):
        add_number_circle(s10, i, Inches(0.4), Inches(y))
        add_text(s10, reason, Inches(1.0), Inches(y + 0.08), Inches(8.5), Inches(0.4), size=FONT_BODY, color=TEXT_LIGHT)
        y += 0.7

    add_highlight(s10, "Ein neues System ohne nutzbares Wissen ist wie\nein neues Lager ohne Beschriftung.")
    add_logo(s10)
    add_footer(s10)

    # ===== FOLIE 11: VORGEHEN =====
    s11 = prs.slides.add_slide(blank)
    set_background(s11)
    add_section(s11, "Vorgehen ohne Großprojekt")
    add_title(s11, "Pragmatisch. Schrittweise. Messbar.")

    steps = [
        ("1", "Machbarkeitscheck", "An echten Unterlagen und echten Fragen"),
        ("2", "Kleines Paket", "Mit sichtbarem Output"),
        ("3", "Skalierung", "Auf weitere Fabrikate oder Dokumenttypen"),
        ("4", "Integration", "Optional in bestehende Systeme")
    ]
    y = 1.9
    for num, title, desc in steps:
        add_number_circle(s11, num, Inches(0.4), Inches(y))
        add_text(s11, title, Inches(1.0), Inches(y), Inches(3), Inches(0.35), size=16, color=GOLD, bold=True)
        add_text(s11, desc, Inches(1.0), Inches(y + 0.35), Inches(8), Inches(0.3), size=FONT_BODY, color=TEXT_LIGHT)
        y += 0.8

    add_highlight(s11, "Wir beweisen Nutzen zuerst. Danach wird entschieden.")
    add_logo(s11)
    add_footer(s11)

    # ===== FOLIE 12: WAS WIR BRAUCHEN =====
    s12 = prs.slides.add_slide(blank)
    set_background(s12)
    add_section(s12, "Was wir von Ihnen brauchen")
    add_title(s12, "Minimaler Aufwand auf Kundenseite")

    add_text(s12, "Für den Start reichen:", Inches(0.4), Y_CONTENT, Inches(9), Inches(0.35),
             size=FONT_SUBTITLE, color=GOLD, bold=True)

    items = [
        "2–5 Dokumente, die heute nerven",
        "3–10 typische Fragen aus dem Alltag",
        "Ein Ansprechpartner aus Service oder Produktmanagement"
    ]
    y = 2.3
    for item in items:
        # Checkbox
        chk = s12.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.4), Inches(y), Inches(0.35), Inches(0.35))
        chk.fill.solid()
        chk.fill.fore_color.rgb = GOLD
        chk.line.fill.background()
        tf = chk.text_frame
        tf.anchor = MSO_ANCHOR.MIDDLE
        p = tf.paragraphs[0]
        p.text = "✓"
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = NAVY
        p.alignment = PP_ALIGN.CENTER

        add_text(s12, item, Inches(0.9), Inches(y + 0.05), Inches(8), Inches(0.35), size=16, color=WHITE)
        y += 0.55

    add_text(s12, "Das war's.", Inches(0.4), Inches(4.3), Inches(9), Inches(0.6), size=36, color=GOLD, bold=True)
    add_logo(s12)
    add_footer(s12)

    # ===== FOLIE 13: ERGEBNISSE =====
    s13 = prs.slides.add_slide(blank)
    set_background(s13)
    add_section(s13, "Was Sie nach kurzer Zeit sehen")
    add_title(s13, "Konkrete Ergebnisse statt Folien")

    add_text(s13, "Beispielhafte Outcomes:", Inches(0.4), Y_CONTENT, Inches(9), Inches(0.35),
             size=FONT_SUBTITLE, color=GOLD, bold=True)

    outcomes = [
        "Dokumente, die wirklich auffindbar sind",
        "Tabellen, die man direkt weiterverwenden kann",
        "Erste Wissensfälle, die jeder findet",
        "Eine Such- oder Assistenzoberfläche, die im Alltag testbar ist"
    ]
    y = 2.3
    for i, outcome in enumerate(outcomes, 1):
        add_number_circle(s13, i, Inches(0.4), Inches(y))
        add_text(s13, outcome, Inches(1.0), Inches(y + 0.08), Inches(8), Inches(0.4), size=FONT_BODY, color=WHITE)
        y += 0.6

    add_logo(s13)
    add_footer(s13)

    # ===== FOLIE 14: SICHERHEIT =====
    s14 = prs.slides.add_slide(blank)
    set_background(s14)
    add_section(s14, "Sicherheit und Vertraulichkeit")
    add_title(s14, "Wenn Daten Betriebsgeheimnis sind, wird das mitgedacht")

    # 5 kleine Karten in 2 Reihen
    items = [
        ("Interne Nutzung", "Keine externe Weitergabe"),
        ("Zugriffsrechte", "Rollenbasierte Kontrolle"),
        ("Transparenz", "Quellen sind sichtbar"),
        ("Keine Veröffentlichung", "Inhalte bleiben geschützt"),
        ("Klare Abgrenzung", "Was rein darf und was nicht")
    ]
    positions = [(0.4, 1.9), (3.5, 1.9), (6.6, 1.9), (2.0, 3.1), (5.1, 3.1)]

    for (title, desc), (x, y) in zip(items, positions):
        card = s14.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(2.95), Inches(0.95))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = BORDER
        add_text(s14, title, Inches(x + 0.1), Inches(y + 0.1), Inches(2.75), Inches(0.3),
                size=FONT_BODY, color=GOLD, bold=True)
        add_text(s14, desc, Inches(x + 0.1), Inches(y + 0.45), Inches(2.75), Inches(0.3),
                size=FONT_SMALL, color=TEXT_LIGHT)

    add_highlight(s14, "Wissen soll verfügbar sein. Aber nur für die Richtigen.", top=Inches(4.4))
    add_logo(s14)
    add_footer(s14)

    # ===== FOLIE 15: ABSCHLUSS =====
    s15 = prs.slides.add_slide(blank)
    set_background(s15)

    # Dekorativer Balken
    bar = s15.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(2.2), Inches(0.12), Inches(2))
    bar.fill.solid()
    bar.fill.fore_color.rgb = GOLD
    bar.line.fill.background()

    add_text(s15, "Wir ersetzen keine Menschen.", Inches(0.6), Inches(1.5), Inches(8), Inches(0.5), size=22, color=TEXT_LIGHT)
    add_text(s15, "Wir ersetzen Sucharbeit,\nUnterbrechungen und\nWissensverlust.",
             Inches(0.6), Inches(2.2), Inches(8), Inches(1.5), size=28, color=GOLD, bold=True)

    # Kontakt-Box
    cbox = s15.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.4), Inches(4.6), Inches(4), Inches(1.6))
    cbox.fill.solid()
    cbox.fill.fore_color.rgb = CARD_BG
    cbox.line.color.rgb = BORDER

    add_text(s15, "Kontakt", Inches(0.55), Inches(4.7), Inches(3.5), Inches(0.25), size=FONT_SMALL, color=GOLD, bold=True)
    add_text(s15, "Philipp Koch", Inches(0.55), Inches(5.0), Inches(3.5), Inches(0.3), size=16, color=WHITE, bold=True)
    add_text(s15, "Neuratex AI", Inches(0.55), Inches(5.35), Inches(3.5), Inches(0.25), size=FONT_BODY, color=TEXT_LIGHT)
    add_text(s15, "philippkoch@neuratex.de", Inches(0.55), Inches(5.65), Inches(3.5), Inches(0.25), size=FONT_BODY, color=TEXT_LIGHT)

    if os.path.exists(LOGO_PATH):
        s15.shapes.add_picture(LOGO_PATH, Inches(5.5), Inches(3.8), width=Inches(4))

    add_footer(s15)

    # Speichern
    prs.save(OUTPUT_PATH)
    print(f"Präsentation gespeichert: {OUTPUT_PATH}")


if __name__ == "__main__":
    create_presentation()
