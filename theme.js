// theme.js

function getThemeForCurrentHour(hour) {
    return (hour >= 6 && hour < 18) ? 'light' : 'dark';
}

module.exports = { getThemeForCurrentHour };
