const { app, BrowserWindow, shell, dialog, ipcMain } = require("electron");
const fs = require('node:fs');
const path = require("node:path");
const { startLocalApi } = require("./local-api.cjs");

let localApi;
let mainWindow;
let quitting = false;

const isDev = Boolean(process.env.ELECTRON_START_URL);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: "#f2f6f9",
    title: "Al-Bassam School Management",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://') && !url.startsWith('http://localhost:')) event.preventDefault();
  });

  if (isDev) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "public", "index.html"));
  }

  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });
}

ipcMain.handle('backup-database', async () => {
  if (!localApi) return { canceled: true };
  const result = await dialog.showSaveDialog({ title: 'Backup school database', defaultPath: 'al-bassam-school-backup.sqlite', filters: [{ name: 'SQLite database', extensions: ['sqlite'] }] });
  if (result.canceled || !result.filePath) return { canceled: true };
  localApi.db.pragma('wal_checkpoint(TRUNCATE)');
  fs.copyFileSync(path.join(app.getPath('userData'), 'al-bassam-school.sqlite'), result.filePath);
  return { canceled: false, filePath: result.filePath };
});

ipcMain.handle('restore-database', async () => {
  if (!localApi) return { canceled: true };
  const result = await dialog.showOpenDialog({ title: 'Restore school database', properties: ['openFile'], filters: [{ name: 'SQLite database', extensions: ['sqlite'] }] });
  if (result.canceled || !result.filePaths[0]) return { canceled: true };
  localApi.db.close();
  fs.copyFileSync(result.filePaths[0], path.join(app.getPath('userData'), 'al-bassam-school.sqlite'));
  app.relaunch(); app.exit(0);
  return { canceled: false };
});

app.whenReady().then(async () => {
  localApi = await startLocalApi(app.getPath('userData'));
  process.env.LOCAL_API_PORT = String(localApi.port);
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("before-quit", () => {
  quitting = true;
  localApi?.server.close();
  localApi?.db.close();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin" && !quitting) app.quit();
});
