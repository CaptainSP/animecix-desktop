import { ipcMain } from "electron";
import { Client } from "discord-rpc";
import { WindowController } from "./window-controller";

export class RpcController {
  private readonly client: Client;

  constructor(private win: WindowController) {
    this.client = new Client({ transport: "ipc" });
    this.client.login({ clientId: "921684324141641728" }).catch(console.error);
  }

  public execute(): void {
    ipcMain.on("discord-rpc", (event, data) => {
      this.client
        .setActivity({
          state: data.state === "" ? "Movie" : data.state,
          details: data.details,
          startTimestamp: new Date(),
          largeImageKey: "animecix-logo",
        })
        .catch(console.error);
    });

    ipcMain.on("discord-rpc-destroy", (event, data) => {
      this.client
        .setActivity({
          startTimestamp: new Date(),
          largeImageKey: "animecix-logo",
        })
        .catch(console.error);
    });
  }

  public destroy(): void {
    this.client.destroy().catch(console.error);
  }
}
