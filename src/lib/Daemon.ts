import ConnectionPool from './ConnectionPool'
import Stack from './Stack'
import { ScalableServer } from '../index.d'
import { EventEmitter } from 'events'
import Connection from './Connection'
import { server as WebSocketServer, connection, client } from 'websocket'
import * as http from 'http'
import * as url from 'url'

type Message = {
    hashCode: string
}

type ParsedMessage = Message & {
    event: string
}

export default class Daemon extends EventEmitter {
    protected pool = new ConnectionPool()
    protected servers = new ConnectionPool()
    protected history = new Stack<Message>(2000)
    protected submodules = []
    protected address:string
    protected config:ScalableServer.Configuration

    constructor(config:ScalableServer.Configuration) {
        super()

        this.address = config.address
        this.config = config
    }

    emitEvent(type:string, data:object): boolean {
        const eventObject = {
            event: type,
            returnValue: true,
            ...data
        }

        this.emit(type, eventObject)

        return eventObject.returnValue
    }

    parseMessage(message:Message, connection:Connection, server: boolean = false): void {
        // TODO: Replace with actual parsing
        const parsedMessage:ParsedMessage = {
            event: '',
            hashCode: ''
        }

        if(!this.history.contains(message)) {
            let send = true

            if(!this.config.noEvents && parsedMessage.event) {
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

            if(send) {
                this.pool.send(parsedMessage)
                this.servers.send(parsedMessage)
            }

            this.history.add(parsedMessage)
        }
    }

    addConnection(socket: connection, address:string): void {
        const connection = new Connection(socket, this.pool)
        this.pool.add(connection, address)

        socket.on('message', (event: MessageEvent) => {
            this.emit('log', 'server', 'received : %s', event)

            // TODO: parse message
        })

        socket.on('close', (code: number, desc: string) => {
            this.emit('log', 'server', 'closed: %s', desc)

            connection.remove()

            // TODO: send closed message
        })

        socket.on('error', (error: Error) => {
            this.emit('log', 'server', 'error: %j', error)

            connection.remove()

            // TODO: send closed message
        })

        // TODO: send new connection message
    }

    addServerConnection(socket: connection, address: string) {
        const connection = new Connection(socket, this.servers)
        this.servers.add(connection, address)

        socket.on('message', (event: MessageEvent) => {
            this.emit('log', 'server', 'received : %s', event)

            // TODO: parse message
        })

        socket.on('close', (code: number, desc: string) => {
            this.emit('log', 'server', 'closed: %s', desc)

            connection.remove()

            // TODO: send closed message
        })

        socket.on('error', (error: Error) => {
            this.emit('log', 'server', 'error: %j', error)

            connection.remove()

            // TODO: send closed message
        })

        // TODO: send new connection message
    }

    initSocketServer(port: number): void {
        const web = http.createServer()
        web.listen(port)

        const server = new WebSocketServer({
            httpServer: web,
            autoAcceptConnections: true
        })

        server.on('request', (connection) => {
            const requestedUrl = url.parse(connection.httpRequest.url as string, true)

            this.emit('log', 'daemon', 'connected with %j', requestedUrl.href)

            const server = !!requestedUrl.query.server
            const address = (requestedUrl.pathname as string).substr(1)

            this.emit('log', 'daemon', '[ws] %s: %s', server ? 'server' : 'client', address)

            const socket = connection.accept()

            if(server) {
                this.addServerConnection(socket, address)
            } else {
                this.addConnection(socket, address)
            }
        })
    }

    connectToServer(hostname: string, port: number, remote_address?: string): void {
        const address = url.format({
            protocol: 'ws',
            hostname,
            port,
            query: {
                server: true
            },
            pathname: `/${this.address}`
        })

        this.emit('log', 'Server', 'A server connection will be initiated to %s', address);
        this.emit('log', 'Server', 'Its address will be : %s', remote_address);
        
        const connection = new client()

        connection.on('connect', (connection:connection) => {
            this.emit('log', 'Server', 'server connection has been made to %s', address);

            this.addServerConnection(connection, remote_address as string)
        })

        connection.connect(address)
    }

    connectToLocalClient(port:number): void {
        this.connectToServer('localhost', port)
    }

    log(...labels:string[]) {
        if(labels.length === 1) {
            labels.unshift('Daemon')
        }

        this.emit('log', ...labels)
    }

    send(message: Message) {
        if(!this.history.contains(message)) {
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