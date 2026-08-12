# Design-Umbau neuratex.de: Plan zur Prüfung

Stand: 12.08.2026
Branch: `fix/audit-paket-4` (main unberührt, nichts deployed)
Autor: Claude, im Auftrag von Philipp Koch

Dieses Dokument beschreibt den geplanten Design-Umbau. Es ist zur kritischen Prüfung
gedacht. Schritt 1 ist bereits ausgeführt, alle weiteren Schritte stehen zur Diskussion.

---

## 1. Ausgangslage, gemessen

Die Website ist funktional in Ordnung, wirkt aber wie ein Template. Das liegt messbar
nicht an fehlenden Effekten, sondern an fehlender Systematik:

| Merkmal | Ist-Zustand | Zielwert |
|---|---|---|
| Verschiedene `font-size`-Werte | 39 | 7 |
| Verschiedene `margin`-Werte | 59 | 8 |
| Verschiedene `padding`-Werte | 43 | 8 |
| Verschiedene `border-radius`-Werte | 17 | 4 |
| Hex-Farbliterale im CSS | 45 | 0 (alle über Tokens) |
| Inline-`style`-Attribute | 41 (Startseite), 364 (Lernplattform), 150 (Leistungen) | 0 |
| CSS-Zeilen gesamt | 2.652 über 4 Dateien | ähnlich, aber systematisiert |

Interpretation: Wenn Abstände und Schriftgrößen unsystematisch sind, entsteht optische
Unruhe, die Betrachter nicht benennen, aber als "wirkt selbstgebaut" wahrnehmen.
Hochwertige Websites unterscheiden sich primär durch Konsistenz und Weißraum,
sekundär durch Bewegung.

Zweiter Befund: Alle Bildmotive sind generierte Stockillustrationen mit KI-Ästhetik
(abstrakte Interfaces, Neon-Datenströme). Es existiert kein einziges echtes
Projektartefakt auf der Seite.

---

## 2. Zielbild

Die Seite soll aussagen: "Der Typ hat es drauf und liefert." Nicht: "Der Typ hat eine
Agentur bezahlt."

Konkret heißt das:
- Ruhiges, großzügiges Layout mit klarer Typo-Hierarchie
- Bewegung, die Inhalt erschließt (Reveals beim Scrollen, Zahlen-Counter), nicht Bewegung als Selbstzweck
- Ein aufwendiger Hero als Blickfang, da er den ersten Eindruck trägt
- Echte Artefakte statt generierter Bilder, wo immer verfügbar
- Volle Funktion ohne JavaScript und bei `prefers-reduced-motion`

---

## 3. Die Schritte

### Schritt 1: Design-System als Fundament (AUSGEFÜHRT)

**Was:** Design-Tokens als CSS-Custom-Properties: Typo-Skala mit 7 Stufen, Spacing-Skala
auf 4px-Basis, erweiterte Farbpalette mit benannten Rollen, Radien, Schatten,
Motion-Tokens (Dauer und Easing), Layout-Breiten.

**Warum zuerst:** Jeder weitere Schritt greift darauf zu. Ohne dieses Fundament wird
jede neue Sektion wieder mit frei gewählten Pixelwerten gebaut und das Chaos wächst.
Dieser Schritt ist außerdem der einzige, der durch Feedback nicht obsolet werden kann:
Design-Tokens braucht jede denkbare Design-Richtung.

**Risiko:** Sehr gering. Die Tokens werden additiv eingeführt, bestehende Regeln bleiben
zunächst unverändert und werden schrittweise umgestellt.

**Prüfbar durch:** Regressionstest über alle Seiten, visueller Vergleich vorher/nachher.

### Schritt 2: Typografie und Rhythmus

**Was:** Alle Überschriften, Fließtexte und Abstände auf die Skala umstellen. Fluid
Typography über `clamp()`, damit Schriftgrößen zwischen Mobile und Desktop stufenlos
skalieren statt in Breakpoint-Sprüngen. Zeilenlängen auf 60 bis 75 Zeichen begrenzen.
Vertikaler Rhythmus vereinheitlichen.

**Warum:** Das ist der größte optische Hebel überhaupt und der Unterschied, den Laien
als "hochwertig" wahrnehmen, ohne ihn benennen zu können.

**Risiko:** Mittel. Umfangreiche CSS-Änderungen, jede Seite muss visuell geprüft werden.

### Schritt 3: Hero

**Was:** Vollflächiger Hero mit mehrschichtigem Canvas-Hintergrund (der bestehende
`hero-canvas.js` wird ersetzt, nicht ergänzt), Maus-Parallax, gestaffeltes Text-Reveal,
Scroll-Indikator. Dazu eine Vertrauensleiste direkt unter dem CTA (Kundenlogos, sobald
Freigaben vorliegen).

**Warum:** Der Hero entscheidet in den ersten zwei Sekunden. Hier ist aufwendige
Gestaltung investiert, nicht verschwendet.

**Risiko:** Mittel bis hoch. Canvas-Animationen kosten Rechenzeit auf schwachen Geräten.
Gegenmaßnahmen: Rendering pausiert außerhalb des Viewports, Partikelzahl abhängig von
Bildschirmgröße, vollständige Abschaltung bei `prefers-reduced-motion`, statischer
Verlauf als Fallback.

### Schritt 4: Scroll-Choreografie

**Was:** Einheitliches Reveal-System für alle Sektionen (aktuell existieren drei
unterschiedliche, teils widersprüchliche Implementierungen in `main.js`,
`ki-anwendungen.js` und `leistungen-anim.js`). Gestaffelte Einblendungen, Zahlen-Counter,
optional scroll-gekoppelte Verläufe über `IntersectionObserver` und CSS.

**Warum:** Aktuell sind die Animationen inkonsistent und teilweise wirkungslos. Ein
System statt drei Insellösungen.

**Risiko:** Gering bis mittel.

### Schritt 5: Sektionen im Detail

**Was:** Case Study als Kernstück mit echtem Screenshot des Forecasting-Tools,
Kundenstimmen prominent unter dem Hero, Stufen-Sektion mit Verbindungslinie,
KI-Anwendungen als kompakteres Raster, Über-mich mit größerem Portrait.

**Risiko:** Gering, aber abhängig von Zulieferungen (siehe Abschnitt 5).

### Schritt 6: Aufräumen und Härten

**Was:** Inline-Styles in Klassen überführen, Font Awesome selbst hosten statt vom CDN
(entfernt eine externe Abhängigkeit und beschleunigt den ersten Seitenaufbau),
`prefers-reduced-motion` global, Kontrastprüfung nach WCAG AA, Tastaturbedienung,
Test auf echten Geräten.

---

## 4. Was bewusst nicht passiert

- **Kein Framework, kein Build-Schritt.** Die Seite bleibt statisches HTML/CSS/JS auf
  Vercel. Ein Build-Prozess wäre für eine Seite dieser Größe Overhead und würde die
  Wartbarkeit für Philipp verschlechtern.
- **Keine externen Animationsbibliotheken.** GSAP wurde bereits entfernt. Alles wird
  mit nativen Web-APIs gebaut, das hält die Seite schnell und die Content-Security-Policy
  streng.
- **Keine Dark/Light-Umschaltung.** Die Seite ist dunkel gestaltet, das bleibt so.
- **Keine erfundenen Inhalte.** Keine Platzhalter-Logos, keine Beispielzahlen, keine
  Statements ohne Freigabe. Sektionen ohne Inhalt bleiben deaktiviert.

---

## 5. Zulieferungen von Philipp

Ohne diese Punkte bleibt der visuelle Umbau unter seinen Möglichkeiten:

| Was | Wofür | Priorität |
|---|---|---|
| Screenshot des Forecasting-Tools (anonymisiert) | Case Study, stärkster Beweis der Seite | hoch |
| Freigabe Statement Jaenecke (gekürzte Fassung) | Vertrauensleiste unter dem Hero | hoch |
| Statement-Entwurf Krück plus Freigabe | Kundenstimmen | hoch |
| Freigabe zur Namensnennung i-Alarmsysteme plus Logo | De-Anonymisierung der Case Study | hoch |
| Klärung: Wer hat das Case-Study-Zitat gesagt? | Aktuell "Einkaufsleiter" zugeschrieben, Geschäftsführer ist Kervin Krück | hoch, blockierend |
| Portrait in höherer Auflösung | Über-mich-Sektion | mittel |
| ZDH-Statement | dritter Testimonial-Slot | mittel |

---

## 6. Offene Fragen zur Diskussion

1. **Preise auf der Seite?** Aktuell steht auf der gesamten Website kein Preis. Ein
   "ab"-Preis pro Stufe filtert unpassende Anfragen vor dem Erstgespräch. Gegenargument:
   Preise können bei individuellen Projekten abschrecken oder falsch verankern.
2. **Reifegrad-Check:** Die 17 Fragen messen überwiegend persönliche KI-Kompetenz, das
   Ergebnis wird aber als organisatorische Reife des Unternehmens dargestellt. Umbauen
   oder ehrlich als Kompetenzcheck für Teams positionieren?
3. **Voicebot-Demo:** Der Audio-Player ist der einzige interaktive Beweis auf der Seite
   und klingt stark. Voicebots wurden aber bewusst aus dem Angebot genommen. Behalten und
   als Beispiel für Automatisierung rahmen, oder entfernen?
4. **Lernplattform:** Aktuell der einzige hervorgehobene Navigations-Button, führt zu
   einem kostenlosen Angebot. Sie ist inhaltlich stark, steht aber am teuersten Platz der
   Seite. Zurückstufen?
5. **Umfang der Startseite:** Aktuell zehn Sektionen. Kürzen und Inhalte auf Unterseiten
   verlagern, oder als "eine Seite, alle Antworten" belassen?

---

## 7. Reihenfolge und Abhängigkeiten

```
Schritt 1  Design-System            [ausgeführt]
    |
Schritt 2  Typografie und Rhythmus  ──┐
    |                                  |  können parallel laufen
Schritt 3  Hero                     ──┘
    |
Schritt 4  Scroll-Choreografie
    |
Schritt 5  Sektionen im Detail      ← braucht Zulieferungen aus Abschnitt 5
    |
Schritt 6  Aufräumen und Härten
```

Conversion-Themen (Tracking, Kontaktformular, CTA-Stufen, Preise) laufen bewusst
getrennt, weil sie Zuarbeit in Brevo und Umami erfordern.

---

## 8. Prüfung nach jedem Schritt

- Regressionstest über alle sieben Seiten: HTTP-Status, JavaScript-Fehler, tote Ressourcen
- Screenshots in drei Breiten (390, 768, 1440 Pixel)
- Kontrastwerte nach WCAG AA
- Verhalten bei deaktiviertem JavaScript und bei `prefers-reduced-motion`
