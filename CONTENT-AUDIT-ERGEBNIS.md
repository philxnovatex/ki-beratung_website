# CONTENT-AUDIT-ERGEBNIS – Neuratex AI Website

> **Audit-Datum:** 12. März 2026
> **Geprüft von:** KI-Agent (GitHub Copilot)
> **Basis:** Alle HTML-Quelldateien im Repository (public/)
> **Perspektive:** Skeptischer Mittelstands-Geschäftsführer (55 J., wenig KI-Erfahrung, schon von IT-Dienstleistern enttäuscht)

---

## Phase 0: Seiten-Inventar & Status-Quo

| Seite | URL | Primäres Ziel | Haupt-CTA | Zielgruppe |
|---|---|---|---|---|
| Startseite | `/` | Positionierung + Lead-Generierung | „Jetzt kostenlose Potenzial-Analyse buchen" → Calendly | GF, Entscheider, Mittelstand |
| Leistungen | `/pages/leistungen.html` | Leistungsdetails + Lead | „Workshop anfragen" / „Strategiegespräch" / „Potenzial-Analyse buchen" → Calendly / Kontakt | GF, IT-Leiter, HR, Marketing |
| Kontakt | `/pages/kontakt.html` | Kontaktaufnahme | E-Mail + Calendly-Link | Alle Interessenten |
| Lernplattform | `/pages/lernplattform.html` | Lead-Gen + Bildung + Newsletter | Newsletter-Anmeldung + Whitepaper-Download | Entscheider, Wissensinteressierte |
| Datenschutz | `/pages/legal/datenschutz.html` | Rechtspflicht | – | – |
| Impressum | `/pages/legal/impressum.html` | Rechtspflicht | – | – |
| Danke | `/pages/legal/danke.html` | Bestätigung nach Aktion | Zurück zur Startseite / Leistungen | – |

### Befunde

- **Seitenziel klar?** Ja, bei Startseite, Leistungen und Kontakt. Bei der Lernplattform ist das Ziel diffus – sie versucht gleichzeitig Podcast, Glossar, Newsletter, Whitepaper und Neuratex-Prinzip unterzubringen.
- **Fehlende Seiten:**
  - **Referenzen / Case Studies** – kritisch für Vertrauen im Mittelstand
  - **Eigenständige „Über uns"-Seite** – aktuell nur About-Sektion auf der Startseite
  - **FAQ-Seite** – die Lernplattform hat ein Glossar, aber keine echten Entscheider-FAQs („Was kostet das?", „Wie lange dauert ein Projekt?")
  - **Blog / Ratgeber** – fehlt komplett (SEO-Potenzial verschenkt)
- **Redundanzen:** Die 3-Phasen-Methodik (Neuratex Prinzip) erscheint auf der Startseite UND auf der Lernplattform UND auf der Leistungsseite in leicht unterschiedlicher Formulierung → verwirrend.

---

## Phase 1: Zielgruppen-Fit

### 1.1 Sprache & Ansprache

- [x] **Siezen:** Startseite, Leistungen und Kontakt siezen durchgehend. ✅
- [❌] **Lernplattform Glossar duzt durchgehend!** Massive Inkonsistenz. Beispiele:
  - „Denk an ein Kind, das aus Erfahrung lernt" (ML-Erklärung)
  - „Wie bei dir, wenn du im Supermarkt bei der Nudel-Auswahl alles andere ausblendest"
  - „Dein Befehl an die Maschine" (Prompt-Erklärung)
  - „Du gibst der KI Beispiele" (Überwachtes Lernen)
  - „Wenn du für KI bezahlst" (Token-Erklärung)
  - → **Über 40 Stellen mit „du/dein/dir"** im Glossar!
- [❌] **„Mitarbeiter*innen"** wird einmalig auf der Leistungsseite (Workshops) verwendet. Rest der Website nutzt „Mitarbeiter" oder „Teams". Inkonsistenz.
- [⚠️] **Fachjargon:** Begriffe wie „ROI", „MVP", „Use-Case", „RAG" werden auf der Startseite ohne Erklärung verwendet. Für die Zielgruppe (GF mit wenig KI-Erfahrung) teilweise grenzwertig.
- [⚠️] **Tonalität:** Startseite und Leistungen sind professionell. Das Glossar wirkt eher wie ein YouTube-Erklärvideo für Gen Z (Slang wie „labern", „Autocomplete auf Steroiden", „dumm wie Brot").

**Empfehlung:**
> Das gesamte Glossar muss auf „Sie" umgestellt werden. Formulierungen wie „dumm wie Brot" und „labern" sind für Geschäftsführer unpassend. Vergleiche dürfen anschaulich sein, aber die Tonalität muss seriös bleiben.

### 1.2 Schmerzpunkte des Mittelstands

| Schmerzpunkt | Adressiert? | Wo? | Überzeugend? (1-5) |
|---|---|---|---|
| Fachkräftemangel | ✅ | Problem-Sektion, Automatisierung | 4 |
| Steigende Kosten / Effizienzdruck | ✅ | Problem-Sektion, Services | 4 |
| Unsicherheit bei KI-Einführung | ✅ | Hero-Claim, Prinzip-Methodik | 3 – wird adressiert, aber nicht ausreichend mit konkreten Beispielen belegt |
| DSGVO / Compliance-Sorgen | ✅ | Leistungen (Keynote), About, Subtitle | 4 |
| Fehlende interne KI-Kompetenz | ✅ | Workshops, Problem-Sektion | 4 |
| Angst vor Vendor-Lock-in | ✅ | Tech-Sektion (Technologieoffenheit) | 3 |
| Skepsis gegenüber Hype vs. Realität | ✅ | Services „Hype von Realität trennen", About | 4 |
| Demografischer Wandel / Wissensverlust | ✅ | Problem-Sektion (explizit erwähnt) | 3 |
| Wettbewerbsdruck | ✅ | Problem-Sektion „wachsender Wettbewerbsnachteil" | 3 |
| Mangelnde Datenqualität | ⚠️ | Nur indirekt in Phase 2 „Daten-Check" | 2 – sollte prominenter adressiert werden |

**Stärke:** Die Problem-Solution-Sektion adressiert viele Schmerzpunkte gut.
**Schwäche:** Es fehlen konkrete Zahlen und ROI-Beispiele, die die Schmerzpunkte quantifizieren.

### 1.3 Branchen-Relevanz

- **Erwähnte Branchen:** Arztpraxen, Werkstätten, Beratungsfirmen (nur in der Voicebot-Beschreibung)
- **Fehlende, relevante Branchen:** Maschinenbau, Logistik, Versicherungen, Steuerberatung, Gesundheitswesen, Fertigung, Handwerk
- **Branchenspezifische Use Cases:** Keine vorhanden
- **Empfehlung:** Mindestens 3–5 konkrete Branchen-Beispiele in die KI-Anwendungen-Sektion integrieren. Mittelfristig: eigene Branchen-Unterseiten erstellen.

---

## Phase 2: Value Proposition & Positionierung

### 2.1 Hauptversprechen

**Aktuell:** „Planbarer KI Erfolg statt teurer Experimente"

- [✅] **Sofort verständlich?** Ja, sehr klar und eingängig.
- [⚠️] **Differenzierung?** Mittelstark. „Planbar" ist ein gutes Versprechen, wird aber nirgends konkretisiert. Kein Zeitrahmen, keine Methodik-Garantie, keine „Planbarkeits"-Nachweise.
- [⚠️] **Durchgehend eingelöst?** Teilweise. Das 3-Phasen-Modell stützt den Anspruch. Aber auf der Lernplattform und der Kontaktseite wird „planbar" nicht mehr aufgegriffen.
- [✅] **Subtitle passend?** „Wir konzipieren KI Projekte mit strategischer Weitsicht, technischer Machbarkeit und rechtlicher Sicherheit" – gut, unterstützt den Claim.
- [❌] **„Planbar" konkretisiert?** Nein. Es fehlen:
  - Typische Projektdauer / Phasen-Zeitrahmen
  - Garantien oder Risikoumkehr
  - Referenzprojekte als Beleg

**Konkreter Textvorschlag für die Startseite (unter dem Subtitle):**
> „Von der ersten Analyse bis zur fertigen Lösung in 8–12 Wochen. Transparent, budgetsicher und mit klarer Roadmap für jeden Schritt."

### 2.2 Differenzierung

| Merkmal | Kommuniziert? | Bewertung |
|---|---|---|
| Pragmatismus statt Hype | ✅ Behauptet | ⚠️ Nur behauptet, nicht belegt (keine Case Studies, keine Zahlen) |
| Erfahrung im regulierten Umfeld | ✅ About-Text | ✅ Gut positioniert (Versicherungskonzern, DSGVO, Compliance) |
| Technologieoffenheit | ✅ Eigene Sektion | ⚠️ Reicht nicht als Alleinstellung – das behaupten viele |
| Mittelstands-Fokus | ⚠️ Implizit | ❌ Wird nirgends explizit gesagt, z. B. „Speziell für den Mittelstand" |
| „Wir sind anders, weil…" | ❌ | ❌ Fehlt komplett |

**Empfehlung:** Explizite Differenzierungsaussage hinzufügen:
> „Anders als große Beratungshäuser arbeiten wir nicht mit theoretischen Folienschlachten. Und anders als reine Tech-Agenturen verstehen wir, wie Entscheidungen im Mittelstand wirklich fallen."

### 2.3 Glaubwürdigkeit & Belege

| Element | Vorhanden? | Qualität |
|---|---|---|
| Konkrete Zahlen / ROI | ❌ | Nur „80% des Supports automatisieren" in der Meta-Description, nicht im sichtbaren Content |
| Testimonials | ❌ | – |
| Case Studies | ❌ | – |
| Kundenlogos | ❌ | – |
| Zertifizierungen | ❌ | – |
| Partnerschaften | ⚠️ | Cloud-Logos (AWS/Azure/GCP) – aber keine offizielle Partnerschaft erkennbar |
| Gründer-Expertise | ✅ | About-Text gut, aber könnte mit LinkedIn-Profil oder konkreten Zahlen gestärkt werden |

**Kritisch:** Die Website hat **null Social Proof**. Für einen skeptischen Mittelständler ist das ein potenzieller Dealbreaker. Selbst eine einzige Kundenstimme oder ein anonymisiertes Projektbeispiel würde die Glaubwürdigkeit erheblich steigern.

---

## Phase 3: Conversion-Funnel & CTAs

### 3.1 Primary CTA

**„Jetzt kostenlose Potenzial-Analyse buchen"** → Calendly

- [✅] **Niedrige Hürde:** „kostenlos" und „30 Minuten" sind gut. „Unverbindlich" steht im Contact-Bereich, aber nicht immer am CTA.
- [⚠️] **Was passiert in der Analyse?** Nur auf der Startseite kurz beschrieben: „identifizieren wir gemeinsam den größten Hebel". Kein klarer 3-Schritte-Ablauf des Gesprächs.
- [❌] **CTA-Text inkonsistent:** Verschiedene Formulierungen werden verwendet:
  - „Jetzt kostenlose Potenzial-Analyse buchen" (Hero)
  - „Termin für Potenzial-Analyse buchen" (Contact-Sektion)
  - „Kostenlose Beratung buchen" (Demo-Sektion)
  - „Kalender öffnen" (Kontaktseite)
  - „Jetzt kostenlose Potenzial-Analyse buchen" (Leistungen Footer)

**Empfehlung:** Einen einheitlichen CTA-Text verwenden. Vorschlag:
> „Kostenlose Potenzial-Analyse buchen – 30 Min, unverbindlich"

### 3.2 Conversion-Pfad-Analyse

| Seite / Bereich | CTA? | CTA-Text | Ziel | Sinnvoll? | Verbesserung? |
|---|---|---|---|---|---|
| Startseite Hero | ✅ | „Jetzt kostenlose Potenzial-Analyse buchen" | Calendly | ✅ | Textergänzung: „30 Min, unverbindlich" |
| Startseite Services | ❌ | Cards verlinken auf Leistungen | Leistungsseite | ⚠️ | Hier fehlt ein CTA am Ende des Service-Blocks |
| Startseite Demo | ✅ | „Kostenlose Beratung buchen" | Calendly | ✅ | Text konsistent zum Hero machen |
| Startseite Quiz | ✅ | „Mehr zum Potenzial‑Workshop" etc. | `#contact` | ⚠️ | Ergebnis-CTAs könnten auf zielgerichtete Landingpages verlinken |
| Startseite Contact | ✅ | „Termin für Potenzial-Analyse buchen" | Calendly | ✅ | OK |
| Leistungen (Vorträge) | ❌ | Kein CTA bei Vorträgen | – | ❌ | CTA „Vortrag anfragen" hinzufügen |
| Leistungen (Workshops) | ✅ | „Workshop anfragen" | Kontaktseite | ✅ | OK |
| Leistungen (Strategie) | ✅ | „Strategiegespräch vereinbaren" | Kontaktseite | ✅ | OK |
| Leistungen (Automatisierung) | ✅ | „Jetzt kostenlose Potenzial-Analyse buchen" | Calendly | ✅ | OK |
| Kontakt | ✅ | E-Mail + Calendly | Direkt | ✅ | Fehlt: Erwartungsbeschreibung für das Gespräch |
| Lernplattform | ✅ | Newsletter + Whitepaper | Brevo / PDF | ✅ | Newsletter-Nutzen besser kommunizieren |

### 3.3 Sekundäre Conversion-Pfade

- **Newsletter:** „Bleiben Sie auf dem Laufenden mit exklusiven Insights und Updates zur KI-Welt" – zu generisch. Was genau bekommt der Abonnent? Wie oft?
- **Whitepaper:** Titel-Tag sagt „In 3 Schritten den Kundenservice automatisieren", aber der Body bietet „Neuratex-Prinzip anfordern" an → **Mismatch!**
- **Reifegrad-Check:** Gut konzipiert, 3 Ergebnis-Stufen mit passenden Empfehlungen. Aber: Die CTAs verlinken auf `#contact` – das funktioniert nur auf der Startseite, nicht wenn der Quiz separat geteilt wird.

---

## Phase 4: Inhaltliche Konsistenz & Qualität

### 4.1 Widersprüche & Inkonsistenzen

| Befund | Schwere | Details |
|---|---|---|
| **Impressum: „§ 5 TMG" statt „§ 5 DDG"** | 🔴 Hoch | Das TMG wurde durch das DDG (Digitale-Dienste-Gesetz) abgelöst. Die Meta-Description sagt korrekt „DDG", der Fließtext sagt falsch „TMG". |
| **Copyright-Jahr inkonsistent** | 🟡 Mittel | Impressum + Datenschutz zeigen „2025", andere Seiten „2026" (per JS dynamisch). |
| **Lernplattform Title-Tag veraltet** | 🔴 Hoch | `<title>` sagt „Whitepaper: In 3 Schritten den Kundenservice automatisieren", aber der Inhalt ist jetzt „Neuratex-Prinzip anfordern". |
| **„KI-Update 2025"** | 🔴 Hoch | Auf der Leistungsseite steht „KI-Update 2025: Strategie & Hype" – wir sind im März 2026! |
| **3-Phasen-Modell in 3 Varianten** | 🟡 Mittel | Startseite (Timeline), Leistungen (Strategie-Sektion), Lernplattform (Neuratex-Ansatz) – leicht unterschiedliche Formulierungen und Schwerpunkte. |
| **„Parameter" doppelt im Glossar** | 🟡 Mittel | FAQ Item 12 (Kategorie „Moderne Architekturen") und FAQ Item 25 (Kategorie „Datenverarbeitung") behandeln beide „Parameter". |
| **Gendering inkonsistent** | 🟢 Niedrig | „Mitarbeiter*innen" einmal auf Leistungsseite, sonst „Mitarbeiter" oder „Teams". |
| **LinkedIn-Link fehlt im sichtbaren Content** | 🟡 Mittel | Nur in Schema.org und Lernplattform-JSON vorhanden, nirgends als klickbarer Link. |

### 4.2 Textqualität

**Grammatik-Befund:**
- **„Was Unternehmen heute kämpfen lässt"** – grammatisch korrekt, aber idiomatisch ungewöhnlich. Natürlicher wäre: „Womit Unternehmen heute kämpfen" oder „Was Unternehmen heute ausbremst".

**Füllwörter/Verbesserungen:**
- „Wir glauben nicht an Hype. Wir glauben daran, dass KI sinnvoll eingesetzt werden muss." → Repetitiv. Besser: „Wir glauben nicht an Hype, sondern an sinnvoll eingesetzte KI."
- „damit aus Ideen Investitionen werden, die sich lohnen" → Stark, kann bleiben.
- „Ein stabiles Fundament und Menschen, die damit umgehen können" → Gut, bildhaft.

**Positiv:**
- About-Text ist authentisch und gut geschrieben
- Problem-Solution-Sektion kommuniziert klar
- Service-Beschreibungen sind nutzenorientiert

### 4.3 Besondere Prüfpunkte

- **Problem-Solution-Sektion:** Inhaltlich schlüssig, gute Gegenüberstellung. H2-Heading „Was Unternehmen heute kämpfen lässt" sollte sprachlich überarbeitet werden (s.o.).
- **KI-Anwendungen (6 Karten):** Gute Auswahl, deckt die wichtigsten Use Cases ab. Nichts überflüssig, nichts Entscheidendes fehlt.
- **Neuratex Prinzip (3 Phasen):** Überzeugend strukturiert, aber zu wenig Detail (keine Zeitangaben, keine konkreten Deliverables pro Phase).
- **About-Sektion:** Stärke der Website. Authentisch, glaubwürdig, zeigt relevante Erfahrung. Könnte durch LinkedIn-Link und ggf. ein professionelleres Foto gestärkt werden.
- **Demo-Sektion:** Die Voicebot-Demo ist ein guter „Wow-Moment". Aber: Ein Mittelständler fragt sich: „Klingt nett – aber was kostet mich sowas?" → Fehlt.

---

## Phase 5: Lernplattform – Detailprüfung

### 5.1 Podcast

- **Titel „KI Grundlagen, erklärt von KI"** – klingt ironisch und könnte bei skeptischen Entscheidern Misstrauen auslösen. Empfehlung: „Der KI-Kompass für Entscheider – Grundlagen verständlich erklärt"
- **Inhaltsbeschreibung:** Vorhanden, aber kurz. Keine Kapitelmarken.
- **Transkription:** ❌ Fehlt – schlecht für Barrierefreiheit und SEO.

### 5.2 KI-Begriffe Glossar

- **Umfang:** 45 Begriffe in 7 Kategorien – eher erschlagend auf einen Blick. Aber durch Accordion-Struktur gut handhabbar.
- **Zielgruppen-Kompatibilität:** ❌ Die Erklärungen richten sich im Stil an eine junge, tech-affine Zielgruppe, nicht an Geschäftsführer. Beispiele:
  - „Autocomplete auf Steroiden" (LLM)
  - „dumm wie Brot" (Chatbot)
  - „KIs, die nicht nur labern, sondern machen" (KI-Agenten)
  - „Hacking mit Worten" (Prompt Injection)
- **Du/Sie:** ❌ Konsequent „du" – muss komplett auf „Sie" umgestellt werden.
- **Emojis in Überschriften:** ⚠️ Passt nicht optimal zur seriösen Mittelstands-Zielgruppe. Empfehlung: Icons statt Emojis oder ganz entfernen.
- **Fehlende Begriffe:** EU AI Act (trotz Erwähnung auf der Leistungsseite!)
- **Duplikat:** „Parameter" erscheint zweimal (Item 12 und 25).
- **Suchfunktion:** ❌ Fehlt – bei 45 Begriffen sinnvoll.

### 5.3 Whitepaper & Newsletter

- **Whitepaper:** Der `<title>` sagt „In 3 Schritten den Kundenservice automatisieren", der Body bietet „Neuratex-Prinzip anfordern" an → **Sofort korrigieren!**
- **Newsletter-Versprechen:** „Bleiben Sie auf dem Laufenden mit exklusiven Insights und Updates zur KI-Welt" – zu generisch. Besser: „Alle 2 Wochen: Ein konkreter KI-Tipp für Ihr Unternehmen, kuratiert von Philipp Koch"
- **Datenschutz bei Newsletter:** ❌ Kein Hinweis auf Datenschutz neben dem Newsletter-Formular. Nur beim Whitepaper gibt es eine Privacy-Checkbox.

### 5.4 Reifegrad-Check

- **17 Fragen für „5 Minuten":** Grenzwertig, aber machbar. Kritisch: Viele Fragen sind eher Wissenstest als Reifegrad-Check. Ein Geschäftsführer will nicht geprüft werden.
- **Ergebnisse:** Gut differenziert (Entdecker / Experimentator / Stratege). Die Handlungsempfehlungen sind sinnvoll.
- **CTA-Ziel:** Links gehen auf `#contact` – funktioniert auf der Startseite, aber nicht wenn der Check separat verlinkt wird.
- **Quiz befindet sich auf der Startseite (index.html)**, nicht auf der Lernplattform → könnte verwirrend sein, wenn jemand „Reifegrad-Check" auf der Lernplattform erwartet.

---

## Phase 6: Leistungsseite – Detailprüfung

### 6.1 Struktur & Aufbau

- [✅] 4 Leistungsbereiche sind eine gute Granularität
- [✅] Reihenfolge logisch: Vorträge → Workshops → Strategie → Automatisierung (aufsteigend nach Engagement-Level)
- [⚠️] Welche Leistung für wen? Teilweise über Zielgruppen-Tags gelöst, aber es fehlt ein „Welcher Einstieg passt zu mir?"-Empfehlung
- [❌] Preisindikationen fehlen komplett. Auch keine „ab"-Preise oder „Investitions"-Rahmen.

### 6.2 Vorträge & Keynotes

- **4 Varianten:** Gute Abdeckung (Strategie, Compliance, Google, Microsoft)
- [🔴] **„KI-Update 2025"** – veraltet! Muss auf 2026 aktualisiert werden.
- [⚠️] Bullet-Points wie „Klarheit für Investitionen" sind OK, aber könnten konkreter sein.
- [❌] Fehlende Infos: Dauer, Format (remote/vor Ort), typische Teilnehmeranzahl, Preisrahmen.

**Empfehlung:** Pro Vortrag eine Zeile wie:
> „Dauer: 45–90 Min | Format: vor Ort oder remote | Teilnehmer: unbegrenzt"

### 6.3 Workshops

- **4 Typen:** Prompt Engineering, Content-Factory, No-Code Agenten, KI-Führung & Change
- [⚠️] **„Content-Factory"** – könnte als Marketing-Agentur-Leistung missverstanden werden. Besser: „KI-Content-Workshop: Texte, Bilder & Videos in Rekordzeit"
- [⚠️] **„No-Code Agenten – Für Macher"** – „Macher" ist zu vage. Besser: „Für Fachabteilungen ohne IT-Hintergrund"
- [❌] Fehlende Infos: Dauer, Gruppengröße, Vorkenntnisse.

### 6.4 KI-Strategieentwicklung

- [✅] 3-Phasen-Modell klar und schlüssig
- [⚠️] Rolle von Neuratex in Phase 3 (Umsetzung): „Wir entwickeln Prototypen" – wird Neuratex auch implementieren oder nur beraten? Unklar.
- [⚠️] „Vom Experiment zum Erfolgsmodell" – starke Aussage, nicht durch Belege gestützt.

### 6.5 Prozessautomatisierung

- [✅] 3 Agent-Typen (Communication, Admin & Doc, Analyst) gut unterschieden
- [❌] Kein Preismodell oder Größenordnung
- [⚠️] Unterschied zu KI-Strategieentwicklung könnte klarer sein: Strategie = Planung, Automatisierung = Umsetzung

---

## Phase 7: SEO-Content-Analyse

### 7.1 Title Tags & Meta Descriptions

| Seite | Title | Länge | Keyword? | Meta Description | Länge |
|---|---|---|---|---|---|
| Startseite | „Intelligente Automatisierung: Chatbots & KI, die Ihr Team entlasten" | 66 Z ✅ | ⚠️ „KI Beratung" fehlt | „Endlose Routineanfragen binden Ihre besten Mitarbeiter? Neuratex AI entwickelt Chat- & Voicebots, die 80% des Supports automatisieren." | 148 Z ✅ |
| Leistungen | „Lösungen im Detail: KI-gesteuerte Chatbots, Voicebots & Agenten" | 62 Z ✅ | ⚠️ „KI Beratung" fehlt | „Entdecken Sie unsere Automatisierungs-Lösungen: 24/7-Kundensupport..." | 155 Z ✅ |
| Kontakt | „Kostenlose Analyse: Wo lohnt sich Automatisierung für Sie am meisten?" | 68 Z ✅ | ✅ | „Reservieren Sie Ihre kostenlose 30-Minuten-Potenzialanalyse..." | 152 Z ✅ |
| Lernplattform | „Whitepaper: In 3 Schritten den Kundenservice automatisieren" | 58 Z ✅ | ❌ Veraltet! | „Lernplattform zu KI: Grundlagen, Anwendungsbeispiele..." | 126 Z ✅ |
| Datenschutz | „Datenschutz – Neuratex AI" | 25 Z ✅ | ✅ | „Datenschutzerklärung der Neuratex AI Website..." | 80 Z ✅ |
| Impressum | „Impressum – Neuratex AI" | 23 Z ✅ | ✅ | „Impressum der Neuratex AI Website. Angaben gemäß § 5 DDG." | 57 Z ✅ |

**Hauptproblem:** Die wichtigsten Keywords „KI Beratung Mittelstand" und „KI Beratung" tauchen in keinem Title Tag auf!

**Empfohlene Title-Tags:**
- Startseite: „KI-Beratung für den Mittelstand | Chatbots, Voicebots & Strategie – Neuratex AI"
- Leistungen: „KI-Workshops, Strategieberatung & Automatisierung für Unternehmen – Neuratex AI"
- Lernplattform: „KI-Lernplattform: Glossar, Podcast & Whitepaper für Entscheider – Neuratex AI"

### 7.2 Heading-Struktur

| Seite | H1 | H1-Anzahl | Struktur OK? |
|---|---|---|---|
| Startseite | „Planbarer KI Erfolg statt teurer Experimente" | 1 ✅ | ⚠️ Viele H2, teilweise H3 direkt nach H2 ohne H2-Kontext |
| Leistungen | „Unsere Leistungen" | 1 ✅ | ✅ |
| Kontakt | „Nehmen Sie Kontakt auf" | 1 ✅ | ✅ |
| Lernplattform | „Ihre KI Lernplattform" | 1 ✅ | ⚠️ FAQ-Kategorien nutzen H3 innerhalb von H2-losem Kontext |
| Impressum | „Impressum" | 1 ✅ | ✅ |
| Datenschutz | „Datenschutzerklärung" | 1 ✅ | ✅ |

### 7.3 Keyword-Abdeckung

| Keyword-Cluster | Vertreten? | Wo? | Empfehlung |
|---|---|---|---|
| KI Beratung Mittelstand | ❌ | Nur in Meta-Descriptions | In H1 oder H2 aufnehmen! |
| KI Strategie Unternehmen | ⚠️ | Leistungen (Strategieentwicklung) | Expliziter in Headlines |
| Chatbot Kundenservice | ✅ | KI-Anwendungen, Leistungen | OK |
| Voicebot Terminbuchung | ✅ | KI-Anwendungen, Demo | OK |
| KI Workshop Unternehmen | ⚠️ | Leistungen, Services | „Workshop" + „Unternehmen" selten zusammen |
| DSGVO KI / AI Act | ✅ | Leistungen (Compliance-Keynote) | OK, könnte mehr Content vertragen |
| Prozessautomatisierung KI | ✅ | Leistungen, KI-Anwendungen | OK |
| KI Einführung Unternehmen | ❌ | Nicht explizit | Wichtiges Keyword, fehlt! |
| Künstliche Intelligenz Beratung | ❌ | „Künstliche Intelligenz" kaum verwendet | In Alt-Tags oder Body einbauen |
| KI Agentur / KI Dienstleister | ❌ | Nicht verwendet | Optional, da eher „Beratung" |

### 7.4 Content-Lücken für SEO

- [❌] **Kein Blog / Ratgeber** – massives SEO-Potenzial verschenkt. Empfehlung: 2 Artikel/Monat zu Themen wie „KI Einführung im Mittelstand", „Chatbot Kosten", „DSGVO-konformer KI-Einsatz".
- [❌] **Kein FAQ-Schema** – das Glossar auf der Lernplattform ist kein FAQ-Schema. FAQs wie „Was kostet KI-Beratung?" oder „Wie lange dauert ein KI-Projekt?" fehlen.
- [✅] **Lokale SEO:** Düsseldorf in Schema.org und Impressum vorhanden. Telefonnummer vorhanden.
- [❌] **Kein Featured Snippet Content:** Keine kurzen Definitionen oder „Was ist...?"-Paragraphen, die Google als Snippet verwenden könnte.
- [⚠️] **Schema.org:** Organization-Schema auf Startseite und Lernplattform vorhanden. Aber: Kein `LocalBusiness`-Schema, kein `Service`-Schema, kein `FAQPage`-Schema.

---

## Phase 8: Vertrauens-Signale & Überzeugungskraft

### 8.1 Trust-Elemente-Inventar

| Trust-Element | Vorhanden? | Wo? | Qualität (1-5) |
|---|---|---|---|
| Gründer-Portrait + Geschichte | ✅ | Startseite #about | 4 – authentisch, gut geschrieben |
| Kundenstimmen / Testimonials | ❌ | – | – |
| Case Studies / Projektergebnisse | ❌ | – | – |
| Kundenlogos | ❌ | – | – |
| Zertifizierungen | ❌ | – | – |
| Partner-Logos (AWS/Azure/GCP) | ✅ | Startseite Tech-Sektion | 3 – Tech-Logos, keine Partner |
| Bewertungen (Google etc.) | ❌ | – | – |
| „Bekannt aus…" | ❌ | – | – |
| LinkedIn-Verknüpfung | ⚠️ | Nur Schema.org | 1 – nicht sichtbar |
| Garantien / Risikoumkehr | ❌ | – | – |
| DSGVO-Konformität betont | ✅ | Leistungen, About | 3 |
| Kostenlose Erstberatung | ✅ | CTAs überall | 4 |
| Demo / Live-Beispiel | ✅ | Voicebot-Demo | 4 – guter Wow-Moment |
| Reifegrad-Check als Einstieg | ✅ | Startseite | 3 |

**Gesamtbewertung Trust:** 3/10 – **Die Website hat ein massives Trust-Defizit.** Für B2B im Mittelstand ist Social Proof entscheidend. Ohne Testimonials, Case Studies oder Logos wirkt die Seite wie ein „Einzelkämpfer ohne Referenzen".

### 8.2 Einwand-Behandlung

| Einwand | Adressiert? | Wo? | Empfehlung |
|---|---|---|---|
| „KI ist zu teuer für uns" | ❌ | – | ROI-Rechnung oder „ab X €"-Indikation |
| „Wir haben keine/schlechte Daten" | ⚠️ | Phase 2 „Daten-Check" (indirekt) | Eigenen Paragraph oder FAQ |
| „Mitarbeiter haben Angst vor KI" | ✅ | Workshop „KI-Führung & Change" | Gut adressiert |
| „Schlechte Erfahrungen gemacht" | ❌ | – | In About oder als FAQ aufgreifen |
| „Funktioniert in unserer Branche nicht" | ❌ | – | Branchen-Beispiele hinzufügen |
| „Wir haben kein IT-Team" | ⚠️ | Workshop „No-Code" (indirekt) | Expliziter kommunizieren |
| „DSGVO macht KI unmöglich" | ✅ | Compliance-Keynote | Gut adressiert |
| „Das ist nur ein Hype" | ✅ | „Hype von Realität trennen" | Gut adressiert |
| „Wir sind zu klein dafür" | ❌ | – | Explizit Mindestgröße oder „schon ab 20 MA sinnvoll" |
| „Wir finden keinen passenden Anbieter" | ❌ | – | Differenzierung stärken (s. Phase 2.2) |

### 8.3 Storytelling & emotionale Ansprache

- **Vorher → Nachher:** ⚠️ Die Problem-Solution-Sektion liefert eine Art Vorher/Nachher, aber ohne konkrete Beispiele oder Zahlen.
- **Transformation:** ⚠️ Versprochen ja, aber nicht emotionalisiert. Es fehlt: „Stellen Sie sich vor, Ihr Kundenservice läuft 24/7, ohne Überstunden."
- **Ängste ernst genommen:** ✅ Der About-Text adressiert Scheitern von KI-Projekten respektvoll.
- **Vision / Warum:** ⚠️ Gründungsgeschichte vorhanden, aber die „Mission" fehlt. Warum existiert Neuratex AI? Was treibt Philipp an?
- **Kopf vs. Bauch:** Die Website spricht stärker den Kopf an (Fakten, Methodik), vernachlässigt aber emotionale Trigger (Sicherheit, Entlastung, Stolz).

---

## Phase 9: Wettbewerbsvergleich (Desk Research)

> ⚠️ **Hinweis:** Als KI-Agent ohne Internet-Zugriff kann ich keine Live-Wettbewerber-Websites analysieren. Stattdessen gebe ich eine Einschätzung basierend auf dem typischen Markt für KI-Beratung im DACH-Raum.

### 9.1 Typische Wettbewerber-Merkmale

Vergleichbare Anbieter (wie z.B. AI Launch Lab, Alexander Thamm, Datasolut, appliedAI) haben typischerweise:
- Case Studies mit konkreten ROI-Zahlen
- Blog mit regelmäßigen Fachartikeln (SEO-Magneten)
- Team-Seite mit mehreren Beratern
- Preistransparenz oder zumindest „Projekt ab X €"
- Branchen-Seiten (Automotive, Finance, Healthcare)
- Logos auf der Startseite „Vertrauen von: [Logos]"

### 9.2 Differenzierungs-Empfehlung

**Neuratex-USP:** Die Kombination aus (1) persönlicher Beratung durch einen Gründer mit echtem Konzern-Hintergrund, (2) Fokus auf Dienstleistungs-Mittelstand und (3) Ende-zu-Ende-Ansatz (von Vortrag bis Implementierung) ist ein starkes Differenzierungsmerkmal, wird aber nicht klar genug kommuniziert.

**Vorschlag für eine USP-Aussage:**
> „Neuratex AI ist Ihr persönlicher KI-Partner im Mittelstand. Gründer Philipp Koch bringt Erfahrung aus der Unternehmensberatung und einem DAX-Versicherungskonzern zusammen – und übersetzt sie in Lösungen, die in Ihrem Unternehmen wirklich funktionieren."

---

## Phase 10: Content-Gaps & Empfehlungen

### 10.1 Fehlende Seiten / Inhalte

| # | Fehlender Inhalt | Priorität | Begründung | Aufwand |
|---|---|---|---|---|
| 1 | Referenzen / Case Studies | 🔴 Kritisch | Ohne Social Proof kein Vertrauen im B2B-Mittelstand | Mittel |
| 2 | FAQ-Seite | 🔴 Hoch | Adressiert Einwände, SEO-Potenzial (FAQ-Schema), senkt Conversion-Hürde | Niedrig |
| 3 | Blog / Ratgeber | 🟡 Mittel | Langfristig wichtigster SEO-Kanal und Thought Leadership | Hoch (laufend) |
| 4 | Über-uns-Seite (eigenständig) | 🟡 Mittel | About-Sektion auf Startseite reicht für den Anfang, aber eigene Seite stärkt Vertrauen | Niedrig |
| 5 | Branchen-Seiten | 🟡 Mittel | Zielgruppe erwartet branchenspezifische Relevanz | Mittel |
| 6 | Preise / Pakete | 🟢 Niedrig | Im Beratungsgeschäft unüblich, aber eine „Orientierung" wäre hilfreich | Niedrig |
| 7 | Partner-Seite | 🟢 Niedrig | Erst relevant bei offiziellen Partnerschaften | Niedrig |
| 8 | Karriere / Team | 🟢 Niedrig | Erst relevant bei Team-Wachstum | Niedrig |

### 10.2 Verbesserungen bestehender Inhalte

### Impressum – Rechtsgrundlage
- **Problem:** „Angaben gemäß § 5 TMG" – TMG wurde durch DDG ersetzt.
- **Auswirkung:** Veraltete Rechtsgrundlage wirkt unprofessionell und kann Abmahnrisiko darstellen.
- **Empfehlung:** Ändern auf „Angaben gemäß § 5 DDG".
- **Priorität:** 🔴 Hoch (sofort)

### Impressum + Datenschutz – Copyright-Jahr
- **Problem:** `<span id="copyright-year">2025</span>` fest eincodiert statt dynamisch.
- **Auswirkung:** Wirkt veraltet.
- **Empfehlung:** Entweder JS-basiert (wie auf anderen Seiten) oder manuell auf 2026 aktualisieren.
- **Priorität:** 🟡 Mittel

### Leistungen – Jahresangabe
- **Problem:** „KI-Update 2025: Strategie & Hype" – veraltet.
- **Auswirkung:** Wirkt, als sei die Website nicht gepflegt. Signal an Besucher: „Hier passiert nichts mehr."
- **Empfehlung:** Auf „2026" aktualisieren ODER jahresneutral formulieren: „KI-Update: Strategie, Hype & Realität".
- **Priorität:** 🔴 Hoch (sofort)

### Lernplattform – Title-Tag
- **Problem:** Title sagt „Whitepaper: In 3 Schritten den Kundenservice automatisieren", Inhalt bietet „Neuratex-Prinzip" an.
- **Auswirkung:** Google zeigt falschen Title in Suchergebnissen. Besucher sind verwirrt.
- **Empfehlung:** Title auf „KI-Lernplattform: Glossar, Podcast & Whitepaper – Neuratex AI" ändern.
- **Priorität:** 🔴 Hoch (sofort)

### Lernplattform – Glossar Anrede
- **Problem:** 40+ Stellen mit „du/dein/dir" statt „Sie/Ihr/Ihnen".
- **Auswirkung:** Massiver Tonbruch. Ein 55-jähriger Geschäftsführer fühlt sich nicht ernst genommen.
- **Empfehlung:** Komplett auf „Sie" umstellen. Slang-Formulierungen anpassen.
- **Priorität:** 🔴 Hoch
- **Beispieltext (statt):** „Denk an ein Kind, das aus Erfahrung lernt" → „Stellen Sie sich ein Kind vor, das aus Erfahrung lernt"
- **Beispieltext (statt):** „Du gibst der KI Beispiele" → „Sie geben der KI Beispiele"
- **Beispieltext (statt):** „dumm wie Brot" → „stark limitiert"
- **Beispieltext (statt):** „KIs, die nicht nur labern, sondern machen" → „KIs, die nicht nur antworten, sondern eigenständig handeln"

### Lernplattform – Newsletter-Datenschutz
- **Problem:** Kein Datenschutzhinweis beim Newsletter-Formular.
- **Auswirkung:** DSGVO-Risiko. Nutzer wissen nicht, was mit ihrer E-Mail passiert.
- **Empfehlung:** Unter dem Newsletter-Formular ergänzen: „Mit der Anmeldung stimmen Sie unserer [Datenschutzerklärung] zu. Abmeldung jederzeit möglich."
- **Priorität:** 🔴 Hoch

### Startseite – Problem-Solution Heading
- **Problem:** „Was Unternehmen heute kämpfen lässt" – ungewöhnliche Grammatik.
- **Auswirkung:** Leser stolpern über die Formulierung.
- **Empfehlung:** „Womit Unternehmen heute kämpfen" oder „Was Unternehmen heute ausbremst"
- **Priorität:** 🟡 Mittel

### Kontaktseite – Erwartungsmanagement
- **Problem:** Nur „Wir freuen uns darauf, von Ihnen zu hören" – keine Info, was im Gespräch passiert.
- **Auswirkung:** Höhere Hürde für Entscheider, die nicht wissen, was sie erwartet.
- **Empfehlung:** Ergänzen: „In 30 Minuten besprechen wir: (1) Ihre aktuelle Situation, (2) die drei vielversprechendsten KI-Ansätze, (3) einen konkreten nächsten Schritt."
- **Priorität:** 🟡 Mittel

### 10.3 Quick Wins (sofort umsetzbar)

1. **Impressum: „§ 5 TMG" → „§ 5 DDG"** – 1 Minute, reduziert Abmahnrisiko
2. **Leistungen: „KI-Update 2025" → „KI-Update 2026"** – 1 Minute, wirkt aktuell
3. **Lernplattform: Title-Tag korrigieren** – 1 Minute, SEO-Impact
4. **Copyright-Jahr auf Impressum/Datenschutz aktualisieren** – 1 Minute
5. **LinkedIn-Link sichtbar in Footer oder About-Sektion hinzufügen** – 5 Minuten
6. **„Parameter"-Duplikat im Glossar entfernen** – 2 Minuten
7. **Newsletter-Formular: Datenschutz-Hinweis ergänzen** – 5 Minuten
8. **Startseite Title-Tag: „KI Beratung" aufnehmen** – 2 Minuten

### 10.4 Strategische Empfehlungen (mittelfristig)

1. **Social Proof aufbauen:** Selbst 1–2 anonymisierte Case Studies oder Pilotprojekt-Ergebnisse ändern die Wahrnehmung fundamental. Empfehlung: Nächste 2 Projekte dokumentieren und als Referenz aufbereiten.
2. **Glossar auf Sie-Anrede umstellen:** Systematische Überarbeitung aller 45 Begriffe. Tonalität anpassen von „Gen-Z-Erklärvideo" auf „Verständlich für Entscheider".
3. **FAQ-Seite mit Schema.org erstellen:** 10–15 echte Entscheider-Fragen beantworten. SEO-Boost durch FAQPage-Schema.
4. **Blog starten:** 1–2 Artikel/Monat zu Long-Tail-Keywords wie „KI Einführung Mittelstand Erfahrungsbericht", „Chatbot Kosten Unternehmen", „DSGVO KI Checkliste".
5. **Branchen-Relevanz stärken:** 3–4 Branchen-Abschnitte oder -Seiten (z. B. Versicherungen, Steuerberatung, Dienstleister, Gesundheitswesen) mit spezifischen Use Cases.
6. **CTA-Konsistenz:** Alle Calendly-CTAs auf einen einheitlichen Text bringen.
7. **Reifegrad-Check auch auf Lernplattform verlinken/einbetten** – logischerer Standort.

---

## Phase 11: Zusammenfassung & Aktionsplan

### 11.1 Gesamtbewertung

| Kategorie | Bewertung (1-10) | Kernaussage |
|---|---|---|
| Zielgruppen-Fit (Mittelstand) | **6** | Grundausrichtung gut, aber Glossar-Tonalität und fehlende Branchen-Spezifik schwächen |
| Value Proposition | **7** | Starker Claim, aber „planbar" nicht belegt; Differenzierung zu schwach |
| Vertrauenswürdigkeit | **4** | Größte Schwäche: Null Social Proof. About-Text allein trägt nicht |
| Conversion-Optimierung | **6** | CTAs vorhanden, aber inkonsistent; sekundäre Pfade nicht optimal |
| Content-Qualität | **7** | Texte sind gut geschrieben (Ausnahme: Glossar-Ton); einige Inkonsistenzen |
| SEO-Content | **4** | Wichtige Keywords fehlen in Titles; kein Blog; kein FAQ-Schema |
| Vollständigkeit | **5** | Kernseiten vorhanden, aber Referenzen, FAQ, Blog, Branchen fehlen |
| **Gesamt** | **5,6** | **Solide Basis mit klarem Verbesserungspotenzial, besonders bei Trust und SEO** |

### 11.2 Top-5-Prioritäten

| # | Maßnahme | Impact | Aufwand | Zeitrahmen |
|---|---|---|---|---|
| 1 | **Quick Fixes:** TMG→DDG, 2025→2026, Title-Tags, Copyright | 🟡 Mittel | 🟢 Minimal | Sofort (1h) |
| 2 | **Glossar auf „Sie" umstellen + Tonalität anpassen** | 🔴 Hoch | 🟡 Mittel (2-3h) | Woche 1 |
| 3 | **1–2 Case Studies / Referenzen erstellen** | 🔴 Hoch | 🟡 Mittel | Woche 2-3 |
| 4 | **FAQ-Seite mit Schema.org erstellen** | 🔴 Hoch | 🟡 Mittel | Woche 3-4 |
| 5 | **Title-Tags SEO-optimieren (Keyword „KI Beratung Mittelstand")** | 🔴 Hoch | 🟢 Minimal | Woche 1 |

### 11.3 Umsetzungs-Roadmap

**Woche 1–2: Quick Wins**
- [ ] Impressum: „§ 5 TMG" → „§ 5 DDG"
- [ ] Copyright-Jahr auf 2026 setzen (Impressum, Datenschutz)
- [ ] „KI-Update 2025" → „KI-Update 2026" auf Leistungsseite
- [ ] Lernplattform Title-Tag korrigieren
- [ ] „Parameter"-Duplikat im Glossar entfernen
- [ ] Title-Tags mit „KI Beratung" optimieren
- [ ] LinkedIn-Link sichtbar in Footer oder About einbauen
- [ ] Newsletter-Formular: Datenschutzhinweis ergänzen
- [ ] CTA-Texte vereinheitlichen

**Woche 3–4: Inhaltliche Überarbeitung**
- [ ] Glossar komplett auf „Sie" umstellen (45 Begriffe)
- [ ] Glossar-Tonalität anpassen (Slang → professionell)
- [ ] Problem-Solution-Heading überarbeiten
- [ ] Kontaktseite: Erwartungsmanagement ergänzen
- [ ] Newsletter-Versprechen konkretisieren
- [ ] Whitepaper-Titel-Konsistenz prüfen und korrigieren
- [ ] Auf Leistungsseite: Dauer/Format/Teilnehmerinfo hinzufügen

**Monat 2–3: Neue Inhalte erstellen**
- [ ] 1–2 Case Studies / Projektbeispiele aufbereiten
- [ ] FAQ-Seite mit 15 Entscheider-Fragen + FAQ-Schema
- [ ] „Über uns"-Seite eigenständig erstellen
- [ ] Mindestens 3 Branchen-Beispiele in KI-Anwendungen integrieren
- [ ] Blog-Infrastruktur aufsetzen + erste 2 Artikel

**Laufend: Content-Strategie**
- [ ] 2 Blog-Artikel/Monat (SEO-fokussiert)
- [ ] Newsletter alle 2 Wochen
- [ ] Nach jedem Projekt: Case Study erstellen
- [ ] Quartals-weise: KI-Update-Jahreszahlen prüfen
- [ ] Kundenstimmen aktiv einsammeln

---

## Anhang: Detaillierte Befunde pro Seite

### A. Startseite – Alle Befunde

| # | Befund | Schwere | Zeile/Bereich |
|---|---|---|---|
| A1 | H2 „Was Unternehmen heute kämpfen lässt" – grammatisch ungewöhnlich | 🟡 | Problem-Sektion |
| A2 | MVP, ROI, Use-Case ohne Erklärung | 🟢 | Timeline, Services |
| A3 | Kein CTA nach der Services-Sektion | 🟡 | Nach den 4 Service-Cards |
| A4 | Cloud-Logos (AWS/Azure/GCP) ohne Partnerschafts-Beleg | 🟢 | Tech-Sektion |
| A5 | Demo-CTA „Kostenlose Beratung buchen" – inkonsistent zum Hero-CTA | 🟡 | Demo |
| A6 | Quiz-Ergebnis CTAs verlinken auf `#contact` – funktioniert nur auf Startseite | 🟡 | Reifegrad-Check |
| A7 | Title-Tag enthält nicht „KI Beratung" | 🔴 | `<head>` |
| A8 | OG-Title ≠ Page Title – inkonsistente Darstellung in Social Media | 🟢 | `<head>` |

### B. Leistungsseite – Alle Befunde

| # | Befund | Schwere | Zeile/Bereich |
|---|---|---|---|
| B1 | „KI-Update 2025" – veraltet | 🔴 | Vorträge |
| B2 | „Mitarbeiter*innen" – inkonsistentes Gendering | 🟢 | Workshops |
| B3 | Kein CTA bei den Keynote-Karten | 🟡 | Vorträge |
| B4 | Fehlende Info: Dauer, Format, Teilnehmerzahl | 🟡 | Alle Bereiche |
| B5 | „Content-Factory" als Name missverständlich | 🟡 | Workshops |
| B6 | „No-Code Agenten für Macher" – Zielgruppe zu vage | 🟡 | Workshops |
| B7 | Rolle Neuratex in Phase 3 „Umsetzung" unklar | 🟡 | Strategie |
| B8 | Viel Inline-CSS statt CSS-Klassen | 🟢 | Gesamte Seite |

### C. Lernplattform – Alle Befunde

| # | Befund | Schwere | Zeile/Bereich |
|---|---|---|---|
| C1 | Title-Tag veraltet (Whitepaper-Titel stimmt nicht) | 🔴 | `<head>` |
| C2 | 40+ Stellen mit „du" statt „Sie" im Glossar | 🔴 | FAQ-Bereich |
| C3 | Slang-Formulierungen unpassend für Zielgruppe | 🟡 | FAQ-Bereich |
| C4 | „Parameter" doppelt (Item 12 + 25) | 🟡 | FAQ |
| C5 | Emojis in Kategorie-Titeln fraglich für B2B | 🟡 | Kategorien |
| C6 | Kein Datenschutzhinweis bei Newsletter-Formular | 🔴 | Newsletter |
| C7 | Newsletter-Nutzen zu generisch beschrieben | 🟡 | Newsletter |
| C8 | Podcast-Titel kann skeptisch wirken | 🟡 | Podcast |
| C9 | Keine Podcast-Transkription | 🟡 | Podcast |
| C10 | Export-Button im Footer (disabled) – Legacy-Code? | 🟢 | Footer |

### D. Impressum & Datenschutz

| # | Befund | Schwere | Zeile/Bereich |
|---|---|---|---|
| D1 | „§ 5 TMG" statt „§ 5 DDG" | 🔴 | Impressum |
| D2 | Copyright „2025" statt dynamisch | 🟡 | Footer |
| D3 | Impressum-Nav fehlt „KI-Anwendungen"-Link (anders als andere Seiten) | 🟢 | Nav |

---

> **Fazit:** Die Neuratex-Website hat eine solide inhaltliche Grundlage mit einem klaren Claim, einer authentischen Gründer-Story und einem gut strukturierten Leistungsportfolio. Die größten Hebel für mehr Anfragen sind: (1) Social Proof aufbauen, (2) Glossar professionalisieren, (3) SEO-Basics korrigieren und (4) fehlende Quick-Fixes sofort umsetzen. Die Quick Wins in Woche 1 erfordern weniger als 2 Stunden Arbeit und beseitigen die offensichtlichsten Schwächen.
