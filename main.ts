import { Main } from "./modules/main";
import { Notifier } from "./modules/notifier";
process.env.APP_URL = "https://animecix.net";
process.env.dir = __dirname.replace(/\\/g, "/");
new Main(__dirname.replace(/\\/g, "/")).run();
