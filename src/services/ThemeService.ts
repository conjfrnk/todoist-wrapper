import { nativeTheme } from 'electron';
import type {
    Theme,
    ThemeServiceConfig,
    ThemeServiceInterface,
    ThemeTransition
} from '../types/theme.types.js';
import { getLogger } from './LoggerService.js';
import type { LoggerService } from './LoggerService.js';
import { getStore } from './StoreService.js';
import type { StoreService } from './StoreService.js';

/**
 * ThemeService - Theme management with optimized auto-toggle scheduling
 */
export class ThemeService implements ThemeServiceInterface {
    private config: ThemeServiceConfig;
    private logger: LoggerService;
    private store: StoreService;
    private autoToggleTimeout: ReturnType<typeof setTimeout> | null = null;
    private static instance: ThemeService | null = null;

    private constructor(config: ThemeServiceConfig) {
        this.config = config;
        this.logger = getLogger('ThemeService');
        this.store = getStore();
    }

    /**
     * Initialize singleton instance
     */
    public static initialize(config: ThemeServiceConfig): ThemeService {
        if (!ThemeService.instance) {
            ThemeService.instance = new ThemeService(config);
        }
        return ThemeService.instance;
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): ThemeService {
        if (!ThemeService.instance) {
            throw new Error('ThemeService not initialized. Call initialize() first.');
        }
        return ThemeService.instance;
    }

    /**
     * Reset singleton (mainly for testing)
     */
    public static reset(): void {
        if (ThemeService.instance) {
            ThemeService.instance.destroy();
        }
        ThemeService.instance = null;
    }

    /**
     * Get the current theme
     */
    public getCurrentTheme(): Theme {
        return nativeTheme.themeSource as Theme;
    }

    /**
     * Set the theme
     */
    public setTheme(theme: Theme): void {
        nativeTheme.themeSource = theme;
        this.store.setTheme(theme === 'system' ? 'system' : theme);
        this.logger.info('Theme set', { theme });
    }

    /**
     * Toggle between light and dark themes
     */
    public toggleTheme(): Theme {
        const newTheme = nativeTheme.shouldUseDarkColors ? 'light' : 'dark';
        this.setTheme(newTheme);
        this.logger.info('Theme toggled', { newTheme });
        return newTheme;
    }

    /**
     * Get theme for a given hour based on configuration
     */
    public getThemeForHour(hour: number): 'light' | 'dark' {
        const { lightThemeStartHour, lightThemeEndHour } = this.config;
        return hour >= lightThemeStartHour && hour < lightThemeEndHour ? 'light' : 'dark';
    }

    /**
     * Calculate the next theme transition
     */
    public getNextTransition(): ThemeTransition {
        const now = new Date();
        const currentHour = now.getHours();
        const currentTheme = this.getThemeForHour(currentHour);

        let nextTransitionHour: number;
        let nextTheme: 'light' | 'dark';

        if (currentTheme === 'light') {
            // Currently light, next transition is to dark
            nextTransitionHour = this.config.lightThemeEndHour;
            nextTheme = 'dark';
        } else {
            // Currently dark, next transition is to light
            nextTransitionHour = this.config.lightThemeStartHour;
            nextTheme = 'light';
        }

        // Calculate next transition time
        const nextTransition = new Date(now);
        nextTransition.setHours(nextTransitionHour, 0, 0, 0);

        // If the transition time has passed today, it's tomorrow
        if (nextTransition <= now) {
            nextTransition.setDate(nextTransition.getDate() + 1);
        }

        const msUntilTransition = nextTransition.getTime() - now.getTime();

        return {
            nextTheme,
            transitionTime: nextTransition,
            msUntilTransition
        };
    }

    /**
     * Start auto-toggle scheduling using setTimeout to exact transition times
     */
    public startAutoToggle(): void {
        if (!this.config.autoToggleEnabled) {
            this.logger.info('Auto theme toggle is disabled');
            return;
        }

        // Apply initial theme based on current hour
        const currentHour = new Date().getHours();
        const initialTheme = this.getThemeForHour(currentHour);
        if (nativeTheme.themeSource !== initialTheme) {
            this.setTheme(initialTheme);
        }

        // Schedule next transition
        this.scheduleNextTransition();

        this.logger.info('Auto theme toggle started', {
            lightHours: `${this.config.lightThemeStartHour}:00 - ${this.config.lightThemeEndHour}:00`
        });
    }

    /**
     * Schedule the next theme transition
     */
    private scheduleNextTransition(): void {
        // Clear any existing timeout
        if (this.autoToggleTimeout) {
            clearTimeout(this.autoToggleTimeout);
        }

        const transition = this.getNextTransition();

        // Cap at maximum setTimeout delay (24 hours in ms)
        const maxDelay = 24 * 60 * 60 * 1000;
        const delay = Math.min(transition.msUntilTransition, maxDelay);

        this.autoToggleTimeout = setTimeout(() => {
            this.performAutoTransition(transition.nextTheme);
        }, delay);

        this.logger.debug('Next theme transition scheduled', {
            nextTheme: transition.nextTheme,
            transitionTime: transition.transitionTime.toISOString(),
            delayMs: delay
        });
    }

    /**
     * Perform auto theme transition
     */
    private performAutoTransition(theme: 'light' | 'dark'): void {
        if (nativeTheme.themeSource !== theme) {
            this.setTheme(theme);
            this.logger.info('Theme auto-transitioned', { theme });
        }

        // Schedule the next transition
        this.scheduleNextTransition();
    }

    /**
     * Stop auto-toggle scheduling
     */
    public stopAutoToggle(): void {
        if (this.autoToggleTimeout) {
            clearTimeout(this.autoToggleTimeout);
            this.autoToggleTimeout = null;
            this.logger.info('Auto theme toggle stopped');
        }
    }

    /**
     * Clean up resources
     */
    public destroy(): void {
        this.stopAutoToggle();
    }

    /**
     * Restore theme from store
     */
    public restoreTheme(): void {
        const savedTheme = this.store.getTheme();
        if (savedTheme && savedTheme !== 'system') {
            nativeTheme.themeSource = savedTheme;
            this.logger.info('Theme restored from store', { theme: savedTheme });
        }
    }

    /**
     * Check if auto-toggle is currently running
     */
    public isAutoToggleRunning(): boolean {
        return this.autoToggleTimeout !== null;
    }
}

// Legacy function for backwards compatibility
export function getThemeForHour(hour: number, config: ThemeServiceConfig): 'light' | 'dark' {
    const { lightThemeStartHour, lightThemeEndHour } = config;
    return hour >= lightThemeStartHour && hour < lightThemeEndHour ? 'light' : 'dark';
}

// Export singleton getter for convenience
export function getTheme(): ThemeService {
    return ThemeService.getInstance();
}
