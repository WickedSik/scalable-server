import * as express from 'express'
import { Request, Response, NextFunction } from 'express'
import MainServer from '../lib/socket/Server'

type ApiRoute = {
    path: string
    callback: (request: Request, response: Response, next: NextFunction) => Response
}

export default class Server {
    constructor(private readonly server: MainServer, protected customRoutes: ApiRoute[] = []) {
    }

    init(webServer: express.Application): void {
        webServer.get('/statistics', (req, response) => {
            return response.json(this.server.statistics)
        })

        webServer.get('/addresses', (req, response) => {
            return response.json(this.server.addresses)
        })

        this.customRoutes.forEach((customRoute: ApiRoute) => {
            webServer.get(customRoute.path, customRoute.callback)
        })
    }
}
