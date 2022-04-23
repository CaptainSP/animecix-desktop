"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var main_1 = require("./modules/main");
process.env.dir = __dirname.replace(/\\/g, "/");
new main_1.Main(__dirname.replace(/\\/g, "/")).run();
