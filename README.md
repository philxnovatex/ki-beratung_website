# Neuratex AI – KI-Beratungs-Website

> Planbarer KI-Erfolg statt teurer Experimente.  
> Chatbots, Voicebots & KI-Agenten für den Mittelstand.

**Live:** [https://neuratex.de](https://neuratex.de)

---

## Architektur

| Komponente | Technologie |
|---|---|
| Hosting | **Vercel** (statisch + Serverless Functions) |
| Frontend | Vanilla HTML / CSS / JS |
| Newsletter | Vercel Serverless Function → **Brevo API** |
| Domain | neuratex.de (via Vercel) |

```
├── public/              ← Statische Website (Vercel Output)
│   ├── index.html       ← Startseite
│   ├── pages/           ← Unterseiten (Leistungen, Kontakt, …)
│   └── assets/          ← CSS, JS, Bilder, Icons
├── api/                 ← Vercel Serverless Functions
│   └── newsletter.js    ← Newsletter-Anmeldung (Brevo)
├── vercel.json          ← Vercel-Konfiguration
├── server.js            ← ⚠️ Nur lokaler Dev-Server (nicht Produktion)
├── config.js            ← ⚠️ Nur lokaler Dev-Server
└── documents/           ← Templates, Onepager-Generierung
```

## Lokale Entwicklung

Die Website ist rein statisch. Zum lokalen Testen reicht ein beliebiger HTTP-Server:

```bash
# Option 1: Python
cd public && python -m http.server 3000

# Option 2: Node (npx)
npx serve public

# Option 3: Legacy Dev-Server (Express, nicht für Produktion)
npm install && npm run dev
```

> **Hinweis:** `server.js` / `config.js` sind ein Legacy-Dev-Server und werden auf Vercel **nicht** genutzt. Die Newsletter-Funktion läuft ausschließlich über `api/newsletter.js` (Vercel Serverless Function).

## Newsletter (Brevo)

Die Newsletter-Anmeldung funktioniert über eine Vercel Serverless Function (`api/newsletter.js`), die Kontakte direkt über die Brevo-API zur Liste „Website Leads" hinzufügt.

### Environment Variables (Vercel Dashboard)

| Variable | Beschreibung |
|---|---|
| `BREVO_API_KEY` | Brevo API-Schlüssel (bereits gesetzt) |
| `BREVO_LIST_ID` | Numerische ID der Brevo-Liste (Default: `5`) |

### Ablauf

1. Nutzer gibt E-Mail im Formular ein (Lernplattform-Seite)
2. `POST /api/newsletter` → Vercel Serverless Function
3. Function ruft Brevo API auf → Kontakt wird zur Liste hinzugefügt
4. Nutzer erhält Bestätigung im Browser

## Deployment

Push auf `main` → Vercel deployed automatisch.

- **Preview-Deployments:** Jeder PR bekommt eine eigene Preview-URL
- **Produktion:** Nur Merges in `main` gehen live

## Seiten

| Seite | Pfad |
|---|---|
| Startseite | `/index.html` |
| Leistungen | `/pages/leistungen.html` |
| KI-Anwendungen | `/#ki-anwendungen` |
| Lernplattform | `/pages/lernplattform.html` |
| Kontakt | `/pages/kontakt.html` |
| Impressum | `/pages/legal/impressum.html` |
| Datenschutz | `/pages/legal/datenschutz.html` |

## Sicherheit

- Secrets ausschließlich über **Vercel Environment Variables** (nie im Code!)
- `.env` ist in `.gitignore`
- `data/` ist in `.gitignore` (lokale Dev-Daten)
- Branch Protection für `main` aktivieren (kein direkter Push)

## Lizenz

Proprietär – Neuratex AI. Alle Rechte vorbehalten.
