import Server from './server'
import Client from './client'

export namespace ScalableServer {
    export type Configuration = {
        address: string
        noEvents: boolean
        daemon: {
            port: number
            clients: Client[]
            servers: Server[]
            noEvents: boolean
        }
        api: {
            port: number
        }
        dryRun: boolean
    }

    export type ServerStatistics = {
        address: {
            name: string
            hostname: string
            ip: string
        },
        daemon: {
            clients: number
            servers: number
        }
    }
}