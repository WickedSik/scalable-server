import md5 = require('md5')

export default class HashCode {
    private static serialize(object: any): string {
        const type: string = typeof object

        let serializedCode = ''

        switch (type) {
            case 'object':
                for (const element in object) {
                    if (object.hasOwnProperty(element)) {
                        serializedCode += `[${type}:${element}${this.serialize(object[element])}]`
                    }
                }
                break
            case 'function':
                serializedCode += `[${type}:${object.toString()}]`
                break
            default:
                serializedCode += `[${type}:${object}]`
        }

        return serializedCode.replace(/\s/g, '')
    }

    static value(object: any): string {
        return md5(this.serialize(object))
    }

    static raw(object: any): string {
        return this.serialize(object)
    }
}
