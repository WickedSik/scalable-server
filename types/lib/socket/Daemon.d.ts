import { EventEmitter } from 'events'
import { NewConnectionEvent, LostConnectionEvent } from '../../index'

interface Daemon extends EventEmitter {
    // events
    on( event: 'connection.new', listener: ( event: NewConnectionEvent ) => void ): this
    on( event: 'connection.lost', listener: ( event: LostConnectionEvent ) => void ): this
    on( event: 'ready', listener: () => void ): this
    on( event: string|symbol, listener: ( event: any ) => void ): this

    // emits
    emit( event: 'connection.new', data: NewConnectionEvent ): boolean
    emit( event: 'connection.lost', data: LostConnectionEvent ): boolean
    emit( event: 'ready' ): boolean
    emit( event: 'log', ...elements: any[] ): boolean
    emit( event: string, data: any ): boolean
}