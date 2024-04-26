const { app, BrowserWindow, nativeTheme, shell } = require('electron');
const Store = require('electron-store');
const store = new Store({ name: 'todoist-wrapper-config' });

let win;

function setupThemeToggler() {
    const toggleTheme = () => {
        const hour = new Date().getHours();
        const newTheme = (hour >= 6 && hour < 18) ? 'light' : 'dark';
        if (nativeTheme.themeSource !== newTheme) {
            nativeTheme.themeSource = newTheme;
            store.set('theme', newTheme);
        }
    };

    toggleTheme();
    setInterval(toggleTheme, 30 * 60 * 1000); // adjust every half hour
}

function createWindow() {
    const windowBounds = store.get('windowBounds', { width: 1250, height: 1000 });

    win = new BrowserWindow({
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
    });

    setupThemeToggler();
    win.loadURL('https://app.todoist.com');

    function setupEventListeners(contents) {
        contents.on('will-navigate', handleNavigation);
        contents.setWindowOpenHandler(handleExternalOpen);
    }

    win.webContents.on('did-finish-load', () => {
        setupEventListeners(win.webContents);
    });

    function handleNavigation(event, navigationUrl) {
        const parsedUrl = new URL(navigationUrl);
        if (parsedUrl.origin !== 'https://app.todoist.com') {
            event.preventDefault();
        }
    }

    function handleExternalOpen({ url }) {
        if (isSafeForExternalOpen(url)) {
            setImmediate(() => shell.openExternal(url));
        }
        return { action: 'deny' };
    }

    setupResizeHandling();
}

function setupResizeHandling() {
    let resizeTimeout;
    win.on('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const { width, height } = win.getBounds();
            store.set('windowBounds', { width, height });
        }, 300);
    });
}

app.on('ready', createWindow);
