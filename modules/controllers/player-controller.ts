import axios from "axios";
import { ipcMain } from "electron";
import { Sibnet } from "../helpers/sibnet";
import { WindowController } from "./window-controller";

export class PlayerController {
  constructor(private win: WindowController) {}

  private isOdnok = false;

  public execute() {
    ipcMain.on("getDetails", (event, ok) => {
      event.sender.send(
        "details",
        this.win.currentFrameUrl,
        this.win.identifier
      );
      if (this.win != null) {
        this.win.webContents?.mainFrame.frames.forEach((frame) => {
          frame.send("details", this.win.currentFrameUrl, this.win.identifier);
        });
      }
    });

    ipcMain.on("nextEpisode", (event, ok) => {
      this.win.sendToWebContents("nextEpisode", true);
    });

    ipcMain.on("playerError", (event, ok) => {
      this.win.sendToWebContents("playerError", true);
    });

    this.setupOK();
    this.setupStandart();
    this.setupFembed();
    this.listenCurrentFrame();
  }

  public listenCurrentFrame() {
    ipcMain.on("updateCurrent", (event, currentUrl, identifier) => {
      this.win.currentFrameUrl = currentUrl;
      if (identifier != null) {
        this.win.identifier = identifier;
      }
      this.isOdnok = false;
    });
  }

  public setupFembed() {
    ipcMain.on("Fembed", (event, sourceString) => {
      this.win.sources = JSON.parse(sourceString);
    });
  }

  public setupStandart() {
    ipcMain.on("StandartSetup", (event, file) => {
      if (!this.win.isDestroyed) {
        this.win.webContents?.mainFrame.frames.forEach((frame) => {
          frame.send("Standart", this.win.standart);
        });
      }
    });

    ipcMain.on("Sources", (event, ok) => {
      if (!this.win.isDestroyed) {
        this.win.webContents?.mainFrame.frames.forEach((frame) => {
          frame.send("Sources", this.win.sources);
        });
      }
    });

    ipcMain.on("Setup", (event, ok) => {
      if (this.win.currentFrameUrl != null) {
        Sibnet.found(this.win.currentFrameUrl, (video: any) => {
          if (!this.win.isDestroyed) {
            this.win.webContents?.mainFrame.frames.forEach((frame) => {
              this.win.standart = video;
              frame.send("Standart", video);
            });
          }
        });
      }
    });

    ipcMain.on("Standart", (event, file) => {
      this.win.standart = file;
    });
  }

  public setupOK() {
    ipcMain.on("Odnok", (event, ok) => {
      if (this.win.currentFrameUrl != null) {
        axios
          .get(this.win.currentFrameUrl)
          .then((response) => {
            let str = response.data;
            try {
              const HTMLParser = require("node-html-parser");
              const { parse } = HTMLParser;

              let parsed = parse(str);
              let opt = parsed
                .querySelector('[data-module="OKVideo"]')
                .getAttribute("data-options");
              let data = JSON.parse(opt);
              let metadata = JSON.parse(data.flashvars.metadata);
              // console.log(metadata.videos)
              this.win.sources = [];
              metadata.videos.forEach((element: any) => {
                this.win.sources.push({
                  label: element.name
                    .toUpperCase()
                    .replace("MOBİLE", "144P")
                    .replace("LOWEST", "240P")
                    .replace("LOW", "360P")
                    .replace("SD", "480P")
                    .replace("HD", "720P HD")
                    .replace("FULL", "1080P FHD"),
                  file: element.url + ".mp4",
                });
              });
              this.isOdnok = true;
              if (this.win != null && !this.win.isDestroyed) {
                this.win.webContents?.mainFrame.frames.forEach((frame) => {
                  console.log(this.win.sources);
                  frame.send("Sources", this.win.sources);
                });
              }
            } catch (e) {
              console.log(e);
            }
          })
          .catch((error) => {
            console.log(error);
          });
      }
    });
  }
}
