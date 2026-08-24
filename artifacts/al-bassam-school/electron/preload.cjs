const { contextBridge, ipcRenderer } = require("electron");

const getArgument = (name) => {
  const prefix = `--${name}=`;
  const argument = process.argv.find((value) => value.startsWith(prefix));
  return argument ? argument.slice(prefix.length) : '';
};

contextBridge.exposeInMainWorld("alBassamDesktop", {
  platform: process.platform,
  isDesktop: true,
  apiBaseUrl: `http://127.0.0.1:${getArgument('local-api-port')}`,
  appVersion: getArgument('app-version'),
  backup: () => ipcRenderer.invoke('backup-database'),
  restore: () => ipcRenderer.invoke('restore-database'),
});
