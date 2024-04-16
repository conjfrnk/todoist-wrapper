const { app, BrowserWindow, Menu, nativeTheme } = require('electron');
const Store = require('electron-store');
const store = new Store({name: 'todoist-wrapper-config'});

let win;

function createWindow() {
    let windowBounds = store.get('windowBounds', { width: 1250, height: 1000 });

    win = new BrowserWindow({
        width: windowBounds.width,
        height: windowBounds.height,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            nativeTheme: {
                themeSource: store.get('theme', 'system')
            }
        },
        autoHideMenuBar: true,
        frame: true
    });

    win.loadURL('https://app.todoist.com');

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

    createMenu();
}

function createMenu() {
    const menuTemplate = [
        {
            label: 'View',
            submenu: [
                {
                    label: 'Toggle Dark Mode',
                    click() {
                        let newTheme = nativeTheme.shouldUseDarkColors ? 'light' : 'dark';
                        nativeTheme.themeSource = newTheme;
                        store.set('theme', newTheme);
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
}

app.on('ready', createWindow);
