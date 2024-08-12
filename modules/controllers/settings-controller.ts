import axios from "axios";
import { ipcMain } from "electron";
import { Sibnet } from "../helpers/sibnet";
import { WindowController } from "./window-controller";
import { Database } from "../../models/database";
import path from "path";
export class SettingsControlller {
  db: Database;
  constructor(private win: WindowController) {
    this.db = new Database(
      path.join(process.cwd(), "settings.json")
    );
  }
  private getData() {
    return this.db.fetchAll();
  }
  public execute() {
    ipcMain.on("settingsGet", async (event, ok) => {
      console.log("get Event");
      console.log(this.db.file)
      let data = this.getData();
      data.autoLaunch = await this.win.autoLauncher?.isEnabled();
      if (this.win != null) {
        this.win.webContents?.mainFrame.frames.forEach((frame) => {
          frame.send("settingsDetails", data);
        });
      }
      event.sender.send("settingsDetails",data );
    });
    ipcMain.on("settingsSet", (event, namve, value) => {
      if(!value) return this.db.remove(namve);
      this.db.set(namve, value);
    });
    ipcMain.on("toggleAutoLaunch", async (event, namve, value) => {
    if(await this.win.autoLauncher?.isEnabled()) {
      await this.win.autoLauncher?.disable()
    } else await this.win.autoLauncher?.enable()
    });
  }
}
