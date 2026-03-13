# 🔒 FORT KNOX DEBUGGING & SECURITY AUDIT PROMPT

> **Zweck:** Dieser Prompt wird an einen KI-Agenten übergeben, um die gesamte Website
> `neuratex.de` systematisch auf Bugs, Sicherheitslücken, Performance-Probleme und
> Edge Cases zu prüfen – mit Backup-Strategie, Zwischenspeicher und unkonventionellen Tests.
>
> **Projekt:** Neuratex AI – KI-Beratungs-Website (Vanilla HTML/CSS/JS + Vercel Serverless)
> **Repo:** `github.com/philxnovatex/ki-beratung_website`
> **Live:** https://neuratex.de

---

## ═══════════════════════════════════════════════════════════════
## PHASE 0 – SICHERHEITSNETZ (Backup & Rollback)
## ═══════════════════════════════════════════════════════════════

### 0.1 Git-Absicherung
Bevor IRGENDWAS geändert wird:

1. **Aktuellen Stand committen** (falls uncommitted changes existieren):
   ```bash
   git stash                          # Uncommitted changes sichern
   git checkout -b audit/fort-knox-$(date +%Y%m%d-%H%M%S)   # Eigener Audit-Branch
   git stash pop                      # Stash zurückholen
   ```

2. **Snapshot-Tag erstellen:**
   ```bash
   git tag -a pre-audit-$(date +%Y%m%d) -m "Snapshot vor Fort-Knox-Audit"
   ```

3. **Komplettes Backup des public/-Ordners:**
   ```bash
   cp -r public/ public_backup_$(date +%Y%m%d)/
   cp -r api/ api_backup_$(date +%Y%m%d)/
   ```

4. **Rollback-Plan dokumentieren:**
   - Bei jedem Fix: eigener Commit mit aussagekräftiger Message
   - Jeder Commit muss einzeln revertierbar sein
   - Kein "Fix everything"-Mega-Commit

### 0.2 Zwischenspeicher-Strategie
- Nach jeder abgeschlossenen Phase: **Zwischen-Commit** erstellen
- Format: `audit(phase-X): [Beschreibung]`
- Bei kritischen Fixes: sofort committen, nicht sammeln
- Checkliste führen: Was wurde geprüft, was wurde gefunden, was wurde gefixt

---

## ═══════════════════════════════════════════════════════════════
## PHASE 1 – STATISCHE CODE-ANALYSE
## ═══════════════════════════════════════════════════════════════

### 1.1 HTML-Validierung
Prüfe JEDE HTML-Datei auf:
- [ ] W3C-konforme Syntax (keine unclosed tags, korrekte Verschachtelung)
- [ ] Korrekte `<!DOCTYPE html>` Deklaration
- [ ] `<html lang="de">` gesetzt
- [ ] `<meta charset="UTF-8">` vorhanden
- [ ] `<meta name="viewport">` korrekt
- [ ] Alle `id`-Attribute einzigartig pro Seite
- [ ] Keine verwaisten `id`-Referenzen (JS referenziert ID die nicht existiert)
- [ ] Alle `<img>` haben `alt`-Attribute
- [ ] Alle `<a>` mit `target="_blank"` haben `rel="noopener noreferrer"`
- [ ] Keine leeren `href="#"` ohne Event-Handler
- [ ] Formulare: alle `<input>` haben zugehörige `<label>`
- [ ] `aria-*` Attribute korrekt verwendet
- [ ] Keine inline `<script>` ohne Nonce (CSP-Kompatibilität)

**Dateien:** `public/index.html`, `public/pages/*.html`, `public/pages/legal/*.html`

### 1.2 CSS-Analyse
- [ ] Keine unbenutzten CSS-Klassen (Dead CSS)
- [ ] Keine CSS-Konflikte (gleiche Spezifität, widersprüchliche Regeln)
- [ ] Responsive Design: Media Queries für 320px, 768px, 1024px, 1440px
- [ ] Kein `!important`-Missbrauch
- [ ] CSS Custom Properties (`--var`) alle definiert
- [ ] Keine hartcodierten Farben außerhalb des Design Systems
- [ ] `font-display: swap` bei Webfonts
- [ ] Kein Layout-Shift (CLS) durch fehlende Breiten/Höhen
- [ ] Dark/Light Mode Konsistenz prüfen
- [ ] Print-Stylesheet vorhanden oder `@media print` Regeln

**Dateien:** `public/assets/css/style.css`, `public/assets/css/hero-enhancements.css`, `public/assets/css/sections/*.css`

### 1.3 JavaScript-Analyse
- [ ] Keine `var`-Deklarationen (nur `const`/`let`)
- [ ] Keine globalen Variablen (alles in IIFE oder Modulen gekapselt)
- [ ] Kein `eval()`, `innerHTML` mit User-Input, `document.write()`
- [ ] Alle `fetch()`-Aufrufe haben Error-Handling (`.catch()` oder `try/catch`)
- [ ] Keine Console-Logs in Produktion (nur `console.error`/`console.warn` für echte Fehler)
- [ ] Event-Listener: keine Memory Leaks (removeEventListener bei Cleanup)
- [ ] Keine Race Conditions bei async Operationen
- [ ] Strict Mode (`'use strict'`) aktiviert
- [ ] Keine hartcodierten URLs (Base-URL dynamisch)
- [ ] Template Literals sicher (kein XSS durch String-Injection)
- [ ] Keine sensiblen Daten in Client-Side JS

**Dateien:** `public/assets/js/*.js`, `public/assets/js/sections/*.js`, `public/assets/js/utils/*.js`

### 1.4 Serverless Functions Analyse
- [ ] Input-Validierung: alle Body-Parameter validiert und sanitisiert
- [ ] Email-Regex robust genug (keine ReDoS-Anfälligkeit)
- [ ] Rate Limiting vorhanden oder via Vercel konfiguriert
- [ ] Keine Secrets im Code (nur `process.env`)
- [ ] Error-Responses leaken keine internen Details (Stack Traces, Pfade)
- [ ] CORS korrekt konfiguriert (nur erlaubte Origins)
- [ ] HTTP-Methoden korrekt eingeschränkt (nur POST erlaubt)
- [ ] Request-Body-Größe begrenzt
- [ ] Timeout-Handling für externe API-Calls (Brevo)
- [ ] Idempotenz: Doppelte Requests verursachen keine Probleme

**Dateien:** `api/newsletter.js`, `api/whitepaper.js`

---

## ═══════════════════════════════════════════════════════════════
## PHASE 2 – SICHERHEITS-AUDIT (Security Hardening)
## ═══════════════════════════════════════════════════════════════

### 2.1 HTTP Security Headers (vercel.json)
Prüfe und härte alle Header in `vercel.json`:

- [ ] **Content-Security-Policy:** 
  - `default-src 'self'` als Basis
  - `script-src` – kein `'unsafe-eval'`, minimales `'unsafe-inline'`
  - `style-src` – nur benötigte CDN-Domains
  - `img-src` – kein Wildcard `*`
  - `connect-src` – nur eigene Domain + Brevo API
  - `frame-ancestors 'none'` (Clickjacking-Schutz)
  - `base-uri 'self'`
  - `form-action 'self'`
  - `upgrade-insecure-requests` hinzufügen
  - Alle externen Domains in CSP tatsächlich benötigt?

- [ ] **X-Frame-Options:** `DENY` ✓
- [ ] **X-Content-Type-Options:** `nosniff` ✓
- [ ] **Referrer-Policy:** `strict-origin-when-cross-origin` ✓
- [ ] **Permissions-Policy:** Alle unnötigen APIs deaktiviert
- [ ] **Strict-Transport-Security:** `max-age=63072000; includeSubDomains; preload` ✓
- [ ] **X-XSS-Protection:** `0` (CSP ist besser, aber Header setzen)
- [ ] **Cross-Origin-Opener-Policy:** `same-origin`
- [ ] **Cross-Origin-Resource-Policy:** `same-origin`
- [ ] **Cross-Origin-Embedder-Policy:** prüfen ob sinnvoll

### 2.2 XSS-Prävention (Cross-Site Scripting)
Prüfe JEDEN Punkt, an dem User-Input verarbeitet wird:

- [ ] Newsletter-Formular: Email-Input wird sanitisiert
- [ ] Whitepaper-Formular: Name, Email, Company – alle sanitisiert
- [ ] Quiz-Formular: Radio-Button-Werte manipulierbar?
- [ ] Kontaktformular (falls vorhanden): alle Felder
- [ ] URL-Parameter: Werden `window.location.search` / Hash-Fragmente irgendwo ausgelesen und in DOM eingefügt?
- [ ] `innerHTML`/`outerHTML` Verwendung: Wird User-Input eingefügt?
- [ ] `document.createElement` + `textContent` statt `innerHTML`
- [ ] DOM-basiertes XSS: `location.href`, `location.hash`, `document.referrer`

### 2.3 CSRF-Schutz (Cross-Site Request Forgery)
- [ ] API-Endpoints: Origin-Header validieren
- [ ] CORS restricted auf `https://neuratex.de`
- [ ] Keine GET-Requests für state-changing Operations
- [ ] SameSite Cookie-Attribute gesetzt (Cookie Consent)
- [ ] Überprüfen: Kann ein externer Angreifer POST an `/api/newsletter` senden?

### 2.4 Injection-Angriffe
- [ ] API: JSON-Body wird korrekt geparst (kein String-Concatenation)
- [ ] Keine SQL/NoSQL-Injection (kein direkter DB-Zugriff, aber Brevo API-Payloads prüfen)
- [ ] Header-Injection: Werden User-Inputs in Response-Headers geschrieben?
- [ ] Email-Header-Injection: CRLF-Zeichen in Email-Adressen gefiltert?
- [ ] Prototype Pollution: `Object.assign`, `{...spread}` mit User-Input?

### 2.5 Information Disclosure
- [ ] `robots.txt` – keine sensiblen Pfade exponiert
- [ ] `sitemap.xml` – nur öffentliche Seiten
- [ ] `.git/` nicht über Web erreichbar (Vercel blockt das default)
- [ ] Keine Source Maps in Produktion
- [ ] Keine Stack Traces in Error Responses
- [ ] Server-Header: Keine Versionsinfos (Vercel entfernt default)
- [ ] `data/`-Ordner: Ist er wirklich nicht deployed? (in `.gitignore`?)
- [ ] `documents/`-Ordner: Nicht im `public/`-Ordner, also nicht deployed ✓
- [ ] `server.js`, `config.js`, `lib/`: Nicht deployed (außerhalb `public/`) ✓
- [ ] Error-Messages an User: Keine internen Details

### 2.6 Dependency Security
- [ ] `package.json`: Keine unnötigen Dependencies
- [ ] Keine `node_modules` committed
- [ ] CDN-Links: Integrity-Hashes (`integrity="sha384-..."`) vorhanden?
- [ ] CDN-Fallback: Was passiert wenn CDN down ist?
- [ ] Externe Scripts: Alle über HTTPS geladen?
- [ ] Subresource Integrity (SRI) für alle externen JS/CSS

### 2.7 API-Sicherheit
- [ ] Rate Limiting (Brevo hat eigenes, aber Vercel-Side auch?)
- [ ] Request-Größe: Verhindert Denial-of-Service durch riesige Payloads
- [ ] Input-Länge begrenzt (Name: 120 Zeichen ✓, Company: 140 Zeichen ✓)
- [ ] Email-Validierung: Sowohl Client- als auch Server-seitig
- [ ] API-Key Rotation: Dokumentiert wie/wann Keys rotiert werden
- [ ] Error Codes: Einheitlich und nicht zu detailliert
- [ ] Keine API-Keys im Frontend-Code

---

## ═══════════════════════════════════════════════════════════════
## PHASE 3 – FUNKTIONALES DEBUGGING
## ═══════════════════════════════════════════════════════════════

### 3.1 Navigation & Routing
- [ ] Alle internen Links funktionieren (keine 404er)
- [ ] Alle externen Links funktionieren und öffnen in neuem Tab
- [ ] Trailing-Slash-Konsistenz (mit oder ohne, nicht gemischt)
- [ ] Canonical URLs korrekt gesetzt
- [ ] 404-Seite konfiguriert?
- [ ] Back-Button Verhalten korrekt
- [ ] Anchor-Links (#) scrollen zur richtigen Position
- [ ] Navigation: Active State korrekt auf jeder Seite

### 3.2 Formulare Durchspielen (Happy Path + Edge Cases)

**Newsletter-Formular:**
- [ ] Gültige Email → Erfolg
- [ ] Leeres Feld → Client-seitige Fehlermeldung
- [ ] Ungültige Email → Client + Server Fehler
- [ ] Doppel-Anmeldung → Freundliche Meldung
- [ ] Email mit Sonderzeichen: `test+tag@domain.com`
- [ ] Email mit Umlaut: `müller@example.de`
- [ ] Sehr lange Email (254 Zeichen)
- [ ] Button-Doppelklick → Kein doppelter Request
- [ ] Netzwerk-Fehler simulieren → Fehlermeldung
- [ ] Submit während Ladevorgang → Button disabled

**Whitepaper-Formular:**
- [ ] Alle Pflichtfelder ausgefüllt → Erfolg + PDF-Download startet
- [ ] PDF-Datei existiert unter dem korrekten Pfad
- [ ] Name mit Sonderzeichen: `O'Brien`, `Müller-Schmidt`
- [ ] XSS im Name-Feld: `<script>alert(1)</script>`
- [ ] SQL Injection im Company-Feld: `'; DROP TABLE--`
- [ ] Leere optionale Felder → Funktioniert
- [ ] Datenschutz-Checkbox nicht angehakt → Blockiert
- [ ] Button-Feedback: "Wird gesendet..." während Request

**Quiz (Reifegrad-Check):**
- [ ] Alle 17 Fragen durchspielbar
- [ ] Frage-Navigation: Vorwärts korrekt
- [ ] Counter zeigt korrekte Frage-Nummer
- [ ] Submit erst möglich wenn alle Fragen beantwortet
- [ ] Ergebnisberechnung mathematisch korrekt
- [ ] Alle 4 Ergebnis-Level erreichbar
- [ ] Radio-Button Manipulation (DevTools): Wird Server-seitig abgefangen?
- [ ] Quiz-Reset: Nochmal machen funktioniert

### 3.3 Cookie Consent
- [ ] Banner erscheint beim Erstbesuch
- [ ] "Alle akzeptieren" → Analytics-Tracking lädt
- [ ] "Nur notwendige" → Kein Tracking geladen
- [ ] Einstellungen ändern → Tracking wird entfernt/hinzugefügt
- [ ] Cookie-Banner-Interaktion wird gespeichert (kein Banner bei Reload)
- [ ] Cookie-Einstellungen können nachträglich geändert werden
- [ ] Leadsy-Tracking nur nach Consent geladen
- [ ] Keine Cookies vor Consent gesetzt (außer necessary)
- [ ] Cookie-Ablaufzeiten korrekt

### 3.4 Responsive Design & Cross-Browser
- [ ] iPhone SE (320px)
- [ ] iPhone 12/13 (390px)
- [ ] iPad (768px)
- [ ] iPad Pro (1024px)
- [ ] Laptop (1366px)
- [ ] Desktop (1920px)
- [ ] Ultra-Wide (2560px)
- [ ] Portrait UND Landscape testen
- [ ] Kein horizontaler Scroll
- [ ] Touch-Targets mindestens 44x44px
- [ ] Font-Lesbarkeit auf allen Größen
- [ ] Bilder skalieren korrekt
- [ ] Browser: Chrome, Firefox, Safari, Edge
- [ ] Mobilgeräte: iOS Safari, Android Chrome

---

## ═══════════════════════════════════════════════════════════════
## PHASE 4 – PERFORMANCE & SEO
## ═══════════════════════════════════════════════════════════════

### 4.1 Ladezeit-Optimierung
- [ ] Bilder: Alle in WebP/AVIF + Fallback
- [ ] Bilder: `width` und `height` Attribute für CLS-Vermeidung
- [ ] Bilder: `loading="lazy"` für Below-the-Fold
- [ ] CSS: Critical CSS inline, Rest deferred
- [ ] JS: `defer` oder `async` bei Script-Tags
- [ ] Font-Loading: `font-display: swap`
- [ ] Keine Render-Blocking Resources
- [ ] Gzip/Brotli-Komprimierung (Vercel macht das automatisch)
- [ ] Cache-Header für statische Assets korrekt?
- [ ] Keine unnötig großen Dateien

### 4.2 Core Web Vitals
- [ ] **LCP** (Largest Contentful Paint) < 2.5s
- [ ] **FID/INP** (Interaction to Next Paint) < 200ms
- [ ] **CLS** (Cumulative Layout Shift) < 0.1
- [ ] TTFB (Time to First Byte) < 800ms
- [ ] FCP (First Contentful Paint) < 1.8s

### 4.3 SEO-Check
- [ ] `<title>` auf jeder Seite einzigartig und beschreibend
- [ ] `<meta name="description">` auf jeder Seite
- [ ] Open Graph Tags (`og:title`, `og:description`, `og:image`)
- [ ] `<link rel="canonical">` gesetzt
- [ ] `robots.txt` erlaubt Crawling
- [ ] `sitemap.xml` aktuell und korrekt
- [ ] Structured Data (JSON-LD) für Local Business
- [ ] Heading-Hierarchie: Ein `<h1>` pro Seite, korrekte H2-H6 Reihenfolge
- [ ] Alt-Texte für SEO-relevante Bilder
- [ ] Interne Verlinkung logisch

---

## ═══════════════════════════════════════════════════════════════
## PHASE 5 – UNKONVENTIONELLE TESTS (Chaos Engineering Light)
## ═══════════════════════════════════════════════════════════════

### 5.1 Affentest (Monkey Testing)
- [ ] Zufällig auf alles klicken – stürzt nichts ab?
- [ ] Tab-Taste durch die ganze Seite drücken – Fokus-Reihenfolge logisch?
- [ ] Alle Formulare extrem schnell submitten
- [ ] Seite während Ladevorgang navigieren – Fehler?
- [ ] JavaScript deaktivieren – Seite trotzdem nutzbar (Graceful Degradation)?
- [ ] CSS deaktivieren – Inhalt trotzdem lesbar?

### 5.2 Edge-Case-Inputs
- [ ] Leere Strings an alle Formulare: `""`, `"   "`
- [ ] Unicode-Bomben: `‮` (Right-to-Left Override)
- [ ] Emoji in Formularfeldern: `🎉@email.com`
- [ ] Null-Bytes: `\x00` in Inputs
- [ ] 10.000 Zeichen in jedes Feld
- [ ] HTML-Tags in Klartext-Feldern: `<b>test</b>`
- [ ] JavaScript-URIs: `javascript:alert(1)` in Inputs
- [ ] SQL-Fragments: `' OR 1=1 --`, `'; DROP TABLE`
- [ ] CRLF-Injection: `%0d%0a` in Email
- [ ] Homograph-Angriff: `nеuratex.de` (kyrillisches 'е')

### 5.3 Netzwerk-Stress
- [ ] Extrem langsames Netzwerk (3G) – Timeout-Handling?
- [ ] Netzwerk komplett offline – Fehlermeldung statt Absturz?
- [ ] Request-Abbruch mitten im Fetch – Memory Leaks?
- [ ] CORS-Fehler simulieren – Fehlermeldung verständlich?
- [ ] API-Server nicht erreichbar – Graceful Fallback?
- [ ] Brevo API gibt 500er → Wie reagiert die Seite?
- [ ] Brevo API gibt 429 (Rate Limit) → Wie reagiert die Seite?

### 5.4 Browser-Manipulation (DevTools Attacks)
- [ ] `localStorage` / `sessionStorage` manuell manipulieren – Absturz?
- [ ] Cookie-Consent Cookie löschen → Banner erscheint wieder?
- [ ] JavaScript Console: Globale Funktionen aufrufbar? (sollten gekapselt sein)
- [ ] Netzwerk-Tab: API-Requests replizierbar via `fetch()` in Console?
- [ ] DOM manipulieren → Hidden Buttons/Formulare sichtbar machen → Gefahr?
- [ ] `disabled`-Attribute von Inputs entfernen → Validation umgehbar?
- [ ] Quiz-Antworten via DOM-Inspektion sichtbar? (nicht sicherheitskritisch, aber Qualität)

### 5.5 Concurrency & Timing
- [ ] Formular doppelt submitten (Doppelklick) – doppelter API-Call?
- [ ] Zwei Tabs: Gleiche Email gleichzeitig anmelden – Race Condition?
- [ ] Browser Back-Button nach Formular-Submit – Re-Submit?
- [ ] Seite während Quiz schließen und wiederkommen – State verloren?

### 5.6 Automatisiertes Abuse-Testing
Simuliere einen Angreifer:
```bash
# Massenhafte Newsletter-Anmeldung (Rate Limiting Test)
for i in $(seq 1 100); do
  curl -X POST https://neuratex.de/api/newsletter \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"test${i}@attacker.com\"}"
  sleep 0.1
done

# Überlanger Body
curl -X POST https://neuratex.de/api/newsletter \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$(python3 -c "print('A'*100000)")@test.com\"}"

# Fehlende Content-Type
curl -X POST https://neuratex.de/api/newsletter \
  -d "email=test@example.com"

# Ungültiger JSON
curl -X POST https://neuratex.de/api/newsletter \
  -H "Content-Type: application/json" \
  -d "INVALID JSON{{{}"

# Origin-Spoofing
curl -X POST https://neuratex.de/api/newsletter \
  -H "Content-Type: application/json" \
  -H "Origin: https://evil-site.com" \
  -d "{\"email\": \"test@example.com\"}"
```

### 5.7 Datei- & Pfad-Sicherheit
- [ ] `https://neuratex.de/.git/` → 404/403?
- [ ] `https://neuratex.de/.env` → 404/403?
- [ ] `https://neuratex.de/api/` ohne Route → Kein Directory Listing?
- [ ] `https://neuratex.de/server.js` → Nicht ausgeliefert?
- [ ] `https://neuratex.de/../etc/passwd` → Path Traversal geblockt?
- [ ] `https://neuratex.de/data/` → Nicht erreichbar?
- [ ] `https://neuratex.de/assets/js/main.js` → Keine sensiblen Daten?
- [ ] Direkte PDF-URL ohne Formular → Akzeptables Verhalten?

### 5.8 DNS & Infrastruktur
- [ ] DNS-Einträge korrekt (CNAME/A-Record → Vercel)
- [ ] SSL-Zertifikat gültig und auto-renew aktiv
- [ ] HSTS Preload Liste → Domain submitted?
- [ ] Email SPF/DKIM/DMARC Records (für Brevo Newsletter)
- [ ] Keine offenen Ports/Services (Vercel managed)
- [ ] Vercel Build-Logs: Keine Secrets geloggt

---

## ═══════════════════════════════════════════════════════════════
## PHASE 6 – BARRIEREFREIHEIT (Accessibility a11y)
## ═══════════════════════════════════════════════════════════════

- [ ] WCAG 2.1 AA Konformität
- [ ] Keyboard-Navigation: Alle interaktiven Elemente erreichbar
- [ ] Focus-Indicator sichtbar (`:focus-visible`)
- [ ] Skip-Navigation-Link vorhanden
- [ ] Screen Reader: `aria-labels`, `aria-live`, `role`-Attribute korrekt
- [ ] Farbkontrast: Mindestens 4.5:1 für Text, 3:1 für große Texte
- [ ] Keine Informationen nur über Farbe vermittelt
- [ ] Formulare: Fehlermeldungen programmatisch verknüpft
- [ ] Bilder: Dekorative Bilder mit `alt=""`, informative mit beschreibendem Alt
- [ ] Motion: `prefers-reduced-motion` Media Query für Animationen
- [ ] Zoom: Seite nutzbar bei 200% Zoom
- [ ] Touch-Targets: Mindestens 44x44px auf Mobile

---

## ═══════════════════════════════════════════════════════════════
## PHASE 7 – RECHTLICHE COMPLIANCE (DSGVO / TDDDG)
## ═══════════════════════════════════════════════════════════════

- [ ] Impressum vorhanden und vollständig (§5 TMG / DDG)
- [ ] Datenschutzerklärung vorhanden und aktuell
- [ ] Cookie-Banner TDDDG-konform (Opt-In für nicht-notwendige Cookies)
- [ ] Newsletter: Double Opt-In Prozess (Brevo übernimmt dies)
- [ ] Kein Tracking VOR Cookie-Consent
- [ ] Alle Third-Party-Dienste in Datenschutz dokumentiert
- [ ] Auftragsverarbeitungsvertrag (AVV) mit Brevo vorhanden
- [ ] Formular-Pflichtfelder klar gekennzeichnet
- [ ] Widerspruchsmöglichkeit dokumentiert
- [ ] Datenverarbeitungs-Verzeichnis aktuell
- [ ] Links zur Datenschutzerklärung von allen Formularen erreichbar
- [ ] "Rechte der Betroffenen" Abschnitt vollständig

---

## ═══════════════════════════════════════════════════════════════
## PHASE 8 – DEPLOYMENT & MONITORING
## ═══════════════════════════════════════════════════════════════

### 8.1 Vercel-Konfiguration
- [ ] Build-Einstellungen korrekt (`outputDirectory: "public"`)
- [ ] Serverless Functions im `api/`-Ordner werden erkannt
- [ ] Environment Variables korrekt gesetzt (nie im Code!)
- [ ] Preview-Deployments funktionieren
- [ ] Production Branch = `main`
- [ ] Auto-Deploy aktiviert
- [ ] Custom Domain korrekt konfiguriert

### 8.2 Post-Deployment Checks
- [ ] Alle Seiten erreichbar (HTTP 200)
- [ ] Alle API-Endpoints erreichbar
- [ ] SSL-Zertifikat gültig
- [ ] Security Headers live prüfen: `curl -I https://neuratex.de`
- [ ] Google Search Console: Keine Crawl-Errors
- [ ] PageSpeed Insights: Score > 90 für alle Seiten

### 8.3 Monitoring & Alerting
- [ ] Vercel Analytics aktiviert?
- [ ] Error-Logging in Serverless Functions aktiv
- [ ] Uptime-Monitoring eingerichtet? (z.B. UptimeRobot, kostenlos)
- [ ] Brevo-Webhook für Bounces konfiguriert?

---

## ═══════════════════════════════════════════════════════════════
## PHASE 9 – ABSCHLUSS & DOKUMENTATION
## ═══════════════════════════════════════════════════════════════

### 9.1 Audit-Report erstellen
Für jeden gefundenen Issue:
```
| # | Severity | Kategorie | Beschreibung | Datei:Zeile | Status |
|---|----------|-----------|--------------|-------------|--------|
| 1 | CRITICAL | Security  | ...          | api/x.js:42 | FIXED  |
| 2 | HIGH     | Bug       | ...          | index.html  | FIXED  |
| 3 | MEDIUM   | A11y      | ...          | style.css   | OPEN   |
| 4 | LOW      | Perf      | ...          | main.js:100 | WONTFIX|
```

**Severity-Stufen:**
- **CRITICAL** → Sicherheitslücke, sofort fixen
- **HIGH** → Funktionaler Bug, User-Impact
- **MEDIUM** → Accessibility, Performance, Best Practice
- **LOW** → Kosmetisch, Nice-to-Have
- **INFO** → Beobachtung, kein Handlungsbedarf

### 9.2 Fixes committen
```bash
# Für jeden Fix einzeln:
git add [betroffene Dateien]
git commit -m "fix(security): [Beschreibung] – Audit #[Nummer]"

# Am Ende: PR erstellen
git push origin audit/fort-knox-DATUM
# PR auf main erstellen mit Audit-Report als Beschreibung
```

### 9.3 Verifikation nach Fixes
- [ ] Alle Tests aus Phase 3 nochmal durchlaufen
- [ ] Security Headers live prüfen nach Deploy
- [ ] Abuse-Tests wiederholen
- [ ] Formular-Tests wiederholen
- [ ] Accessibility-Tests wiederholen

### 9.4 Regelmäßige Wiederholung
- **Monatlich:** Phase 2 (Security Headers), Phase 5.6 (Abuse Tests)
- **Quartalsweise:** Vollständiger Audit (alle Phasen)
- **Bei jedem Deployment:** Phase 8.2 (Post-Deployment Checks)
- **Bei Code-Änderungen:** Phase 1 + Phase 3 für betroffene Bereiche

---

## ═══════════════════════════════════════════════════════════════
## SCHNELL-REFERENZ: TOOLS & BEFEHLE
## ═══════════════════════════════════════════════════════════════

```bash
# Security Headers Online prüfen
# → https://securityheaders.com/?q=neuratex.de

# SSL-Check
# → https://www.ssllabs.com/ssltest/analyze.html?d=neuratex.de

# CSP Evaluator
# → https://csp-evaluator.withgoogle.com/

# PageSpeed
# → https://pagespeed.web.dev/analysis?url=https://neuratex.de

# WAVE Accessibility
# → https://wave.webaim.org/report#/https://neuratex.de

# W3C HTML Validator
# → https://validator.w3.org/nu/?doc=https://neuratex.de

# Mozilla Observatory
# → https://observatory.mozilla.org/analyze/neuratex.de

# Lighthouse (lokal)
npx lighthouse https://neuratex.de --output html --output-path report.html

# Local Security Headers Check
curl -I https://neuratex.de 2>&1 | grep -iE "content-security|x-frame|x-content|strict-transport|referrer-policy|permissions-policy"

# OWASP ZAP Quick Scan (wenn installiert)
zap-cli quick-scan --self-contained -r https://neuratex.de
```

---

> **⚠️ WICHTIG:** Dieser Prompt ist als CHECKLISTE gedacht. Arbeite Phase für Phase ab.
> Überspringe KEINE Phase. Dokumentiere JEDEN Fund. Committe JEDEN Fix einzeln.
> Die Website soll danach so sicher sein, dass ein Penetration-Tester leer ausgeht.
