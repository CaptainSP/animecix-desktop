import {
  BrowserWindow,
  ipcMain,
  WebContents,
  app,
  dialog,
  session,
  shell,
} from "electron";
import path from "path";
import { Deeplink } from "electron-deeplink";

export class WindowController {
  private isOdnok = false;
  public sources: any[] = [];
  public identifier: any;
  public standart: any;

  public intervals: any[] = [];

  public get webContents(): WebContents | undefined {
    return this.win?.webContents;
  }

  public get isDestroyed(): boolean {
    return this.win == null || this.win.isDestroyed();
  }

  // Set the progress bar to the given percentage. It will be shown in task bar
  public setProgress(progress: number) {
      this.win?.setProgressBar(progress != 0 ? progress : -1);
  }

  unmaximize() {
    this.win?.unmaximize();
  }

  reload() {
    this.win?.reload();
  }

  constructor(public win: BrowserWindow | null) {
    this.setUserAgent();
    this.destoryWhenExit();
    this.listenFullScreen();
    this.registerDeepLinks();
    this.setOpenHandler();

    this.win?.webContents.openDevTools();
  }

  // Register deep links (animecix://) for the app.
  registerDeepLinks() {
    const win = this.win;

    if (win) {
    }
  }

  minimize() {
    this.win?.minimize();
  }

  public isMaximized() {
    return this.win?.isMaximized();
  }

  maximize() {
    this.win?.maximize();
  }

  listenFullScreen() {
    this.win?.on("enter-full-screen", () => {
      if (this.win != null) {
        this.win.setMenuBarVisibility(false);
      }
    });

    this.win?.on("leave-full-screen", () => {
      if (this.win != null) {
        this.win.setMenuBarVisibility(true);
      }
    });
  }

  destoryWhenExit() {
    ipcMain.on("exit", (event) => {
      this.win?.close();
      this.intervals.forEach((element) => {
        clearInterval(element);
      });
    });
  }

  public currentFrameUrl: string | null = null;

  public sendToWebContents(key: string, ...data: any) {
    if (this.win != null && !this.win.isDestroyed()) {
      this.win.webContents.send(key, ...data);
    }
  }

  public sendToFrame(key: string, ...data: any) {
    if (!this.win?.isDestroyed()) {
      this.win?.webContents?.mainFrame.frames.forEach((frame) => {
        frame.send(key, ...data);
      });
    }
  }

  public destroy() {
    this.win = null;
  }

  public loadURL(url: string) {
    if (this.win != null && !this.win.isDestroyed()) {
      this.win.webContents.loadURL(url);
    }
  }

  public getReferer() {
    return this.isOdnok ? null : this.currentFrameUrl;
  }

  public setUserAgent() {
    if (this.win != null) {
      this.win.webContents.on("did-create-window", (window) => {
        window.webContents.setUserAgent(
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:70.0) Gecko/20100101 Firefox/70.0"
        );
      });
    }
  }

  public setOpenHandler() {
    if (this.win != null) {
      ipcMain.on("openLink", (event, link: string) => {
        if (!link.startsWith("http")) {
          link = process.env.APP_URL + "/" + link;
        }
        console.log(link);
        shell.openExternal(link);
      });

      this.win.webContents.on("new-window", (e, url) => {
        if (url.includes("discord.gg")) {
          e.preventDefault();
          shell.openExternal(url);
        }
      });

      this.win.webContents.setWindowOpenHandler(({ url }) => {
        console.log("OPEN", url);

        if (
          url.includes("disqus") ||
          url.includes("animecix") ||
          url.includes("google")
        ) {
          return {
            action: "allow",
            overrideBrowserWindowOptions: {
              frame: true,
              autoHideMenuBar: true,
              fullscreenable: false,
              backgroundColor: "black",
              webPreferences: {},
            },
          };
        }
        return { action: "deny" };
      });
    }
  }
}
