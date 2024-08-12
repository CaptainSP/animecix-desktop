import { app, dialog } from "electron";
import { AuthController } from "./auth-controller";
import { WindowController } from "./window-controller";
import path from "path";

export class DeeplinkController {
  constructor(
    private win: WindowController,
    private authController: AuthController
  ) {}

  public execute() {
    if (this.win.win) {
      const win = this.win.win;
      if (process.defaultApp) {
        if (process.argv.length >= 2) {
          app.setAsDefaultProtocolClient("animecix", process.execPath, [
            path.resolve(process.argv[1]),
          ]);
        }
      } else {
        app.setAsDefaultProtocolClient("animecix");
      }

      app.on("open-url", (event, url) => {

        if (url !== undefined) {
          if (url.includes("animecix://login")) {
            this.authController.onLinkReceived(url);
          } else {
            win.loadURL(url.replace("animecix://", "https://"));
          }
        }
      });

      app.on("second-instance", (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        let url = commandLine.find((item) => {
          return item.includes("animecix://");
        });
        if (url !== undefined) {
          if (url.includes("animecix://login")) {
            this.authController.onLinkReceived(url);
          } else {
            const urll = new URL(process.env.APP_URL as string);
            urll.pathname = url.replace("animecix://", "");
            win.loadURL(urll.href);
          }
        }
        if (win.isMinimized()) win.restore();
        win.focus();
      });
    }
  }
}
