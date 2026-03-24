import { app, BrowserWindow } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const packagedIndex = path.join(currentDir, "..", "dist", "index.html");
const appUrl = process.env.OPEN_METAVERSE_APP_URL ?? "http://127.0.0.1:5173/";

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 760,
    autoHideMenuBar: true,
    title: "OpenMetaverseKit",
    backgroundColor: "#020617",
    webPreferences: {
      contextIsolation: true,
      sandbox: true
    }
  });

  if (app.isPackaged) {
    window.loadFile(packagedIndex).catch(() => {
      window.loadURL(errorPage(`The packaged app could not load <code>${packagedIndex}</code>.`));
    });
    return;
  }

  window.loadURL(appUrl).catch(() => {
    window.loadURL(errorPage(
      `The desktop shell could not reach <code>${appUrl}</code>.`,
      "Start the runtime with <code>npm run dev -- --host 127.0.0.1 --port 5173</code> and then open the desktop shell again."
    ));
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

function errorPage(message, detail = "") {
  return `data:text/html,
    <html>
      <body style="margin:0;font-family:sans-serif;background:#020617;color:#e2e8f0;display:grid;place-items:center;min-height:100vh;">
        <div style="max-width:720px;padding:32px;">
          <h1>OpenMetaverseKit</h1>
          <p>${message}</p>
          ${detail ? `<p>${detail}</p>` : ""}
        </div>
      </body>
    </html>`;
}
