const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("clarityRxElectron", {
  getSessionContext: () => ipcRenderer.invoke("session:getContext"),
  lockWorkstation: (reason) => ipcRenderer.invoke("workstation:lock", reason),
  unlockWorkstation: () => ipcRenderer.invoke("workstation:unlock"),
  secureStorage: {
    get: (key) => ipcRenderer.invoke("secureStorage:get", key),
    set: (key, value) => ipcRenderer.invoke("secureStorage:set", key, value),
    remove: (key) => ipcRenderer.invoke("secureStorage:remove", key),
  },
  openCashDrawer: (payload) => ipcRenderer.invoke("cashDrawer:open", payload),
});
