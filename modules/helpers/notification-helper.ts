import path from "path";
import { Notification } from "electron";

export class NotificationHelper {
  public static createAndShow(title: string, body?: string): Notification {
    const notification = this.create(title, body);
    notification.show();
    return notification;
  }

  public static create(title: string, body?: string) {
    const notification = new Notification({
      icon: path.join(process.env.dir as string, "files", "icon.png"),
      title: title,
      body: body,
    });
    return notification;
  }
}
