import { ElectronBlocker } from "@cliqz/adblocker-electron";
import { session } from "electron";
import { WindowController } from "./window-controller";

export class RequestController {
  private blocker: ElectronBlocker | null = null;

  private csrfToken: string | null = null;

  private filter = {
    urls: ["*://*/*"],
  };

  constructor(private win: WindowController) {}

  public execute() {
    this.setupAdblock();
    this.listenHeaders();
    this.listenRequests();
  }

  public setCsrfToken(token: string) {
    this.csrfToken = token;
  }

  private setupAdblock() {
    ElectronBlocker.fromPrebuiltAdsAndTracking(require("node-fetch")).then(
      (blocker) => {
        this.blocker = blocker;
      }
    );
  }

  private listenHeaders() {
    session.defaultSession.webRequest.onBeforeSendHeaders(
      this.filter,
      (details: Electron.OnBeforeSendHeadersListenerDetails, callback) => {
        if (
          !details.url.includes("disqus") &&
          !details.url.includes("google") &&
          this.win.currentFrameUrl != null
        ) {
          details.requestHeaders["Referer"] = this.win.currentFrameUrl;
        }

        details.requestHeaders["User-Agent"] =
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:70.0) Gecko/20100101 Firefox/70.0";

        if (this.csrfToken && details.url.includes("animecix")) {
          delete details.requestHeaders["X-XSRF-TOKEN"];
          console.log("owerrite", details.requestHeaders, details.url);
          details.requestHeaders["X-CSRF-TOKEN"] = this.csrfToken;
        }

        callback({ requestHeaders: details.requestHeaders });
      }
    );
  }

  private listenRequests() {
    session.defaultSession.webRequest.onBeforeRequest(
      this.filter,
      (details, callback) => {
        let callBackCalled = false;
        let shouldCheckRequest = true;

        if (
          details.url.includes("animecix") ||
          details.url.includes("stape.fun")
        ) {
          shouldCheckRequest = false;
        }

        if (this.blocker != null && !callBackCalled && shouldCheckRequest) {
          this.blocker.onBeforeRequest(details, callback);
        } else if (!callBackCalled) {
          callback({});
        }
      }
    );
  }
}
