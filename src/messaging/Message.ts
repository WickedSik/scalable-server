type MessageType = {
    [key: string]: any
}

export type Message = MessageType & {
    address: string[]
}
