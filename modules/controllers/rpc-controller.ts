import { ipcMain } from "electron";
import { WindowController } from "./window-controller";
import { settings } from "../../models/database";
import DiscordRPC from "discord-rpc";
const clientId = "921684324141641728";
let ready = false;
DiscordRPC.register(clientId);
const rpc = new DiscordRPC.Client({ transport: "ipc" });
rpc.on("ready", () => {
  ready = true;
});
rpc.login({ clientId });
export class RpcController {
  private rpcData: DiscordRPC.Presence = {};
  constructor(private win: WindowController) {}
  private updateActivity() {
    if (JSON.stringify(this.rpcData) == "{}") return rpc.clearActivity();
    rpc.setActivity(this.rpcData);
  }
  public execute() {
    setInterval(() => {
      if (!ready || this.win?.db.get("discordRPC") !== true) return  rpc.clearActivity();
      this.updateActivity();
    }, 15e3);
    ipcMain.on("rpc-href", (event, href) => {
      const url = new URL(href);
      const path = url.pathname;
      const segment = path.split("/").filter(Boolean);
      if (segment[0] == undefined) {
        this.rpcData = {
          details: "Ana sayfada",
          startTimestamp: new Date(),
          largeImageKey: "animecix-logo",
        };
      } else if (segment[0] == "browse") {
        this.rpcData = {
          details: "Ana sayfada",
          state: "Anime keşfediyor",
          startTimestamp: new Date(),
          largeImageKey: "animecix-logo",
        };
      } else if (segment[0] == "news") {
        this.rpcData = {
          details: "Ana sayfada",
          state: "Haberlere bakıyor",
          startTimestamp: new Date(),
          largeImageKey: "animecix-logo",
        };
      } else if (segment[0] == "search") {
        this.rpcData = {
          details: "Ana sayfada",
          state: "Anime arıyor",
          startTimestamp: new Date(),
          largeImageKey: "animecix-logo",
        };
      } else if (segment[0] == "users") {
        this.rpcData = {
          details: "Ana sayfada",
          state: "Profile bakıyor",
          startTimestamp: new Date(),
          largeImageKey: "animecix-logo",
          buttons: [{ label: "PROFIL", url: url.href }],
        };
      } else if (segment[0] == "lists") {
        this.rpcData = {
          details: "Ana sayfada",
          state: "Listelere bakıyor",
          startTimestamp: new Date(),
          largeImageKey: "animecix-logo",
        };
      } else if (segment[0] == "account") {
        this.rpcData = {
          details: "Ana sayfada",
          state: "Hesabına bakıyor",
          startTimestamp: new Date(),
          largeImageKey: "animecix-logo",
        };
      } else if (segment[0] == "gw-rooms") {
        this.rpcData = {
          details: "Ana sayfada",
          state: "Arkadaş arıyor(oda)",
          startTimestamp: new Date(),
          largeImageKey: "animecix-logo",
        };
      }
    });
    ipcMain.on("discord-rpc", (event, data) => {
      if (this.win?.db.get("discordRPC") !== true) return  rpc.clearActivity();

      this.rpcData = {
        state: data.state == "" ? "Movie" : data.state,
        details: data.details,
        startTimestamp: new Date(),
        largeImageKey: "animecix-logo",
      };
    });

    ipcMain.on("discord-rpc-destroy", (event, data) => {
      if (this.win?.db.get("discordRPC") !== true) return  rpc.clearActivity();
      this.rpcData = {
        startTimestamp: new Date(),
        largeImageKey: "animecix-logo",
      };
    });
  }
}
