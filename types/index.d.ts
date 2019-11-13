export as namespace ScalableServer

export type Configuration = {
    noEvents: boolean
    port: number
    dryRun: boolean
}

export type ServerStatistics = {
    address: {
        name: string
        hostname: string
        ip: string
    }
    connections: number
}

export type AddressDetails = {
    name?: string
    hostname: string
    port: number
}

export type AddressBook = {
    [key: string]: AddressDetails
}

/**
 * Message that is send between servers and clients
 */
export declare class Message { // eslint-disable-line
    [key: string]: any
}

/* EVENTS */

export declare class Event {
    origin: AddressDetails

    name: string

    payload?: any
}

/**
 * MessageEvent when a message is received through the system
 */
export declare class MessageEvent extends Event {
    name: 'message'

    payload: Message
}

export type NewConnectionEvent = {
    connection: import('../src/lib/socket/Connection').default
    address?: AddressDetails
    server: boolean
}

export type LostConnectionEvent = NewConnectionEvent & {
    reason: string
}
