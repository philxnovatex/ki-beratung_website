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
                    necessary: { readOnly: true }
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
})();
