import Server from './socket/Server'
import * as yargs from 'yargs'

const argv = yargs.options({
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

const server: Server = new Server({
    port: argv.port,
    noEvents: false,
    dryRun: false
})

// eslint-disable-next-line
console.info('-- server started: %s:%d', server.localip, argv.port)

if (argv.client) {
    argv.client.forEach((client: string) => {
        const [host, port, address] = client.split(':')

        // eslint-disable-next-line
        console.info(
            '-- connecting to: %s:%d (%s)', host, port, address
        )
        server.connect(host, parseInt(port, 10))
            .then(serverconnection => {
                // eslint-disable-next-line
                console.info('-- connected', serverconnection)
            }, failure => {
                // eslint-disable-next-line
                console.error('-- failed', failure)
            })
    })
}
