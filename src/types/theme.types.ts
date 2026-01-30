export type Theme = 'light' | 'dark' | 'system';

export interface ThemeServiceConfig {
    autoToggleEnabled: boolean;
    autoToggleIntervalMinutes: number;
    lightThemeStartHour: number;
    lightThemeEndHour: number;
}

export interface ThemeServiceInterface {
    getCurrentTheme(): Theme;
    setTheme(theme: Theme): void;
    toggleTheme(): Theme;
    getThemeForHour(hour: number): 'light' | 'dark';
    startAutoToggle(): void;
    stopAutoToggle(): void;
    destroy(): void;
}

export interface ThemeTransition {
    nextTheme: 'light' | 'dark';
    transitionTime: Date;
    msUntilTransition: number;
}
