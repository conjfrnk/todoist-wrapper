import { z } from 'zod';
import { AppConfigSchema, type AppConfig, DEFAULT_CONFIG } from '../types/config.types.js';
import { parseEnvBool, parseEnvInt, parseEnvString, parseEnvEnum } from '../utils/env-parser.js';

/**
 * ConfigService - Manages application configuration with Zod validation
 * Supports environment variable overrides and config file loading
 */
export class ConfigService {
    private config: AppConfig;
    private static instance: ConfigService | null = null;

    private constructor() {
        this.config = this.loadConfig();
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): ConfigService {
        if (!ConfigService.instance) {
            ConfigService.instance = new ConfigService();
        }
        return ConfigService.instance;
    }

    /**
     * Reset singleton (mainly for testing)
     */
    public static reset(): void {
        ConfigService.instance = null;
    }

    /**
     * Get the full configuration object
     */
    public getConfig(): AppConfig {
        return this.config;
    }

    /**
     * Get a specific config value
     */
    public get<K extends keyof AppConfig>(key: K): AppConfig[K] {
        return this.config[key];
    }

    /**
     * Get Todoist URL
     */
    public getTodoistUrl(): string {
        return this.config.todoistUrl;
    }

    /**
     * Get theme configuration
     */
    public getThemeConfig(): AppConfig['theme'] {
        return this.config.theme;
    }

    /**
     * Get window configuration
     */
    public getWindowConfig(): AppConfig['window'] {
        return this.config.window;
    }

    /**
     * Get network configuration
     */
    public getNetworkConfig(): AppConfig['network'] {
        return this.config.network;
    }

    /**
     * Get store configuration
     */
    public getStoreConfig(): AppConfig['store'] {
        return this.config.store;
    }

    /**
     * Get log level
     */
    public getLogLevel(): AppConfig['logLevel'] {
        return this.config.logLevel;
    }

    /**
     * Check if running in development mode
     */
    public isDevelopment(): boolean {
        return this.config.nodeEnv === 'development';
    }

    /**
     * Check if running in production mode
     */
    public isProduction(): boolean {
        return this.config.nodeEnv === 'production';
    }

    /**
     * Check if running in test mode
     */
    public isTest(): boolean {
        return this.config.nodeEnv === 'test';
    }

    /**
     * Load configuration from environment variables with validation
     */
    private loadConfig(): AppConfig {
        const env = process.env;

        const rawConfig = {
            todoistUrl: parseEnvString(env.TODOIST_URL, DEFAULT_CONFIG.todoistUrl),
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
            store: { ...DEFAULT_CONFIG.store },
            logLevel: parseEnvEnum(
                env.LOG_LEVEL,
                ['debug', 'info', 'warn', 'error'] as const,
                DEFAULT_CONFIG.logLevel
            ),
            nodeEnv: parseEnvEnum(
                env.NODE_ENV,
                ['development', 'production', 'test'] as const,
                DEFAULT_CONFIG.nodeEnv
            )
        };

        // Validate the config with Zod
        const result = AppConfigSchema.safeParse(rawConfig);

        if (!result.success) {
            console.error('Configuration validation failed:', result.error.format());
            // Return defaults on validation failure
            return DEFAULT_CONFIG;
        }

        return result.data;
    }

    /**
     * Validate a partial config object
     */
    public static validate(config: unknown): z.SafeParseReturnType<unknown, AppConfig> {
        return AppConfigSchema.safeParse(config);
    }
}

// Export singleton getter for convenience
export function getConfigService(): ConfigService {
    return ConfigService.getInstance();
}

// Export config getter for backwards compatibility
export function getConfig(): AppConfig {
    return ConfigService.getInstance().getConfig();
}
