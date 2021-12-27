"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sibnet = void 0;
var axios_1 = __importDefault(require("axios"));
var Sibnet = /** @class */ (function () {
    function Sibnet() {
    }
    Sibnet.found = function (url, after) {
        axios_1.default.get(url).then(function (response) {
            var data = response.data;
            var l1 = data.split('player.src([{src: "')[1];
            var l2 = l1.split('"')[0];
            after("https://video.sibnet.ru" + l2);
        });
        return this;
    };
    return Sibnet;
}());
exports.Sibnet = Sibnet;
