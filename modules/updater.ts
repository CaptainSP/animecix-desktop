import { session } from "electron";
import { autoUpdater, ProgressInfo, UpdateInfo } from "electron-updater";
import { WindowController } from "./controllers/window-controller";
import { NotificationHelper } from "./helpers/notification-helper";

export class Updater {
  constructor(private win: WindowController) {}

  public execute() {
    try {
      // Güncellemeyi başlat
      autoUpdater.checkForUpdates();
    } catch (err) {
      console.error("Güncelleme kontrolü başlatılamadı:", err);
    }

    // Güncelleme bulunduğunda
    autoUpdater.on("update-available", async (info: UpdateInfo) => {
      try {
        if (session.defaultSession) await session.defaultSession.clearCache();
        if (this.win.webContents?.session)
          await this.win.webContents.session.clearCache();
      } catch (e) {
        console.error("Cache temizleme hatası:", e);
      }

      NotificationHelper.createAndShow(
        "AnimeciX Güncelleniyor...",
        "Güncelleme indiriliyor"
      );

      // Yeni sürüm sayfasını yükle
      try {
        this.win.loadURL(`https://anm.cx/windows-update-page/${info.version}`);
      } catch (e) {
        console.error("Güncelleme sayfası yüklenemedi:", e);
      }
    });

    // Güncelleme indirildiğinde
    autoUpdater.on("update-downloaded", async () => {
      try {
        if (session.defaultSession) await session.defaultSession.clearCache();
        if (this.win.webContents?.session)
          await this.win.webContents.session.clearCache();
      } catch (e) {
        console.error("Cache temizleme hatası:", e);
      }

      NotificationHelper.createAndShow(
        "AnimeciX Güncelleniyor...",
        "Güncelleme kuruluyor..."
      );

      // 1-2 saniyelik gecikme (UI kapanmadan önce)
      setTimeout(() => {
        try {
          autoUpdater.quitAndInstall();
        } catch (e) {
          console.error("Güncelleme kurulumu başlatılamadı:", e);
        }
      }, 1500);
    });

    // İndirme ilerlemesi
    autoUpdater.on("download-progress", (data: ProgressInfo) => {
      try {
        this.win.sendToWebContents("update-download-progress", data);
      } catch (e) {
        console.error("Progress bilgisi gönderilemedi:", e);
      }
    });

    // Hata durumunda
    autoUpdater.on("error", (error) => {
      console.error("Güncelleme hatası:", error);
      NotificationHelper.createAndShow(
        "Güncelleme Hatası",
        "Güncelleme sırasında bir hata oluştu. Daha sonra tekrar deneyin."
      );
    });
  }
}
