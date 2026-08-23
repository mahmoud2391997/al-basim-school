const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("alBassamDesktop", {
  platform: process.platform,
  isDesktop: true,
});