const { app, BrowserWindow, shell, dialog, ipcMain } = require("electron");
const fs = require('node:fs');
const path = require("node:path");
const { startLocalApi } = require("./local-api.cjs");
let localApi;
let mainWindow;
let quitting = false;
let databaseClosed = false;

const isDev = Boolean(process.env.ELECTRON_START_URL);
const localApiOrigin = () => `http://127.0.0.1:${localApi?.port}`;
const isAllowedNavigation = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'file:' || parsed.origin === localApiOrigin() || (isDev && parsed.origin === new URL(process.env.ELECTRON_START_URL).origin);
  } catch {
    return false;
  }
};

const hasSingleInstance = app.requestSingleInstanceLock();
if (!hasSingleInstance) app.quit();
else app.on('second-instance', () => mainWindow?.show());

function createWindow() {
  const iconPath = path.join(__dirname, "..", "public", "al-bassam-school-icon.png");
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: "#f2f6f9",
    icon: iconPath,
    title: "Al-Bassam School Management",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      additionalArguments: [`--local-api-port=${localApi.port}`, `--app-version=${app.getVersion()}`],
      webSecurity: true,
    },
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedNavigation(url)) event.preventDefault();
  });

  mainWindow.webContents.on('will-redirect', (event, url) => {
    if (!isAllowedNavigation(url)) event.preventDefault();
  });

  if (isDev) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "public", "index.html"));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
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
  const databasePath = path.join(app.getPath('userData'), 'al-bassam-school.sqlite');
  const restorePath = `${databasePath}.restore-${process.pid}`;
  fs.copyFileSync(result.filePaths[0], restorePath);
  localApi.db.close();
  databaseClosed = true;
  fs.rmSync(`${databasePath}-wal`, { force: true });
  fs.rmSync(`${databasePath}-shm`, { force: true });
  const previousPath = `${databasePath}.previous-${process.pid}`;
  try {
    if (fs.existsSync(databasePath)) fs.renameSync(databasePath, previousPath);
    fs.renameSync(restorePath, databasePath);
    if (fs.existsSync(previousPath)) fs.rmSync(previousPath, { force: true });
  } catch (error) {
    if (!fs.existsSync(databasePath) && fs.existsSync(previousPath)) fs.renameSync(previousPath, databasePath);
    if (fs.existsSync(restorePath)) fs.rmSync(restorePath, { force: true });
    throw error;
  }
  app.relaunch();
  app.exit(0);
  return { canceled: false };
});

const profilePicturePath = () =>
  path.join(app.getPath('userData'), 'admin-profile-picture.txt');

ipcMain.handle('save-profile-picture', async (_event, dataUrl) => {
  try {
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
      return { ok: false, error: 'invalid-data' };
    }
    fs.mkdirSync(app.getPath('userData'), { recursive: true });
    fs.writeFileSync(profilePicturePath(), dataUrl, 'utf8');
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('load-profile-picture', async () => {
  try {
    const filePath = profilePicturePath();
    if (!fs.existsSync(filePath)) return { ok: true, dataUrl: null };
    const dataUrl = fs.readFileSync(filePath, 'utf8');
    if (!String(dataUrl).startsWith('data:')) return { ok: true, dataUrl: null };
    return { ok: true, dataUrl };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
});

app.whenReady().then(async () => {
  app.setAppUserModelId('com.albasam.school');
  localApi = await startLocalApi(app.getPath("userData"));
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}).catch((error) => {
  console.error('Failed to start Al-Bassam School:', error);
  dialog.showErrorBox('Al-Bassam School failed to start', error instanceof Error ? error.message : String(error));
  app.quit();
});

app.on("before-quit", () => {
  quitting = true;
  localApi?.server.close();
  if (localApi?.db && !databaseClosed) {
    localApi.db.pragma('wal_checkpoint(TRUNCATE)');
    localApi.db.close();
    databaseClosed = true;
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin" && !quitting) app.quit();
});
