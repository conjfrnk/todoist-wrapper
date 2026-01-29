import { app, BrowserWindow, nativeTheme, shell, Menu, screen } from 'electron';
import Store from 'electron-store';
import { createRequire } from 'module';

// Use createRequire for CommonJS config module
const require = createRequire(import.meta.url);
const {
    getConfig,
    getThemeForHour,
    isSafeForExternalOpen,
    validateBounds
} = require('./config.cjs');

// Load configuration
const config = getConfig();

// Simple logger for observability
const log = {
    info: (msg, data) => console.log(`[INFO] ${new Date().toISOString()} ${msg}`, data || ''),
    warn: (msg, data) => console.warn(`[WARN] ${new Date().toISOString()} ${msg}`, data || ''),
    error: (msg, data) => console.error(`[ERROR] ${new Date().toISOString()} ${msg}`, data || '')
};

// Log configuration at startup
log.info('Configuration loaded:', {
    todoistUrl: config.todoistUrl,
    autoTheme: config.theme.autoToggleEnabled,
    themeHours: `${config.theme.lightThemeStartHour}-${config.theme.lightThemeEndHour}`
});

// Global error handlers
process.on('uncaughtException', error => {
    log.error('Uncaught exception:', error);
});

process.on('unhandledRejection', reason => {
    log.error('Unhandled promise rejection:', reason);
});

// Store schema for validation
const storeSchema = {
    schemaVersion: {
        type: 'number',
        default: config.store.schemaVersion
    },
    windowBounds: {
        type: 'object',
        properties: {
            width: {
                type: 'number',
                minimum: config.window.minWidth,
                maximum: config.window.maxWidth
            },
            height: {
                type: 'number',
                minimum: config.window.minHeight,
                maximum: config.window.maxHeight
            },
            x: { type: 'number' },
            y: { type: 'number' }
        },
        default: { width: config.window.defaultWidth, height: config.window.defaultHeight }
    },
    theme: {
        type: 'string',
        enum: ['light', 'dark', 'system'],
        default: 'system'
    }
};

// Store initialization with error handling, schema validation, and migration
let store;
let storeWriteQueue = Promise.resolve();

function initializeStore() {
    try {
        store = new Store({
            name: config.store.name,
            schema: storeSchema,
            clearInvalidConfig: true // Auto-clear invalid data
        });

        // Run migrations if needed
        const currentVersion = store.get('schemaVersion', 0);
        if (currentVersion < config.store.schemaVersion) {
            log.info(
                `Migrating store from version ${currentVersion} to ${config.store.schemaVersion}`
            );
            migrateStore(currentVersion);
            store.set('schemaVersion', config.store.schemaVersion);
        }

        log.info('Store initialized successfully');
        return true;
    } catch (error) {
        log.error('Failed to initialize store:', error);

        // Try to recover by clearing the store
        try {
            log.warn('Attempting store recovery by clearing corrupted data');
            store = new Store({
                name: config.store.name,
                schema: storeSchema,
                clearInvalidConfig: true
            });
            store.clear();
            store.set('schemaVersion', config.store.schemaVersion);
            log.info('Store recovered successfully');
            return true;
        } catch (recoveryError) {
            log.error('Store recovery failed, using in-memory fallback:', recoveryError);
            // Fallback to a minimal in-memory store interface
            const memoryStore = new Map();
            store = {
                get: (key, defaultValue) =>
                    memoryStore.has(key) ? memoryStore.get(key) : defaultValue,
                set: (key, value) => memoryStore.set(key, value),
                clear: () => memoryStore.clear()
            };
            return false;
        }
    }
}

// Migration functions for future schema changes
function migrateStore(fromVersion) {
    // Migration from version 0 (no schema) to version 1
    if (fromVersion < 1) {
        log.info('Running migration: v0 -> v1');
        // No structural changes in v1, just adding schema version tracking
        // Future migrations can be added here as elif blocks
    }
}

// Serialize store writes to prevent race conditions
function safeStoreSet(key, value) {
    storeWriteQueue = storeWriteQueue
        .then(() => {
            try {
                store.set(key, value);
                return true;
            } catch (error) {
                log.error(`Failed to write to store (key: ${key}):`, error);
                return false;
            }
        })
        .catch(error => {
            log.error('Store write queue error:', error);
            return false;
        });
    return storeWriteQueue;
}

initializeStore();

let win;
let themeToggleInterval = null;

// Use the isSafeForExternalOpen from config module with current config
function checkUrlSafety(url) {
    return isSafeForExternalOpen(url, config);
}

function setupThemeToggler() {
    const toggleTheme = () => {
        try {
            const newTheme = nativeTheme.shouldUseDarkColors ? 'light' : 'dark';
            nativeTheme.themeSource = newTheme;
            safeStoreSet('theme', newTheme);
            log.info(`Theme manually toggled to: ${newTheme}`);
        } catch (error) {
            log.error('Failed to toggle theme:', error);
        }
    };

    const autoToggleTheme = () => {
        try {
            const hour = new Date().getHours();
            const newTheme = getThemeForHour(hour, config);
            if (nativeTheme.themeSource !== newTheme) {
                nativeTheme.themeSource = newTheme;
                safeStoreSet('theme', newTheme);
                log.info(`Theme auto-toggled to: ${newTheme}`);
            }
        } catch (error) {
            log.error('Failed to auto-toggle theme:', error);
        }
    };

    // Only set up auto-toggle if enabled
    if (config.theme.autoToggleEnabled) {
        autoToggleTheme();
        // Store interval reference for cleanup on app quit
        const intervalMs = config.theme.autoToggleIntervalMinutes * 60 * 1000;
        themeToggleInterval = setInterval(autoToggleTheme, intervalMs);
        log.info(
            `Auto theme toggle enabled, interval: ${config.theme.autoToggleIntervalMinutes} minutes`
        );
    } else {
        log.info('Auto theme toggle disabled');
    }

    return toggleTheme;
}

// Validate window bounds using config module
function getValidatedWindowBounds(storedBounds) {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
    return validateBounds(storedBounds, screenWidth, screenHeight, config);
}

function createWindow() {
    const defaults = { width: config.window.defaultWidth, height: config.window.defaultHeight };
    const storedBounds = store.get('windowBounds', defaults);
    const windowBounds = getValidatedWindowBounds(storedBounds);

    log.info('Creating window with bounds:', windowBounds);

    const windowOptions = {
        width: windowBounds.width,
        height: windowBounds.height,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            enableRemoteModule: false,
            sandbox: true
        },
        autoHideMenuBar: true,
        frame: true
    };

    // Restore window position if available and valid
    if (typeof windowBounds.x === 'number' && typeof windowBounds.y === 'number') {
        windowOptions.x = windowBounds.x;
        windowOptions.y = windowBounds.y;
    }

    win = new BrowserWindow(windowOptions);

    const toggleTheme = setupThemeToggler();

    // Load URL with error handling and retry logic
    const loadWithRetry = async (url, retries = config.network.maxRetries) => {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                log.info(`Loading URL (attempt ${attempt}/${retries}):`, url);
                await win.loadURL(url);
                log.info('URL loaded successfully');
                return;
            } catch (error) {
                log.error(`Failed to load URL (attempt ${attempt}/${retries}):`, error.message);
                if (attempt === retries) {
                    log.error('All retry attempts failed, showing error page');
                    // Show a user-friendly error message with offline detection
                    const errorPageHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Connection Error - Todoist</title>
    <meta charset="UTF-8">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 16px;
            padding: 48px;
            max-width: 480px;
            text-align: center;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        .icon { font-size: 64px; margin-bottom: 24px; }
        h1 { color: #1a1a2e; font-size: 24px; margin-bottom: 16px; }
        .message { color: #666; line-height: 1.6; margin-bottom: 24px; }
        .error-detail {
            background: #f5f5f5;
            padding: 12px;
            border-radius: 8px;
            font-size: 13px;
            color: #888;
            margin-bottom: 24px;
            word-break: break-word;
        }
        .status {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            margin-bottom: 24px;
        }
        .status.offline { background: #fee2e2; color: #dc2626; }
        .status.online { background: #dcfce7; color: #16a34a; }
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: currentColor;
        }
        button {
            background: #667eea;
            color: white;
            border: none;
            padding: 14px 32px;
            font-size: 16px;
            border-radius: 8px;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        button:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); }
        button:active { transform: translateY(0); }
        button:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .spinner {
            display: none;
            width: 20px;
            height: 20px;
            border: 2px solid #fff;
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 8px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading .spinner { display: inline-block; }
        .loading button { padding-left: 16px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">🔌</div>
        <h1>Unable to connect to Todoist</h1>
        <div id="status" class="status offline">
            <span class="status-dot"></span>
            <span id="status-text">Checking connection...</span>
        </div>
        <p class="message">
            We couldn't reach Todoist. This might be due to a network issue or the service may be temporarily unavailable.
        </p>
        <div class="error-detail">
            ${error.message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
        </div>
        <div id="btn-container">
            <button onclick="retry()" id="retry-btn">
                <span class="spinner"></span>
                Try Again
            </button>
        </div>
    </div>
    <script>
        const targetUrl = '${url}';
        const statusEl = document.getElementById('status');
        const statusText = document.getElementById('status-text');
        const retryBtn = document.getElementById('retry-btn');
        const btnContainer = document.getElementById('btn-container');

        function updateStatus() {
            const online = navigator.onLine;
            statusEl.className = 'status ' + (online ? 'online' : 'offline');
            statusText.textContent = online ? 'Internet connected' : 'No internet connection';
        }

        function retry() {
            btnContainer.classList.add('loading');
            retryBtn.disabled = true;
            window.location.href = targetUrl;
        }

        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);
        updateStatus();

        // Auto-retry when connection is restored
        window.addEventListener('online', () => {
            setTimeout(retry, 1000);
        });
    </script>
</body>
</html>`;
                    win.loadURL(
                        `data:text/html;charset=utf-8,${encodeURIComponent(errorPageHtml)}`
                    );
                } else {
                    // Wait before retrying (exponential backoff)
                    const delay = config.network.retryBaseDelayMs * attempt;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
    };

    loadWithRetry(config.todoistUrl);

    // Track if event listeners have been set up to prevent duplicates
    let eventListenersSetup = false;

    function setupEventListeners(contents) {
        if (eventListenersSetup) {
            log.info('Event listeners already set up, skipping');
            return;
        }
        eventListenersSetup = true;
        log.info('Setting up event listeners');
        contents.on('will-navigate', handleNavigation);
        contents.setWindowOpenHandler(handleExternalOpen);
    }

    win.webContents.on('did-finish-load', () => {
        log.info('Page finished loading');
        setupEventListeners(win.webContents);
    });

    // Handle page load failures
    win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        log.error('Page failed to load:', { errorCode, errorDescription, validatedURL });
    });

    function handleNavigation(event, navigationUrl) {
        if (checkUrlSafety(navigationUrl)) {
            event.preventDefault();
            log.info('Opening external URL:', navigationUrl);
            shell.openExternal(navigationUrl).catch(error => {
                log.error('Failed to open external URL:', {
                    url: navigationUrl,
                    error: error.message
                });
            });
        }
    }

    function handleExternalOpen({ url }) {
        if (checkUrlSafety(url)) {
            log.info('Opening external URL from new window request:', url);
            setImmediate(() => {
                shell.openExternal(url).catch(error => {
                    log.error('Failed to open external URL:', { url, error: error.message });
                });
            });
        }
        return { action: 'deny' };
    }

    setupResizeHandling();

    const currentMenu = Menu.getApplicationMenu();
    const menuItems = currentMenu ? currentMenu.items : [];
    const menuTemplate = menuItems.map(item =>
        item.role ? { role: item.role } : { label: item.label, submenu: item.submenu }
    );

    menuTemplate.push({
        label: 'Theme',
        submenu: [
            {
                label: 'Toggle',
                click: () => toggleTheme()
            }
        ]
    });

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
}

function setupResizeHandling() {
    let boundsTimeout;

    const saveBounds = () => {
        clearTimeout(boundsTimeout);
        boundsTimeout = setTimeout(() => {
            try {
                const bounds = win.getBounds();
                safeStoreSet('windowBounds', bounds);
                log.info('Window bounds saved:', bounds);
            } catch (error) {
                log.error('Failed to save window bounds:', error);
            }
        }, 300);
    };

    // Save bounds on resize and move
    win.on('resize', saveBounds);
    win.on('move', saveBounds);
}

// App lifecycle management
app.whenReady()
    .then(() => {
        log.info('App ready, creating window');
        createWindow();
    })
    .catch(error => {
        log.error('Failed to initialize app:', error);
        app.quit();
    });

app.on('window-all-closed', () => {
    log.info('All windows closed');
    // On macOS, apps typically stay open until explicitly quit
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
        log.info('Reactivating app, creating new window');
        createWindow();
    }
});

app.on('before-quit', () => {
    log.info('App quitting, cleaning up resources');
    // Clean up the theme toggle interval to prevent memory leaks
    if (themeToggleInterval) {
        clearInterval(themeToggleInterval);
        themeToggleInterval = null;
        log.info('Theme toggle interval cleared');
    }
});
