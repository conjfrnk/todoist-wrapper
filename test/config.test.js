// test/config.test.js

const {
    DEFAULT_CONFIG,
    getConfig,
    getThemeForHour,
    isSafeForExternalOpen,
    validateBounds,
    parseEnvBool,
    parseEnvInt
} = require('../config.cjs');

describe('parseEnvBool', () => {
    test('returns default for undefined', () => {
        expect(parseEnvBool(undefined, true)).toBe(true);
        expect(parseEnvBool(undefined, false)).toBe(false);
    });

    test('returns default for empty string', () => {
        expect(parseEnvBool('', true)).toBe(true);
    });

    test('parses "true" as true', () => {
        expect(parseEnvBool('true', false)).toBe(true);
        expect(parseEnvBool('TRUE', false)).toBe(true);
    });

    test('parses "1" as true', () => {
        expect(parseEnvBool('1', false)).toBe(true);
    });

    test('parses other values as false', () => {
        expect(parseEnvBool('false', true)).toBe(false);
        expect(parseEnvBool('0', true)).toBe(false);
        expect(parseEnvBool('no', true)).toBe(false);
    });
});

describe('parseEnvInt', () => {
    test('returns default for undefined', () => {
        expect(parseEnvInt(undefined, 42)).toBe(42);
    });

    test('returns default for empty string', () => {
        expect(parseEnvInt('', 42)).toBe(42);
    });

    test('parses valid integers', () => {
        expect(parseEnvInt('123', 0)).toBe(123);
        expect(parseEnvInt('-5', 0)).toBe(-5);
    });

    test('returns default for invalid integers', () => {
        expect(parseEnvInt('not-a-number', 42)).toBe(42);
        expect(parseEnvInt('12.34', 42)).toBe(12); // parseInt truncates
    });
});

describe('getConfig', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    test('returns default config when no env vars set', () => {
        const config = getConfig();
        expect(config.todoistUrl).toBe(DEFAULT_CONFIG.todoistUrl);
        expect(config.theme.autoToggleIntervalMinutes).toBe(30);
        expect(config.theme.lightThemeStartHour).toBe(6);
        expect(config.theme.lightThemeEndHour).toBe(18);
    });

    test('overrides todoistUrl from env', () => {
        process.env.TODOIST_URL = 'https://custom.todoist.com';
        const config = getConfig();
        expect(config.todoistUrl).toBe('https://custom.todoist.com');
    });

    test('overrides theme settings from env', () => {
        process.env.TODOIST_THEME_INTERVAL_MINUTES = '60';
        process.env.TODOIST_LIGHT_THEME_START_HOUR = '8';
        process.env.TODOIST_LIGHT_THEME_END_HOUR = '20';
        process.env.TODOIST_AUTO_THEME = 'false';

        const config = getConfig();
        expect(config.theme.autoToggleIntervalMinutes).toBe(60);
        expect(config.theme.lightThemeStartHour).toBe(8);
        expect(config.theme.lightThemeEndHour).toBe(20);
        expect(config.theme.autoToggleEnabled).toBe(false);
    });

    test('overrides network settings from env', () => {
        process.env.TODOIST_MAX_RETRIES = '5';
        process.env.TODOIST_TIMEOUT_MS = '60000';

        const config = getConfig();
        expect(config.network.maxRetries).toBe(5);
        expect(config.network.timeoutMs).toBe(60000);
    });
});

describe('getThemeForHour', () => {
    const defaultConfig = getConfig();

    test('returns light theme during daytime hours (6-17)', () => {
        expect(getThemeForHour(6, defaultConfig)).toBe('light');
        expect(getThemeForHour(9, defaultConfig)).toBe('light');
        expect(getThemeForHour(12, defaultConfig)).toBe('light');
        expect(getThemeForHour(17, defaultConfig)).toBe('light');
    });

    test('returns dark theme during nighttime hours (18-5)', () => {
        expect(getThemeForHour(18, defaultConfig)).toBe('dark');
        expect(getThemeForHour(21, defaultConfig)).toBe('dark');
        expect(getThemeForHour(0, defaultConfig)).toBe('dark');
        expect(getThemeForHour(5, defaultConfig)).toBe('dark');
    });

    test('respects custom theme hours', () => {
        const customConfig = {
            ...defaultConfig,
            theme: {
                ...defaultConfig.theme,
                lightThemeStartHour: 8,
                lightThemeEndHour: 20
            }
        };
        expect(getThemeForHour(7, customConfig)).toBe('dark');
        expect(getThemeForHour(8, customConfig)).toBe('light');
        expect(getThemeForHour(19, customConfig)).toBe('light');
        expect(getThemeForHour(20, customConfig)).toBe('dark');
    });
});

describe('isSafeForExternalOpen', () => {
    const defaultConfig = getConfig();

    describe('valid URLs', () => {
        test('allows https URLs not on todoist.com', () => {
            expect(isSafeForExternalOpen('https://google.com', defaultConfig)).toBe(true);
            expect(isSafeForExternalOpen('https://example.org/path', defaultConfig)).toBe(true);
        });

        test('allows http URLs not on todoist.com', () => {
            expect(isSafeForExternalOpen('http://example.com', defaultConfig)).toBe(true);
        });
    });

    describe('blocked URLs', () => {
        test('blocks todoist.com URLs', () => {
            expect(isSafeForExternalOpen('https://app.todoist.com', defaultConfig)).toBe(false);
            expect(isSafeForExternalOpen('https://app.todoist.com/app', defaultConfig)).toBe(false);
        });

        test('blocks javascript: URLs', () => {
            expect(isSafeForExternalOpen('javascript:alert(1)', defaultConfig)).toBe(false);
        });

        test('blocks data: URLs', () => {
            expect(isSafeForExternalOpen('data:text/html,<h1>test</h1>', defaultConfig)).toBe(
                false
            );
        });

        test('blocks file: URLs', () => {
            expect(isSafeForExternalOpen('file:///etc/passwd', defaultConfig)).toBe(false);
        });

        test('blocks about: URLs', () => {
            expect(isSafeForExternalOpen('about:blank', defaultConfig)).toBe(false);
        });

        test('returns false for invalid URLs', () => {
            expect(isSafeForExternalOpen('not-a-url', defaultConfig)).toBe(false);
            expect(isSafeForExternalOpen('', defaultConfig)).toBe(false);
        });
    });

    describe('custom todoist URL', () => {
        test('blocks custom todoist domain', () => {
            const customConfig = {
                ...defaultConfig,
                todoistUrl: 'https://enterprise.todoist.com'
            };
            expect(isSafeForExternalOpen('https://enterprise.todoist.com', customConfig)).toBe(
                false
            );
            expect(isSafeForExternalOpen('https://app.todoist.com', customConfig)).toBe(true);
        });
    });
});

describe('validateBounds', () => {
    const screenWidth = 1920;
    const screenHeight = 1080;
    const defaultConfig = getConfig();

    test('returns defaults for null/undefined bounds', () => {
        const result = validateBounds(null, screenWidth, screenHeight, defaultConfig);
        expect(result.width).toBe(DEFAULT_CONFIG.window.defaultWidth);
        expect(result.height).toBe(DEFAULT_CONFIG.window.defaultHeight);
    });

    test('returns defaults for empty object', () => {
        const result = validateBounds({}, screenWidth, screenHeight, defaultConfig);
        expect(result.width).toBe(DEFAULT_CONFIG.window.defaultWidth);
        expect(result.height).toBe(DEFAULT_CONFIG.window.defaultHeight);
    });

    test('validates width within bounds', () => {
        const result = validateBounds({ width: 800 }, screenWidth, screenHeight, defaultConfig);
        expect(result.width).toBe(800);
    });

    test('constrains width to screen width', () => {
        const result = validateBounds({ width: 3000 }, screenWidth, screenHeight, defaultConfig);
        expect(result.width).toBe(screenWidth);
    });

    test('rejects width below minimum', () => {
        const result = validateBounds({ width: 50 }, screenWidth, screenHeight, defaultConfig);
        expect(result.width).toBe(DEFAULT_CONFIG.window.defaultWidth);
    });

    test('rejects width above maximum', () => {
        const result = validateBounds({ width: 20000 }, screenWidth, screenHeight, defaultConfig);
        expect(result.width).toBe(DEFAULT_CONFIG.window.defaultWidth);
    });

    test('validates height within bounds', () => {
        const result = validateBounds({ height: 600 }, screenWidth, screenHeight, defaultConfig);
        expect(result.height).toBe(600);
    });

    test('constrains height to screen height', () => {
        const result = validateBounds({ height: 2000 }, screenWidth, screenHeight, defaultConfig);
        expect(result.height).toBe(screenHeight);
    });

    test('validates x position', () => {
        const result = validateBounds(
            { width: 800, x: 100 },
            screenWidth,
            screenHeight,
            defaultConfig
        );
        expect(result.x).toBe(100);
    });

    test('constrains x position to keep window partially visible', () => {
        // Window too far right
        const result1 = validateBounds(
            { width: 800, x: 2000 },
            screenWidth,
            screenHeight,
            defaultConfig
        );
        expect(result1.x).toBe(screenWidth - 100);

        // Window too far left
        const result2 = validateBounds(
            { width: 800, x: -1000 },
            screenWidth,
            screenHeight,
            defaultConfig
        );
        expect(result2.x).toBe(-800 + 100);
    });

    test('validates y position', () => {
        const result = validateBounds(
            { height: 600, y: 100 },
            screenWidth,
            screenHeight,
            defaultConfig
        );
        expect(result.y).toBe(100);
    });

    test('constrains y position to keep window partially visible', () => {
        // Window too far down
        const result1 = validateBounds(
            { height: 600, y: 1500 },
            screenWidth,
            screenHeight,
            defaultConfig
        );
        expect(result1.y).toBe(screenHeight - 50);

        // Y cannot go below 0
        const result2 = validateBounds(
            { height: 600, y: -100 },
            screenWidth,
            screenHeight,
            defaultConfig
        );
        expect(result2.y).toBe(0);
    });

    test('rejects non-number values', () => {
        const result = validateBounds(
            { width: 'invalid', height: null, x: undefined, y: {} },
            screenWidth,
            screenHeight,
            defaultConfig
        );
        expect(result.width).toBe(DEFAULT_CONFIG.window.defaultWidth);
        expect(result.height).toBe(DEFAULT_CONFIG.window.defaultHeight);
        expect(result.x).toBeUndefined();
        expect(result.y).toBeUndefined();
    });
});
