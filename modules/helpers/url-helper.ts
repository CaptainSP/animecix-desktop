import { writeFileSync } from "fs";
import { writeFile } from "fs/promises";
import fetch from "node-fetch";
export class URLHelper {
  public static getHostname(url: any) {
    try {
      return new URL(url).hostname;
    } catch (e) {
      return "notvalid";
    }
  }
}
export async function downloadImage(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url);
  const buffer = await response.buffer();
  await writeFile(outputPath, buffer);
}