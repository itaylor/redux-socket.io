# redux-socket.io
An opinionated connector between socket.io and redux.

Philosophy
-------------
Socket.io client->server messages should should be sent by dispatching actions to redux's store, where the action is the payload.  Socket.io server->client messages should be dispatched as actions when received.

How to use
-------------
### Installation
```
npm install --save redux-socket.io
```

### Example usage
This will create a middleware that sends actions to the server when the action type starts with "server/".
When the socket.io socket receives a message of type 'action', it will dispatch the action to the store.

The result of running this code from the client is a request to the server and a response from the server, both of
which go through the redux store's dispatch method.

Client side:
```js
import { createStore, applyMiddleware } from 'redux';
import createSocketIoMiddleware from 'redux-socket.io';
import io from 'socket.io-client';
let socket = io('http://localhost:3000');
let socketIoMiddleware = createSocketIoMiddleware(socket, 'fromSocket/', 'toSocket/', ['fromSocket/eventFromSocket1', 'fromSocket/eventFromSocket2']);
function reducer(state = {}, action){
  switch(action.type){
    case 'fromSocket/eventFromSocket1':
      return Object.assign({}, {message:action.data});
    default:
      return state;
  }
}
let store = applyMiddleware(socketIoMiddleware)(createStore)(reducer);
store.subscribe(()=>{
  console.log('new client state', store.getState());
});
store.dispatch({type:'server/hello', data:'Hello!'});
```

Server side:
```js
var http = require('http');
var server = http.createServer();
var socket_io = require('socket.io');
server.listen(3000);
var io = socket_io();
io.attach(server);
io.on('connection', function(socket){
  console.log("Socket connected: " + socket.id);
  socket.on('action', (action) => {
    if(action.type === 'server/hello'){
      console.log('Got hello data!', action.data);
      socket.emit('action', {type:'message', data:'good day!'});
    }
  });
});
```

### MIT License
Copyright (c) 2015 Ian Taylor

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
