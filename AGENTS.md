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
- **Icons:** Font Awesome 6.5
- **Cookie Consent:** orestbida/cookieconsent v3

## Code-Konventionen

- Keine unnötigen npm-Abhängigkeiten hinzufügen
- Kein TypeScript, kein Bundler (die Seite ist bewusst simpel gehalten)
- Inline-Styles nur wo nötig, bevorzugt CSS-Klassen
- Barrierefreiheit beachten: `alt`-Attribute, `aria`-Labels, Fokus-Management
- Deutsche Texte auf der Website, Code-Kommentare Deutsch oder Englisch

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
