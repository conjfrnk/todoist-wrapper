// test/theme.test.js

const { getThemeForCurrentHour } = require('../theme');

test('theme should be light during morning (e.g., 9 AM)', () => {
    expect(getThemeForCurrentHour(9)).toBe('light');
});

test('theme should be dark at night (e.g., 21)', () => {
    expect(getThemeForCurrentHour(21)).toBe('dark');
});
