/**
 * Cookie Consent Konfiguration
 * Ausgelagert aus index.html für bessere Wartbarkeit und Caching
 */
(function initCookieConsent() {
    'use strict';
    
    // Warten bis DOM und CookieConsent Library geladen sind
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    function init() {
        // Prüfen ob CookieConsent verfügbar ist
        if (typeof CookieConsent === 'undefined') {
            console.warn('[Cookie Consent] Library nicht geladen');
            return;
        }
        
        try {
            CookieConsent.run({
                guiOptions: {
                    consentModal: { 
                        layout: 'box', 
                        position: 'bottom right', 
                        equalWeightButtons: true, 
                        flipButtons: false 
                    },
                    preferencesModal: { 
                        layout: 'box', 
                        position: 'right', 
                        equalWeightButtons: true, 
                        flipButtons: false 
                    }
                },
                categories: {
                    necessary: { readOnly: true },
                    analytics: {}
                },
                // Wird bei jedem Seitenaufruf aufgerufen wenn bereits Consent vorliegt
                onConsent: function() {
                    if (CookieConsent.acceptedCategory('analytics')) {
                        loadLeadsyTracking();
                    }
                },
                // Wird aufgerufen wenn der User seine Einstellungen ändert
                onChange: function() {
                    if (CookieConsent.acceptedCategory('analytics')) {
                        loadLeadsyTracking();
                    }
                },
                language: {
                    default: 'de',
                    translations: {
                        de: {
                            consentModal: {
                                title: 'Wir verwenden Cookies',
                                description: 'Um Ihre Erfahrung auf unserer Seite zu verbessern, nutzen wir Cookies. Einige sind technisch notwendig, andere helfen uns, die Seite zu optimieren.',
                                acceptAllBtn: 'Alle akzeptieren',
                                acceptNecessaryBtn: 'Nur notwendige',
                                showPreferencesBtn: 'Einstellungen',
                                closeIconLabel: 'Schließen'
                            },
                            preferencesModal: {
                                title: 'Cookie-Einstellungen',
                                acceptAllBtn: 'Alle akzeptieren',
                                acceptNecessaryBtn: 'Nur notwendige',
                                savePreferencesBtn: 'Auswahl speichern',
                                closeIconLabel: 'Schließen',
                                sections: [
                                    {
                                        title: 'Cookie-Nutzung',
                                        description: 'Sie können hier auswählen, welche Cookies Sie zulassen möchten.'
                                    },
                                    {
                                        title: 'Notwendige Cookies',
                                        description: 'Diese Cookies sind für die Grundfunktionen der Website erforderlich und können nicht deaktiviert werden.',
                                        linkedCategory: 'necessary'
                                    },
                                    {
                                        title: 'Analyse & Tracking',
                                        description: 'Diese Cookies helfen uns zu verstehen, wie Besucher unsere Website nutzen. Die Daten werden anonymisiert erhoben.',
                                        linkedCategory: 'analytics'
                                    }
                                ]
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('[Cookie Consent] Initialisierungsfehler:', error);
        }
    }

    // Leadsy.ai Tracking erst laden wenn Analytics-Consent erteilt wurde
    function loadLeadsyTracking() {
        if (document.getElementById('vtag-ai-js')) return; // bereits geladen
        var s = document.createElement('script');
        s.id = 'vtag-ai-js';
        s.async = true;
        s.src = 'https://r2.leadsy.ai/tag.js';
        s.setAttribute('data-pid', 'S4KAX14a3TXfaOvV');
        s.setAttribute('data-version', '062024');
        document.head.appendChild(s);
    }
})();
