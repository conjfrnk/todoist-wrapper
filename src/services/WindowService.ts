import { BrowserWindow, screen, shell, Menu } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
    WindowBounds,
    ValidatedWindowBounds,
    WindowServiceOptions,
    WindowServiceInterface
} from '../types/window.types.js';
import { validateBounds, boundsChanged, createBoundsContext } from '../utils/bounds-validator.js';
import { getLogger } from './LoggerService.js';
import type { LoggerService } from './LoggerService.js';
import { getStore } from './StoreService.js';
import type { StoreService } from './StoreService.js';
import { getSecurity } from './SecurityService.js';
import type { SecurityService } from './SecurityService.js';
import { getNetwork } from './NetworkService.js';
import type { NetworkService } from './NetworkService.js';
import { getTheme } from './ThemeService.js';
import type { ThemeService } from './ThemeService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * WindowService - Window lifecycle management with security features
 */
export class WindowService implements WindowServiceInterface {
    private window: BrowserWindow | null = null;
    private options: WindowServiceOptions;
    private logger: LoggerService;
    private store: StoreService;
    private security: SecurityService;
    private network: NetworkService;
    private theme: ThemeService;
    private todoistUrl: string;
    private boundsTimeout: ReturnType<typeof setTimeout> | null = null;
    private lastSavedBounds: WindowBounds | null = null;
    private eventListenersSetup: boolean = false;
    private static instance: WindowService | null = null;

    private constructor(todoistUrl: string, options: WindowServiceOptions) {
        this.todoistUrl = todoistUrl;
        this.options = options;
        this.logger = getLogger('WindowService');
        this.store = getStore();
        this.security = getSecurity();
        this.network = getNetwork();
        this.theme = getTheme();
    }

    /**
     * Initialize singleton instance
     */
    public static initialize(todoistUrl: string, options: WindowServiceOptions): WindowService {
        if (!WindowService.instance) {
            WindowService.instance = new WindowService(todoistUrl, options);
        }
        return WindowService.instance;
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): WindowService {
        if (!WindowService.instance) {
            throw new Error('WindowService not initialized. Call initialize() first.');
        }
        return WindowService.instance;
    }

    /**
     * Reset singleton (mainly for testing)
     */
    public static reset(): void {
        WindowService.instance = null;
    }

    /**
     * Get the BrowserWindow instance
     */
    public getWindow(): BrowserWindow | null {
        return this.window;
    }

    /**
     * Create and configure the main window
     */
    public async createWindow(): Promise<void> {
        const bounds = this.getValidatedBounds();

        this.logger.info('Creating window with bounds', { ...bounds });

        const windowOptions: Electron.BrowserWindowConstructorOptions = {
            width: bounds.width,
            height: bounds.height,
            show: false, // Don't show until ready
            webPreferences: {
                contextIsolation: true,
                nodeIntegration: false,
                sandbox: true,
                preload: path.join(__dirname, 'preload.js')
            },
            autoHideMenuBar: true,
            frame: true
        };

        // Add position if available
        if (typeof bounds.x === 'number' && typeof bounds.y === 'number') {
            windowOptions.x = bounds.x;
            windowOptions.y = bounds.y;
        }

        this.window = new BrowserWindow(windowOptions);

        // Show window when ready
        this.window.once('ready-to-show', () => {
            this.window?.show();
            this.logger.info('Window ready and shown');
        });

        // Set up event handlers
        this.setupEventHandlers();

        // Set up menu
        this.setupMenu();

        // Load the URL
        await this.loadContent();
    }

    /**
     * Get validated window bounds from store
     */
    private getValidatedBounds(): ValidatedWindowBounds {
        const storedBounds = this.store.getWindowBounds();
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

        const context = createBoundsContext(screenWidth, screenHeight, {
            defaultWidth: this.options.defaultBounds.width,
            defaultHeight: this.options.defaultBounds.height,
            minWidth: this.options.minWidth,
            maxWidth: this.options.maxWidth,
            minHeight: this.options.minHeight,
            maxHeight: this.options.maxHeight
        });

        return validateBounds(storedBounds, context);
    }

    /**
     * Set up window event handlers
     */
    private setupEventHandlers(): void {
        if (!this.window) return;

        // Resize and move handlers with debouncing
        this.window.on('resize', () => this.debouncedSaveBounds());
        this.window.on('move', () => this.debouncedSaveBounds());

        // Page load handlers
        this.window.webContents.on('did-finish-load', () => {
            this.logger.info('Page finished loading');
            this.setupNavigationHandlers();
        });

        this.window.webContents.on(
            'did-fail-load',
            (_event, errorCode, errorDescription, validatedURL) => {
                this.logger.error('Page failed to load', new Error(errorDescription), {
                    errorCode,
                    validatedURL
                });
            }
        );

        // Window close handler
        this.window.on('closed', () => {
            this.window = null;
            this.logger.info('Window closed');
        });
    }

    /**
     * Set up navigation handlers (only once)
     */
    private setupNavigationHandlers(): void {
        if (this.eventListenersSetup || !this.window) return;
        this.eventListenersSetup = true;

        this.logger.info('Setting up navigation handlers');

        // Handle navigation within the window
        this.window.webContents.on('will-navigate', (event, navigationUrl) => {
            if (this.security.isSafeForExternalOpen(navigationUrl)) {
                event.preventDefault();
                this.logger.info('Opening external URL', { url: navigationUrl });
                shell.openExternal(navigationUrl).catch(error => {
                    this.logger.error('Failed to open external URL', error, { url: navigationUrl });
                });
            }
        });

        // Handle new window requests
        this.window.webContents.setWindowOpenHandler(({ url }) => {
            if (this.security.isSafeForExternalOpen(url)) {
                this.logger.info('Opening external URL from new window request', { url });
                setImmediate(() => {
                    shell.openExternal(url).catch(error => {
                        this.logger.error('Failed to open external URL', error, { url });
                    });
                });
            }
            return { action: 'deny' };
        });
    }

    /**
     * Set up application menu
     */
    private setupMenu(): void {
        const currentMenu = Menu.getApplicationMenu();
        const menuItems = currentMenu ? currentMenu.items : [];
        const menuTemplate: Electron.MenuItemConstructorOptions[] = menuItems.map(item => {
            if (item.role) {
                return { role: item.role as Electron.MenuItemConstructorOptions['role'] };
            }
            const submenuItems: Electron.MenuItemConstructorOptions[] = [];
            if (item.submenu && 'items' in item.submenu) {
                for (const subItem of item.submenu.items) {
                    submenuItems.push({
                        label: subItem.label,
                        role: subItem.role as Electron.MenuItemConstructorOptions['role']
                    });
                }
            }
            return { label: item.label, submenu: submenuItems };
        });

        menuTemplate.push({
            label: 'Theme',
            submenu: [
                {
                    label: 'Toggle',
                    click: () => {
                        this.theme.toggleTheme();
                    }
                }
            ]
        });

        const menu = Menu.buildFromTemplate(menuTemplate);
        Menu.setApplicationMenu(menu);
    }

    /**
     * Load the main content
     */
    private async loadContent(): Promise<void> {
        if (!this.window) return;

        const result = await this.network.loadUrl(this.todoistUrl, this.window);

        if (!result.success && result.error) {
            await this.network.loadErrorPage(this.window, result.error, this.todoistUrl);
        }
    }

    /**
     * Debounced bounds saving with deduplication
     */
    private debouncedSaveBounds(): void {
        if (this.boundsTimeout) {
            clearTimeout(this.boundsTimeout);
        }

        this.boundsTimeout = setTimeout(() => {
            this.saveBounds();
        }, 300);
    }

    /**
     * Save current window bounds to store
     */
    public async saveBounds(): Promise<void> {
        if (!this.window) return;

        try {
            const bounds = this.window.getBounds();

            // Check if bounds actually changed to avoid unnecessary writes
            if (!boundsChanged(this.lastSavedBounds ?? undefined, bounds)) {
                return;
            }

            this.lastSavedBounds = bounds;
            await this.store.setWindowBounds(bounds);
            this.logger.debug('Window bounds saved', { ...bounds });
        } catch (error) {
            this.logger.error('Failed to save window bounds', error);
        }
    }

    /**
     * Close the window
     */
    public close(): void {
        if (this.window) {
            this.window.close();
        }
    }

    /**
     * Reload the window content
     */
    public async reload(): Promise<void> {
        if (!this.window) return;
        this.network.resetCircuit();
        await this.loadContent();
    }

    /**
     * Focus the window
     */
    public focus(): void {
        if (this.window) {
            if (this.window.isMinimized()) {
                this.window.restore();
            }
            this.window.focus();
        }
    }
}

// Export singleton getter for convenience
export function getWindowService(): WindowService {
    return WindowService.getInstance();
}
