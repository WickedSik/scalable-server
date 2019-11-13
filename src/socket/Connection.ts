import ConnectionPool from './ConnectionPool'
import { connection } from 'websocket'

export default class Connection {
    constructor(private readonly socket: connection, private readonly pool: ConnectionPool) {
    }

    get address(): string | undefined {
        return this.pool.index(this)
    }

    send(message: string): void {
        this.socket.send(message)
    }

    remove(): void {
        this.pool.remove(this.address as string)
    }
}
