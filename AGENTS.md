# AGENTS.md – Regeln für KI-Agenten

> Dieses Dokument definiert verbindliche Regeln für alle KI-Agenten (Copilot, Cursor, Codex, etc.),
> die an diesem Repository arbeiten.

---

## Projekt-Kontext

- **Projekt:** Neuratex AI – KI-Beratungs-Website
- **Repo:** `github.com/philxnovatex/ki-beratung_website`
- **Live-URL:** https://neuratex.de
- **Hosting:** Vercel (statisch + Serverless Functions)
- **Kein eigener Server in Produktion!** (`server.js` ist nur ein Legacy-Dev-Server)

---

## Hosting & Deployment

- **Vercel statisch:** Der Ordner `public/` ist das Output-Verzeichnis
- **Serverless Functions:** Liegen in `api/` (z.B. `api/newsletter.js`)
- **Auto-Deploy:** Push/Merge auf `main` → automatisches Vercel-Deployment
- **Preview:** Jeder PR bekommt eine eigene Preview-URL von Vercel

## Git-Workflow

- **Kein direkter Push auf `main`** – immer über Feature-Branches + Pull Request
- Branch-Namenskonvention: `feat/...`, `fix/...`, `chore/...`, `docs/...`
- Commits auf Deutsch oder Englisch, kurz und aussagekräftig
- PRs sollten eine Beschreibung enthalten, was sich ändert und warum

## Secrets & Umgebungsvariablen

- **Secrets gehören ausschließlich in Vercel Environment Variables** (Dashboard)
- **Niemals** API-Keys, Tokens oder Passwörter in den Code committen
- `.env` ist in `.gitignore` – lokale Env-Dateien sind nur für Entwicklung
- `data/` ist in `.gitignore` – enthält lokale Dev-Daten

### Aktuelle Vercel Environment Variables

| Variable | Zweck |
|---|---|
| `BREVO_API_KEY` | Brevo API-Schlüssel für Newsletter |
| `BREVO_LIST_ID` | Brevo-Listen-ID (Default: `5`) |

## Newsletter

- Newsletter-Anmeldungen laufen über **Brevo API** (ehemals Sendinblue)
- Serverless Function: `api/newsletter.js`
- Brevo-Liste: „Website Leads"
- Kontaktverwaltung, Analytics und E-Mail-Versand erfolgen im **Brevo Dashboard**
- Kein eigenes Double-Opt-In nötig – Brevo übernimmt das bei Bedarf

## Technologie-Stack

- **Frontend:** Vanilla HTML / CSS / JavaScript (kein Framework)
- **Serverless:** Node.js (Vercel Functions)
- **CSS:** Custom CSS, keine Preprocessors
- **Fonts:** Google Fonts (Inter, Roboto Mono)
- **Icons:** Eigenes System in `assets/css/icons.css` (SVG-Masken, kein Netzwerkzugriff).
  Font Awesome wurde bewusst entfernt. **Nicht wieder einbinden.**
  Verwendung: `<i class="icon icon-check" aria-hidden="true"></i>`.
  Vorhanden sind nur: `arrow-right`, `bolt`, `chart-line`, `check`, `folders`,
  `gears`, `microphone`, `quote`, `route`, `warning`, `workshop`.
  Wird ein weiteres gebraucht, in `icons.css` im gleichen Stil ergänzen.
- **Cookie Consent:** orestbida/cookieconsent v3

## Code-Konventionen

- Keine unnötigen npm-Abhängigkeiten hinzufügen
- Kein TypeScript, kein Bundler (die Seite ist bewusst simpel gehalten)
- Inline-Styles nur wo nötig, bevorzugt CSS-Klassen
- Barrierefreiheit beachten: `alt`-Attribute, `aria`-Labels, Fokus-Management
- Deutsche Texte auf der Website, Code-Kommentare Deutsch oder Englisch

## Design-System (verbindlich)

Alle Werte kommen aus den Tokens in `assets/css/style.css` (`:root`).
Keine rohen Zahlen in Regeln schreiben.

**Abstände:** `--space-1, 2, 3, 4, 6, 8, 12, 16, 24`
⚠️ **Dazwischen gibt es nichts.** `var(--space-5)` existiert nicht. Ein
undefiniertes Token macht die gesamte Deklaration ungültig, und sie fällt
still auf den Startwert zurück. Das ist bereits einmal passiert und war im
Ergebnis ein Abstand von null.

**Bewegung:**

| Token | Wert | Wofür |
|---|---|---|
| `--duration-fast` | 150ms | Hover, Fokus, Klickrückmeldung |
| `--duration-base` | 300ms | Zustandswechsel, Menü, Akkordeon |
| `--duration-slow` | 600ms | Einblenden beim Scrollen |
| `--duration-reveal` | 800ms | Obergrenze, nur der eine Signatur-Moment |
| `--ease-out` | `.2,.8,.3,1` | **Eintritte, Standardkurve** |
| `--ease-in-out` | `.4,0,.2,1` | Austritte, Zustandswechsel |

Keine hart kodierten `cubic-bezier` und kein blankes `ease` mehr einbauen.
Beide Kurven existieren genau einmal, nämlich als Token.

**Bewegungsregeln:** Einblendungen fahren 16 bis 24 px, nie 60. Kein Federn,
kein Überschwingen. Gold (`--accent`) ist für Handlungsaufforderungen
reserviert, also trägt nur das goldene Element die auffälligste Bewegung.

**Farben:** Dark Theme. Semantische Rollen benutzen (`--surface-card`,
`--text-body`, `--accent`), nicht die Rohpalette (`--c-navy-600`).

---

## Harte Verträge (werden getestet)

`npm test` startet einen Server und prüft mit Playwright. **Vor jedem PR
ausführen.** Diese Punkte sind keine Empfehlungen:

1. **Ohne JavaScript muss die Seite vollständig lesbar sein.** Jede
   JS-gesteuerte Anzeige braucht einen Zustand ohne JS, in dem alle Inhalte
   sichtbar sind. Bedienelemente, die ohne JS funktionslos wären, werden vom
   Skript erzeugt und stehen nicht im HTML.
2. **`prefers-reduced-motion` hält jede Bewegung an**, ohne Inhalte zu
   verstecken. Rückmeldung auf Eingaben bleibt, nur ohne Weg.
3. **Kein horizontaler Überlauf** bei 390, 768 und 1440 px.
4. **Kontrast nach WCAG AA.**
5. **Keine Geviert- oder Halbgeviertstriche in Website-Texten.** Stattdessen
   Komma, Punkt, Doppelpunkt oder Klammern. Zahlenbereiche ausschreiben
   ("30 bis 50"). Bindestriche in Komposita sind in Ordnung.
6. **Keine dauerhaft laufende Animationsschleife, wo sie nichts bringt:**
   nicht im Hintergrundtab, nicht bei reduzierter Bewegung, nicht auf
   schmalen Fenstern.

Bekannt und vorbestehend: Die Prüfung "Kontaktseite 390px ohne Überlauf"
schlägt fehl. Ursache ist das ausgeblendete Mobilmenü, das per
`translateX(100%)` rechts außerhalb steht und zur Scrollbreite zählt.

---

## Bewegung und Interaktion (bestehende Bausteine)

Nicht neu erfinden, diese Bausteine gibt es bereits:

| Datei | Zweck |
|---|---|
| `assets/js/background-canvas.js` | Knotennetz als fester Seitenhintergrund (`#site-canvas`), vom Scrollfortschritt gesteuert. Läuft nur ab 900 px Breite. |
| `assets/js/pin-sequence.js` | Abschnitte, die beim Scrollen einrasten und Schritte durchschalten. **Neue solche Abschnitte brauchen nur einen Eintrag in `SEKTIONEN` plus CSS, kein neues Skript.** |
| `assets/js/scroll-reveal.js` | Einheitliches Einblenden beim Scrollen, inklusive Staffelung. |
| `assets/js/hero-signature.js` | Scroll-gekoppelte Übergabe vom Hero zum Inhalt. |
| `assets/js/testimonial-slider.js` | Kundenstimmen als Slideshow. |

Wenn der Hintergrund durchscheinen soll, müssen Abschnittsflächen
halbtransparent sein (etwa `rgba(10, 25, 49, .62)`). Deckende Flächen
verdecken ihn vollständig.

---

## CSS-Aufteilung

- `style.css` ist die Basis mit den Tokens und den allgemeinen Komponenten.
- `hero-enhancements.css` gehört ausschließlich zum Hero der Startseite.
- `sections/*.css` sind abschnittsbezogen. **Neue größere Abschnitte bekommen
  eine eigene Datei dort**, statt `style.css` weiter wachsen zu lassen.

Achtung auf die Kaskade: Mehrere Basisregeln setzen `height: 100%`,
`max-width`, `margin: 0 auto` oder eine feste Spaltenzahl. Wer ein Layout
umschaltet, muss diese gezielt zurücknehmen.

---

## Dateistruktur (wichtig!)

```
public/           ← Das wird deployed (Vercel Output)
api/              ← Vercel Serverless Functions
server.js         ← ⚠️ Legacy Dev-Server, NICHT Produktion
config.js         ← ⚠️ Legacy Dev-Server Konfig
lib/              ← Legacy Dev-Server Module
documents/        ← Onepager-Templates (nicht deployed)
data/             ← Lokale Dev-Daten (.gitignore)
```

## Verbote

1. Keine Secrets in den Code committen
2. Nicht direkt auf `main` pushen
3. Keinen neuen Server/Backend einführen (Vercel Serverless reicht)
4. Keine `node_modules` committen
5. Keine Breaking Changes ohne PR-Review
