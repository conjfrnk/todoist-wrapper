import { contextBridge, ipcRenderer } from 'electron';

/**
 * Secure preload script exposing minimal API to renderer
 */

// Allowed theme values
const ALLOWED_THEMES = ['light', 'dark', 'system'] as const;
type AllowedTheme = (typeof ALLOWED_THEMES)[number];

function isAllowedTheme(value: unknown): value is AllowedTheme {
    return typeof value === 'string' && ALLOWED_THEMES.includes(value as AllowedTheme);
}

// Expose secure bridge to renderer
contextBridge.exposeInMainWorld('todoistBridge', {
    /**
     * Get the current theme
     */
    getTheme: (): Promise<string> => {
        return ipcRenderer.invoke('get-theme');
    },

    /**
     * Set the theme (validated)
     */
    setTheme: (theme: unknown): Promise<boolean> => {
        if (!isAllowedTheme(theme)) {
            console.warn('Invalid theme value:', theme);
            return Promise.resolve(false);
        }
        return ipcRenderer.invoke('set-theme', theme);
    },

    /**
     * Toggle the theme
     */
    toggleTheme: (): Promise<string> => {
        return ipcRenderer.invoke('toggle-theme');
    },

    /**
     * Get app version
     */
    getVersion: (): Promise<string> => {
        return ipcRenderer.invoke('get-version');
    },

    /**
     * Check if running in development mode
     */
    isDevelopment: (): Promise<boolean> => {
        return ipcRenderer.invoke('is-development');
    }
});

// Type declarations for the exposed API
declare global {
    interface Window {
        todoistBridge: {
            getTheme: () => Promise<string>;
            setTheme: (theme: string) => Promise<boolean>;
            toggleTheme: () => Promise<string>;
            getVersion: () => Promise<string>;
            isDevelopment: () => Promise<boolean>;
        };
    }
}
