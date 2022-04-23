import { app, ipcMain, Notification, shell } from "electron";
import { DownloadItem } from "../../models/download-item";
import { Downloader2 } from "../downloader";
import { NotificationHelper } from "../helpers/notification-helper";
import { WindowController } from "./window-controller";

export class DownloadController {
  private paused = false;
  fileForDownload: any;
  downloads: Map<string, DownloadItem> = new Map();

  constructor(private win: WindowController) {}

  public execute() {
    ipcMain.on("pauseAllDownloads", (event) => {
      this.pauseAllDownloads();
    });

    ipcMain.on("setPaused", (event, paused: boolean) => {
      this.paused = paused;
      this.sendDownloadStatus();
      if (!paused && this.getDownloadingItem() === undefined) {
        const first = this.getFirstQueriedDownloadItem();
        if (first !== undefined) {
          this.downloadVideo({
            file: first.url,
            name: first.name,
            threads: first.threads,
            referer:
              first.downloader.referer || this.win.getReferer() || undefined,
          });
        }
      }
    });

    ipcMain.on("setPaused", (event, paused: boolean) => {
      this.paused = paused;
      this.sendDownloadStatus();
    });

    ipcMain.on("canDownload", (event, file) => {
      this.fileForDownload = file;
      this.sendToWindow("canDownload", true);
      this.sendToWindow("sourcesForDownload", null);
      console.log("CAN DOWNLOAD", this.fileForDownload);
    });

    ipcMain.on("canDownloadSources", (event, sources) => {
      this.win.sources = sources;
      this.sendToWindow("canDownload", true);
      this.sendToWindow("sourcesForDownload", this.win.sources);
      console.log("CAN DOWNLOAD", this.fileForDownload);
    });

    ipcMain.on("cancelDownloadVideo", (event, name) => {
      this.cancelFirstDownload();
    });

    ipcMain.on("removeDownload", (event, name) => {
      this.downloads.delete(name);
      this.sendDownloadsToWindow();
    });

    ipcMain.on("showDownloads", (event, ok) => {
      this.sendDownloadsToWindow();
    });

    ipcMain.on("seeAll", (event, ok) => {
      shell.openPath(app.getPath("downloads") + "/AnimeciX/");
    });

    ipcMain.on("downloads", (event, data) => {});

    ipcMain.on(
      "downloadVideo",
      (
        event,
        video: {
          name: string;
          file?: string;
          threads: number;
          referer?: string;
        }
      ) => {
        this.downloadVideo(video);
      }
    );

    ipcMain.on("retryDownload", (event, video) => {
      this.downloadVideo(video);
    });
  }

  private sendToWindow(key: string, data: any) {
    this.win.sendToWebContents(key, data);
  }

  pauseAllDownloads() {
    this.paused = true;
    this.cancelFirstDownload();
    this.sendDownloadStatus();
  }

  downloadVideo(video: {
    name: string;
    file?: string | undefined;
    referer?: string | undefined;
    threads: number;
  }) {
    if (!video.file) {
      video.file = this.fileForDownload;
    }
    if (
      this.downloads.has(video.name) &&
      this.downloads.get(video.name)?.downloader.isDownloading()
    ) {
      this.cancelFirstDownload();
    }
    const downloader = new Downloader2(
      video.file as string, // url
      video.name, // name
      video.threads, // thread count
      video.referer ? video.referer : this.win.getReferer()
    );
    this.downloads.set(video.name, {
      name: video.name,
      url: video.file as string,
      downloader: downloader,
      threads: video.threads,
    });
    console.log(this.downloads);
    this.checkToStartDownload();
    this.sendDownloadsToWindow();
  }

  public sendDownloadsToWindow() {
    this.sendToWindow(
      "downloads",
      this.getDownloadsArray().map((item) => {
        return {
          name: item.name,
          url: item.url,
          referer: item.downloader.getReferer(),
          downloading: item.downloader.isDownloading(),
          canceled: item.downloader.isCanceled(),
          failed: item.downloader.isFailed(),
          completed: item.downloader.isCompleted(),
        };
      })
    );
    this.sendDownloadStatus();
  }

  checkToStartDownload() {
    if (this.paused) {
      return;
    }
    const values = this.getDownloadsArray();
    const downloading = this.getDownloadingItem(values);
    if (downloading === undefined) {
      const first = this.getFirstQueriedDownloadItem(values);
      if (first !== undefined) {
        first.downloader.setOnCanceledListener(
          this.onDownloadCanceledListener.bind(this)
        );
        first.downloader.setOnErrorListener(
          this.onDownloadErrorListener.bind(this)
        );
        first.downloader.setOnFinishListener(
          this.onDownloadFinishListener.bind(this)
        );
        first.downloader.setOnProgressListener(
          this.onDownloadProgressListener.bind(this)
        );
        first.downloader.start();
        this.sendToWindow("downloadProgress", {
          speed: 0,
          progress: 0,
        });
      } else {
        console.log("first und");
      }
    } else {
      console.log("down", downloading);
    }
  }
  getFirstQueriedDownloadItem(values?: DownloadItem[]) {
    if (values === undefined) {
      values = this.getDownloadsArray();
    }
    let first = values.find((item) => {
      return (
        !item.downloader.isCanceled() &&
        !item.downloader.isFailed() &&
        !item.downloader.isCompleted() &&
        !item.downloader.isDownloading()
      );
    });
    return first;
  }

  sendDownloadStatus() {
    this.win.sendToWebContents("downloadStatus", this.paused);
  }
  cancelFirstDownload() {
    this.getDownloadingItem()?.downloader.cancel();
  }

  getDownloadingItem(values?: DownloadItem[]) {
    if (values === undefined) {
      values = this.getDownloadsArray();
    }
    let downloading = values.find((item) => {
      return item.downloader.isDownloading();
    });
    return downloading;
  }
  getDownloadsArray() {
    return Array.from(this.downloads.values());
  }

  onDownloadErrorListener(error: string) {
    console.log("DOWNLOAD ERROR", error);
    this.checkToStartDownload();
    this.sendDownloadsToWindow();
  }

  onDownloadCanceledListener() {
    this.checkToStartDownload();
    this.sendDownloadsToWindow();
  }

  onDownloadFinishListener() {
    if (this.getFirstQueriedDownloadItem() === undefined) {
      NotificationHelper.createAndShow("Tüm indirmeler tamamlandı");
    } else {
      this.checkToStartDownload();
    }
    this.sendDownloadsToWindow();
  }

  onDownloadProgressListener(
    progress: number,
    speed: number,
    totalSize: number
  ) {
    this.sendToWindow("downloadProgress", {
      speed: speed,
      progress: progress,
      totalSize: totalSize,
    });
  }
}
