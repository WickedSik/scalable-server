import { AddressDetails } from "../../../types";

type MessageType = {
    [key: string]: any    
}

export type Message = MessageType & {
    address: string[]
}
