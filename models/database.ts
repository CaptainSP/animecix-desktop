export interface settings {
  discordRPC?: boolean;
  autoSkip?:boolean
}
const fs = require("fs"); //fs safeload- provided
const load = (file: string): settings =>
  JSON.parse(fs.readFileSync(file, "utf-8"));
const write = (file: string, data: settings) =>
  fs.writeFileSync(file, JSON.stringify(data, null, 4));
const extension = (filePath: string) => {
  let parts = filePath.split(".");
  return parts[parts.length - 1];
};

export class Database {
  file: string;
  constructor(file?: string) {
    this.file = file || "database.json";
    if (this.file === "database.json") {
      try {
        load(this.file);
      } catch {
        write(this.file, {});
      }
    } else {
      //  if (!this.file.includes('./')) this.file = './' + this.file
      if (extension(this.file) !== "json")
        throw Error("[err] the database file must end with .json");
      try {
        load(this.file);
      } catch {
        write(this.file, { discordRPC: true });
      }
    }
  }
  set(data: "discordRPC", value: boolean) {
    if (!data) throw Error("[err] no data to set");
    if (!value) throw Error("[err] no value to set");
    let fileData = load(this.file);
    fileData[data] = value;
    write(this.file, fileData);
    return;
  } //€€₺€ißæ err, set for ❤
  remove(data: "discordRPC") {
    if (!data) throw Error("[err] no value to remove");
    let fileData = load(this.file);
    if (!fileData[data])
      throw Error(
        "[err] mentioned data isn't in directory or cannot be reached"
      );
    fileData[data] = undefined;
    write(this.file, fileData);
    return;
  }

  //🪐 this is a nice planet.

  //Code obsidestructor ⚔

  has(data: "discordRPC") {
    if (!data) throw Error("[err] No data to has function");
    let fileData = load(this.file);
    if (!fileData[data]) return false;
    if (fileData[data]) return true;
  }

  //do not, delete the code below - - - discor
  //--------------------------------\\
  /* 
Welcome, hope you are enjoying this package
this package was created for discord.gg/javascript
and for anyone's use. its open source and free for use
please credit us.
❤
*/
  //--------------------------------\\

  clear() {
    write(this.file, {});
    return;
  }

  fetchAll() {
    return load(this.file);
  }

  all() {
    return load(this.file);
  }

  destroy() {
    fs.unlinkSync(this.file);
    return;
  }

  fetch(data: "discordRPC") {
    if (!data) throw Error("[err] No data to fetch");
    let fileData = load(this.file);
    if (!fileData[data]) fileData[data] = undefined;
    return fileData[data];
  }

  get(data: "discordRPC") {
    if (!data) throw Error("[err] No data to get");
    let fileData = load(this.file);
    if (!fileData[data]) fileData[data] = undefined;
    return fileData[data];
  }
}
