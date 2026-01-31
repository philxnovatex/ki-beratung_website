/**
 * Server Configuration
 * Zentrale Konfiguration für Express-Server
 * Werte können durch Umgebungsvariablen überschrieben werden
 */
module.exports = {
    // Server
    port: parseInt(process.env.PORT, 10) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // Rate Limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 Minuten
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX, 10) || 5
    },
    
    // SMTP (Newsletter)
    smtp: {
        host: process.env.SMTP_HOST || null,
        port: parseInt(process.env.SMTP_PORT, 10) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER || null,
        pass: process.env.SMTP_PASS || null,
        from: process.env.SMTP_FROM || 'noreply@neuratex.de'
    },
    
    // Admin
    admin: {
        user: process.env.ADMIN_USER || null,
        pass: process.env.ADMIN_PASS || null,
        token: process.env.ADMIN_TOKEN || null
    },
    
    // Content Security Policy
    csp: {
        defaultSrc: ["'self'"],
        scriptSrc: [
            "'self'",
            "'unsafe-inline'", // Für Legacy-Inline-Scripts (TODO: entfernen wenn möglich)
            "https://cdnjs.cloudflare.com",
            "https://cdn.jsdelivr.net",
            "https://r2.leadsy.ai"
        ],
        styleSrc: [
            "'self'",
            "'unsafe-inline'", // Für inline styles
            "https://fonts.googleapis.com",
            "https://cdn.jsdelivr.net",
            "https://cdnjs.cloudflare.com"
        ],
        fontSrc: [
            "'self'",
            "https://fonts.gstatic.com",
            "https://cdnjs.cloudflare.com"
        ],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://calendly.com"],
        frameSrc: ["'self'", "https://calendly.com"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"]
    },
    
    // Compression
    compression: {
        level: 6, // 1-9, höher = mehr Kompression, mehr CPU
        threshold: 1024 // Nur Dateien > 1KB komprimieren
    },
    
    // Logging
    logging: {
        level: process.env.LOG_LEVEL || 'info' // 'debug', 'info', 'warn', 'error'
    }
};
