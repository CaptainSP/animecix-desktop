import { ipcMain } from "electron";
import { WindowController } from "./window-controller";

export class SiteMenuController {
  constructor(private win: WindowController) {}

  public execute() {
    ipcMain.on("redo", (event) => {
      this.win.webContents?.goForward();
    });

    ipcMain.on("undo", (event) => {
      this.win.webContents?.goBack();
    });

    ipcMain.on("min", (event) => {
        if (this.win != null) {
          this.win.minimize();
        }
      });

      ipcMain.on("max", (event) => {
        if (this.win != null) {
          if (this.win.isMaximized()) {
            this.win.maximize();
          } else {
            this.win.maximize();
          }
        }
      });
  }
}
