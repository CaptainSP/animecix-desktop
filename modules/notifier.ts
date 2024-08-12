import { app, Menu, Notification, shell, Tray } from "electron";
import path from "path";
import { Database } from "../models/database";
import fetch from "node-fetch";
import { WindowController } from "./controllers/window-controller";
import { Main } from "./main";

interface animeData {
  poster: string;
  title: string;
  titleId: number;
  seasonNumber: number;
  episode_number: number;
}
let notifyIDs = [11520, 11521];
export class Notifier {
  tray: Tray | null = null;
  db: Database | undefined;
  win: WindowController | null = null;

  constructor(public dir: any) {}

  async run() {
    app.on("second-instance", (event, commandLine, workingDirectory) => {
      if (this.win) {
        event.preventDefault();  
        let url = commandLine.find((item) => {
          return item.includes("animecix://");
        });
        if (url !== undefined) {
            const urll = new URL(process.env.APP_URL as string);
            urll.pathname = url.replace("animecix://", "");
            this.win.loadURL(urll.href);
          
        }
        if (this.win.win?.isMinimized()) this.win.win?.restore();
        this.win.win?.focus();
      } else {
        const main = new Main(__dirname.replace(/\\/g, "/"));
        main.run();
        this.win = main.win;
      }
    });
    const gotTheLock = app.requestSingleInstanceLock();

    if (!gotTheLock) {
      app.quit();
    } else {
      app.whenReady().then(async () => {
        app.setAppUserModelId("AnimeciX");
        this.tray = new Tray(path.join(this.dir, "files", "icon.png"));
        this.tray.setToolTip("Animecix Notifier");
        this.db = new Database(path.join(process.cwd(), "settings.json"));
        this.setContext();

        let json = {
          lastCheck: 0,
          animeData: [] as animeData[],
        };
        const data = this.db.get("notifier");
        if (data) json = data;
        if (!json.animeData) json.animeData = [];
        if (!json.lastCheck) json.lastCheck = 0;
        const shouldFetchData = Date.now() - json.lastCheck > 15 * 60 * 1000;
        if (shouldFetchData) {
          try {
            const d = await this.fetchData();
            const requiredAnimes = d.data
              .filter((x: { title_id: number }) =>
                notifyIDs.includes(x.title_id)
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
          } catch (error) {
            console.error("Failed to fetch data:", error);
          }
        }
      });
    }
  }
  async checkForNewEpisodes(newData: animeData[]) {
    const storedData = await this.db?.get("notifier");
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
        await new Promise<void>((a) => {
          const notification = new Notification({
            icon:
              episode.poster ??
              path.join(process.env.dir as string, "files", "icon.png"),
            title: "Yeni bölüm",
            timeoutType: "default",
            body: `${
              episode.title.length > 13
                ? `${episode.title.slice(0, 13)}...`
                : episode.title
            }\n${episode.seasonNumber ?? 0} Sezon ${
              episode.episode_number
            } Bölüm`,

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
        });
      }

      this.db?.set("notifier", {
        lastCheck: Date.now(),
        animeData: [
          ...storedEpisodes.map((x) => {
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
    } else {
      this.db?.set("notifier", {
        lastCheck: Date.now(),
        animeData: [
          ...storedEpisodes
        ],
      });
    }
  }
  async fetchData() {
    try {
      const response = await fetch("https://animecix.net/secure/last-episodes");
      const data = await response.json();
      console.log(data);
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
}
