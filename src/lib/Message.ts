import { v1 } from 'uuid'
import * as S from 'string'
import Connection from './Connection'
import HashCode from './HashCode'

export default class Message {
    protected message: Map<string, any> = new Map()
    protected address: string[] = []

    constructor(props?: { [key:string]: any } ) {
        if(props) {
            for(let property in props) {
                if(property === 'address') {
                    if(Array.isArray(props[property])) {
                        this.address.concat(props[property])
                    } else {
                        this.address.push(props[property])
                    }
                } else {
                    this.message.set(property, Message.cleanMessage(props[property]))
                }
            }
        }
    }

    static createFromObject(message: any, sender?: Connection): Message {
        let m:Message = new Message(message)

        if(sender) {
            m.address.push(sender.address as string)
        }

        Message.generateMessageHash(m)
        return m
    }

    static generateMessageHash(object: any): string {
        if(typeof object === 'object') {
            if(typeof object.hashCode !== 'undefined') {
                return object.hashCode
            } else {
                const hash = `${v1()}::${HashCode.value(object)}`
                object.hashCode = hash

                return hash
            }
        }

        return HashCode.value(object)
    }

    static cleanMessage(text: any): any {
        if(typeof text !== 'string') {
            return text
        }

        return S(text)
            .decodeHTMLEntities()
            .collapseWhitespace()
            .stripTags()
            .toString()
    }
}