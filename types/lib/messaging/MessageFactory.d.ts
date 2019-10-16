declare class MessageFactory {
    static createFromObject(message: any, sender?: import('../../../src/lib/socket/Connection').default): import('../../../src/lib/messaging/Message').Message
    static generateMessageHash(object: any): string
    static cleanMessage(text: any): any

    constructor(props?: { [key:string]: any })

    protected message: Map<string, any>
    protected address: string[]
}