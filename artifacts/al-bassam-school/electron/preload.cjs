const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("alBassamDesktop", {
  platform: process.platform,
  isDesktop: true,
  apiBaseUrl: `http://127.0.0.1:${process.env.LOCAL_API_PORT || ''}`,
  appVersion: require('./../package.json').version,
  backup: () => ipcRenderer.invoke('backup-database'),
  restore: () => ipcRenderer.invoke('restore-database'),
});
