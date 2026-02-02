import { ConfigService, getConfigService, getConfig } from '../../src/services/ConfigService.js';
import { DEFAULT_CONFIG } from '../../src/types/config.types.js';

describe('ConfigService', () => {
    // Store original env and reset singleton before each test
    const originalEnv = { ...process.env };

    beforeEach(() => {
        ConfigService.reset();
        // Clear all TODOIST_* and LOG_LEVEL env vars
        Object.keys(process.env).forEach(key => {
            if (key.startsWith('TODOIST_') || key === 'LOG_LEVEL' || key === 'NODE_ENV') {
                delete process.env[key];
            }
        });
    });

    afterEach(() => {
        // Restore original env
        process.env = { ...originalEnv };
        ConfigService.reset();
    });

    describe('getInstance', () => {
        test('returns singleton instance', () => {
            const instance1 = ConfigService.getInstance();
            const instance2 = ConfigService.getInstance();
            expect(instance1).toBe(instance2);
        });
    });

    describe('reset', () => {
        test('clears singleton instance', () => {
            const instance1 = ConfigService.getInstance();
            ConfigService.reset();
            const instance2 = ConfigService.getInstance();
            expect(instance1).not.toBe(instance2);
        });
    });

    describe('getConfig', () => {
        test('returns default config when no env vars set', () => {
            const config = ConfigService.getInstance().getConfig();
            expect(config).toEqual(DEFAULT_CONFIG);
        });
    });

    describe('get', () => {
        test('returns specific config value', () => {
            const service = ConfigService.getInstance();
            expect(service.get('todoistUrl')).toBe(DEFAULT_CONFIG.todoistUrl);
        });
    });

    describe('getTodoistUrl', () => {
        test('returns default URL when no env var set', () => {
            const service = ConfigService.getInstance();
            expect(service.getTodoistUrl()).toBe('https://app.todoist.com');
        });

        test('returns custom URL from env var', () => {
            process.env.TODOIST_URL = 'https://custom.todoist.com';
            const service = ConfigService.getInstance();
            expect(service.getTodoistUrl()).toBe('https://custom.todoist.com');
        });
    });

    describe('getThemeConfig', () => {
        test('returns default theme config', () => {
            const service = ConfigService.getInstance();
            const theme = service.getThemeConfig();
            expect(theme).toEqual(DEFAULT_CONFIG.theme);
        });

        test('respects env var overrides', () => {
            process.env.TODOIST_THEME_INTERVAL_MINUTES = '60';
            process.env.TODOIST_LIGHT_THEME_START_HOUR = '7';
            process.env.TODOIST_LIGHT_THEME_END_HOUR = '20';
            process.env.TODOIST_AUTO_THEME = 'false';

            const service = ConfigService.getInstance();
            const theme = service.getThemeConfig();

            expect(theme.autoToggleIntervalMinutes).toBe(60);
            expect(theme.lightThemeStartHour).toBe(7);
            expect(theme.lightThemeEndHour).toBe(20);
            expect(theme.autoToggleEnabled).toBe(false);
        });
    });

    describe('getWindowConfig', () => {
        test('returns default window config', () => {
            const service = ConfigService.getInstance();
            const window = service.getWindowConfig();
            expect(window).toEqual(DEFAULT_CONFIG.window);
        });
    });

    describe('getNetworkConfig', () => {
        test('returns default network config', () => {
            const service = ConfigService.getInstance();
            const network = service.getNetworkConfig();
            expect(network).toEqual(DEFAULT_CONFIG.network);
        });

        test('respects env var overrides', () => {
            process.env.TODOIST_MAX_RETRIES = '5';
            process.env.TODOIST_TIMEOUT_MS = '60000';

            const service = ConfigService.getInstance();
            const network = service.getNetworkConfig();

            expect(network.maxRetries).toBe(5);
            expect(network.timeoutMs).toBe(60000);
        });
    });

    describe('getStoreConfig', () => {
        test('returns default store config', () => {
            const service = ConfigService.getInstance();
            const store = service.getStoreConfig();
            expect(store).toEqual(DEFAULT_CONFIG.store);
        });
    });

    describe('getLogLevel', () => {
        test('returns default log level', () => {
            const service = ConfigService.getInstance();
            expect(service.getLogLevel()).toBe('info');
        });

        test('respects LOG_LEVEL env var', () => {
            process.env.LOG_LEVEL = 'debug';
            const service = ConfigService.getInstance();
            expect(service.getLogLevel()).toBe('debug');
        });

        test('returns default for invalid log level', () => {
            process.env.LOG_LEVEL = 'invalid';
            const service = ConfigService.getInstance();
            expect(service.getLogLevel()).toBe('info');
        });
    });

    describe('isDevelopment', () => {
        test('returns false by default', () => {
            const service = ConfigService.getInstance();
            expect(service.isDevelopment()).toBe(false);
        });

        test('returns true when NODE_ENV is development', () => {
            process.env.NODE_ENV = 'development';
            const service = ConfigService.getInstance();
            expect(service.isDevelopment()).toBe(true);
        });
    });

    describe('isProduction', () => {
        test('returns true by default', () => {
            const service = ConfigService.getInstance();
            expect(service.isProduction()).toBe(true);
        });

        test('returns false when NODE_ENV is not production', () => {
            process.env.NODE_ENV = 'development';
            const service = ConfigService.getInstance();
            expect(service.isProduction()).toBe(false);
        });
    });

    describe('isTest', () => {
        test('returns false by default', () => {
            const service = ConfigService.getInstance();
            expect(service.isTest()).toBe(false);
        });

        test('returns true when NODE_ENV is test', () => {
            process.env.NODE_ENV = 'test';
            const service = ConfigService.getInstance();
            expect(service.isTest()).toBe(true);
        });
    });

    describe('validate', () => {
        test('validates valid config', () => {
            const result = ConfigService.validate({
                todoistUrl: 'https://app.todoist.com',
                theme: {
                    autoToggleIntervalMinutes: 30,
                    lightThemeStartHour: 6,
                    lightThemeEndHour: 18,
                    autoToggleEnabled: true
                },
                window: {
                    defaultWidth: 1250,
                    defaultHeight: 1000,
                    minWidth: 100,
                    maxWidth: 10000,
                    minHeight: 100,
                    maxHeight: 10000
                },
                network: {
                    maxRetries: 3,
                    retryBaseDelayMs: 1000,
                    timeoutMs: 30000
                },
                store: {
                    name: 'todoist-wrapper-config',
                    schemaVersion: 1
                },
                logLevel: 'info',
                nodeEnv: 'production'
            });
            expect(result.success).toBe(true);
        });

        test('rejects invalid config', () => {
            const result = ConfigService.validate({
                todoistUrl: 'not-a-url'
            });
            expect(result.success).toBe(false);
        });
    });

    describe('validation fallback', () => {
        test('returns defaults when validation fails for out-of-range values', () => {
            // Set invalid values that will pass parsing but fail Zod validation
            process.env.TODOIST_THEME_INTERVAL_MINUTES = '0'; // min is 1
            process.env.TODOIST_LIGHT_THEME_START_HOUR = '25'; // max is 23

            const service = ConfigService.getInstance();
            const config = service.getConfig();

            // Should return defaults when validation fails
            expect(config).toEqual(DEFAULT_CONFIG);
        });
    });
});

describe('getConfigService', () => {
    beforeEach(() => {
        ConfigService.reset();
    });

    afterEach(() => {
        ConfigService.reset();
    });

    test('returns ConfigService singleton', () => {
        const service = getConfigService();
        expect(service).toBe(ConfigService.getInstance());
    });
});

describe('getConfig', () => {
    beforeEach(() => {
        ConfigService.reset();
    });

    afterEach(() => {
        ConfigService.reset();
    });

    test('returns config from singleton', () => {
        const config = getConfig();
        // Config should match singleton's config
        expect(config).toBe(ConfigService.getInstance().getConfig());
    });
});
