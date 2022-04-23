import {Main} from './modules/main'

process.env.dir = __dirname.replace(/\\/g,"/")

new Main(__dirname.replace(/\\/g,"/")).run()