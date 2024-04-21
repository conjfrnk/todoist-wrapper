const { app, BrowserWindow, nativeTheme } = require('electron');
const Store = require('electron-store');
const store = new Store({name: 'todoist-wrapper-config'});

let win;

function toggleThemeByTime() {
    const hour = new Date().getHours();
    const newTheme = (hour >= 6 && hour < 18) ? 'light' : 'dark';
    nativeTheme.themeSource = newTheme;
    store.set('theme', newTheme);
}

function createWindow() {
    let windowBounds = store.get('windowBounds', { width: 1250, height: 1000 });

    win = new BrowserWindow({
        width: windowBounds.width,
        height: windowBounds.height,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
        },
        autoHideMenuBar: true,
        frame: true,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            nodeIntegrationInWorker: false,
            backgroundThrottling: false
        }
    });

    toggleThemeByTime();

    win.loadURL('https://app.todoist.com');

    win.on('web-contents-created', (event, contents) => {
        win.on('will-attach-webview', (event, webPreferences, params) => {
            delete webPreferences.preload
            if (!params.src.startsWith('https://app.todoist.com')) {
                event.preventDefault()
            }
        })
        win.on('will-navigate', (event, navigationUrl) => {
            const parsedUrl = new URL(navigationUrl)
            if (parsedUrl.origin !== 'https://app.todoist.com') {
                event.preventDefault()
            }
        })
        contents.setWindowOpenHandler(({ url }) => {
            if (isSafeForExternalOpen(url)) {
                setImmediate(() => {
                    shell.openExternal(url)
                })
            }
            return { action: 'deny' }
        })
    })

    win.on('resize', () => {
        let { width, height } = win.getBounds();
        store.set('windowBounds', { width, height });
    });

    win.on('move', () => {
        let { x, y } = win.getBounds();
        store.set('windowBounds', { x, y });
    });

    win.on('closed', () => {
        win = null;
    });

    setInterval(toggleThemeByTime, 5 * 60 * 1000); // Refresh every 5 minutes
}

app.on('ready', createWindow);
