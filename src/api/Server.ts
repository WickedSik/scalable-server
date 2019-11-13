import { Request, Response, NextFunction, Application } from 'express'
import MainServer from '../socket/Server'

type ApiRoute = {
    path: string
    callback: (request: Request, response: Response, next: NextFunction) => Response
}
export default class Server {
    constructor(private readonly server: MainServer, webServer: Application, protected customRoutes: ApiRoute[] = []) {
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
