import Connection from './Connection'

export default class ConnectionPool {
    protected pool: Map<string, Connection> = new Map()

    add(connection: Connection, address: string): void {
        this.pool.set(address, connection)
    }

    remove(address: string): void {
        if (this.has(address)) {
            this.pool.delete(address)
        }
    }

    has(address: string): boolean {
        return this.pool.has(address)
    }

    index(connection: Connection): string | undefined {
        for (const [key, value] of this.pool.entries()) {
            if (value === connection) {
                return key
            }
        }
        return undefined
    }

    send(message: any, except?: string): void {
        if (typeof message !== 'string') {
            message = JSON.stringify(message)
        }

        this.pool.forEach((connection: Connection, address) => {
            if (address !== except) {
                connection.send(message)
            }
        })
    }

    get length(): number {
        return this.pool.size
    }
}
