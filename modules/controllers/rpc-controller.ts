/* import { ipcMain } from "electron";
import { WindowController } from "./window-controller";

export class RpcController {
  private readonly client = require("discord-rich-presence")(
    "921684324141641728"
  );

  constructor(private win: WindowController) {}

  public execute() {
    ipcMain.on("discord-rpc", (event, data) => {
      this.client.updatePresence({
        state: data.state == "" ? "Movie" : data.state,
        details: data.details,
        startTimestamp: new Date(),
        largeImageKey: "animecix-logo",
      });
    });

    ipcMain.on("discord-rpc-destroy", (event, data) => {
      this.client.updatePresence({
        startTimestamp: new Date(),
        largeImageKey: "animecix-logo",
      });
    });
  }
}
*/
