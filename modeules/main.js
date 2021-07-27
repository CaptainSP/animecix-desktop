"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Main = void 0;
var axios_1 = require("axios");
var electron_1 = require("electron");
var sibnet_1 = require("./sibnet");
var path = require("path");
var downloader_1 = require("./downloader");
var electron_updater_1 = require("electron-updater");
var adblocker_electron_1 = require("@cliqz/adblocker-electron");
var fetch = require("node-fetch");
var Main = /** @class */ (function () {
    function Main(dir) {
        var _this = this;
        this.dir = dir;
        this.cancels = [];
        this.downloads = [];
        this.intervals = [];
        this.intervals.push(setInterval(function () {
            _this.sendDownloads();
        }, 500));
        this.intervals.push(setInterval(function () {
            _this.checkStart();
        }, 2000));
    }
    Main.prototype.sendToWindow = function (key, val) {
        if (val === void 0) { val = null; }
        if (this.win != null && !this.win.isDestroyed()) {
            this.win.webContents.send(key, val);
        }
    };
    Main.prototype.getDownloadUrl = function (url) {
        if (url.includes("mycdn")) {
            return url.replace(/\.mp4/g, "");
        }
        return url;
    };
    Main.prototype.checkStart = function () {
        var _this = this;
        var started = false;
        this.downloads.forEach(function (downloadObj) {
            if (!downloadObj.downloader.isDownloading() && !downloadObj.downloader.isCanceled() && !started && downloadObj.status != 'completed') {
                downloadObj.downloader.start();
                var notification = new electron_1.Notification({ icon: path.join(_this.dir, "files", "icon.png"), title: "İndiriliyor", body: downloadObj.name });
                notification.on('click', function () {
                    if (_this.win != null && !_this.win.isDestroyed()) {
                        _this.sendToWindow("showDownloads");
                    }
                });
                notification.show();
                started = true;
            }
            else if (downloadObj.downloader.isDownloading()) {
                started = true;
            }
        });
    };
    Main.prototype.updateDownloads = function (obj) {
        var index = this.downloads.map(function (item) {
            return item.name;
        }).indexOf(obj.name);
        if (index > -1) {
            this.downloads[index] = obj;
        }
        else {
            this.downloads.push(obj);
        }
        this.checkStart();
    };
    Main.prototype.getHostname = function (url) {
        try {
            return new URL(url).hostname;
        }
        catch (e) {
            return "notvalid";
        }
    };
    Main.prototype.sendDownloads = function () {
        if (this.win != null && !this.win.isDestroyed() && electron_1.app.isReady()) {
            this.sendToWindow('downloadItems', this.downloads.map(function (item) {
                var obj = {
                    name: item.name,
                    progress: Math.round(item.progress),
                    status: item.status,
                    statusText: item.statusText,
                    url: item.url
                };
                return obj;
            }));
        }
    };
    Main.prototype.getReferer = function () {
        return this.isOdnok ? null : this.currentFrameUrl;
    };
    Main.prototype.run = function () {
        var _this = this;
        electron_1.app.on("ready", function () {
            electron_1.app.setAppUserModelId("AnimeciX");
            _this.win = new electron_1.BrowserWindow({
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false,
                    nodeIntegrationInSubFrames: true,
                    preload: _this.dir + "/files/preload.js",
                    nativeWindowOpen: true
                },
                title: "AnimeciX",
                icon: path.join(_this.dir, "files", "icon.png"),
                frame: false
            });
            /* this.win.webContents.on('did-fail-load', () => {
                 setTimeout(this.win.reload, 2000)
             })*/
            /* axios.get('https://animecix.com/windows/loader.js').then(response => {
                 this.loaderScript = response.data
              
                 
             }).catch(e => {
                 console.log(e)
                 
             })
 */
            _this.win.maximize();
            electron_updater_1.autoUpdater.checkForUpdatesAndNotify();
            electron_updater_1.autoUpdater.on('update-available', function () {
                if (_this.win != null && !_this.win.isDestroyed()) {
                    var notification = new electron_1.Notification({ icon: path.join(_this.dir, "files", "icon.png"), title: "AnimeciX Güncelleniyor...", body: "Güncelleme indiriliyor" });
                    notification.show();
                    _this.win.webContents.loadURL("https://animecix.com/windows/update.html");
                }
            });
            electron_updater_1.autoUpdater.on('update-downloaded', function () {
                var notification = new electron_1.Notification({ icon: path.join(_this.dir, "files", "icon.png"), title: "AnimeciX Güncelleniyor...", body: "Güncelleme Kuruluyor" });
                notification.show();
                electron_updater_1.autoUpdater.quitAndInstall();
            });
            electron_updater_1.autoUpdater.on('download-progress', function (data) {
                if (_this.win != null && !_this.win.isDestroyed()) {
                    _this.win.webContents.send("update-download-progress", data);
                }
            });
            var filter = {
                urls: ['*://*/*']
            };
            adblocker_electron_1.ElectronBlocker.fromPrebuiltAdsAndTracking(fetch).then(function (blocker) {
                blocker.enableBlockingInSession(electron_1.session.defaultSession);
            });
            electron_1.session.defaultSession.webRequest.onBeforeSendHeaders(filter, function (details, callback) {
                if (!_this.isOdnok) {
                    if (!details.url.includes("disqus")) {
                        details.requestHeaders['Referer'] = _this.currentFrameUrl;
                    }
                    details.requestHeaders['User-Agent'] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:70.0) Gecko/20100101 Firefox/70.0";
                }
                else {
                    if (details.url.includes("google")) {
                        details.requestHeaders['User-Agent'] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:70.0) Gecko/20100101 Firefox/70.0";
                    }
                    else {
                        details.requestHeaders['User-Agent'] = "axios 1.0";
                    }
                }
                callback({ requestHeaders: details.requestHeaders });
            });
            electron_1.session.defaultSession.webRequest.onBeforeRequest(filter, function (details, callback) {
                var url = "";
                if (_this.isOdnok && details.url.includes("mycdn") && details.url.includes(".mp4")) {
                    url = details.url.replace(/\.mp4/g, "");
                    callback({ redirectURL: url });
                }
                else {
                    callback({});
                }
            });
            _this.win.webContents.setWindowOpenHandler(function (_a) {
                var url = _a.url;
                console.log("OPEN", url);
                if (url.includes("disqus") || url.includes("animecix") || url.includes("google")) {
                    return {
                        action: 'allow',
                        overrideBrowserWindowOptions: {
                            frame: true,
                            autoHideMenuBar: true,
                            fullscreenable: false,
                            backgroundColor: 'black',
                            webPreferences: {}
                        }
                    };
                }
                return { action: 'deny' };
            });
            _this.win.webContents.on('did-create-window', function (window) {
                window.webContents.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:70.0) Gecko/20100101 Firefox/70.0");
            });
            _this.win.on("enter-full-screen", function () {
                _this.win.setMenuBarVisibility(false);
            });
            _this.win.on("leave-full-screen", function () {
                _this.win.setMenuBarVisibility(true);
            });
            _this.win.on("close", function () {
                electron_1.app.exit();
                _this.intervals.forEach(function (element) {
                    clearInterval(element);
                });
                _this.win = null;
            });
            //this.win.webContents.session.clearCache()
            _this.win.loadURL("https://animecix.com");
            _this.win.webContents.openDevTools();
            electron_1.ipcMain.on("getDetails", function (event, ok) {
                event.sender.send("details", _this.currentFrameUrl, _this.identifier);
                _this.win.webContents.mainFrame.frames.forEach(function (frame) {
                    frame.send("details", _this.currentFrameUrl, _this.identifier);
                });
            });
            electron_1.ipcMain.on("Odnok", function (event, ok) {
                axios_1.default.get(_this.currentFrameUrl).then(function (response) {
                    var str = response.data;
                    try {
                        var HTMLParser = require('node-html-parser');
                        var parse = HTMLParser.parse;
                        var parsed = parse(str);
                        var opt = parsed.querySelector('[data-module="OKVideo"]').getAttribute("data-options");
                        var data = JSON.parse(opt);
                        var metadata = JSON.parse(data.flashvars.metadata);
                        // console.log(metadata.videos)
                        _this.sources = [];
                        metadata.videos.forEach(function (element) {
                            _this.sources.push({
                                label: element.name.toUpperCase().replace("MOBİLE", "144P")
                                    .replace("LOWEST", "240P")
                                    .replace("LOW", "360P")
                                    .replace("SD", "480P")
                                    .replace("HD", "720P HD")
                                    .replace("FULL", "1080P FHD"),
                                file: element.url + ".mp4"
                            });
                        });
                        _this.isOdnok = true;
                        if (_this.win != null && !_this.win.isDestroyed()) {
                            _this.win.webContents.mainFrame.frames.forEach(function (frame) {
                                console.log(_this.sources);
                                frame.send("Sources", _this.sources);
                            });
                        }
                    }
                    catch (e) {
                        console.log(e);
                    }
                }).catch(function (error) {
                    console.log(error);
                });
            });
            electron_1.ipcMain.on("Setup", function (event, ok) {
                sibnet_1.Sibnet.found(_this.currentFrameUrl, function (video) {
                    if (_this.win != null && !_this.win.isDestroyed()) {
                        _this.win.webContents.mainFrame.frames.forEach(function (frame) {
                            frame.send("Standart", video);
                        });
                    }
                });
            });
            electron_1.ipcMain.on("Standart", function (event, file) {
                _this.standart = file;
            });
            electron_1.ipcMain.on("min", function (event) {
                _this.win.minimize();
            });
            electron_1.ipcMain.on("max", function (event) {
                if (_this.win.isMaximized()) {
                    _this.win.unmaximize();
                }
                else {
                    _this.win.maximize();
                }
            });
            electron_1.ipcMain.on("redo", function (event) {
                _this.win.webContents.goForward();
            });
            electron_1.ipcMain.on("undo", function (event) {
                _this.win.webContents.goBack();
            });
            electron_1.ipcMain.on("exit", function (event) {
                _this.win.close();
            });
            electron_1.ipcMain.on("StandartSetup", function (event, file) {
                if (_this.win != null && !_this.win.isDestroyed()) {
                    _this.win.webContents.mainFrame.frames.forEach(function (frame) {
                        frame.send("Standart", _this.standart);
                    });
                }
            });
            electron_1.ipcMain.on("Sources", function (event, ok) {
                if (_this.win != null && !_this.win.isDestroyed()) {
                    _this.win.webContents.mainFrame.frames.forEach(function (frame) {
                        frame.send("Sources", _this.sources);
                    });
                }
            });
            electron_1.ipcMain.on("canDownload", function (event, file) {
                _this.fileForDownload = file;
                _this.sendToWindow("canDownload", true);
                _this.sendToWindow("sourcesForDownload", null);
                console.log("CAN DOWNLOAD", _this.fileForDownload);
            });
            electron_1.ipcMain.on("canDownloadSources", function (event, sources) {
                _this.sources = sources;
                _this.sendToWindow("canDownload", true);
                _this.sendToWindow("sourcesForDownload", _this.sources);
                console.log("CAN DOWNLOAD", _this.fileForDownload);
            });
            electron_1.ipcMain.on("cancelDownloadVideo", function (event, name) {
                _this.downloads.forEach(function (obj) {
                    if (obj.name == name) {
                        obj.downloader.cancel();
                    }
                    _this.sendDownloads();
                });
            });
            electron_1.ipcMain.on("removeDownload", function (event, name) {
                var index = _this.downloads.map(function (obj) {
                    return obj.name;
                }).indexOf(name);
                _this.downloads.splice(index, 1);
                _this.sendDownloads();
            });
            electron_1.ipcMain.on("showDownloads", function (event, ok) {
                _this.sendDownloads();
            });
            electron_1.ipcMain.on("seeAll", function (event, ok) {
                electron_1.shell.openPath(electron_1.app.getPath("downloads") + "/AnimeciX/");
            });
            electron_1.ipcMain.on("downloadSource", function (event, video) {
                var downloaderObj = {
                    downloader: null,
                    url: video.file,
                    name: video.name,
                    progress: 0,
                    speed: 0,
                    status: 'queried',
                    statusText: 'Sırada'
                };
                var downloader = new downloader_1.Downloader(_this.getDownloadUrl(video.file), video.name, parseInt(video.threads), _this.getReferer(), function (stats) {
                    downloaderObj.progress = stats.progress;
                    downloaderObj.status = 'downloading';
                    downloaderObj.statusText = (downloaderObj.speed / 1000000).toFixed(2) + " MB/s hızla indiriliyor";
                    downloaderObj.speed = stats.speed;
                    _this.updateDownloads(downloaderObj);
                }, function () {
                    downloaderObj.status = 'completed';
                    downloaderObj.statusText = 'İndirme Tamamlandı';
                    _this.updateDownloads(downloaderObj);
                }, function (e) {
                    downloaderObj.status = 'failed';
                    if (downloader.isCanceled()) {
                        downloaderObj.statusText = 'İptal Edildi';
                    }
                    else {
                        downloaderObj.statusText = 'İndirme Başarısız';
                    }
                    _this.updateDownloads(downloaderObj);
                });
                downloaderObj.downloader = downloader;
                _this.updateDownloads(downloaderObj);
            });
            electron_1.ipcMain.on("downloadVideo", function (event, video) {
                var downloaderObj = {
                    downloader: null,
                    url: _this.fileForDownload,
                    name: video.name,
                    progress: 0,
                    speed: 0,
                    status: 'queried',
                    statusText: 'Sırada'
                };
                var downloader = new downloader_1.Downloader(_this.getDownloadUrl(_this.fileForDownload), video.name, parseInt(video.threads), _this.getReferer(), function (stats) {
                    downloaderObj.progress = stats.progress;
                    downloaderObj.status = 'downloading';
                    downloaderObj.statusText = (downloaderObj.speed / 1000000).toFixed(2) + " MB/s hızla indiriliyor";
                    downloaderObj.speed = stats.speed;
                    _this.updateDownloads(downloaderObj);
                }, function () {
                    downloaderObj.status = 'completed';
                    downloaderObj.statusText = 'İndirme Tamamlandı';
                    _this.updateDownloads(downloaderObj);
                }, function (e) {
                    downloaderObj.status = 'failed';
                    if (downloader.isCanceled()) {
                        downloaderObj.statusText = 'İptal Edildi';
                    }
                    else {
                        downloaderObj.statusText = 'İndirme Başarısız';
                    }
                    _this.updateDownloads(downloaderObj);
                });
                downloaderObj.downloader = downloader;
                _this.updateDownloads(downloaderObj);
            });
            electron_1.ipcMain.on("nextEpisode", function (event, ok) {
                _this.sendToWindow("nextEpisode", true);
            });
            electron_1.ipcMain.on("retryDownload", function (event, video) {
                var downloaderObj = {
                    downloader: null,
                    name: video.name,
                    url: video.url,
                    progress: 0,
                    speed: 0,
                    status: 'queried',
                    statusText: 'Sırada'
                };
                var downloader = new downloader_1.Downloader(_this.getDownloadUrl(video.url), video.name, parseInt(video.threads), _this.getReferer(), function (stats) {
                    downloaderObj.progress = stats.progress;
                    downloaderObj.status = 'downloading';
                    downloaderObj.statusText = (downloaderObj.speed / 1000000).toFixed(2) + " MB/s hızla indiriliyor";
                    downloaderObj.speed = stats.speed;
                    _this.updateDownloads(downloaderObj);
                }, function () {
                    downloaderObj.status = 'completed';
                    downloaderObj.statusText = 'İndirme Tamamlandı';
                    _this.updateDownloads(downloaderObj);
                }, function (e) {
                    downloaderObj.status = 'failed';
                    if (downloader.isCanceled()) {
                        downloaderObj.statusText = 'İptal Edildi';
                    }
                    else {
                        downloaderObj.statusText = 'İndirme Başarısız';
                    }
                    _this.updateDownloads(downloaderObj);
                });
                downloaderObj.downloader = downloader;
                _this.updateDownloads(downloaderObj);
            });
            electron_1.ipcMain.on("Fembed", function (event, sourceString) {
                _this.sources = JSON.parse(sourceString);
                console.log(_this.sources);
            });
            electron_1.ipcMain.on("updateCurrent", function (event, currentUrl, identifier) {
                _this.currentFrameUrl = currentUrl;
                _this.identifier = identifier;
                _this.isOdnok = false;
                console.log("UPDATE!");
                /*this.win.webContents.mainFrame.frames.forEach(frame => {
                    
                    let loaderResponse = "if(!frameUrl) {\n\nvar identifier = `" + this.identifier + "`;  \n\n var frameUrl = `" + this.currentFrameUrl + "`;\n\n var dirname = `" + this.dir + "`;\n\n" + this.loaderScript + "\n\n}"
                    frame.executeJavaScript(loaderResponse)
                    
                });


                setInterval(() => {
                    if (this.win.isDestroyed()) {
                        return;
                    }
                    this.win.webContents.mainFrame.frames.forEach(frame => {

                      
                        let loaderResponse = "if(!frameUrl) {\n\nvar identifier = `" + this.identifier + "`;  \n\n var frameUrl = `" + this.currentFrameUrl + "`;\n\n var dirname = `" + this.dir + "`;\n\n" + this.loaderScript + "\n\n}"
                        frame.executeJavaScript(loaderResponse)
                      

                    })



                }, 1000)*/
            });
        });
    };
    return Main;
}());
exports.Main = Main;
//# sourceMappingURL=main.js.map