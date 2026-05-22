const path = require("path");
const { app, BrowserWindow, ipcMain, nativeImage, safeStorage, screen } = require("electron");

const DEV_URL = process.env.CLRX_POS_URL || "http://localhost:3001";
const PROD_FILE = path.join(__dirname, "..", "build", "index.html");
const useDevServer = process.env.CLRX_POS_DESKTOP_DEV !== "0" && !app.isPackaged;

let mainWindow = null;
let workstationLocked = false;

function resolveIcon() {
  const icns = path.join(__dirname, "icon.icns");
  const png = path.join(__dirname, "icon.png");
  if (process.platform === "darwin") {
    const img = nativeImage.createFromPath(icns);
    if (!img.isEmpty()) return img;
  }
  return nativeImage.createFromPath(png);
}

function getPrimaryWorkArea() {
  return screen.getPrimaryDisplay().workArea;
}

function fitWindowToScreen(win) {
  if (!win || win.isDestroyed() || workstationLocked) return;
  const area = getPrimaryWorkArea();
  win.setBounds(area);
  if (!win.isMaximized()) win.maximize();
}

function createWindow() {
  const workArea = getPrimaryWorkArea();
  mainWindow = new BrowserWindow({
    x: workArea.x,
    y: workArea.y,
    width: workArea.width,
    height: workArea.height,
    minWidth: Math.min(800, workArea.width),
    minHeight: Math.min(600, workArea.height),
    title: "ClarityRx POS",
    icon: resolveIcon(),
    backgroundColor: "#0f172a",
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once("ready-to-show", () => {
    fitWindowToScreen(mainWindow);
    mainWindow.show();
  });

  if (useDevServer) {
    mainWindow.loadURL(DEV_URL);
    if (process.env.CLRX_POS_OPEN_DEVTOOLS === "1") {
      mainWindow.webContents.openDevTools({ mode: "detach" });
    }
  } else {
    mainWindow.loadFile(PROD_FILE);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function lockWindow() {
  workstationLocked = true;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setFullScreenable(false);
    mainWindow.setKiosk(true);
    mainWindow.setAlwaysOnTop(true, "screen-saver");
    mainWindow.setVisibleOnAllWorkspaces(true);
    mainWindow.focus();
  }
}

function unlockWindow() {
  workstationLocked = false;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setKiosk(false);
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setFullScreenable(true);
    fitWindowToScreen(mainWindow);
  }
}

ipcMain.handle("session:getContext", () => ({
  deviceLabel: "POS till (Electron)",
  electron: true,
}));

ipcMain.handle("workstation:lock", (_event, reason) => {
  lockWindow();
  return { locked: true, reason: reason || "manual" };
});

ipcMain.handle("workstation:unlock", () => {
  unlockWindow();
  return { locked: false };
});

ipcMain.handle("secureStorage:get", (_event, key) => {
  const filePath = path.join(app.getPath("userData"), "secure", `${key}.bin`);
  try {
    const fs = require("fs");
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath);
    if (safeStorage.isEncryptionAvailable()) {
      return safeStorage.decryptString(raw);
    }
    return raw.toString("utf8");
  } catch {
    return null;
  }
});

ipcMain.handle("secureStorage:set", (_event, key, value) => {
  const fs = require("fs");
  const dir = path.join(app.getPath("userData"), "secure");
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${key}.bin`);
  const payload = safeStorage.isEncryptionAvailable()
    ? safeStorage.encryptString(String(value))
    : Buffer.from(String(value), "utf8");
  fs.writeFileSync(filePath, payload);
});

ipcMain.handle("cashDrawer:open", (_event, payload) => {
  if (process.env.CLRX_POS_LOG_DRAWER === "1") {
    console.info("[cash-drawer]", payload?.reason || "open", payload);
  }
  return { ok: true };
});

ipcMain.handle("secureStorage:remove", (_event, key) => {
  const fs = require("fs");
  const filePath = path.join(app.getPath("userData"), "secure", `${key}.bin`);
  try {
    fs.unlinkSync(filePath);
  } catch {
    // ignore
  }
});

app.whenReady().then(() => {
  if (process.platform === "darwin" && app.dock) {
    const icon = resolveIcon();
    if (!icon.isEmpty()) app.dock.setIcon(icon);
  }
  screen.on("display-metrics-changed", () => fitWindowToScreen(mainWindow));
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
