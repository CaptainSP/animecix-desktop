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

    // Attempt to connect
    this.client.once("ready", () => {
      this.isConnected = true;
      console.log(`Logged in as ${this.client.user?.tag}`);

      this.setIdleActivity(); // Set the initial idle activity
    });

    this.client.login().catch((err) => {
      console.error("Failed to connect to Discord RPC:", err.message);
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
        console.warn("Discord RPC not connected, cannot set activity.");
        return;
      }

      const watchingActivity = {
        state: data.state === "" ? "Movie" : data.state,
        details: data.details,
        startTimestamp: Date.now(),
        largeImageKey: "animecix-logo",
        type: 3,
      };

      this.client.user?.setActivity(watchingActivity).catch(console.error);
    });

    ipcMain.on("discord-rpc-destroy", () => {
      this.setIdleActivity();
    });
  }

  public destroy(): void {
    if (!this.isConnected) return;
    this.client.user?.clearActivity().catch(console.error);
  }
}
