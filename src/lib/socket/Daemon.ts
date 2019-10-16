import { server as WebSocketServer, connection, client, IMessage, frame, request } from 'websocket'
import * as http from 'http'
import * as url from 'url'
import ConnectionPool from './ConnectionPool'
import Stack from '../common/Stack'
import { Configuration, AddressDetails } from '../../../types'
import { EventEmitter } from 'events'
import Connection from './Connection'
import Server from './Server'

type Message = {
    hashCode: string
}

type ParsedMessage = Message & {
    event: string
}

class Daemon extends EventEmitter {
    protected pool = new ConnectionPool()

    protected servers = new ConnectionPool()

    protected history = new Stack<Message>(2000)

    protected submodules = []

    constructor(protected server: Server, protected config: Configuration, protected address: string) {
        super()
    }

    private emitEvent(type: string, data: object): boolean {
        const eventObject = {
            event: type,
            returnValue: true,
            ...data
        }

        this.emit(type, eventObject)

        return eventObject.returnValue
    }

    private parseMessage(message: Message, connection: Connection, server = false): void {
        // TODO: Replace with actual parsing
        const parsedMessage: ParsedMessage = {
            event: '',
            hashCode: ''
        }

        if (! this.history.contains(message)) {
            let send = true

            if (! this.config.noEvents && parsedMessage.event) {
                send = this.emitEvent(`event.${parsedMessage.event}`, {
                    message: parsedMessage,
                    connection
                })
            } else {
                send = this.emitEvent('message', {
                    message: parsedMessage,
                    connection
                })
            }

            if (send) {
                this.pool.send(parsedMessage)
                this.servers.send(parsedMessage)
            }

            this.history.add(parsedMessage)
        }
    }

    protected addConnection(socket: connection, remote_address: string): void {
        console.info('-- daemon:connection', { remote_address })

        const connection = new Connection(socket, this.pool)
        this.pool.add(connection, remote_address)

        socket.on('message', (event: MessageEvent) => {
            console.info('-- daemon.client:received : %s', event)

            // TODO: parse message
        })

        socket.on('close', (code: number, desc: string) => {
            console.info('-- daemon.client:closed: %s', desc)

            connection.remove()

            // TODO: send closed message
            this.emit('connection.lost', { connection, server: false, reason: 'Closed' })
        })

        socket.on('error', (error: Error) => {
            console.info('-- daemon.client:error: %j', error)

            connection.remove()

            // TODO: send closed message
            this.emit('connection.lost', { connection, server: false, reason: `Error: ${error.message}` })
        })

        // TODO: send new connection message
        this.emit('connection.new', { connection, server: false })
    }

    protected addServerConnection(socket: connection, remote_address: string, address: AddressDetails) {
        console.info('-- daemon:server-connection', { remote_address, address })

        address.name = remote_address

        const connection = new Connection(socket, this.servers)
        this.servers.add(connection, remote_address)

        socket.on('message', (event: MessageEvent) => {
            console.info('-- daemon.server:received : %s', event)

            // TODO: parse message
        })

        socket.on('close', (code: number, desc: string) => {
            console.info('-- daemon.server:closed: %s', desc)

            connection.remove()

            // TODO: send closed message
        })

        socket.on('error', (error: Error) => {
            console.info('-- daemon.server:error: %j', error)

            connection.remove()

            // TODO: send closed message
        })

        // TODO: send new connection message
        this.emit('connection.new', { connection, address, server: true })
    }

    public initSocketServer(webServer: http.Server): void {
        const server = new WebSocketServer({
            httpServer: webServer
        })

        server.on('request', (request: request) => {
            console.info('-- server:connect', request.resourceURL)

            const requestedUrl = request.resourceURL as url.UrlWithParsedQuery

            console.info('-- daemon', `connected with ${requestedUrl.href}`)

            const server = !! requestedUrl.query.server
            const address = (requestedUrl.pathname as string).substr(1)

            console.info('-- daemon', `[ws] ${server ? 'server' : 'client'}: ${address}`)

            const connection = request.accept()

            connection.on('close', (code, desc) => {
                console.info('-- server:close', code, desc)
            })
            connection.on('error', (e: Error) => {
                console.info('-- server:error', e)
            })
            connection.on('message', (d: IMessage) => {
                console.info('-- server:message', d.utf8Data)
            })
            connection.on('frame', (f: frame) => {
                console.info('-- server:frame', f.toBuffer(true).toString())
            })

            if (server) {
                const [ returnIP, returnPort ] = (requestedUrl.query.return as string).split(':')

                this.addServerConnection(connection, address, { hostname: returnIP, port: parseInt(returnPort, 10) })
            } else {
                this.addConnection(connection, address)
            }
        })

        console.info('-- daemon: sending ready')
        this.emit('ready')
    }

    /**
     * TODO: Clarify the difference between address (string) and the actual connection information (AddressDetails)
     *
     * @param hostname
     * @param port
     * @param remote_address
     */
    public connectToServer(hostname: string, port: number, remote_address?: string): void {
        const address = url.format({
            protocol: 'ws',
            hostname,
            port,
            query: {
                server: true,
                return: `${this.server.localip}:${this.config.port}`
            },
            pathname: `/${this.address}`
        })

        console.info('-- daemon: A server connection will be initiated to %s', address)
        console.info('-- daemon: Its address will be : %s', remote_address)

        const connection = new client()

        connection.on('connect', (connection: connection) => {
            console.info('-- daemon: server connection has been made to %s', address)

            this.addServerConnection(connection, remote_address as string, { hostname, port })
        })
        connection.on('connectFailed', (error: Error) => {
            console.warn('-- daemon: server connection has failed %s', error.message)
        })

        connection.connect(address)
    }

    public connectToLocalClient(port: number): void {
        this.connectToServer('localhost', port)
    }

    public log(...labels: any[]) {
        if (labels.length === 1) {
            labels.unshift('Daemon')
        }

        this.emit('log', ...labels)
    }

    public send(message: Message) {
        if (! this.history.contains(message)) {
            this.pool.send(message)
            this.servers.send(message)

            this.history.add(message)
        }
    }

    get clientConnections(): number {
        return this.pool.length
    }

    get serverConnections(): number {
        return this.servers.length
    }
}

export default Daemon
