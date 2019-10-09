import { networkInterfaces, NetworkInterfaceInfo, hostname } from 'os'
import { v4 } from 'uuid'
import * as S from 'string'
import { ScalableServer } from '../index.d'
import Daemon from 'lib/Daemon'
import { default as ApiServer } from '../api/Server'
import { default as ApiClient } from '../api/Client'

export default class Server {
    private address: string
    private daemon: Daemon
    private api: ApiServer

    constructor(private config: ScalableServer.Configuration) {
        this.address = v4()
        this.daemon = new Daemon(this.config)
        this.api = new ApiServer(this.config.api.port)

        this.initDaemon()
        this.initAPIServer()
    }

    initDaemon(): void {
        this.daemon.on('log', this.log)
        this.daemon.on('error', this.log)
        this.daemon.on('message', (event:any) => {
            const { message } = event

            if(message.message) {
                this.log('message', 'Received message "%j" from "%s"', message.message, message.address)
            } else {
                this.log('event', 'Received event "%s" from "%s"', message.event, message.address)
            }
        })
        this.daemon.on('connection.new', (...args) => {
            this.log('new connection', ...args)
        })
        this.daemon.on('server.new', (server:any) => {
            this.log('new server', server.host)

            const [hostname, port] = server.host.split(':')
            const api = new ApiClient(this, `http://${hostname}:${port + 1}`)

            api.get('/statistics').then((stats:any) => {
                this.log('new server', 'Gained statistics: %j', stats)
            })
        })

        this.daemon.initSocketServer(this.config.daemon.port)
    }

    initAPIServer(): void {
        this.api.init()
    }

    log(format: string, ...elements: string[]): void {
        if(elements.length >= 1) {
            let [ type, first ] = elements
            type = type.toUpperCase()
            first = `=[${first}]=`

            elements.unshift(first, S(type).pad(10).toString())
        }

        console.log(format, ...elements)
    }

    on(event:string|symbol, callback: (...args:any[]) => void): void {
        this.daemon.on(event, callback)
    }

    get localip(): string {
        const interfaces = networkInterfaces()

        for(let index in interfaces) {
            for(let dev in interfaces[index]) {
                let device:NetworkInterfaceInfo = interfaces[index][dev]
    
                if(device.family === 'IPv4' && device.internal === false) {
                    return device.address
                }
            }
        }

        return '127.0.0.1'
    }

    get statistics(): ScalableServer.ServerStatistics {
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
}