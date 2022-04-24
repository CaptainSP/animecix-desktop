import { WindowController } from "./window-controller";
import { Cookie, session } from "electron";
import { RequestController } from "./request-controller";
import { NotificationHelper } from "../helpers/notification-helper";

export class AuthController {
  private authCookie: Cookie | null = null;

  constructor(private win: WindowController) {}

  public onLinkReceived(link: string) {
    try {
      link = decodeURIComponent(link);
      
      const status = link.split("{")[1].split("|")[0];
      const data = link.split("|")[1].split("}")[0];

      this.win.loadURL(process.env.APP_URL + "/secure/short-login/" + data);
      
    } catch (e) {
      console.log(e);
    }
  }
}
