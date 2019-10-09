# Scalable Server

## Initiation

```javascript

var Server = require('scalable-server');

var config = {
    daemon: {
        port: 8800,
        clients: [],
        servers: [],
        noEvents: false
    },
    test: false
};
var s = new Server(config);

// connect listeners
s.on('connection.new',  function(event) { /* .. code .. */ });
s.on('connection.lost', function(event) { /* .. code .. */ });

s.init();

// connect to additional clients and servers
// this can also be done from the config

s.getDaemon().addClient( port );
s.getDaemon().addServer( address ); // example : ws://localhost:9000/

```

### Options

The options are given to the constructor

#### Daemon Options

This is in the `daemon` property of the config object.

- `port` Sets the server port on the entered number, the default is `8800`
- `clients` Adds a connection to a client, this parameter can be repeated when required. This only requires a port number
- `servers` Adds a connection to a server, this parameter can be repeated when required. This requires an object with the following attributes
    - `hostname` The hostname to connect to
    - `port` The port to connect to
- `noEvents` If `true`, this sets the event handling to `message` events only. This effectively disables the use of `evt.*` events.

> `clients` is the shorthand version of `servers` where the hostname is always "localhost"

## Events

### Global

- `log` This event is emitted every time a log line is executed, this can be used to handle logs in your own way, instead of outputting them to the console
- `message` This event is emitted every time a message is received, this is only triggered once per message. The handler for this parameter has 2 parameters;
    - `message` The message object, this includes the message, user, hashcode and event-type.
    - `connection` The connection which has send this message.
- `evt.<eventcode>` This type of event is send whenever the client or a connected server sends out a message with the event type set. __Note:__ this will be triggered instead of the `message` event. This can be configured.

  __Example:__

  Client: `{ "user": "hank", "event":"request", "method":"sayHello", "params": {} }`

  Server: `self.emit('evt.request', event);`

If you put the `returnValue` of the `EventObject` to `false`, the message will not be send to other servers, nor clients. This allows to respond to an event without _alerting the flock_.

### Connection

- `connection.new` This event is emitted when a new connection is established. The handler for this event has one parameter, which is the connection object itself.
- `connection.lost` This event is emitted when a connection is lost. The handler for this event has one parameter, which is the connection object itself. __Note:__ one can no longer use this object for sending messages. The connection _has_ been terminated.

### Server

- `server.new` This event is emitted when a new server-connection is established. The handler for this event has one parameter, which is the connection object itself.
- `server.lost` This event is emitted when a server-connection is lost. The handler for this event has one parameter, which is the connection object itself. __Note:__ one can no longer use this object for sending messages. The connection _has_ been terminated.

## Sub Modules

__TBD__

## Objects 

### Submodule

```javascript

Submodule: {
    server: null,     // Deamon
    // ...
    init:function(){} // Function
}

```

### Connection

```javascript

Connection: {
    pool: [],                  // ConnectionPool[]
    conn: null,                // Websocket
    // ...
    getIndex: function() {},   // int
    remove: function() {},     // void
    send: function(message) {} // void
}

```

### Connection Pool

```javascript

ConnectionPool: {
    pool:[],                                      // Connection[]
    // ...
    getPool: function() {},                       // Connection[]
    setPool: function(connections) {},            // void
    add: function(connection) {},                 // Connection
    remove: function(index) {},                   // Connection
    has: function(index) {}                       // boolean
    index: function(connection) {},               // int
    send: function(message, except_connection) {} // void
]

```

### EventObject

```javascript

EventObject: {
    event: "",         // String
    returnValue: true, // boolean
    // ...
    message: "",       // String
    connection: null   // Connection
}

```
