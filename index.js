const { app, BrowserWindow, Menu } = require('electron')
const Store = require('electron-store')
const store = new Store({name: 'todoist-wrapper-config'});

let win

function createWindow() {
    // Retrieve window size and position
    let windowBounds = store.get('windowBounds', { width: 1250, height: 1000 });

    win = new BrowserWindow({
        width: windowBounds.width,
        height: windowBounds.height,
        webPreferences: {
            nodeIntegration: true
        },
        autoHideMenuBar: true, // Auto-hide the menu bar
        frame: true // Use standard window frame
    })

    win.loadURL('https://app.todoist.com')

    // Save window size and position on resize or move
    win.on('resize', () => {
        let { width, height } = win.getBounds();
        store.set('windowBounds', { width, height });
    });

    win.on('move', () => {
        let { x, y } = win.getBounds();
        store.set('windowBounds', { x, y });
    });

    win.on('closed', () => {
        win = null
    })

    win.webContents.on('new-window', (event, url) => {
        event.preventDefault()
        win.loadURL(url)
    })

    // Show the menu bar when Alt key is pressed
    win.on('browser-window-focus', () => {
        win.setMenuBarVisibility(false);
    });

    win.on('browser-window-blur', () => {
        win.setMenuBarVisibility(false);
    });

    win.on('keydown', (e) => {
        if (e.code === 'AltLeft' || e.code === 'AltRight') {
            win.setMenuBarVisibility(!win.isMenuBarVisible());
        }
    });
}

app.on('ready', createWindow)
