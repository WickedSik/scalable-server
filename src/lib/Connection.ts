import ConnectionPool from './ConnectionPool'
import { connection } from 'websocket'

export default class Connection {
    constructor(private socket: connection, private pool: ConnectionPool) {
    }

    get address(): string | undefined {
        return this.pool.index(this)
    }

    send(message: string): void {
        this.socket.send(message)
    }

    remove() {
        this.pool.remove(this.address as string)
    }
}