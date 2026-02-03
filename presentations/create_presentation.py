#!/usr/bin/env python3
"""
Neuratex AI Präsentation - PowerPoint Generator
CI-Farben: Navy #0A1931, Gold #FFC947, Blau #185ADB
"""

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.ns import nsmap
from pptx.oxml import parse_xml
from lxml import etree
import os

# CI Farben
NAVY = RGBColor(0x0A, 0x19, 0x31)
GOLD = RGBColor(0xFF, 0xC9, 0x47)
BLUE = RGBColor(0x18, 0x5A, 0xDB)
TEXT_LIGHT = RGBColor(0xCB, 0xD5, 0xE1)
HEADLINE_WHITE = RGBColor(0xF8, 0xFA, 0xFC)
CARD_BG = RGBColor(0x11, 0x22, 0x40)

# Pfade
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
LOGO_PATH = os.path.join(SCRIPT_DIR, "../public/assets/images/neuratex-logo.jpg")
OUTPUT_PATH = os.path.join(SCRIPT_DIR, "Neuratex_AI_Praesentation.pptx")

def set_slide_background(slide, color):
    """Setzt den Hintergrund einer Folie auf eine Farbe"""
    background = slide.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = color

def add_title_text(slide, text, left, top, width, height, font_size=44, bold=True, color=HEADLINE_WHITE):
    """Fügt einen Titel-Textrahmen hinzu"""
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = text
    p.font.size = Pt(font_size)
    p.font.bold = bold
    p.font.color.rgb = color
    p.font.name = "Arial"
    return txBox

def add_body_text(slide, text, left, top, width, height, font_size=18, color=TEXT_LIGHT, bold=False):
    """Fügt einen Body-Textrahmen hinzu"""
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = text
    p.font.size = Pt(font_size)
    p.font.bold = bold
    p.font.color.rgb = color
    p.font.name = "Arial"
    p.line_spacing = 1.5
    return txBox

def add_bullet_points(slide, items, left, top, width, height, font_size=16, color=TEXT_LIGHT):
    """Fügt Bullet Points hinzu"""
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True

    for i, item in enumerate(items):
        if i == 0:
            p = tf.paragraphs[0]
        else:
            p = tf.add_paragraph()
        p.text = f"• {item}"
        p.font.size = Pt(font_size)
        p.font.color.rgb = color
        p.font.name = "Arial"
        p.line_spacing = 1.5
        p.space_after = Pt(8)
    return txBox

def add_highlight_box(slide, text, left, top, width, height, font_size=16):
    """Fügt eine Gold-Highlight-Box hinzu"""
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = GOLD
    shape.line.fill.background()

    tf = shape.text_frame
    tf.word_wrap = True
    tf.paragraphs[0].alignment = PP_ALIGN.CENTER
    p = tf.paragraphs[0]
    p.text = text
    p.font.size = Pt(font_size)
    p.font.bold = True
    p.font.color.rgb = NAVY
    p.font.name = "Arial"

    # Vertikal zentrieren
    tf.paragraphs[0].space_before = Pt(10)
    return shape

def add_section_header(slide, text, left, top, width, font_size=14):
    """Fügt eine Abschnittsüberschrift in Gold hinzu"""
    txBox = slide.shapes.add_textbox(left, top, width, Inches(0.4))
    tf = txBox.text_frame
    p = tf.paragraphs[0]
    p.text = text.upper()
    p.font.size = Pt(font_size)
    p.font.bold = True
    p.font.color.rgb = GOLD
    p.font.name = "Arial"
    return txBox

def add_logo(slide, logo_path, width=Inches(1.2)):
    """Fügt das Logo unten rechts hinzu"""
    if os.path.exists(logo_path):
        slide.shapes.add_picture(
            logo_path,
            Inches(10) - width - Inches(0.3),  # Rechts
            Inches(7.5) - Inches(0.6) - Inches(0.2),  # Unten
            width=width
        )

def add_notes(slide, text):
    """Fügt Sprechernotizen hinzu"""
    notes_slide = slide.notes_slide
    notes_tf = notes_slide.notes_text_frame
    notes_tf.text = text

def create_presentation():
    prs = Presentation()
    prs.slide_width = Inches(10)
    prs.slide_height = Inches(7.5)

    # Leeres Layout verwenden
    blank_layout = prs.slide_layouts[6]

    # ========== FOLIE 1: TITEL ==========
    slide1 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide1, NAVY)

    # Haupttitel
    add_body_text(slide1, "Wissen nutzbar machen.", Inches(0.5), Inches(2), Inches(9), Inches(0.6),
                  font_size=28, color=TEXT_LIGHT)
    add_body_text(slide1, "Suche eliminieren.", Inches(0.5), Inches(2.5), Inches(9), Inches(0.6),
                  font_size=28, color=TEXT_LIGHT)
    add_body_text(slide1, "Service beschleunigen.", Inches(0.5), Inches(3), Inches(9), Inches(0.6),
                  font_size=28, color=TEXT_LIGHT)

    add_title_text(slide1, "Neuratex AI", Inches(0.5), Inches(4), Inches(9), Inches(1),
                   font_size=54, color=GOLD)

    add_body_text(slide1, "Philipp Koch", Inches(0.5), Inches(5.2), Inches(9), Inches(0.5),
                  font_size=20, color=TEXT_LIGHT)

    # Logo groß auf Titelfolie
    if os.path.exists(LOGO_PATH):
        slide1.shapes.add_picture(LOGO_PATH, Inches(7), Inches(1.5), width=Inches(2.5))

    add_notes(slide1, "Ich helfe technischen Unternehmen dabei, Informationen schnell auffindbar zu machen, ohne ihre Systeme umzubauen.")

    # ========== FOLIE 2: DIE REALITÄT ==========
    slide2 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide2, NAVY)

    add_section_header(slide2, "Die Realität in technischen Unternehmen", Inches(0.5), Inches(0.4), Inches(9))
    add_title_text(slide2, "Warum es heute oft unnötig langsam ist", Inches(0.5), Inches(0.8), Inches(9), Inches(0.8),
                   font_size=32)

    # Linke Spalte - Wissen verteilt in
    add_body_text(slide2, "Kritisches Wissen liegt verteilt in:", Inches(0.5), Inches(1.8), Inches(4), Inches(0.5),
                  font_size=16, color=GOLD, bold=True)
    add_bullet_points(slide2, [
        "PDFs und Scans",
        "Tabellen und Listen",
        "Zeichnungen und Katalogen",
        "E-Mails, Ordnern, SharePoint",
        "Köpfen einzelner Mitarbeiter"
    ], Inches(0.5), Inches(2.3), Inches(4), Inches(2.5), font_size=15)

    # Rechte Spalte - Das Ergebnis
    add_body_text(slide2, "Das Ergebnis im Alltag:", Inches(5), Inches(1.8), Inches(4.5), Inches(0.5),
                  font_size=16, color=GOLD, bold=True)
    add_bullet_points(slide2, [
        "Suchen statt arbeiten",
        "Rückfragen statt Lösungen",
        "Abhängigkeit von Schlüsselpersonen",
        "Lange Antwortzeiten im Service"
    ], Inches(5), Inches(2.3), Inches(4.5), Inches(2), font_size=15)

    # Highlight Box
    add_highlight_box(slide2, "Wenn Information existiert, aber nicht auffindbar ist,\nist sie wirtschaftlich wertlos.",
                      Inches(0.5), Inches(5.5), Inches(9), Inches(1.2), font_size=18)

    add_logo(slide2, LOGO_PATH)

    # ========== FOLIE 3: WAS ES KOSTET ==========
    slide3 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide3, NAVY)

    add_section_header(slide3, "Was es wirklich kostet", Inches(0.5), Inches(0.4), Inches(9))
    add_title_text(slide3, "Zeitverlust ist nur die Oberfläche", Inches(0.5), Inches(0.8), Inches(9), Inches(0.8),
                   font_size=32)

    # Direkte Kosten
    add_body_text(slide3, "Direkte Kosten", Inches(0.5), Inches(1.8), Inches(4), Inches(0.5),
                  font_size=18, color=GOLD, bold=True)
    add_bullet_points(slide3, [
        "Suchzeit im Service und Vertrieb",
        "Unterbrechungen und Kontextwechsel",
        "Doppelte Arbeit durch wiederholte Recherche"
    ], Inches(0.5), Inches(2.3), Inches(4.2), Inches(1.8), font_size=15)

    # Indirekte Kosten
    add_body_text(slide3, "Indirekte Kosten", Inches(5), Inches(1.8), Inches(4.5), Inches(0.5),
                  font_size=18, color=GOLD, bold=True)
    add_bullet_points(slide3, [
        "Langsamer Kundenservice wirkt wie mangelnde Kompetenz",
        "Kunden springen ab oder bestellen woanders",
        "Experten werden zum Flaschenhals",
        "Einarbeitung dauert zu lange"
    ], Inches(5), Inches(2.3), Inches(4.5), Inches(2.2), font_size=15)

    # Highlight
    add_highlight_box(slide3, "Wachstum scheitert selten an Nachfrage.\nEs scheitert an Zugriff auf Wissen.",
                      Inches(0.5), Inches(5.5), Inches(9), Inches(1.2), font_size=18)

    add_logo(slide3, LOGO_PATH)

    # ========== FOLIE 4: KLASSISCHE ANSÄTZE ==========
    slide4 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide4, NAVY)

    add_section_header(slide4, "Warum klassische Ansätze nicht reichen", Inches(0.5), Inches(0.4), Inches(9))
    add_title_text(slide4, "Warum Teams, SharePoint und Ablage\nallein das Problem nicht lösen",
                   Inches(0.5), Inches(0.8), Inches(9), Inches(1), font_size=28)

    add_body_text(slide4, "Ablage ist nicht Zugriff", Inches(0.5), Inches(2), Inches(9), Inches(0.5),
                  font_size=18, color=GOLD, bold=True)

    add_bullet_points(slide4, [
        "Wer nicht weiß, wonach er suchen muss, findet nichts",
        "Gescannte Tabellen und Zeichnungen sind oft nicht zuverlässig durchsuchbar",
        "Wissen aus gelösten Fällen wird selten standardisiert festgehalten",
        "Ergebnisse landen in Chats, Telefonaten oder WhatsApp – und verschwinden"
    ], Inches(0.5), Inches(2.5), Inches(9), Inches(2.5), font_size=16)

    add_highlight_box(slide4, "Viele Unternehmen haben Speicher.\nWas fehlt, ist ein Gedächtnis.",
                      Inches(0.5), Inches(5.5), Inches(9), Inches(1.2), font_size=20)

    add_logo(slide4, LOGO_PATH)

    # ========== FOLIE 5: WAS WIR LIEFERN ==========
    slide5 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide5, NAVY)

    add_section_header(slide5, "Was wir konkret liefern", Inches(0.5), Inches(0.4), Inches(9))
    add_title_text(slide5, "Keine Tool-Show. Konkrete Ergebnisse.",
                   Inches(0.5), Inches(0.8), Inches(9), Inches(0.8), font_size=32)

    add_body_text(slide5, "Wir liefern drei Dinge, je nach Ausgangslage:", Inches(0.5), Inches(1.8), Inches(9), Inches(0.5),
                  font_size=18, color=TEXT_LIGHT)

    # Die drei Lösungen als nummerierte Liste
    items = [
        "Dokumente werden nutzbar gemacht",
        "Erfahrungswissen wird strukturiert gesichert",
        "Zugriff wird drastisch beschleunigt"
    ]

    y_pos = 2.4
    for i, item in enumerate(items, 1):
        # Nummer in Gold
        num_box = slide5.shapes.add_shape(MSO_SHAPE.OVAL, Inches(0.5), Inches(y_pos), Inches(0.5), Inches(0.5))
        num_box.fill.solid()
        num_box.fill.fore_color.rgb = GOLD
        num_box.line.fill.background()
        tf = num_box.text_frame
        tf.paragraphs[0].text = str(i)
        tf.paragraphs[0].font.size = Pt(20)
        tf.paragraphs[0].font.bold = True
        tf.paragraphs[0].font.color.rgb = NAVY
        tf.paragraphs[0].alignment = PP_ALIGN.CENTER

        add_body_text(slide5, item, Inches(1.2), Inches(y_pos + 0.1), Inches(8), Inches(0.5),
                      font_size=20, color=HEADLINE_WHITE)
        y_pos += 0.8

    add_highlight_box(slide5, "Wir ersetzen keine Systeme.\nWir bauen eine Zugriffsebene auf Ihren Bestand.",
                      Inches(0.5), Inches(5.5), Inches(9), Inches(1.2), font_size=18)

    add_logo(slide5, LOGO_PATH)

    # ========== FOLIE 6: LÖSUNG 1 ==========
    slide6 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide6, NAVY)

    add_section_header(slide6, "Lösung 1: Altunterlagen nutzbar machen", Inches(0.5), Inches(0.4), Inches(9))
    add_title_text(slide6, "Von Scan-Chaos zu Arbeitsdaten",
                   Inches(0.5), Inches(0.8), Inches(9), Inches(0.8), font_size=32)

    # Typische Inputs
    add_body_text(slide6, "Typische Inputs", Inches(0.5), Inches(1.7), Inches(4), Inches(0.5),
                  font_size=16, color=GOLD, bold=True)
    add_bullet_points(slide6, [
        "Gescannte Kataloge",
        "PDF-Tabellen",
        "Stücklisten",
        "Kennlinien",
        "Ersatzteilseiten",
        "Zeichnungen mit Positionsnummern"
    ], Inches(0.5), Inches(2.1), Inches(4), Inches(2.8), font_size=14)

    # Outputs
    add_body_text(slide6, "Outputs, die im Alltag zählen", Inches(5), Inches(1.7), Inches(4.5), Inches(0.5),
                  font_size=16, color=GOLD, bold=True)
    add_bullet_points(slide6, [
        "Durchsuchbare Dokumente mit verlässlichen Treffern",
        "Saubere Tabellen als Excel oder CSV",
        "Importdaten für ERP oder Shop nach Vorgabe",
        "Strukturierte Daten mit klaren Feldern"
    ], Inches(5), Inches(2.1), Inches(4.5), Inches(2.2), font_size=14)

    add_highlight_box(slide6, "Es geht nicht um schöne Digitalisierung. Es geht darum, dass jemand\nin 30 Sekunden findet, was er heute in 15 Minuten sucht.",
                      Inches(0.5), Inches(5.5), Inches(9), Inches(1.3), font_size=16)

    add_logo(slide6, LOGO_PATH)

    # ========== FOLIE 7: LÖSUNG 2 ==========
    slide7 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide7, NAVY)

    add_section_header(slide7, "Lösung 2: Erfahrungswissen sichern", Inches(0.5), Inches(0.4), Inches(9))
    add_title_text(slide7, "Wissen geht sonst in Rente",
                   Inches(0.5), Inches(0.8), Inches(9), Inches(0.8), font_size=32)

    # Problem
    add_body_text(slide7, "Problem", Inches(0.5), Inches(1.7), Inches(4.2), Inches(0.5),
                  font_size=16, color=GOLD, bold=True)
    add_bullet_points(slide7, [
        "Die Trefferquote hängt an Personen, nicht am System",
        "Viele Lösungen sind implizit und werden nie dokumentiert",
        "Neue Mitarbeiter müssen fragen statt handeln"
    ], Inches(0.5), Inches(2.1), Inches(4.2), Inches(1.5), font_size=14)

    # Lösung - Fallkarten
    add_body_text(slide7, "Lösung: Schlanke Wissenslogik", Inches(5), Inches(1.7), Inches(4.5), Inches(0.5),
                  font_size=16, color=GOLD, bold=True)
    add_bullet_points(slide7, [
        "Kurze Fallkarten statt Romane",
        "Maschine oder Baureihe",
        "Symptom oder Anfrage",
        "Lösungsschritte",
        "Teile und Hinweise",
        "Quelle oder Referenz"
    ], Inches(5), Inches(2.1), Inches(4.5), Inches(2.5), font_size=14)

    # Ergebnis
    add_body_text(slide7, "Ergebnis:", Inches(0.5), Inches(4.2), Inches(9), Inches(0.4),
                  font_size=16, color=GOLD, bold=True)
    add_body_text(slide7, "Wissen bleibt im Unternehmen • Einarbeitung wird schneller • Qualität wird stabiler",
                  Inches(0.5), Inches(4.6), Inches(9), Inches(0.4), font_size=15, color=TEXT_LIGHT)

    add_highlight_box(slide7, "Gute Leute sollen Probleme lösen.\nNicht Wissen wiederfinden.",
                      Inches(0.5), Inches(5.5), Inches(9), Inches(1.2), font_size=20)

    add_logo(slide7, LOGO_PATH)

    # ========== FOLIE 8: LÖSUNG 3 ==========
    slide8 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide8, NAVY)

    add_section_header(slide8, "Lösung 3: Internes Assistenzsystem", Inches(0.5), Inches(0.4), Inches(9))
    add_title_text(slide8, "Schnelle Antworten aus den eigenen Quellen",
                   Inches(0.5), Inches(0.8), Inches(9), Inches(0.8), font_size=32)

    # Was es ist
    add_body_text(slide8, "Was es ist", Inches(0.5), Inches(1.7), Inches(4.2), Inches(0.5),
                  font_size=16, color=GOLD, bold=True)
    add_body_text(slide8, "Ein internes System für Service und Vertrieb, das Fragen beantwortet – auf Basis Ihrer eigenen Dokumente und Wissensfälle",
                  Inches(0.5), Inches(2.1), Inches(4.2), Inches(1.2), font_size=14, color=TEXT_LIGHT)

    # Was es nicht ist
    add_body_text(slide8, "Was es nicht ist", Inches(0.5), Inches(3.3), Inches(4.2), Inches(0.5),
                  font_size=16, color=GOLD, bold=True)
    add_bullet_points(slide8, [
        "Kein Endkundentool",
        "Kein Chatbot ohne Nachweise",
        "Keine Fantasie-Antworten"
    ], Inches(0.5), Inches(3.7), Inches(4.2), Inches(1.3), font_size=14)

    # Wie es Vertrauen schafft
    add_body_text(slide8, "Wie es Vertrauen schafft", Inches(5), Inches(1.7), Inches(4.5), Inches(0.5),
                  font_size=16, color=GOLD, bold=True)
    add_bullet_points(slide8, [
        "Antworten mit Quellenbezug",
        "Verlinkung zur Originalstelle",
        "Nachvollziehbar für den Mitarbeiter"
    ], Inches(5), Inches(2.1), Inches(4.5), Inches(1.3), font_size=14)

    # Ergebnis
    add_body_text(slide8, "Ergebnis", Inches(5), Inches(3.5), Inches(4.5), Inches(0.5),
                  font_size=16, color=GOLD, bold=True)
    add_bullet_points(slide8, [
        "Minuten statt Viertelstunden",
        "Weniger interne Rückfragen",
        "Experten werden entlastet"
    ], Inches(5), Inches(3.9), Inches(4.5), Inches(1.3), font_size=14)

    add_logo(slide8, LOGO_PATH)

    # ========== FOLIE 9: VERBINDUNG DER LÖSUNGEN ==========
    slide9 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide9, NAVY)

    add_section_header(slide9, "So verbinden sich die drei Lösungen", Inches(0.5), Inches(0.4), Inches(9))
    add_title_text(slide9, "Ein System. Drei Einstiegspunkte.",
                   Inches(0.5), Inches(0.8), Inches(9), Inches(0.8), font_size=32)

    # Die drei Säulen
    pillars = [
        ("Dokumente", "sind die Basis"),
        ("Erfahrungswissen", "macht es praxisnah"),
        ("Assistenz", "macht den Zugriff schnell")
    ]

    x_positions = [0.5, 3.5, 6.5]
    for i, (title, subtitle) in enumerate(pillars):
        # Box
        box = slide9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE,
                                       Inches(x_positions[i]), Inches(1.8), Inches(2.8), Inches(1.2))
        box.fill.solid()
        box.fill.fore_color.rgb = CARD_BG
        box.line.color.rgb = GOLD
        box.line.width = Pt(2)

        add_body_text(slide9, title, Inches(x_positions[i]), Inches(2), Inches(2.8), Inches(0.4),
                      font_size=18, color=GOLD, bold=True)
        add_body_text(slide9, subtitle, Inches(x_positions[i]), Inches(2.4), Inches(2.8), Inches(0.4),
                      font_size=14, color=TEXT_LIGHT)

    # Einstiegspunkte
    add_body_text(slide9, "Man kann starten mit:", Inches(0.5), Inches(3.3), Inches(9), Inches(0.4),
                  font_size=16, color=HEADLINE_WHITE, bold=True)
    add_bullet_points(slide9, [
        "Altunterlagen, wenn Dokumentchaos dominiert",
        "Wissensfällen, wenn Experten Engpass sind",
        "Assistenz, wenn Suche im Alltag Zeit frisst"
    ], Inches(0.5), Inches(3.7), Inches(9), Inches(1.5), font_size=15)

    add_highlight_box(slide9, "Das ist kein Bauchladen. Es ist eine klare Stufenlogik.",
                      Inches(0.5), Inches(5.8), Inches(9), Inches(0.9), font_size=18)

    add_logo(slide9, LOGO_PATH)

    # ========== FOLIE 10: WARUM JETZT ==========
    slide10 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide10, NAVY)

    add_section_header(slide10, "Warum jetzt sinnvoll", Inches(0.5), Inches(0.4), Inches(9))
    add_title_text(slide10, "Timing in vielen Unternehmen ist gerade ideal",
                   Inches(0.5), Inches(0.8), Inches(9), Inches(0.8), font_size=32)

    add_bullet_points(slide10, [
        "Neue ERP- oder CRM-Einführungen erhöhen die Sichtbarkeit von Datenproblemen",
        "Ohne saubere Dokumentbasis werden neue Systeme langsamer akzeptiert",
        "Wissensverlust durch Renteneintritte ist planbar, aber oft unvorbereitet",
        "Service-Anfragen steigen, während Fachkräfte knapp sind"
    ], Inches(0.5), Inches(1.9), Inches(9), Inches(2.5), font_size=17)

    add_highlight_box(slide10, "Ein neues System ohne nutzbares Wissen ist wie\nein neues Lager ohne Beschriftung.",
                      Inches(0.5), Inches(5.5), Inches(9), Inches(1.2), font_size=18)

    add_logo(slide10, LOGO_PATH)

    # ========== FOLIE 11: VORGEHEN ==========
    slide11 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide11, NAVY)

    add_section_header(slide11, "Vorgehen ohne Großprojekt", Inches(0.5), Inches(0.4), Inches(9))
    add_title_text(slide11, "Pragmatisch. Schrittweise. Messbar.",
                   Inches(0.5), Inches(0.8), Inches(9), Inches(0.8), font_size=32)

    steps = [
        ("1", "Machbarkeitscheck an echten Unterlagen und echten Fragen"),
        ("2", "Kleines Paket mit sichtbarem Output"),
        ("3", "Skalierung auf weitere Fabrikate oder Dokumenttypen"),
        ("4", "Optional: Integration in bestehende Systeme")
    ]

    y_pos = 2.0
    for num, text in steps:
        # Schritt-Nummer
        num_box = slide11.shapes.add_shape(MSO_SHAPE.OVAL, Inches(0.5), Inches(y_pos), Inches(0.5), Inches(0.5))
        num_box.fill.solid()
        num_box.fill.fore_color.rgb = GOLD
        num_box.line.fill.background()
        tf = num_box.text_frame
        tf.paragraphs[0].text = num
        tf.paragraphs[0].font.size = Pt(18)
        tf.paragraphs[0].font.bold = True
        tf.paragraphs[0].font.color.rgb = NAVY
        tf.paragraphs[0].alignment = PP_ALIGN.CENTER

        add_body_text(slide11, text, Inches(1.2), Inches(y_pos + 0.1), Inches(8), Inches(0.5),
                      font_size=17, color=TEXT_LIGHT)
        y_pos += 0.75

    add_highlight_box(slide11, "Wir beweisen Nutzen zuerst. Danach wird entschieden.",
                      Inches(0.5), Inches(5.5), Inches(9), Inches(0.9), font_size=18)

    add_logo(slide11, LOGO_PATH)

    # ========== FOLIE 12: WAS WIR BRAUCHEN ==========
    slide12 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide12, NAVY)

    add_section_header(slide12, "Was wir von Ihnen brauchen", Inches(0.5), Inches(0.4), Inches(9))
    add_title_text(slide12, "Minimaler Aufwand auf Kundenseite",
                   Inches(0.5), Inches(0.8), Inches(9), Inches(0.8), font_size=32)

    add_body_text(slide12, "Für den Start reichen:", Inches(0.5), Inches(1.9), Inches(9), Inches(0.5),
                  font_size=18, color=GOLD, bold=True)

    add_bullet_points(slide12, [
        "2 bis 5 Dokumente, die heute nerven",
        "3 bis 10 typische Fragen aus dem Alltag",
        "Ein Ansprechpartner aus Service oder Produktmanagement"
    ], Inches(0.5), Inches(2.5), Inches(9), Inches(2), font_size=20)

    # Das war's - groß
    add_title_text(slide12, "Das war's.", Inches(0.5), Inches(4.5), Inches(9), Inches(1),
                   font_size=40, color=GOLD)

    add_logo(slide12, LOGO_PATH)

    # ========== FOLIE 13: ERGEBNISSE ==========
    slide13 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide13, NAVY)

    add_section_header(slide13, "Was Sie nach kurzer Zeit sehen", Inches(0.5), Inches(0.4), Inches(9))
    add_title_text(slide13, "Konkrete Ergebnisse statt Folien",
                   Inches(0.5), Inches(0.8), Inches(9), Inches(0.8), font_size=32)

    add_body_text(slide13, "Beispielhafte Outcomes:", Inches(0.5), Inches(1.9), Inches(9), Inches(0.5),
                  font_size=18, color=GOLD, bold=True)

    add_bullet_points(slide13, [
        "Dokumente, die wirklich auffindbar sind",
        "Tabellen, die man direkt weiterverwenden kann",
        "Erste Wissensfälle, die jeder findet",
        "Eine Such- oder Assistenzoberfläche, die im Alltag testbar ist"
    ], Inches(0.5), Inches(2.5), Inches(9), Inches(2.5), font_size=18)

    add_logo(slide13, LOGO_PATH)

    # ========== FOLIE 14: SICHERHEIT ==========
    slide14 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide14, NAVY)

    add_section_header(slide14, "Sicherheit und Vertraulichkeit", Inches(0.5), Inches(0.4), Inches(9))
    add_title_text(slide14, "Wenn Daten Betriebsgeheimnis sind,\nwird das mitgedacht",
                   Inches(0.5), Inches(0.8), Inches(9), Inches(1), font_size=28)

    add_bullet_points(slide14, [
        "Interne Nutzung",
        "Zugriffsrechte",
        "Transparenz, welche Quellen genutzt werden",
        "Keine Veröffentlichung von Inhalten",
        "Saubere Abgrenzung, was im System landet und was nicht"
    ], Inches(0.5), Inches(2.2), Inches(9), Inches(2.5), font_size=17)

    add_highlight_box(slide14, "Wissen soll verfügbar sein. Aber nur für die Richtigen.",
                      Inches(0.5), Inches(5.5), Inches(9), Inches(0.9), font_size=18)

    add_logo(slide14, LOGO_PATH)

    # ========== FOLIE 15: ABSCHLUSS ==========
    slide15 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide15, NAVY)

    add_title_text(slide15, "Wir ersetzen keine Menschen.",
                   Inches(0.5), Inches(1.5), Inches(9), Inches(0.8), font_size=28, color=TEXT_LIGHT)
    add_title_text(slide15, "Wir ersetzen Sucharbeit,\nUnterbrechungen und Wissensverlust.",
                   Inches(0.5), Inches(2.3), Inches(9), Inches(1.2), font_size=32, color=GOLD)

    # Kontakt
    add_body_text(slide15, "Kontakt", Inches(0.5), Inches(4.5), Inches(9), Inches(0.5),
                  font_size=14, color=GOLD, bold=True)
    add_body_text(slide15, "Philipp Koch", Inches(0.5), Inches(5), Inches(9), Inches(0.4),
                  font_size=20, color=HEADLINE_WHITE, bold=True)
    add_body_text(slide15, "Neuratex AI", Inches(0.5), Inches(5.4), Inches(9), Inches(0.4),
                  font_size=18, color=TEXT_LIGHT)
    add_body_text(slide15, "philippkoch@neuratex.de", Inches(0.5), Inches(5.8), Inches(9), Inches(0.4),
                  font_size=16, color=TEXT_LIGHT)

    # Logo groß auf Abschlussfolie
    if os.path.exists(LOGO_PATH):
        slide15.shapes.add_picture(LOGO_PATH, Inches(6.5), Inches(4.5), width=Inches(3))

    # Speichern
    prs.save(OUTPUT_PATH)
    print(f"Präsentation gespeichert: {OUTPUT_PATH}")

if __name__ == "__main__":
    create_presentation()
