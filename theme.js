// theme.js
// Re-exports theme functions from config for backwards compatibility

const { getThemeForHour, getConfig } = require('./config.cjs');

/**
 * Get theme for a given hour (legacy function for backwards compatibility)
 * @deprecated Use getThemeForHour from config.js instead
 */
function getThemeForCurrentHour(hour) {
    return getThemeForHour(hour, getConfig());
}

module.exports = { getThemeForCurrentHour, getThemeForHour };
