# Tests

Prüfskripte für die statische Website. Bewusst ohne Testframework und ohne
Build-Schritt, damit das Projekt seine Einfachheit behält.

## Voraussetzungen

```
npm install            # installiert Playwright und den statischen Testserver
npx playwright install chromium
```

## Ausführen

In einem Terminal den Server starten:

```
npx serve public -l 4173
```

In einem zweiten Terminal:

```
npm test
```

Das Skript prüft:

1. **Erreichbarkeit** aller acht Seiten: HTTP-Status, genau eine `h1`,
   JavaScript-Fehler, Antworten mit Status 400 und höher.
2. **Sichtbarkeit** aller eingeblendeten Elemente in drei Modi: normal,
   mit `prefers-reduced-motion` und mit deaktiviertem JavaScript. Kein Inhalt
   darf unsichtbar hängen bleiben.
3. **Bewegung**: Der Hero-Canvas muss außerhalb des Sichtfelds und bei
   reduzierter Bewegung vollständig stillstehen.
4. **Bildverhältnisse**: kein Bild darf verzerrt dargestellt werden.
5. **Typo-Hierarchie**: h1 muss größer als h2 sein, auf jeder Breite.
6. **Überlauf**: die Seite darf sich nicht horizontal verschieben lassen.
7. **Kontrast** nach WCAG AA für alle Text- und Größenkombinationen.
8. **Kontaktformular und API**: Pflichtfelder, Datenschutz, Brevo-Payload,
   Fehlerfälle, Rate-Limit, Größenlimit, Schutz vor Mehrfachabsenden und Versand ohne JS.
9. **Conversion-Events**: Calendly, alle Formulare und Quiz-Abschluss mit simuliertem
   Umami und simulierten API-Antworten; keine Formulareingaben in Event-Daten.
10. **Website-Texte**: keine Gedankenstriche in HTML und eigenem JavaScript.
    Kommentare und Fremdbibliotheken sind ausgenommen.

Details zur Einrichtung und Auswertung: [CONVERSIONS.md](../CONVERSIONS.md).

Rückgabewert 0 bei Erfolg, 1 bei mindestens einem Fehlschlag.
