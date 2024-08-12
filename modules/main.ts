import { BrowserWindow, app, Menu, shell, Tray, Notification } from "electron";
import path from "path";
import { Updater } from "./updater";
import { WindowController } from "./controllers/window-controller";
import { DownloadController } from "./controllers/download-controller";
import { SiteMenuController } from "./controllers/site-menu-controller";
import { PlayerController } from "./controllers/player-controller";
import { RequestController } from "./controllers/request-controller";
import { RpcController } from "./controllers/rpc-controller";
import { AuthController } from "./controllers/auth-controller";
import { DeeplinkController } from "./controllers/deeplink-controller";
import { SettingsControlller } from "./controllers/settings-controller";
import fetch from "node-fetch";
import os from "os";
import { existsSync, mkdirSync } from "fs";
import { downloadImage } from "./helpers/url-helper";

interface animeData {
  poster: string;
  title: string;
  titleId: number;
  seasonNumber: number;
  episode_number: number;
}
export class Main {
  win: WindowController | null = null;
  tray: any;
  constructor(public dir: any) {}

  run() {
    const gotTheLock = app.requestSingleInstanceLock();

    if (!gotTheLock) {
      app.quit();
    } else {
      app.whenReady().then(() => {
        this.tray = new Tray(path.join(this.dir, "files", "icon.png"));
        this.tray.setToolTip("AnimeciX");
        this.setContext();
        this.tray.on("click", () => {
          if (this.win?.win?.isVisible()) {
            this.win?.win?.hide();
          } else {
            this.win?.win?.show();
          }
        });
        app.setAppUserModelId("AnimeciX");
        const win = new BrowserWindow({
          show: false,
          backgroundColor: "#1D1D1D",
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
        this.createMenu();
        let did_open = false;

        if (!process.argv.includes("notify")) {
          win.minimize();
          win.setProgressBar(100);
          win.on("ready-to-show", () => {
            open();
          });

          //  win.webContents.openDevTools()

          const updater = new Updater(this.win);
          // Check for updates
          updater.execute();
        } else {
        }
        function open() {
          if (!did_open) {
            did_open = true;
            win.maximize();
            win.show();
            win.setProgressBar(0);
          }
        }
        // Setup the Adblock and rewrite necessary headers
        const requestController = new RequestController(this.win);
        requestController.execute();

        // Setup download controller
        const downloadController = new DownloadController(this.win);
        downloadController.execute();

        const siteMenuController = new SiteMenuController(this.win);
        siteMenuController.execute();
        const playerController = new PlayerController(this.win);
        playerController.execute();
        const settings = new SettingsControlller(this.win);
        settings.execute();
        this.win.db = settings.db;

        this.check();
        this.win?.intervals.push(
          setInterval(() => {
            this.check();
          }, 15 * 60 * 1000)
        );
        // Discord RPC
        const rpcController = new RpcController(this.win);
        rpcController.execute();

        // Register Auth Controller
        const authController = new AuthController(this.win);

        const deeplinkController = new DeeplinkController(
          this.win,
          authController
        );
        deeplinkController.execute();
        let url = process.argv.slice(1).find((item) => {
          return item.includes("animecix://");
        });
        if (url !== undefined) {
          if (url.includes("animecix://login")) {
            authController.onLinkReceived(url);
          } else {
            const urll = new URL(process.env.APP_URL as string);
            urll.pathname = url.replace("animecix://", "");
            win.loadURL(urll.href);
          }
        } else {
          win.loadURL(process.env.APP_URL as string);
        }
      });
    }
  }
  async check() {
    let veri = (await this.win?.db.fetchAll()) ?? {};
    let data = veri.notifier ?? {};
    if (!data?.animeData) data.animeData = [];
    const shouldNotFetchData =
      data.lastCheck !== null &&
      15 * 60 * 1000 - (Date.now() - data.lastCheck) > 0;
    if (!shouldNotFetchData) {
      try {
        const d = this.fetchData().then((d) => {
          const requiredAnimes = d.data
            .filter((x: { title_id: number }) =>
            (veri.notifyIDs ?? []).map(x=>parseInt(`${x}`))?.includes(x.title_id)
            )
            .map(
              (x: {
                title_poster: any;
                title_id: any;
                season_number: any;
                episode_number: any;
                title_name: any;
              }) => {
                return {
                  poster: x.title_poster,
                  title: x.title_name,
                  titleId: x.title_id,
                  seasonNumber: x.season_number,
                  episode_number: x.episode_number,
                };
              }
            );
          this.checkForNewEpisodes(requiredAnimes);
        });
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    }
  }
  async checkForNewEpisodes(newData: animeData[]) {
    const storedData = await this.win?.db?.get("notifier");
    const storedEpisodes: animeData[] = storedData?.animeData || [];

    const newEpisodes = newData.filter(
      (newEpisode) =>
        !storedEpisodes.some(
          (storedEpisode) =>
            storedEpisode.titleId === newEpisode.titleId &&
            storedEpisode.seasonNumber === newEpisode.seasonNumber &&
            storedEpisode.episode_number === newEpisode.episode_number
        )
    );

    if (newEpisodes.length > 0) {
      for (let episode of newEpisodes) {
        await new Promise<void>(async (a) => {
          try {
            let tempdir = path.join(os.tmpdir(), "animecix");
            if (!existsSync(tempdir)) mkdirSync(tempdir);
            let filePath = path.join(tempdir, `${episode.titleId}.png`);
            if (!existsSync(filePath) && episode.poster)
              await downloadImage(episode.poster, filePath);

            const notification = new Notification({
              icon:
                filePath ??
                path.join(process.env.dir as string, "files", "icon.png"),
              title: "Yeni bölüm",
              timeoutType: "default",
              body: `${
                episode.title.length > 15
                  ? `${episode.title.slice(0, 15)}...`
                  : episode.title
              }\n${
                (episode.seasonNumber ?? 0) > 1
                  ? `${episode.seasonNumber ?? 0}. Sezon `
                  : ""
              }${episode.episode_number}. Bölüm`,

              actions: [
                {
                  type: "button",
                  text: "İzle",
                },
              ],
              closeButtonText: "Kapat",
            });
            setTimeout(() => {
              notification.close();
            }, 10000);
            notification.show();
            notification.on("failed", () => a());
            notification.on("close", () => a());
            notification.on("click", async () => {
              await shell.openExternal(
                `animecix://titles/${episode.titleId}/season/${episode.seasonNumber}/episode/${episode.episode_number}`,
                { workingDirectory: process.cwd(), activate: true }
              );
              a();
            });
          } catch (error) {}
        });
      }

      this.win?.db?.set("notifier", {
        lastCheck: Date.now(),
        animeData: [
          ...storedEpisodes
            .filter((x) => !newData.some((y) => x.titleId == y.titleId))
            .map((x) => {
              return {
                titleId: x.titleId,
                seasonNumber: x.seasonNumber,
                episode_number: x.episode_number,
              };
            }),
          ...newData.map((x) => {
            return {
              titleId: x.titleId,
              seasonNumber: x.seasonNumber,
              episode_number: x.episode_number,
            };
          }),
        ],
      });
    }
  }
  async fetchData() {
    try {
      const response = await fetch("https://animecix.net/secure/last-episodes");
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Fetch error:", error);
      throw error;
    }
  }

  setContext() {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Yardım",
        role: "help",
        submenu: [
          {
            label: "İletişim",
            click: async () => {
              await shell.openExternal("https://animecix.net/contact");
            },
          },
          {
            label: "Discord",
            click: async () => {
              await shell.openExternal("https://discord.gg/animecix");
            },
          },
        ],
      },
      { type: "separator" },
      {
        label: "Çıkış",
        click: () => {
          app.quit();
        },
      },
    ]);
    this.tray?.setContextMenu(contextMenu);
  }
  createMenu() {
    const isMac = process.platform === "darwin";

    const template = [
      // { role: 'appMenu' }
      ...(isMac
        ? [
            {
              label: app.name,
              submenu: [
                { role: "about" },
                { type: "separator" },
                { role: "services" },
                { type: "separator" },
                { role: "hide" },
                { role: "hideOthers" },
                { role: "unhide" },
                { type: "separator" },
                { role: "quit" },
              ],
            },
          ]
        : []),
      // { role: 'fileMenu' }
      {
        label: "Uygulama",
        submenu: [isMac ? { role: "close" } : { role: "quit" }],
      },
      // { role: 'editMenu' }
      {
        label: "Düzenle",
        submenu: [
          { role: "undo" },
          { role: "redo" },
          { type: "separator" },
          { role: "cut" },
          { role: "copy" },
          { role: "paste" },
          ...(isMac
            ? [
                { role: "pasteAndMatchStyle" },
                { role: "delete" },
                { role: "selectAll" },
                { type: "separator" },
                {
                  label: "Speech",
                  submenu: [
                    { role: "startSpeaking" },
                    { role: "stopSpeaking" },
                  ],
                },
              ]
            : [
                { role: "delete" },
                { type: "separator" },
                { role: "selectAll" },
              ]),
        ],
      },
      // { role: 'viewMenu' }
      {
        label: "Görüntü",
        submenu: [
          { role: "reload" },
          { role: "forceReload" },
          { type: "separator" },
          { role: "resetZoom" },
          { role: "zoomIn" },
          { role: "zoomOut" },
          { type: "separator" },
          { role: "togglefullscreen" },
        ],
      },
      // { role: 'windowMenu' }
      {
        label: "Pencere",
        submenu: [
          { role: "minimize" },
          { role: "zoom" },
          ...(isMac
            ? [
                { type: "separator" },
                { role: "front" },
                { type: "separator" },
                { role: "window" },
              ]
            : [{ role: "close" }]),
        ],
      },
      {
        role: "help",
        submenu: [
          {
            label: "İletişim",
            click: async () => {
              await shell.openExternal("https://animecix.net/contact");
            },
          },
        ],
      },
    ];

    const menu = Menu.buildFromTemplate(template as any);
    Menu.setApplicationMenu(menu);
  }
}
