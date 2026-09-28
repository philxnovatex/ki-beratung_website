# Kontaktformular und Conversion-Tracking

Umgesetzt auf `fix/audit-paket-4`, noch nicht veröffentlicht.

## Kontaktanfragen

`public/pages/kontakt.html` sendet an `POST /api/contact`. Name, E-Mail,
Nachricht und Datenschutzbestätigung sind Pflicht, Unternehmen ist optional.
Der Endpunkt übernimmt die gemeinsame Origin-Prüfung, das Rate-Limit und
den Brevo-Timeout aus `api/_shared/security.js`. Zusätzlich prüft er Feldtypen,
Längen, Datenschutzbestätigung und ein unsichtbares Spam-Feld.

### Pilotbuchung der Landingpage

`public/pages/ki-sichtbarkeit.html` nutzt denselben Endpunkt und dasselbe
Skript (`contact.js`). Der Besucher bucht dort ohne Vorgespräch verbindlich
einen Pilotplatz. Statt einer Nachricht sendet das Formular die Website des
Kunden im Feld `domain`. Ist `domain` gefüllt, behandelt der Server die Anfrage
als Pilotbuchung.

Pflichtfelder der Buchung (Server und Markup):

| Feld | Inhalt | Grenze |
|---|---|---|
| `name`, `email` | wie Kontaktformular | 120 / E-Mail-Prüfung |
| `domain` | Website-Adresse | 200, einzeilig |
| `leistungen` | welche Leistungen untersucht werden | 600, einzeilig |
| `kunden` | für welche Kunden | 300, einzeilig |
| `markt` | Auswahl `Deutschland`, `DACH` oder `Region` | nur diese Werte |
| `region` | nur Pflicht bei `markt=Region`, mit JavaScript sonst ausgeblendet | 120, einzeilig |
| `company` | Unternehmen, erste Zeile der Rechnungsanschrift | 140, einzeilig |
| `strasse`, `plz`, `ort` | Rechnungsanschrift | 120 / 3 bis 10 Zeichen / 80 |
| `bestaetigung` | Buchung als Unternehmen und Einverständnis zu Referenz und Fallstudie nach Freigabe, ein Häkchen | Checkbox |

Optional: `wettbewerber` (600, mehrzeilig, im Formular zugeklappt). Der
Datenschutz ist bei der Buchung ein Hinweis mit Link, kein Häkchen: Die
Verarbeitung dient der Vertragsanbahnung (Art. 6 Abs. 1 lit. b DSGVO), eine
Einwilligung ist nicht nötig. `privacy` bleibt nur für die Kontaktseite
Pflicht. Eine USt-IdNr. wird nicht abgefragt, weil Neuratex AI als
Kleinunternehmer (§ 19 UStG) abrechnet. Checkboxen kommen per JSON als
`true`, ohne JavaScript als `on`.

Ablauf im Server:

1. Mail an `CONTACT_RECIPIENT_EMAIL` mit Betreff „Neue Pilotbuchung AI
   Visibility Audit: <Unternehmen>“ und allen Angaben. Antwortadresse ist
   der Kunde. Scheitert diese Mail, scheitert die Buchung (502).
2. Danach eine feste Eingangsbestätigung an den Kunden, Antwortadresse ist
   `CONTACT_RECIPIENT_EMAIL`. Sie enthält bewusst keine Formularinhalte,
   damit niemand über das Formular eigenen Text an fremde Adressen schicken
   kann. Zeitlimit 4 Sekunden, damit beide Aufrufe unter den 15 Sekunden des
   Browsers bleiben. Scheitert sie, bleibt die Buchungsanfrage eingegangen. Die Meldung auf
   der Seite verspricht dann keine Bestätigungsmail, und im Vercel-Log steht
   `[contact] Eingangsbestätigung ...`.

Der Vertrag kommt erst mit der Auftragsbestätigung zustande, die Philipp
manuell per E-Mail schickt (Vorlage außerhalb des Repos). So lassen sich
ungeeignete Buchungen und Überbuchungen ablehnen. Den Platzstatus
(„Drei Plätze verfügbar“) nach jeder bestätigten Buchung von Hand anpassen,
siehe Kommentar `PLATZSTATUS` im HTML.

- `domain` heißt bewusst nicht `website`: `website` ist die Spamfalle und
  bleibt unverändert.
- `herkunft` ist ein verborgenes Feld. `contact.js` füllt es mit den
  UTM-Parametern des aktuellen Aufrufs (`utm_source`, `utm_medium`,
  `utm_campaign`, `utm_content`, `utm_term`), hilfsweise mit der verweisenden
  Domain. Bewusst ohne `sessionStorage`: Speichern auf dem Endgerät für die
  Kampagnenauswertung wäre nach § 25 TDDDG einwilligungspflichtig. Der Server
  übernimmt die Werte bereinigt und gekürzt als Zeile „Herkunft“ in die Mail.
  Eine fehlende oder unbrauchbare Herkunft weist keine Buchung ab.
- Ohne JavaScript bleibt `herkunft` leer, die Buchung kommt trotzdem an.
- Anzeigen müssen UTM-Parameter tragen, sonst steht in der Mail nur
  „direkt oder unbekannt“ oder die verweisende Domain. ChatGPT hängt an
  organische Links selbst `utm_source=chatgpt.com` an. Bezahlte Anzeigen
  deshalb mit `utm_source=chatgpt&utm_medium=paid` kennzeichnen.
- `robots.txt` erlaubt `OAI-AdsBot` ausdrücklich. OpenAI lehnt Anzeigen ab,
  deren Zielseite der Crawler nicht lesen darf.

Die vollständige Nachricht wird als Klartext über Brevos Transaktionsmail-API
an `philippkoch@neuratex.de` übergeben. Die Antwortadresse ist die E-Mail-Adresse
des Anfragenden. Eine Newsletter-Anmeldung findet dabei nicht statt.
Erfolg bedeutet, dass Brevo den Versandauftrag angenommen hat, nicht dass die
E-Mail nachweislich im Posteingang liegt. Providerfehler werden als Fehler angezeigt.
Bei Netzwerkfehlern oder Timeouts kann der Versandstatus unklar sein; deshalb
wird nicht automatisch erneut versendet. Eingaben bleiben im Browser erhalten.

| Vercel-Variable | Verwendung |
|---|---|
| `BREVO_API_KEY` | Bestehender API-Key, muss Transaktionsmails erlauben |
| `BREVO_CONTACT_SENDER_EMAIL` | Optionaler verifizierter Brevo-Absender; Standard `philippkoch@neuratex.de` |
| `CONTACT_RECIPIENT_EMAIL` | Optionaler Empfänger; Standard `philippkoch@neuratex.de` |

Vor Freischaltung muss der gewählte Absender in Brevo verifiziert und der
Transaktionsversand im Konto aktiviert sein. Es sind keine neuen Listen oder
Kontaktattribute nötig. Die Kontokonfiguration und echte Zustellung wurden lokal
nicht überprüft. Secrets ausschließlich im Vercel-Dashboard hinterlegen.

Ohne JavaScript sendet das Formular als normaler HTML-POST und erhält eine
eigenständige Bestätigungs- oder Fehlerseite. In diesem Fall gibt es kein
browserseitiges Conversion-Event. Das Rate-Limit gilt wie bei den vorhandenen
Endpunkten pro warmer Serverless-Instanz und ist kein globales Bot-Limit.

## Umami-Events

| Event | Daten | Auslöser |
|---|---|---|
| `calendly_click` | `location` | Klick auf einen Calendly-Link, einschließlich Tastaturaktivierung |
| `form_complete` | `form: contact` | Brevo hat die Kontaktmail angenommen |
| `form_complete` | `form: pilot` | Brevo hat die Pilotbuchung der Landingpage angenommen (Mail an uns) |
| `form_start` | `form: pilot` | Erste Eingabe ins Buchungsformular, einmal pro Seitenaufruf. Zusammen mit `form_complete` ergibt das die Abbruchquote |
| `form_complete` | `form: quiz_lead` | Quiz-Kontakt erfolgreich erfasst |
| `form_complete` | `form: whitepaper` | Whitepaper-Anfrage erfolgreich erfasst |
| `form_complete` | `form: newsletter` | Newsletter-Endpunkt bestätigt die Anmeldung, auch bei bereits vorhandenem Kontakt |
| `quiz_complete` | keine | Alle 17 Fragen beantwortet und Auswertung berechnet, einmal pro Seitenaufruf |

`location` unterscheidet `home_hero`, `home_case_study`, `home_demo`,
`quiz_level_1`, `quiz_level_2`, `quiz_level_3`, `home_final`, `contact_calendar`
und `services_final`. Die URL erfasst Umami mit seinem vorhandenen Tracker.
Diese Werte bleiben bei Textänderungen der Buttons stabil.

Im Umami-Dashboard für neuratex.de unter Events nach diesen Namen filtern.
Bei `form_complete` nach `form`, bei `calendly_click` nach `location` aufschlüsseln.
Ein Calendly-Klick misst den Wechsel zum Kalender, keine abgeschlossene Buchung.
Quiz-Abschluss und anschließende Kontakterfassung werden getrennt gezählt.

Es werden keine Namen, E-Mail-Adressen, Unternehmen, Nachrichten, einzelnen
Quiz-Antworten oder Scores als Event-Daten gesendet. Das bestehende DNT-Verhalten
bleibt erhalten. Bei fehlendem, blockiertem oder fehlerhaftem Tracker funktioniert
die Website weiter; solche Aufrufe erscheinen nicht in Umami. Ereignisse werden
nicht lokal gespeichert oder nachträglich in eine Warteschlange aufgenommen.

API-Grundlagen: [Umami Tracker Functions](https://docs.umami.is/docs/tracker-functions),
[Brevo Transaktionsmail](https://developers.brevo.com/reference/send-transac-email).

## Prüfen

1. `npx serve public -l 4173`
2. In einem zweiten Terminal `npm test`

Die Tests prüfen zusätzlich den Endpunkt mit einem simulierten Brevo-Dienst,
Formularvalidierung, Erfolgs- und Fehlerfälle, Mehrfachabsenden, normale HTML-POSTs,
Event-Daten und das Layout bei 390, 768 und 1440 Pixeln. Die neuen Conversion-Tests
verwenden einen Umami-Stub und senden weder echte E-Mails noch Events an Umami.
Screenshots liegen lokal unter `.cache/contact-qa/`.

Der statische `serve`-Server führt keine Vercel Functions aus. Deshalb simulieren
die Browserprüfungen die API-Antworten; der echte Handler wird zusätzlich direkt
getestet. Ein echter Versandtest auf Vercel bleibt vor der Freischaltung erforderlich.
Die gemeinsame Origin-Prüfung erlaubt die beiden Produktionsdomains und bestehende
lokale Entwicklungsadressen. Vercel-Preview-Domains sind nicht pauschal freigegeben.
