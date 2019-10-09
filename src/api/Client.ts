import Server from '../server'

export default class Client {
    constructor(private server:Server, private uri:string) {

    }

    async get(path:string):Promise<any> {

    }
}