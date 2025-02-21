import { BrowserWindow, app, Menu, shell } from "electron";
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

export class Main {
  win: WindowController | null = null;

  constructor(public dir: any) {}

  run() {
    const gotTheLock = app.requestSingleInstanceLock();

    if (!gotTheLock) {
      app.quit();
    } else {
      app.whenReady().then(() => {
        app.setAppUserModelId("AnimeciX");
        const win = new BrowserWindow({
          show: false,
          backgroundColor: "#1D1D1D",
          webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            nodeIntegrationInSubFrames: true,
            preload: this.dir + "/files/preload.js",
            
          },
          title: "AnimeciX",
          icon: path.join(this.dir, "files", "icon.png"),
          frame: false,
        });
        this.win = new WindowController(win);

        // Do not show the window if page is not loaded

        this.createMenu();

        win.minimize();
        win.setProgressBar(100);
        win.on("ready-to-show", () => {
          win.maximize();
          win.show();
          win.setProgressBar(0);
        });

        //win.webContents.openDevTools()
        

        // Check for updates
        const updater = new Updater(this.win);
        updater.execute();

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

        win.loadURL(process.env.APP_URL as string);
      });
    }
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
              await shell.openExternal("https://anm.cx/contact");
            },
          },
        ],
      },
    ];

    const menu = Menu.buildFromTemplate(template as any);
    Menu.setApplicationMenu(menu);
  }
}
