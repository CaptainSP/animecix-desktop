import { ipcMain } from "electron";
import { Client } from "@xhayper/discord-rpc";
import { WindowController } from "./window-controller";
import { timeStamp } from "console";

export class RpcController {
  private readonly client: Client;
  private isConnected: boolean = false;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private lastActivity: any = null;

  constructor(private win: WindowController) {
    this.client = new Client({
      clientId: "921684324141641728",
    });


    this.setupEventHandlers();
    this.connectToDiscord();
    this.startReconnectCheck();
  }


  private setupEventHandlers(): void {
    this.client.on("ready", () => {
      this.isConnected = true;
      
      if (this.lastActivity) {
        this.client.user?.setActivity(this.lastActivity).catch(console.error);
      } else {
        this.setIdleActivity();
      }
    });

    //if user close the client, just tries to reconnect.
    this.client.on('disconnected', () => {
      console.error("Discord Disconnected");
      this.isConnected = false;
      this.startReconnectCheck();
    });
  }



  private connectToDiscord(): void {
    if (this.isConnected) return;
    this.client.login().catch((err) => {
      this.isConnected = false;
    });
  }


  //Tries to reconnect to Discord every 15 second if cannot
  private startReconnectCheck(): void {
    this.reconnectInterval = setInterval(() => {
      if (!this.isConnected) {
        this.connectToDiscord();
      }
    }, 15000); 
  }

  // As the name suggest it sets the activity to idle.
  // If cannot find anyoworking Discord clients, it updates the lastActivity to idle and returns.
  private setIdleActivity() {
    
    const idleActivity = {
      state: "Bakınıyor",
      largeImageKey: "animecix-logo",
      type: 3
    };


    this.lastActivity = idleActivity;
    if (!this.isConnected) return;

    this.client.user?.setActivity(idleActivity).catch(console.error);
  }

  public execute(): void {
    ipcMain.on("discord-rpc", (event, data) => {
      const watchingActivity = {
        state: data.state === "" ? "Movie" : data.state,
        details: data.details,
        startTimestamp: Date.now(),
        largeImageKey: "animecix-logo",
        type: 3,
      };
      this.lastActivity = watchingActivity;

      //If DiscordRPC cannot changes status, it just tries to reconnect.
      if (!this.isConnected) {
        this.connectToDiscord();
        return;
      }

      this.client.user?.setActivity(watchingActivity).catch(console.error); //update activity status.
    });

    ipcMain.on("discord-rpc-destroy", () => {
      this.setIdleActivity();
    });
  }
}
