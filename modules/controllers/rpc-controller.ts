import { ipcMain } from "electron";
import { Client } from "@xhayper/discord-rpc";
import { WindowController } from "./window-controller";

export class RpcController {
  private readonly client: Client;
  private isConnected: boolean = false;

  constructor(private win: WindowController) {
    this.client = new Client({
      clientId: "921684324141641728",
    });

    //try to connect
    this.client.once("ready", () => {
      this.isConnected = true;

      this.setIdleActivity(); // idle
    });

    //if cannot connect, throw an error
    this.client.login().catch((err) => {
      console.error("Discord RPC bağlanılamadı :", err.message);
      this.isConnected = false;
    });
  }

  private setIdleActivity() {
    if (!this.isConnected) return;
    const idleActivity = {
      state: "Bakınıyor",
      largeImageKey: "animecix-logo",
      type: 3,
    };
    this.client.user?.setActivity(idleActivity).catch(console.error);
  }

  public execute(): void {
    ipcMain.on("discord-rpc", (event, data) => {
      if (!this.isConnected) {
        console.warn("Discord RPC çalışmıyor.");
        return;
      }

      const watchingActivity = {
        //When the user watch an anime
        state: data.state === "" ? "Movie" : data.state,
        details: data.details,
        startTimestamp: Date.now(),
        largeImageKey: "animecix-logo",
        type: 3,
      };

      this.client.user?.setActivity(watchingActivity).catch(console.error); //update activity status.
    });

    ipcMain.on("discord-rpc-destroy", () => {
      // When the user  returns to the homepage, the RPC status is set to idle. Didn't test tho
      this.setIdleActivity();
    });
  }

  public destroy(): void {
    //After app close, clears the activity status.
    if (!this.isConnected) return;
    this.client.user?.clearActivity().catch(console.error);
  }
}
