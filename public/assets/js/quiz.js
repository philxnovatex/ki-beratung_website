/**
 * KI-Reifegrad Quiz
 * 17-Schritte Quiz mit Modulen, Feedback und Subscores
 * Ausgelagert aus index.html für bessere Wartbarkeit
 */
(function initQuiz() {
    'use strict';
    
    const form = document.getElementById('quizForm');
    if (!form) return;
    
    // DOM Elements
    const steps = Array.from(form.querySelectorAll('.quiz-step'));
    const submitBtn = document.getElementById('quizSubmit');
    const counter = document.getElementById('quiz-counter');
    const resultsContainer = document.getElementById('resultsContainer');
    
    // Validierung
    if (!steps.length) {
        console.warn('[Quiz] Keine Quiz-Schritte gefunden');
        return;
    }
    
    const totalSteps = steps.length;
    
    // Scoring Konfiguration
    const config = {
        likertMap: { A: 1, B: 2, C: 3, D: 4, E: 5 },
        moodMap: { A: 1, B: 2, C: 3, D: 4, E: 5 },
        correctAnswers: {
            q2: 'C', q3: 'B', q5: 'B', q6: 'B', q8: 'C', 
            q9: 'B', q11: 'B', q12: 'B', q13: 'C', q15: 'B', q16: 'B'
        },
        feedback: {
            q2: {
                C: 'Richtig: LLMs modellieren Sprache und generieren wahrscheinliche Wortfolgen.',
                default: 'Hinweis: LLMs generieren Sprache; Bilder/Videos erstellt eine Bild-/Video-KI.'
            },
            q3: {
                B: 'Richtig: Muster und Statistik, kein „Verständnis" im menschlichen Sinn.',
                default: 'KI erkennt Muster und Vorhersagen, aber kein echtes Bewusstsein.'
            },
            q5: {
                B: 'Richtig: Klare Parameter + Stilhinweise führen zu fotorealistischen Ergebnissen.',
                default: 'Besser: klare Stil-/Qualitätsangaben (fotorealistisch, Licht, Auflösung).'
            },
            q6: {
                B: 'Richtig: Immer Abgleich mit der Quelle auf Vollständigkeit/Korrektheit.',
                default: 'Wichtig: Inhalte kritisch prüfen und mit Original abgleichen.'
            },
            q8: {
                C: 'Richtig: „Halluzination" = überzeugend, aber falsch.',
                default: 'Achte auf plausible, aber falsche Aussagen – das nennt man Halluzination.'
            },
            q9: {
                B: 'Richtig: Bias/Prompting kann zu einseitigen Ergebnissen führen.',
                default: 'Vermutlich Bias im Datensatz oder zu enger Prompt.'
            },
            q11: {
                B: 'Richtig: DSGVO-Risiko bei personenbezogenen Daten an Dritte.',
                default: 'Achtung: Personenbezogene Daten nicht in externe Tools kopieren.'
            },
            q12: {
                B: 'Richtig: Trainingsbias → diskriminierende Resultate.',
                default: 'Hinweis: Verzerrte Trainingsdaten können diskriminieren.'
            },
            q13: {
                C: 'Richtig: Verantwortung liegt in der Regel beim freigebenden Anwender/Unternehmen.',
                default: 'Üblicherweise trägt der freigebende Anwender bzw. das Unternehmen Verantwortung.'
            },
            q15: {
                B: 'Richtig: E-Mails klassifizieren/weiterleiten = typischer Automatisierungsfall.',
                default: 'Automatisierung zielt auf wiederkehrende Routineaufgaben.'
            },
            q16: {
                B: 'Richtig: Effizienz + Assistenz bei Entscheidungen sind Hauptchancen.',
                default: 'Größte Chance: Effizienz plus bessere Entscheidungen.'
            }
        },
        levelThresholds: { low: 0, medium: 0.45, high: 0.7 }
    };
    
    // Counter aktualisieren
    function updateCounter(idx) {
        if (counter) {
            counter.textContent = `Frage ${Math.min(idx + 1, totalSteps)} von ${totalSteps}`;
        }
    }
    
    // Feedback anzeigen
    function showFeedback(step, input) {
        const qName = input.name;
        const type = step.dataset.type;
        
        let fb = step.querySelector('.answer-feedback');
        if (!fb) {
            fb = document.createElement('div');
            fb.className = 'answer-feedback';
            step.appendChild(fb);
        }
        
        if (type === 'likert' || type === 'mood') {
            fb.textContent = 'Antwort gespeichert.';
            fb.className = 'answer-feedback saved';
        } else {
            const correct = config.correctAnswers[qName];
            const isCorrect = correct && input.value === correct;
            const feedbackText = config.feedback[qName];
            const text = feedbackText 
                ? (isCorrect ? feedbackText[correct] : feedbackText.default) 
                : (isCorrect ? 'Richtig.' : 'Nicht ganz.');
            fb.textContent = text;
            fb.className = 'answer-feedback ' + (isCorrect ? 'correct' : 'incorrect');
        }
    }
    
    // Nächsten Schritt anzeigen
    function showNextStep(currentIdx) {
        const next = steps[currentIdx + 1];
        if (next) {
            next.style.display = '';
            next.querySelectorAll('input[type="radio"]').forEach(inp => inp.disabled = false);
            updateCounter(currentIdx + 1);
        } else if (submitBtn) {
            submitBtn.style.display = '';
            updateCounter(currentIdx);
        }
    }
    
    // Ergebnis berechnen
    function calculateResults() {
        const dims = ['Grundlagen', 'Anwendung', 'Bewertung', 'Ethik_Recht', 'Strategie'];
        const scores = {};
        const maxes = {};
        
        dims.forEach(d => {
            scores[d] = 0;
            maxes[d] = 0;
        });
        
        steps.forEach(step => {
            const type = step.dataset.type;
            const mod = step.dataset.module;
            const selected = step.querySelector('input[type="radio"]:checked');
            
            if (!selected || !mod) return;
            
            if (type === 'likert') {
                scores[mod] += config.likertMap[selected.value] || 0;
                maxes[mod] += 5;
            } else if (type === 'single_choice' || type === 'scenario') {
                const qName = selected.name;
                const isCorrect = selected.value === (config.correctAnswers[qName] || '');
                scores[mod] += isCorrect ? 1 : 0;
                maxes[mod] += 1;
            } else if (type === 'mood') {
                scores[mod] += config.moodMap[selected.value] || 0;
                maxes[mod] += 5;
            }
        });
        
        // Prozent pro Dimension berechnen
        let totalPct = 0;
        let count = 0;
        const percent = {};
        
        Object.keys(scores).forEach(k => {
            const p = maxes[k] ? (scores[k] / maxes[k]) : 0;
            percent[k] = p;
            if (maxes[k] > 0) {
                totalPct += p;
                count++;
            }
        });
        
        const avgPct = count ? totalPct / count : 0;
        
        // Level bestimmen
        let level = 1;
        if (avgPct >= config.levelThresholds.medium) level = 2;
        if (avgPct >= config.levelThresholds.high) level = 3;
        
        return { percent, avgPct, level };
    }
    
    // Ergebnis anzeigen
    function displayResults(results) {
        form.style.display = 'none';
        
        if (!resultsContainer) {
            console.error('[Quiz] Results container nicht gefunden');
            return;
        }
        
        resultsContainer.style.display = 'block';
        
        const card = document.getElementById('result-' + results.level);
        if (!card) {
            console.error('[Quiz] Result card nicht gefunden:', results.level);
            return;
        }
        
        card.hidden = false;
        
        // Subscores hinzufügen
        let subs = card.querySelector('.subscores');
        if (!subs) {
            subs = document.createElement('div');
            subs.className = 'subscores';
            
            const h = document.createElement('h4');
            h.textContent = 'Teilbereiche (Subscores)';
            subs.appendChild(h);
            
            const ul = document.createElement('ul');
            Object.entries(results.percent).forEach(([k, v]) => {
                const li = document.createElement('li');
                li.textContent = `${k}: ${Math.round(v * 100)}%`;
                ul.appendChild(li);
            });
            subs.appendChild(ul);
            card.appendChild(subs);
        }
    }
    
    // Event Listeners initialisieren
    function initEventListeners() {
        // Schritt-weise Navigation
        steps.forEach((step, idx) => {
            step.addEventListener('change', () => {
                const input = step.querySelector('input[type="radio"]:checked');
                if (!input) return;
                
                showFeedback(step, input);
                showNextStep(idx);
            });
        });
        
        // Form Submit
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            try {
                const results = calculateResults();
                displayResults(results);
            } catch (error) {
                console.error('[Quiz] Fehler bei der Auswertung:', error);
                // Fallback: Zeige Level 1
                displayResults({ percent: {}, avgPct: 0, level: 1 });
            }
        });
    }
    
    // Initialisierung
    try {
        updateCounter(0);
        initEventListeners();
    } catch (error) {
        console.error('[Quiz] Initialisierungsfehler:', error);
    }
})();
