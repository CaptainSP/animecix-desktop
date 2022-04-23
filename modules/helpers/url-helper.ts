export class URLHelper {
  public static getHostname(url: any) {
    try {
      return new URL(url).hostname;
    } catch (e) {
      return "notvalid";
    }
  }
}
