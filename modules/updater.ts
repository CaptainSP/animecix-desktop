import { session, app } from "electron";
import { autoUpdater, ProgressInfo, UpdateInfo } from "electron-updater";
import { WindowController } from "./controllers/window-controller";
import { NotificationHelper } from "./helpers/notification-helper";

export class Updater {
  constructor(private win: WindowController) {
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
  }

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
        "AnimeciX Güncellemesi Mevcut",
        "Yeni bir güncelleme var, indirilsin mi?",
      );

      autoUpdater.downloadUpdate();
    });

    autoUpdater.on("update-downloaded", async () => {
      try {
        await session.defaultSession.clearCache();
        await this.win.webContents?.session.clearCache();
      } catch (e) {
        console.error("Failed to clear cache", e);
      }

      NotificationHelper.createAndShow(
        "AnimeciX Güncelleme Hazır",
        "Güncelleme kurmak için yeniden başlatın.",
      );

      autoUpdater.quitAndInstall();
    });

    autoUpdater.on("download-progress", (data: ProgressInfo) => {
      this.win.sendToWebContents("update-download-progress", data);
    });

    autoUpdater.on("error", (error) => {
      console.error("Update error:", error);
    });
  }
}
