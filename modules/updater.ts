import { session } from "electron";
import { autoUpdater, ProgressInfo, UpdateInfo } from "electron-updater";
import { WindowController } from "./controllers/window-controller";
import { NotificationHelper } from "./helpers/notification-helper";

export class Updater {
  constructor(private win: WindowController) {}

  public execute() {
    autoUpdater.checkForUpdates();

    autoUpdater.on("update-available", async (info: UpdateInfo) => {
      try {
        await session.defaultSession.clearCache();
        await this.win.webContents?.session.clearCache();
      } catch (e) {
        console.error("Failed to clear cache", e);
      }
      NotificationHelper.createAndShow(
        "AnimeciX Güncelleniyor...",
        "Güncelleme indiriliyor"
      );

      this.win.loadURL(
        "https://animecix.net/windows-update-page/" + info.version
      );
    });

    autoUpdater.on("update-downloaded", async () => {
      try {
        await session.defaultSession.clearCache();
        await this.win.webContents?.session.clearCache();
      } catch (e) {
        console.error("Failed to clear cache", e);
      }
      NotificationHelper.createAndShow(
        "AnimeciX Güncelleniyor...",
        "Güncelleme Kuruluyor"
      );

      autoUpdater.quitAndInstall();
    });

    autoUpdater.on("download-progress", (data: ProgressInfo) => {
      this.win.sendToWebContents("update-download-progress", data);
    });
  }
}
