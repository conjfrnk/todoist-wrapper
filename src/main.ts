import { app, BrowserWindow, ipcMain } from 'electron';
import {
    ConfigService,
    LoggerService,
    StoreService,
    SecurityService,
    NetworkService,
    ThemeService,
    WindowService
} from './services/index.js';
import type { AppConfig } from './types/config.types.js';

// Track startup time
const startTime = Date.now();

// Services
let config: AppConfig;
let logger: LoggerService;

/**
 * Memory monitor - checks memory usage periodically
 */
class MemoryMonitor {
    private intervalId: ReturnType<typeof setInterval> | null = null;
    private readonly warningThreshold = 80 * 1024 * 1024; // 80MB
    private readonly criticalThreshold = 100 * 1024 * 1024; // 100MB
    private readonly checkInterval = 30 * 1000; // 30 seconds

    start(): void {
        this.intervalId = setInterval(() => this.check(), this.checkInterval);
        logger.info('Memory monitor started');
    }

    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    private check(): void {
        const usage = process.memoryUsage();
        const heapUsed = usage.heapUsed;

        if (heapUsed > this.criticalThreshold) {
            logger.warn('Critical memory usage detected', {
                heapUsedMB: Math.round(heapUsed / 1024 / 1024),
                thresholdMB: Math.round(this.criticalThreshold / 1024 / 1024)
            });

            // Try to free memory
            if (global.gc) {
                logger.info('Triggering garbage collection');
                global.gc();
            }
        } else if (heapUsed > this.warningThreshold) {
            logger.debug('High memory usage', {
                heapUsedMB: Math.round(heapUsed / 1024 / 1024),
                thresholdMB: Math.round(this.warningThreshold / 1024 / 1024)
            });
        }

        logger.logMemory();
    }
}

const memoryMonitor = new MemoryMonitor();

/**
 * Initialize all services in the correct order
 */
async function initializeServices(): Promise<void> {
    // 1. Config Service (no dependencies)
    config = ConfigService.getInstance().getConfig();

    // 2. Logger Service (depends on config)
    logger = LoggerService.initialize({
        level: config.logLevel,
        enableConsole: true,
        enableFile: config.nodeEnv !== 'test'
    });

    logger.info('Configuration loaded', {
        todoistUrl: config.todoistUrl,
        autoTheme: config.theme.autoToggleEnabled,
        themeHours: `${config.theme.lightThemeStartHour}-${config.theme.lightThemeEndHour}`,
        logLevel: config.logLevel,
        nodeEnv: config.nodeEnv
    });

    // 3. Store Service (depends on config, logger)
    StoreService.initialize(config.store.name, config.store.schemaVersion);

    // 4. Security Service (depends on config, logger)
    SecurityService.initialize(config.todoistUrl);

    // 5. Network Service (depends on config, logger)
    NetworkService.initialize({
        maxRetries: config.network.maxRetries,
        retryBaseDelayMs: config.network.retryBaseDelayMs,
        timeoutMs: config.network.timeoutMs
    });

    // 6. Theme Service (depends on config, logger, store)
    ThemeService.initialize({
        autoToggleEnabled: config.theme.autoToggleEnabled,
        autoToggleIntervalMinutes: config.theme.autoToggleIntervalMinutes,
        lightThemeStartHour: config.theme.lightThemeStartHour,
        lightThemeEndHour: config.theme.lightThemeEndHour
    });

    // 7. Window Service (depends on all above)
    WindowService.initialize(config.todoistUrl, {
        defaultBounds: {
            width: config.window.defaultWidth,
            height: config.window.defaultHeight
        },
        minWidth: config.window.minWidth,
        maxWidth: config.window.maxWidth,
        minHeight: config.window.minHeight,
        maxHeight: config.window.maxHeight
    });

    logger.info('All services initialized');
}

/**
 * Set up IPC handlers for preload bridge
 */
function setupIpcHandlers(): void {
    const themeService = ThemeService.getInstance();
    const configService = ConfigService.getInstance();

    ipcMain.handle('get-theme', () => {
        return themeService.getCurrentTheme();
    });

    ipcMain.handle('set-theme', (_event, theme: string) => {
        if (['light', 'dark', 'system'].includes(theme)) {
            themeService.setTheme(theme as 'light' | 'dark' | 'system');
            return true;
        }
        return false;
    });

    ipcMain.handle('toggle-theme', () => {
        return themeService.toggleTheme();
    });

    ipcMain.handle('get-version', () => {
        return app.getVersion();
    });

    ipcMain.handle('is-development', () => {
        return configService.isDevelopment();
    });

    logger.info('IPC handlers registered');
}

/**
 * Set up global error handlers
 */
function setupErrorHandlers(): void {
    process.on('uncaughtException', error => {
        logger.error('Uncaught exception', error);
    });

    process.on('unhandledRejection', reason => {
        logger.error('Unhandled promise rejection', reason as Error);
    });

    // GPU process crash handler
    app.on('child-process-gone', (_event, details) => {
        if (details.type === 'GPU') {
            logger.error('GPU process gone', undefined, { reason: details.reason });
            if (details.reason !== 'killed') {
                // Attempt to reload if not intentionally killed
                const windowService = WindowService.getInstance();
                windowService.reload().catch((err: Error) => {
                    logger.error('Failed to reload after GPU crash', err);
                });
            }
        }
    });

    logger.info('Error handlers registered');
}

/**
 * Set up security features
 */
function setupSecurity(): void {
    const security = SecurityService.getInstance();

    // Apply CSP headers
    security.applyCSP();

    // Set up permission handler
    security.setupPermissionHandler();

    // Certificate error handler
    app.on('certificate-error', (event, _webContents, url, error, certificate, callback) => {
        logger.warn('Certificate error', { url, error });

        // For Todoist domains, reject invalid certificates
        if (url.includes('todoist.com')) {
            security.logSecurityEvent({
                type: 'certificate_error',
                timestamp: new Date().toISOString(),
                details: { url, error, issuer: certificate.issuerName }
            });
            callback(false); // Reject
            return;
        }

        // For other domains, use default behavior
        event.preventDefault();
        callback(false);
    });

    logger.info('Security features configured');
}

/**
 * Create the main window
 */
async function createWindow(): Promise<void> {
    const windowService = WindowService.getInstance();
    await windowService.createWindow();

    // Start theme auto-toggle after window is ready
    const themeService = ThemeService.getInstance();
    themeService.startAutoToggle();
}

/**
 * App lifecycle: ready
 */
app.whenReady()
    .then(async () => {
        logger.info('App ready, initializing');

        // Initialize services
        await initializeServices();

        // Set up error handlers
        setupErrorHandlers();

        // Set up IPC handlers
        setupIpcHandlers();

        // Set up security
        setupSecurity();

        // Create main window
        await createWindow();

        // Log startup time
        logger.logStartup(startTime);

        // Start memory monitor after a delay
        setTimeout(() => {
            memoryMonitor.start();
        }, 5000);
    })
    .catch(error => {
        console.error('Failed to initialize app:', error);
        app.quit();
    });

/**
 * App lifecycle: all windows closed
 */
app.on('window-all-closed', () => {
    logger.info('All windows closed');
    // On macOS, apps typically stay open until explicitly quit
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

/**
 * App lifecycle: activate (macOS)
 */
app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
        logger.info('Reactivating app, creating new window');
        createWindow().catch(error => {
            logger.error('Failed to create window on activate', error);
        });
    }
});

/**
 * App lifecycle: before quit
 */
app.on('before-quit', async () => {
    logger.info('App quitting, cleaning up resources');

    // Stop memory monitor
    memoryMonitor.stop();

    // Clean up theme service
    ThemeService.getInstance().destroy();

    // Flush store writes
    await StoreService.getInstance().flush();

    // Flush logs
    await logger.flush();

    logger.info('Cleanup complete');
});
