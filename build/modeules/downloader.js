"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Downloader = void 0;
var axios_1 = __importDefault(require("axios"));
var fs_1 = __importDefault(require("fs"));
var electron_1 = require("electron");
var node_downloader_helper_1 = require("node-downloader-helper");
var path = __importStar(require("path"));
var Downloader = /** @class */ (function () {
    function Downloader(url, name, threadCount, referer, onProgress, onCompleted, onError) {
        this.cancels = [];
        this.totalsize = 0;
        this.chunkSize = 0;
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
        //  console.log("TOTAL", this.totalsize)
        //  console.log("CHUNK", this.chunkSize)
        //  console.log("PARTS", this.threads)
        this.downloadParts();
    };
    Downloader.prototype.downloadParts = function () {
        var _this = this;
        if (!fs_1.default.existsSync(this.directory)) {
            fs_1.default.mkdirSync(this.directory);
        }
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
            /*const Downloader = require('nodejs-file-downloader')
            const downloader = new Downloader({
                url: this.url,
                directory: this.directory,
                fileName: fileName,
                headers: headers,
                onProgress: (percentage, chunk, remainingSize) => {

                    this.onProgress(percentage, chunk, remainingSize)

                }
            })*/
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
            /*downloader.download().then(() => {
                thread.finished = true
                this.checkWrite()
            }).catch(error => {
                console.log(error)
                this.onError(error)
                this.downloading = false
            })*/
            var interval = setInterval(function () {
                if (_this.canceled) {
                    //downloader.cancel()
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
                    var w = fs_1.default.createWriteStream(_this.path, { flags: 'a' });
                    var r = fs_1.default.createReadStream(thread.path);
                    w.on('close', function () {
                        thread.writeFinished = true;
                        fs_1.default.unlinkSync(thread.path);
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
