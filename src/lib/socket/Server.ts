import { networkInterfaces, NetworkInterfaceInfo, hostname } from 'os'
import { v4 } from 'uuid'
import * as http from 'http'
import * as express from 'express'
import { Configuration, AddressBook, ServerStatistics, NewConnectionEvent, MessageEvent } from '../../../types'
import Daemon from './Daemon'
import Client from './Client'
import { default as ApiServer } from '../../api/Server'
import { default as ApiClient } from '../../api/Client'

export default class Server extends Client {
    private readonly address: string

    public readonly daemon: Daemon

    public readonly api: ApiServer

    private readonly app: express.Application

    private readonly addressBook: AddressBook = {}

    constructor(private readonly config: Configuration) {
        super()

        this.address = v4()
        this.daemon = new Daemon(this, this.config, this.address)
        this.api = new ApiServer(this)

        this.app = express()
        const webServer: http.Server = http.createServer(this.app)

        try {
            this.initAPIServer()
            this.initDaemon(webServer)
    
            webServer.listen(this.config.port)
    
            console.info('-- server:started', this.address)
        } catch(e) {
            console.error('Something went wrong while starting the server', e.message)
        }
    }

    initDaemon(webServer: http.Server): void {
        this.daemon.on('log', console.info)
        this.daemon.on('error', console.info)

        this.daemon.on('message', (event: MessageEvent) => {
            const { payload } = event

            if (payload.message) {
                console.info('-- server.message:received message "%j" from "%s"', payload.message, event.origin)
            } else {
                console.info('-- server.event:received event "%s" from "%s"', event.name, event.origin)
            }
        })

        this.daemon.on('connection.new', (event: NewConnectionEvent) => {
            console.info('-- server.connection.new', event.address)

            const { address } = event

            if (event.server && address) {
                const api = new ApiClient(`${address.hostname}:${address.port}`)

                api.get('/statistics').then((stats: ServerStatistics) => {
                    console.info('-- server.new:statistics: %j', stats)
                }).catch(e => { throw e })

                api.get('/addresses').then((addresses: AddressBook) => {
                    console.info('-- server.new:addresses: %j', addresses)
                }).catch(e => { throw e })
            }
        })

        this.daemon.initSocketServer(webServer)
    }

    initAPIServer(): void {
        this.api.init(this.app)
    }

    on(event: string|symbol, callback: (...args: any[]) => void): void {
        this.daemon.on(event, callback)
    }

    get localip(): string {
        const interfaces = networkInterfaces()

        for (const index in interfaces) {
            for (const dev in interfaces[index]) {
                const device: NetworkInterfaceInfo = interfaces[index][dev]

                if (device.family === 'IPv4' && device.internal === false) {
                    return device.address
                }
            }
        }

        return '127.0.0.1'
    }

    get statistics(): ServerStatistics {
        return {
            address: {
                name: this.address,
                hostname: hostname(),
                ip: this.localip
            },
            daemon: {
                clients: this.daemon.clientConnections,
                servers: this.daemon.serverConnections
            }
        }
    }

    get addresses(): AddressBook {
        return this.addressBook
    }
}
