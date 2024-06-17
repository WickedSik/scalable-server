import { EventEmitter } from 'events'
import * as url from 'url'
import { Message } from '../../types'
import Stack from '../common/Stack'
import ConnectionPool from './ConnectionPool'
import {
    client as WebsocketClient,
    connection as WebsocketConnection,
    IMessage
} from 'websocket'
import Connection from './Connection'
import { default as ApiClient } from '../api/Client'

export default class Client extends EventEmitter {
    protected readonly pool: ConnectionPool = new ConnectionPool()

    protected readonly history: Stack<Message> = new Stack<Message>(500)

    protected api?: ApiClient

    protected emitEvent(type: string, data?: any): boolean {
        const eventObject = {
            event: type,
            returnValue: true,
            ...(data || {})
        }

        this.emit(type, eventObject)

        return eventObject.returnValue
    }

    protected parseMessage(message: Message): void {
        if (! this.history.contains(message)) {
            const send = true

            if (send && this.pool) {
                this.pool.send(message)
            }
        }
    }

    public async connect(hostname: string, port: number): Promise<this> {
        const address = url.format({
            protocol: 'ws',
            hostname,
            port
        })

        this.emit('log', 'client.connecting', address)

        return new Promise<this>((resolve, reject) => {
            const connection = new WebsocketClient()

            connection.on('connect', (conn: WebsocketConnection) => {
                this.emit('log', 'client.connected', conn)

                const socket = new Connection(conn, this.pool)
                this.pool.add(socket, 'server')

                conn.on('message', (data) => this.handleMessage(data))
                conn.on('close', (code, number) => this.handleClose(code, number))
                conn.on('error', (error) => this.handleError(error))

                this.api = new ApiClient(`${hostname}:${port}`)

                this.emitEvent('connected')

                resolve(this)
            })

            connection.on('connectFailed', (error: Error) => {
                this.emit('log', 'client.connection-failed', error)

                reject(error)
            })

            connection.connect(address)
        })
    }

    handleMessage(event: IMessage): void {
        this.emit('log', 'client.handle-message', event)
    }

    handleClose(code: number, desc: string): void {
        this.emit(
            'log',
            'client.handle-close',
            code,
            desc
        )
    }

    handleError(error: Error): void {
        this.emit('log', 'client.handle-error', error)
    }
}
