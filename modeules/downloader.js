"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Downloader = void 0;
var axios_1 = require("axios");
var path = require("path");
var fs = require("fs");
var electron_1 = require("electron");
var node_downloader_helper_1 = require("node-downloader-helper");
var Downloader = (function () {
    function Downloader(url, name, threadCount, referer, onProgress, onCompleted, onError) {
        this.cancels = [];
        this.downloaded = 0;
        this.bytespers = 0;
        this.progressCount = 0;
        this.progress = 0;
        this.threads = [];
        this.lastWrited = -1;
        this.canceled = false;
        this.downloading = false;
        this.pri = 0;
        this.url = url;
        this.threadCount = threadCount;
        this.referer = referer;
        this.name = name.replace(/:/g, "");
        this.path = path.normalize(path.join(electron_1.app.getPath("downloads"), "AnimeciX", this.name));
        this.directory = path.join(electron_1.app.getPath("downloads"), "AnimeciX");
        this.onProgress = onProgress;
        this.onCompleted = onCompleted;
        this.onError = onError;
        var https = require('https');
        this.instance = axios_1.default.create({
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            })
        });
        this.startInterval();
    }
    Downloader.prototype.startInterval = function () {
        var _this = this;
        if (this.progressInterval != null) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
        this.progressInterval = setInterval(function () {
            console.log("YES " + _this.pri);
            _this.pri++;
            if (_this.downloading) {
                var speed = 0;
                var progress = 0;
                for (var i = 0; i < _this.threads.length; i++) {
                    speed += _this.threads[i].speed;
                    progress += _this.threads[i].progress;
                }
                _this.onProgress({
                    speed: speed,
                    progress: (progress / _this.threads.length),
                    canceled: _this.canceled
                });
            }
        }, 1000);
    };
    Downloader.prototype.isDownloading = function () {
        return this.downloading;
    };
    Downloader.prototype.isCanceled = function () {
        return this.canceled;
    };
    Downloader.prototype.start = function () {
        this.canceled = false;
        this.checkSize();
        this.downloading = true;
        if (this.progressInterval == null) {
            this.startInterval();
        }
        console.log("START CALLED");
    };
    Downloader.prototype.cancel = function () {
        this.canceled = true;
        this.destroy();
    };
    Downloader.prototype.checkSize = function () {
        var _this = this;
        var headers = {};
        if (this.referer != null) {
            headers["Referer"] = this.referer;
            headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:70.0) Gecko/20100101 Firefox/70.0";
        }
        this.instance.get(this.url, {
            headers: headers,
            responseType: 'stream'
        }).then(function (response) {
            _this.totalsize = response.headers['content-length'];
            _this.checkParts();
        }).catch(function (e) {
            console.log(e);
        });
    };
    Downloader.prototype.checkParts = function () {
        var first = 0;
        this.chunkSize = Math.round(this.totalsize / this.threadCount);
        for (var i = 0; i < this.threadCount; i++) {
            var start = i * this.chunkSize;
            var end = ((i + 1) * this.chunkSize) - 1;
            if (end > this.totalsize) {
                end = this.totalsize;
            }
            var thread = {
                id: i,
                start: start,
                end: end,
                finished: false,
                writed: false,
                writeFinished: false,
                path: "",
                speed: 0,
                progress: 0
            };
            this.threads.push(thread);
            first = end;
        }
        this.downloadParts();
    };
    Downloader.prototype.downloadParts = function () {
        var _this = this;
        this.threads.forEach(function (thread) {
            var downloadPath = _this.path + "__" + thread.id + ".befw";
            var fileName = _this.name + "__" + thread.id + ".befw";
            thread.path = downloadPath;
            var headers = {
                "Range": "bytes=" + thread.start + "-" + thread.end
            };
            if (_this.referer != null) {
                headers["Referer"] = _this.referer;
                headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:70.0) Gecko/20100101 Firefox/70.0";
            }
            var dl = new node_downloader_helper_1.DownloaderHelper(_this.url, _this.directory, {
                fileName: fileName,
                headers: headers,
                retry: true,
                httpsRequestOptions: {
                    rejectUnauthorized: false
                },
                override: true,
            });
            dl.start();
            dl.on('progress', function (stats) {
                thread.speed = stats.speed;
                thread.progress = stats.progress;
            });
            dl.on('end', function (stats) {
                thread.finished = true;
                _this.checkWrite();
            });
            dl.on('error', function (stats) {
                if (_this.downloading) {
                    _this.onError(stats);
                    _this.cancel();
                }
                _this.downloading = false;
            });
            var interval = setInterval(function () {
                if (_this.canceled) {
                    try {
                        dl.stop();
                    }
                    catch (e) {
                    }
                    clearInterval(interval);
                    _this.onError("Canceled");
                }
            }, 1);
        });
    };
    Downloader.prototype.checkWrite = function () {
        var _this = this;
        this.threads.forEach(function (thread) {
            if (_this.canceled) {
                return;
            }
            try {
                if (thread.finished && !thread.writed && _this.lastWrited + 1 == thread.id) {
                    var w = fs.createWriteStream(_this.path, { flags: 'a' });
                    var r = fs.createReadStream(thread.path);
                    w.on('close', function () {
                        thread.writeFinished = true;
                        fs.unlinkSync(thread.path);
                        _this.lastWrited++;
                        _this.checkEnd();
                    });
                    r.pipe(w);
                    thread.writed = true;
                }
            }
            catch (e) {
                _this.onError(e);
                _this.downloading = false;
            }
        });
    };
    Downloader.prototype.checkEnd = function () {
        var allEnded = true;
        this.threads.forEach(function (thread) {
            if (!thread.writeFinished) {
                allEnded = false;
            }
        });
        if (allEnded) {
            console.log("Completed!");
            this.onCompleted();
            this.downloading = false;
            this.destroy();
        }
        else {
            this.checkWrite();
        }
    };
    Downloader.prototype.destroy = function () {
        if (this.progressInterval != null) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    };
    return Downloader;
}());
exports.Downloader = Downloader;
//# sourceMappingURL=downloader.js.map