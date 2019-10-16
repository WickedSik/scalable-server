import { v1 } from 'uuid'
import * as S from 'string'
import Connection from '../socket/Connection'
import HashCode from '../common/HashCode'
import { Message } from './Message'

export default class MessageFactory {
    protected message: Map<string, any> = new Map()

    protected address: string[] = []

    constructor(props?: { [key: string]: any }) {
        if (props) {
            for (const property in props) {
                if (property === 'address') {
                    if (Array.isArray(props[property])) {
                        this.address.concat(props[property])
                    } else {
                        this.address.push(props[property])
                    }
                } else {
                    this.message.set(property, MessageFactory.cleanMessage(props[property]))
                }
            }
        }
    }

    static createFromObject(message: any, sender?: Connection): Message {
        const m: Message = {
            address: []
        }

        Object.keys(message).forEach((key:string) => {
            if(key === 'address') {
                m.address = m.address.concat(message.address)
            } else {
                m[key] = message[key]
            }
        })

        if (sender) {
            m.address.push(sender.address as string)

            // filter to be unique
            m.address = m.address.filter((a, i) => m.address.indexOf(a) === i)
        }

        MessageFactory.generateMessageHash(m)
        return m
    }

    static generateMessageHash(object: any): string {
        if (typeof object === 'object') {
            if (typeof object.hashCode !== 'undefined') {
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
        if (typeof text !== 'string') {
            return text
        }

        return S(text)
            .decodeHTMLEntities()
            .collapseWhitespace()
            .stripTags()
            .toString()
    }
}
