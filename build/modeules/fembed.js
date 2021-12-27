"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Fembed = void 0;
var axios_1 = __importDefault(require("axios"));
var Fembed = /** @class */ (function () {
    function Fembed(url, onFinish, onError) {
        this.url = url;
        this.onFinish = onFinish;
        this.onError = onError;
    }
    Fembed.prototype.found = function () {
        var _this = this;
        this.first().then(function (sources) {
            _this.onFinish(sources);
        }).catch(function (e) {
            _this.onError(e);
        });
    };
    Fembed.prototype.first = function () {
        return __awaiter(this, void 0, void 0, function () {
            var data, userId, sourceData;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, axios_1.default.get(this.url)];
                    case 1:
                        data = (_a.sent()).data;
                        userId = parseInt(data.split("var USER_ID = '")[1].split("'")[0]);
                        return [4 /*yield*/, this.second()];
                    case 2:
                        sourceData = _a.sent();
                        this.sources = sourceData.data;
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                setTimeout(function () {
                                    console.log(userId);
                                    axios_1.default.post("https://v3.fstats.xyz/watch", {
                                        data: JSON.stringify({
                                            id: _this.getVideoId(),
                                            user: userId,
                                            ref: "",
                                            vip: 0
                                        })
                                    }).then(function (response) {
                                        resolve(_this.sources);
                                    }).catch(function (e) {
                                        reject(e);
                                    });
                                }, 2000);
                            })];
                    case 3: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Fembed.prototype.second = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, axios_1.default.post("https://femax20.com/api/source/" + this.getVideoId(), {
                            r: "",
                            d: "femax20.com"
                        })];
                    case 1: return [2 /*return*/, (_a.sent()).data];
                }
            });
        });
    };
    Fembed.prototype.getVideoId = function () {
        return this.url.split("/v/")[1].split("/")[0].split("#")[0].split("?")[0];
    };
    return Fembed;
}());
exports.Fembed = Fembed;
