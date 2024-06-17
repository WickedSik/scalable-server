import * as md5 from 'md5'

export default {
    serialize(object: any): string {
        const type: string = typeof object

        let serializedCode = ''

        switch (type) {
            case 'object':
                for (const element in object) {
                    serializedCode += `[${type}:${element}${this.serialize(object[element])}]`
                }
                break
            case 'function':
                serializedCode += `[${type}:${object.toString()}]`
                break
            default:
                serializedCode += `[${type}:${object}]`
        }

        return serializedCode.replace(/\s/g, '')
    },

    value(object: any): string {
        return md5(this.serialize(object))
    },

    raw(object: any): string {
        return this.serialize(object)
    }
}
