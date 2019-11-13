import { connection as WebsocketConnection } from 'websocket'
import Connection from './Connection'
import { default as ApiClient } from '../api/Client'
import ConnectionPool from '../socket/ConnectionPool'
import { AddressDetails } from '../../types'

export default class ServerConnection extends Connection {
    public api: ApiClient

    public serverAddress?: AddressDetails

    constructor(socket: WebsocketConnection, pool: ConnectionPool, uri: string) {
        super(socket, pool)

        this.api = new ApiClient(uri)
    }
}
