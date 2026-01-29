// config.js - Configuration management with environment variable support

const DEFAULT_CONFIG = {
    // Todoist URL (can be overridden for enterprise customers)
    todoistUrl: 'https://app.todoist.com',

    // Theme settings
    theme: {
        // Auto-toggle interval in minutes
        autoToggleIntervalMinutes: 30,
        // Hours for light theme (24-hour format)
        lightThemeStartHour: 6,
        lightThemeEndHour: 18,
        // Enable/disable auto theme toggle
        autoToggleEnabled: true
    },

    // Window defaults
    window: {
        defaultWidth: 1250,
        defaultHeight: 1000,
        minWidth: 100,
        maxWidth: 10000,
        minHeight: 100,
        maxHeight: 10000
    },

    // Network settings
    network: {
        // Number of retry attempts for loading URL
        maxRetries: 3,
        // Base delay for exponential backoff (ms)
        retryBaseDelayMs: 1000,
        // Request timeout (ms)
        timeoutMs: 30000
    },

    // Store settings
    store: {
        name: 'todoist-wrapper-config',
        schemaVersion: 1
    }
};

/**
 * Parse a boolean from environment variable
 */
function parseEnvBool(value, defaultValue) {
    if (value === undefined || value === null || value === '') {
        return defaultValue;
    }
    return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Parse an integer from environment variable
 */
function parseEnvInt(value, defaultValue) {
    if (value === undefined || value === null || value === '') {
        return defaultValue;
    }
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Get configuration with environment variable overrides
 */
function getConfig() {
    const env = process.env;

    return {
        todoistUrl: env.TODOIST_URL || DEFAULT_CONFIG.todoistUrl,

        theme: {
            autoToggleIntervalMinutes: parseEnvInt(
                env.TODOIST_THEME_INTERVAL_MINUTES,
                DEFAULT_CONFIG.theme.autoToggleIntervalMinutes
            ),
            lightThemeStartHour: parseEnvInt(
                env.TODOIST_LIGHT_THEME_START_HOUR,
                DEFAULT_CONFIG.theme.lightThemeStartHour
            ),
            lightThemeEndHour: parseEnvInt(
                env.TODOIST_LIGHT_THEME_END_HOUR,
                DEFAULT_CONFIG.theme.lightThemeEndHour
            ),
            autoToggleEnabled: parseEnvBool(
                env.TODOIST_AUTO_THEME,
                DEFAULT_CONFIG.theme.autoToggleEnabled
            )
        },

        window: { ...DEFAULT_CONFIG.window },

        network: {
            maxRetries: parseEnvInt(env.TODOIST_MAX_RETRIES, DEFAULT_CONFIG.network.maxRetries),
            retryBaseDelayMs: DEFAULT_CONFIG.network.retryBaseDelayMs,
            timeoutMs: parseEnvInt(env.TODOIST_TIMEOUT_MS, DEFAULT_CONFIG.network.timeoutMs)
        },

        store: { ...DEFAULT_CONFIG.store }
    };
}

/**
 * Get theme for a given hour based on configuration
 */
function getThemeForHour(hour, config = getConfig()) {
    const { lightThemeStartHour, lightThemeEndHour } = config.theme;
    return hour >= lightThemeStartHour && hour < lightThemeEndHour ? 'light' : 'dark';
}

/**
 * Validate a URL is safe for external opening
 * Uses a more restrictive approach - only opens HTTP(S) URLs that are not Todoist
 */
function isSafeForExternalOpen(url, config = getConfig()) {
    try {
        const parsedUrl = new URL(url);

        // Only allow http and https protocols
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
            return false;
        }

        // Get the configured Todoist origin
        const todoistOrigin = new URL(config.todoistUrl).origin;

        // Don't open Todoist URLs externally
        if (parsedUrl.origin === todoistOrigin) {
            return false;
        }

        // Block potentially dangerous URLs
        const blockedPatterns = [/^javascript:/i, /^data:/i, /^file:/i, /^about:/i];

        for (const pattern of blockedPatterns) {
            if (pattern.test(url)) {
                return false;
            }
        }

        return true;
    } catch {
        return false;
    }
}

/**
 * Validate window bounds against constraints
 */
function validateBounds(bounds, screenWidth, screenHeight, config = getConfig()) {
    const { window: winConfig } = config;
    const defaults = {
        width: winConfig.defaultWidth,
        height: winConfig.defaultHeight
    };
    const validated = { ...defaults };

    if (bounds && typeof bounds === 'object') {
        // Validate width
        if (
            typeof bounds.width === 'number' &&
            bounds.width >= winConfig.minWidth &&
            bounds.width <= winConfig.maxWidth
        ) {
            validated.width = Math.min(bounds.width, screenWidth);
        }
        // Validate height
        if (
            typeof bounds.height === 'number' &&
            bounds.height >= winConfig.minHeight &&
            bounds.height <= winConfig.maxHeight
        ) {
            validated.height = Math.min(bounds.height, screenHeight);
        }
        // Validate x position
        if (typeof bounds.x === 'number') {
            const minX = -validated.width + 100;
            const maxX = screenWidth - 100;
            validated.x = Math.max(minX, Math.min(bounds.x, maxX));
        }
        // Validate y position
        if (typeof bounds.y === 'number') {
            const minY = 0;
            const maxY = screenHeight - 50;
            validated.y = Math.max(minY, Math.min(bounds.y, maxY));
        }
    }

    return validated;
}

// CommonJS exports for compatibility with existing tests
module.exports = {
    DEFAULT_CONFIG,
    getConfig,
    getThemeForHour,
    isSafeForExternalOpen,
    validateBounds,
    parseEnvBool,
    parseEnvInt
};
