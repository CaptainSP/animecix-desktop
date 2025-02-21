import {Main} from './modules/main'

process.env.APP_URL = 'https://anm.cx'
process.env.dir = __dirname.replace(/\\/g,"/")

new Main(__dirname.replace(/\\/g,"/")).run()