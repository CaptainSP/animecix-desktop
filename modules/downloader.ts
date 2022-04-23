import axios, { AxiosInstance } from "axios";
import fs from "fs";
import { app } from "electron";
import { DownloaderHelper } from "node-downloader-helper";
import * as path from "path";

export class Downloader2 {
  url: string;
  threadCount: number;
  referer: string | null;
  name: string;
  path: any;
  directory: string;
  instance: AxiosInstance;

  /// listeners
  errorListener: ((error: string) => void) | null = null;
  progressListener:
    | ((progress: number, speed: number, totalSize: number) => void)
    | null = null;
  onFinishListener: (() => void) | null = null;
  onCanceledListener: (() => void) | null = null;

  /// status
  canceled: boolean = false;
  error: boolean = false;
  downloading: boolean = false;
  completed: boolean = false;

  totalsize: number = 0;
  chunkSize: number = 0;
  threads: {
    id: number;
    start: number;
    end: number;
    finished: boolean;
    writed: boolean;
    writeFinished: boolean;
    path: string;
    speed: number;
    progress: number;
  }[] = [];
  lastWrited: number = 0;

  downloadHelpers: Map<number, DownloaderHelper> = new Map();

  constructor(
    url: string,
    name: string,
    threadCount: number,
    referer: string | null
  ) {
    this.url = url;
    this.threadCount = threadCount;
    this.referer = referer;
    this.name = name.replace(/:/g, "");
    this.path = path.normalize(
      path.join(app.getPath("downloads"), "AnimeciX", this.name)
    );

    this.directory = path.join(app.getPath("downloads"), "AnimeciX");

    const https = require("https");

    this.instance = axios.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });
  }

  public start() {
    this.canceled = false;
    this.error = false;
    this.downloading = true;
    this.checkSize();
  }

  checkSize() {
    if (this.canceled) {
      return;
    }
    const headers: any = {};
    if (this.referer != null) {
      headers["Referer"] = this.referer;
      headers["User-Agent"] =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:70.0) Gecko/20100101 Firefox/70.0";
    }
    this.instance
      .get(this.url, {
        headers: headers,
        responseType: "stream",
      })
      .then((response) => {
        this.totalsize = response.headers["content-length"];
        this.checkParts();
      })
      .catch((e) => {
        this.downloading = false;
        if (!this.canceled) {
          this.error = true;
        }
        if (this.errorListener != null) {
          this.errorListener(e + "");
        }
      });
  }

  checkParts() {
    if (this.canceled) {
      return;
    }
    this.chunkSize = Math.round(this.totalsize / this.threadCount);

    for (let i = 0; i < this.threadCount; i++) {
      let start = i * this.chunkSize;
      let end = (i + 1) * this.chunkSize - 1;

      if (end > this.totalsize) {
        end = this.totalsize;
      }

      let thread = {
        id: i,
        start: start,
        end: end,
        finished: false,
        writed: false,
        writeFinished: false,
        path: "",
        speed: 0,
        progress: 0,
      };

      this.threads.push(thread);
    }

    this.downloadParts();
  }

  calculateProgress(): void {
    let i = 0;
    let totalProgress = 0;
    let totalSpeed = 0;
    this.threads.forEach((value) => {
      totalProgress += value.progress;
      totalSpeed += value.speed;
      i++;
    });
    const speed = totalSpeed / i;
    const progress = totalProgress / i;
    if (this.progressListener != null) {
      this.progressListener(progress, speed, this.totalsize);
    }
    console.log("pr", speed, progress, this.canceled, this.downloading);
  }

  downloadParts() {
    if (!fs.existsSync(this.directory)) {
      fs.mkdirSync(this.directory);
    }

    if (this.canceled || !this.downloading) {
      return;
    }

    this.threads.forEach((thread) => {
      const downloadPath = this.path + "__" + thread.id + ".befw";
      const fileName = this.name + "__" + thread.id + ".befw";
      thread.path = downloadPath;
      let headers: any = {
        Range: "bytes=" + thread.start + "-" + thread.end,
      };

      if (this.referer != null) {
        headers["Referer"] = this.referer;
        headers["User-Agent"] =
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:70.0) Gecko/20100101 Firefox/70.0";
      }

      const dl = new DownloaderHelper(this.url, this.directory, {
        fileName: fileName,
        headers: headers,
        retry: true,
        httpsRequestOptions: {
          rejectUnauthorized: false,
        },
        override: true,
      });

      dl.start();

      dl.on("progress", (stats) => {
        thread.speed = stats.speed;
        thread.progress = stats.progress;
        this.calculateProgress();
        if (!this.downloading) {
          dl.stop();
        }
      });

      dl.on("end", (stats) => {
        thread.finished = true;
        this.checkWrite();
      });

      dl.on("error", (stats) => {
        this.downloading = false;
        if (!this.canceled) {
          this.error = true;
        }
        if (this.errorListener != null) {
          this.errorListener(stats.message);
          this.errorListener = null;
        }
        this.stopDownloads();
      });

      this.downloadHelpers.set(thread.id, dl);
    });
  }

  checkWrite() {
    this.threads.forEach((thread) => {
      if (this.canceled) {
        return;
      }

      try {
        if (
          thread.finished &&
          !thread.writed &&
          (thread.id == 0 || this.threads[thread.id - 1].writeFinished)
        ) {
          var w = fs.createWriteStream(this.path, { flags: "a" });
          var r = fs.createReadStream(thread.path);

          w.on("close", () => {
            thread.writeFinished = true;
            try {
              fs.unlinkSync(thread.path);
            } catch (e) {}
            this.lastWrited++;
            this.checkEnd();
          });

          r.pipe(w);
          thread.writed = true;
        }
      } catch (e) {}
    });
  }

  public cancel() {
    this.canceled = true;
    this.downloading = false;
    this.stopDownloads();
    this.error = false;
    if (this.onCanceledListener != null) {
      this.onCanceledListener();
    }
  }

  stopDownloads() {
    this.downloading = false;
    this.downloadHelpers.forEach((value) => {
      value.stop();
    });
  }

  // Check if all the threads are finished
  checkEnd() {
    let allEnded = true;
    this.threads.forEach((thread) => {
      if (!thread.writeFinished) {
        allEnded = false;
      }
    });
    if (allEnded) {
      /// Finish downloading and call OnSuccess
      this.canceled = false;
      this.error = false;
      this.downloading = false;
      this.completed = true;
      if (this.onFinishListener != null) {
        this.onFinishListener();
      }
    } else {
      /// Keep writings
      this.checkWrite();
    }
  }

  /// Set Listeners

  public setOnErrorListener(listener: (error: string) => void) {
    this.errorListener = listener;
  }

  public setOnProgressListener(
    listener: (progress: number, speed: number, totalSize: number) => void
  ) {
    this.progressListener = listener;
  }

  public setOnFinishListener(listener: () => void) {
    this.onFinishListener = listener;
  }

  public setOnCanceledListener(listener: () => void) {
    this.onCanceledListener = listener;
  }

  public isDownloading() {
    return this.downloading;
  }

  public isCanceled() {
    return this.canceled;
  }

  public isCompleted() {
    return this.completed;
  }

  public isFailed() {
    return this.error;
  }

  public getReferer() {
    return this.referer;
  }
}
