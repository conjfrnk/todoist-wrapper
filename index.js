const { app, BrowserWindow, nativeTheme, shell } = require('electron');
const Store = require('electron-store');
const store = new Store({ name: 'todoist-wrapper-config' });

let win;

function toggleThemeByTime() {
    const hour = new Date().getHours();
    const newTheme = (hour >= 6 && hour < 18) ? 'light' : 'dark';
    if (nativeTheme.themeSource !== newTheme) {
        nativeTheme.themeSource = newTheme;
        store.set('theme', newTheme);
    }
}

function createWindow() {
    let windowBounds = store.get('windowBounds', { width: 1250, height: 1000 });

    win = new BrowserWindow({
        width: windowBounds.width,
        height: windowBounds.height,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            nodeIntegrationInWorker: false,
            backgroundThrottling: false,
            enableRemoteModule: false,
        },
        autoHideMenuBar: true,
        frame: true
    });

    toggleThemeByTime();
    win.loadURL('https://app.todoist.com');

    function setupEventListeners(contents) {
        contents.on('will-navigate', (event, navigationUrl) => {
            const parsedUrl = new URL(navigationUrl);
            if (parsedUrl.origin !== 'https://app.todoist.com') {
                event.preventDefault();
            }
        });

        contents.setWindowOpenHandler(({ url }) => {
            if (isSafeForExternalOpen(url)) {
                setImmediate(() => shell.openExternal(url));
            }
            return { action: 'deny' };
        });
    }

    win.webContents.on('did-finish-load', () => {
        setupEventListeners(win.webContents);
    });

    let resizeTimeout;
    win.on('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            let { width, height } = win.getBounds();
            store.set('windowBounds', { width, height });
        }, 1000);
    });

    win.on('closed', () => {
        win = null;
    });
}

app.on('ready', createWindow);
