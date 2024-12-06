import { app, BrowserWindow, nativeTheme, shell, Menu } from 'electron';
import Store from 'electron-store';

const store = new Store({ name: 'todoist-wrapper-config' });
let win;

function isSafeForExternalOpen(url) {
    try {
        const parsedUrl = new URL(url);
        const isHttp = parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
        const isNotTodoist = parsedUrl.origin !== 'https://app.todoist.com';
        return isHttp && isNotTodoist;
    } catch (e) {
        return false;
    }
}

function setupThemeToggler() {
    const toggleTheme = () => {
        const newTheme = nativeTheme.shouldUseDarkColors ? 'light' : 'dark';
        nativeTheme.themeSource = newTheme;
        store.set('theme', newTheme);
    };

    const autoToggleTheme = () => {
        const hour = new Date().getHours();
        const newTheme = (hour >= 6 && hour < 18) ? 'light' : 'dark';
        if (nativeTheme.themeSource !== newTheme) {
            nativeTheme.themeSource = newTheme;
            store.set('theme', newTheme);
        }
    };

    autoToggleTheme();
    setInterval(autoToggleTheme, 30 * 60 * 1000);

    return toggleTheme;
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

    const toggleTheme = setupThemeToggler();
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

    const currentMenu = Menu.getApplicationMenu();
    const menuItems = currentMenu ? currentMenu.items : [];
    const menuTemplate = menuItems.map(item =>
        item.role ? { role: item.role } : { label: item.label, submenu: item.submenu }
    );

    menuTemplate.push({
        label: 'Theme',
        submenu: [{
            label: 'Toggle',
            click: () => toggleTheme()
        }]
    });

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
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

app.whenReady().then(createWindow);
