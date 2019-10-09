import ConnectionPool from './ConnectionPool'
import Stack from './Stack'
import { ScalableServer } from '../index.d'
import { EventEmitter } from 'events'
import Connection from './Connection'
import { server as WebSocketServer, connection, client, IMessage, frame, request } from 'websocket'
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
            console.info('-- server', 'received : %s', event)

            // TODO: parse message
        })

        socket.on('close', (code: number, desc: string) => {
            console.info('-- server', 'closed: %s', desc)

            connection.remove()

            // TODO: send closed message
        })

        socket.on('error', (error: Error) => {
            console.info('-- server', 'error: %j', error)

            connection.remove()

            // TODO: send closed message
        })

        // TODO: send new connection message
    }

    addServerConnection(socket: connection, address: string) {
        const connection = new Connection(socket, this.servers)
        this.servers.add(connection, address)

        socket.on('message', (event: MessageEvent) => {
            console.info('-- server', 'received : %s', event)

            // TODO: parse message
        })

        socket.on('close', (code: number, desc: string) => {
            console.info('-- server', 'closed: %s', desc)

            connection.remove()

            // TODO: send closed message
        })

        socket.on('error', (error: Error) => {
            console.info('-- server', 'error: %j', error)

            connection.remove()

            // TODO: send closed message
        })

        // TODO: send new connection message
    }

    initSocketServer(port: number): void {
        const web = http.createServer()
        web.listen(port)

        const server = new WebSocketServer({
            httpServer: web
        })

        server.on('request', (request:request) => {
            console.info('-- server:connect', request.resourceURL)

            const requestedUrl = request.resourceURL as url.UrlWithParsedQuery

            console.info('-- daemon', `connected with ${requestedUrl.href}`)

            const server = !!requestedUrl.query.server
            const address = (requestedUrl.pathname as string).substr(1)

            console.info('-- daemon', `[ws] ${server ? 'server' : 'client'}: ${address}`)

            const connection = request.accept()

            connection.on('close', (code, desc) => {
                console.info('-- server:close', code, desc)
            })
            connection.on('error', (e:Error) => {
                console.info('-- server:error', e)
            })
            connection.on('message', (d:IMessage) => {
                console.info('-- server:message', d.utf8Data)
            })
            connection.on('frame', (f:frame) => {
                console.info('-- server:frame', f.toBuffer(true).toString())
            })

            if(server) {
                this.addServerConnection(connection, address)
            } else {
                this.addConnection(connection, address)
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

        console.info('-- Server', 'A server connection will be initiated to %s', address);
        console.info('-- Server', 'Its address will be : %s', remote_address);
        
        const connection = new client()

        connection.on('connect', (connection:connection) => {
            console.info('-- Server', 'server connection has been made to %s', address);

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