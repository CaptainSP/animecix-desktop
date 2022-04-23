import { BrowserWindow, app, ipcMain, WebFrameMain } from "electron";
import path from "path";
import { ElectronBlocker } from "@cliqz/adblocker-electron";
import { Updater } from "./updater";
import { WindowController } from "./controllers/window-controller";
import { DownloadController } from "./controllers/download-controller";
import { SiteMenuController } from "./controllers/site-menu-controller";
import { PlayerController } from "./controllers/player-controller";
import { RequestController } from "./controllers/request-controller";
import { RpcController } from "./controllers/rpc-controller";

export class Main {
  
  win: WindowController | null = null;

 constructor(public dir: any) {}

  run() {
    app.on("ready", () => {
      app.setAppUserModelId("AnimeciX");
      const win = new BrowserWindow({
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
          nodeIntegrationInSubFrames: true,
          preload: this.dir + "/files/preload.js",
          nativeWindowOpen: true,
        },
        title: "AnimeciX",
        icon: path.join(this.dir, "files", "icon.png"),
        frame: false,
      });
      this.win = new WindowController(win);
      this.win.maximize();

      const updater = new Updater(this.win);
      updater.execute();

  
      const requestController = new RequestController(this.win)
      requestController.execute()

      const downloadController = new DownloadController(this.win);
      downloadController.execute();

      const siteMenuController = new SiteMenuController(this.win);
      siteMenuController.execute()

      const playerController = new PlayerController(this.win)
      playerController.execute()

      const rpcController = new RpcController(this.win)
      rpcController.execute()


      win.loadURL("https://animecix.net");
  
    });
  }
}
