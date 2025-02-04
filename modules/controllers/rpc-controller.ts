import { ipcMain } from "electron";
import { Client } from "@xhayper/discord-rpc";
import { WindowController } from "./window-controller";

export class RpcController {
  private readonly client: Client;

  constructor(private win: WindowController) {
    // Create a new Discord.js client (bot)
    this.client = new Client({
      clientId: "921684324141641728",
    });

    this.client.once("ready", () => {
      let idleActivity = {
        state: "Bakınıyor",
        largeImageKey: "animecix-logo",
        type: 3,
      };
      this.client.user?.setActivity(idleActivity);

      console.log(`Logged in as ${this.client.user?.tag}`);
    });

    this.client.login().catch(console.error);
  }

  public execute(): void {
    let idleActivity = {
      state: "Bakınıyor",
      largeImageKey: "animecix-logo",
      type: 3,
    };

    ipcMain.on("discord-rpc", (event, data) => {
      let watchingActivity = {
        //All info during user watch things
        state: data.state === "" ? "Movie" : data.state,
        details: data.details,
        startTimestamp: Date.now(),
        largeImageKey: "animecix-logo",
        type: 3,
      };
      this.client.user?.setActivity(watchingActivity); //Set the watching activity
    });

    ipcMain.on("discord-rpc-destroy", (event, data) => {
      this.client.user?.setActivity(idleActivity); // set the idle activity
    });
  }

  public destroy(): void {
    this.client.user?.clearActivity(); // Clear User RPC After Exit
  }
}
