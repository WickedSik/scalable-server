import { EventEmitter } from 'events'
import { networkInterfaces, hostname } from 'os'
import { v4 } from 'uuid'
import * as express from 'express'
import * as http from 'http'
import * as url from 'url'
import ConnectionPool from './ConnectionPool'
import Stack from '../common/Stack'
import { Message, Configuration, AddressBook, ServerStatistics } from '../../types'
import { default as ApiServer } from '../api/Server'
import {
    client as WebsocketClient,
    connection as WebsocketConnection,
    IMessage
} from 'websocket'
import ServerConnection from './ServerConnection'

export default class Server extends EventEmitter {
    protected readonly pool: ConnectionPool = new ConnectionPool()

    protected readonly history: Stack<Message> = new Stack<Message>(2500)

    protected readonly addressBook: AddressBook = {}

    protected api: ApiServer

    protected address: string

    constructor(private readonly config: Configuration) {
        super()

        const app = express()
        const webserver = http.createServer(app)

        this.address = v4()
        this.api = new ApiServer(this, app, [])

        webserver.listen(config.port)
    }

    get localip(): string {
        const interfaces = networkInterfaces()

        for (const key in interfaces) {
            for (const device of interfaces[key]) {
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
            connections: this.pool.length
        }
    }

    get addresses(): AddressBook {
        return this.addressBook
    }

    protected emitEvent(type: string, data?: any): boolean {
        const eventObject = {
            event: type,
            returnValue: true,
            ...(data || {})
        }

        this.emit(type, eventObject)

        return eventObject.returnValue
    }

    public async connect(host: string, port: number): Promise<ServerConnection> {
        const address = url.format({
            protocol: 'ws',
            hostname: host,
            port
        })

        this.emit('log', 'server.connecting', address)

        return new Promise<ServerConnection>((resolve, reject) => {
            const connection = new WebsocketClient()

            connection.on('connect', (conn: WebsocketConnection) => {
                this.emit('log', 'server.connected', conn)

                const socket = new ServerConnection(conn, this.pool, `${hostname}:${port}`)

                conn.on('message', (data) => this.handleMessage(data))
                conn.on('close', (code, number) => this.handleClose(code, number))
                conn.on('error', (error) => this.handleError(error))

                socket.api.get('/statistics').then((result: ServerStatistics) => {
                    socket.serverAddress = {
                        name: result.address.name,
                        hostname: host,
                        port
                    }

                    resolve(socket)
                }, () => {
                    // NOTE(jurrien) this means, it is not a server
                    resolve(socket)
                })
            })

            connection.on('connectFailed', (error: Error) => {
                this.emit('log', 'server.connection-failed', error)

                reject(error)
            })

            connection.connect(address)
        })
    }

    handleMessage(event: IMessage): void {
        this.emit('log', 'server.handle-message', event)
    }

    handleClose(code: number, desc: string): void {
        this.emit(
            'log',
            'server.handle-close',
            code,
            desc
        )
    }

    handleError(error: Error): void {
        this.emit('log', 'server.handle-error', error)
    }
}
