const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
const historyPath = path.join(app.getPath('userData'), 'history.json');

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: false,
        icon: path.join(__dirname, 'images/icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webviewTag: true
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'routes/browser.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

 
ipcMain.on('minimize-window', () => {
    if (mainWindow) mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
    if (mainWindow) {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    }
});

ipcMain.on('close-window', () => {
    if (mainWindow) mainWindow.close();
});
 
ipcMain.on('save-history', (event, item) => {
    let history = [];
    try {
        if (fs.existsSync(historyPath)) {
            history = JSON.parse(fs.readFileSync(historyPath));
        }
    } catch (e) {}
    
    history.push(item);
    fs.writeFileSync(historyPath, JSON.stringify(history));
});

ipcMain.on('get-history', (event) => {
    let history = [];
    try {
        if (fs.existsSync(historyPath)) {
            history = JSON.parse(fs.readFileSync(historyPath));
        }
    } catch (e) {}
    event.reply('history-data', history);
});

ipcMain.on('clear-history', () => {
    fs.writeFileSync(historyPath, JSON.stringify([]));
});
