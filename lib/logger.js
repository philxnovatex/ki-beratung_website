/**
 * Simple Logger
 * Strukturiertes Logging mit Levels
 * In Production: Ersetzen durch Winston, Pino oder ähnliches
 */
const config = require('../config');

const LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
};

const currentLevel = LEVELS[config.logging.level] ?? LEVELS.info;

function formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

const logger = {
    debug(message, meta) {
        if (currentLevel <= LEVELS.debug) {
            console.log(formatMessage('debug', message, meta));
        }
    },
    
    info(message, meta) {
        if (currentLevel <= LEVELS.info) {
            console.log(formatMessage('info', message, meta));
        }
    },
    
    warn(message, meta) {
        if (currentLevel <= LEVELS.warn) {
            console.warn(formatMessage('warn', message, meta));
        }
    },
    
    error(message, meta) {
        if (currentLevel <= LEVELS.error) {
            console.error(formatMessage('error', message, meta));
        }
    },
    
    // Express-kompatible Request-Logger Middleware
    requestLogger(req, res, next) {
        const start = Date.now();
        
        res.on('finish', () => {
            const duration = Date.now() - start;
            logger.info(`${req.method} ${req.path}`, {
                status: res.statusCode,
                duration: `${duration}ms`,
                ip: req.ip
            });
        });
        
        next();
    }
};

module.exports = logger;
