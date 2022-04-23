import { Downloader2 } from "../modules/downloader";

export interface DownloadItem {
  name: string;
  url: string;
  threads:number;
  downloader: Downloader2;
}
