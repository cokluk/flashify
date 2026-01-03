const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;  

let pluginName;
switch (process.platform) {
  case 'win32':
    pluginName = 'embeded_flashplayer/pepflashplayer.dll';
    break;
  case 'darwin':
    pluginName = 'embeded_flashplayer/PepperFlashPlayer.plugin';
    break;
  case 'linux':
    pluginName = 'embeded_flashplayer/libpepflashplayer.so';
    break;
}
 
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)){
    fs.mkdirSync(dataDir);
}
const historyPath = path.join(dataDir, 'history.json');

if (!fs.existsSync(historyPath)) {
  try {
    fs.writeFileSync(historyPath, '[]');
  } catch (e) {
    console.error('Error creating history file:', e);
  }
}

ipcMain.on('get-history', (event) => {
  try {
    if (!fs.existsSync(historyPath)) {
 
      event.sender.send('history-data', []);
      return;
    }
    const data = fs.readFileSync(historyPath, 'utf-8');
 
    event.sender.send('history-data', JSON.parse(data));
  } catch (error) {
    console.error('Error reading history:', error);
    event.sender.send('history-data', []);
  }
});

ipcMain.on('save-history', (event, item) => {
  try {
    let history = [];
    if (fs.existsSync(historyPath)) {
      const fileContent = fs.readFileSync(historyPath, 'utf-8');
    
      if (fileContent.trim()) {
          history = JSON.parse(fileContent);
      }
    }
   
    if (history.length > 0 && history[0].url === item.url) {
        return; 
    }

    history.unshift(item);

    if (history.length > 1000) history = history.slice(0, 1000);
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2)); // Okunabilirlik için formatlı yaz
  } catch (error) {
    console.error('History save error:', error);
  }
});

ipcMain.on('clear-history', () => {
  try {
    fs.writeFileSync(historyPath, '[]');
  } catch (error) {
    console.error('Error clearing history:', error);
  }
});
 
ipcMain.on('load-url', (event, url) => {
  if (mainWindow) {
    mainWindow.webContents.send('load-url', url);
    mainWindow.focus();
  }
});

app.commandLine.appendSwitch('ppapi-flash-path', path.join(__dirname, pluginName));
app.commandLine.appendSwitch('ppapi-flash-version', '32.0.0.465');

app.commandLine.appendSwitch('disk-cache-size', '1073741824');
app.commandLine.appendSwitch('media-cache-size', '1073741824');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    frame: false, 
    webPreferences: {
      webviewTag: true,
      plugins: true,
      contextIsolation: false,
      nodeIntegration: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: true  
    }
  });

 
  mainWindow.webContents.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  mainWindow.loadFile(path.join(__dirname, 'routes/browser.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}
 
ipcMain.on('minimize-window', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.minimize();
});

ipcMain.on('maximize-window', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});

ipcMain.on('close-window', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.close();
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});