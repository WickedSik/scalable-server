import fetch from 'cross-fetch'

export default class Client {
    constructor(private readonly uri: string) {
    }

    public async get(path: string): Promise<any> {
        return fetch(`http://${this.uri}${path}`)
            .then(response => response.json())
    }

    public async post(path: string, body: string | FormData | URLSearchParams): Promise<any> {
        return fetch(`http://${this.uri}${path}`, {
            method: 'POST',
            body
        }).then(response => response.json())
    }
}
