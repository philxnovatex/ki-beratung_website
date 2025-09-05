Ki‑Beratung Website — Dev helpers
=================================

Kurz: diese Projektkopie enthält kleine Dev‑Hilfen für lokale Tests der Lernplattform, Newsletter Double‑Opt‑In und einen einfachen Admin‑CSV‑Export (Dateibasierte Persistenz). Nicht für Produktion.

Schnellstart (Windows PowerShell):

```powershell
# 1) Node (>=16) und npm installieren falls nicht vorhanden
node -v; npm -v

# 2) Abhängigkeiten installieren
npm install

# 3) Admin token (neu): jetzt wird es automatisch generiert, wenn Sie es nicht setzen.
#    Wenn Sie den Token nicht manuell setzen, lesen Sie weiter bei "Token finden".

# 4) (Optional) SMTP konfigurieren via env vars, sonst wird in dev der Bestätigungslink als JSON zurückgegeben
$env:SMTP_HOST = 'smtp.example'
$env:SMTP_USER = 'user'
$env:SMTP_PASS = 'pass'

# 5) Dev Server starten
npm run dev

# 6) Öffnen: http://localhost:3000/lernplattform.html und http://localhost:3000/admin
```

- Double‑Opt‑In (dev):
- Beim Eintragen wird ein Token erzeugt und per E‑Mail (wenn SMTP konfiguriert) versandt.
- Ohne SMTP wird die API im JSON die Confirm‑URL zurückgeben (nur lokal/dev) — klicken Sie darauf, um die E‑Mail zu bestätigen.

Admin‑Export:
- Standardverhalten: Beim ersten Start erzeugt der Server automatisch einen Admin‑Token und speichert ihn in `data/admin_token.txt`.
- Token finden: Entweder setzen Sie `ADMIN_TOKEN` vor dem Start, oder starten den Server ohne und lesen den Token anschließend in der Konsole oder in der Datei `data/admin_token.txt`.

Beispiel (PowerShell):
```powershell
# 1) Abhängigkeiten installieren
npm install

# 2) Server starten (generiert Token falls nicht gesetzt)
npm run dev

# 3) Nach dem Start: Token in der Konsole suchen oder in data/admin_token.txt lesen
Get-Content .\data\admin_token.txt

# 4) Admin UI: http://localhost:3000/admin — geben Sie den Token ein und klicken Export.
```

Git Commit Hinweis (kurz):
- Erstelle einen Branch: `git checkout -b feat/newsletter-doi`
- Committe kleine Änderungen: `git add . && git commit -m "feat(newsletter): double opt-in + admin export"`
- Push: `git push origin feat/newsletter-doi` und mache ein PR.

Sicherheit & Datenschutz:
- Diese Implementierung ist nur für lokale Tests; vor Live‑Betrieb müssen Sie: HTTPS, DB, Auth für Admin, Consent‑Speicherung, Double‑opt‑in Audit und Löschkonzept implementieren.

Deployment (GitHub Pages):
- Enthalten: Ein GitHub Actions Workflow (`.github/workflows/deploy-pages.yml`) wurde hinzugefügt. Er deployed den Ordner `public/` bei Push auf `main` auf GitHub Pages.
- Schritte zum Live schalten:
	1) Commit & push alle Änderungen auf `main`.
	2) Der Workflow läuft automatisch; nach erfolgreichem Lauf ist die Seite unter `https://<username>.github.io/<repo>` erreichbar.

Wichtig: API‑Funktionen (Double‑Opt‑In, Admin export) benötigen einen laufenden Server. GitHub Pages kann nur statische Dateien hosten. Für funktionale APIs nutze einen separaten Server oder Serverless‑Funktionen (Vercel, Netlify, Railway, etc.).
