import Server from './server'
import * as yargs from 'yargs'

const argv = yargs.options({
    api: {
        alias: 'a',
        describe: 'Port to bind the api on',
        default: 8801
    },
    port: {
        alias: 'p',
        describe: 'Port to bind on',
        default: 8800
    },
    client: {
        array: true,
        describe: 'Clients to connect (this can also be a server)'
    }
}).argv

