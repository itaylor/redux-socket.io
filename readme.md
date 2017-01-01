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
let socketIoMiddleware = createSocketIoMiddleware(socket, "server/");
function reducer(state = {}, action){
  switch(action.type){
    case 'message':
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

## Allowed criteria for action matching ##
When you create this middleware, you can configure how it detects that a given action should be sent to socket.io.
This is done with the second parameter to `createSocketIoMiddleware`.

You can pass either a prefix string that will be matched against the action.type:
```js
let socketIoMiddleware = createSocketIoMiddleware(socket, 'server/');
```
An array of strings that will will be used as allowed prefixes:
```js
let socketIoMiddleware = createSocketIoMiddleware(socket, [ 'post/', 'get/' ]);
```
Or a function that returns a truthy value if the action should be sent to socket.io:
```js
let socketIoMiddleware = createSocketIoMiddleware(socket, (type, action) => action.io);
```

## Advanced usage ##
The default behavior is an "optimistic" update mode, where if an action matches the criteria you provided when you created the socket.io middleware, the middleware calls `socket.emit('action', action)` and then passes the action to the next middleware in the chain.

If you want to change this behavior, you can provide your own execute function that allows you to decide what to do with the action that matched your criteria.

You do this by providing a `function (action, emit, next, dispatch)` as the `execute` property of the third parameter of `createSocketIoMiddleware`

### Example execute functions: ###
This is equivalent to the default execute function, so this is what will happen if you don't override it.  Use something like this if you want optimistic updates of your state, where the action you dispatch goes both to the server and to the redux reducers.
```js
import createSocketIoMiddleware from 'redux-socket.io';
function optimisticExecute(action, emit, next, dispatch) {
  emit('action', action);
  next(action);
}
let socketIoMiddleware = createSocketIoMiddleware(socket, "server/", { execute: optimisticExecute });
```


Here's a function that would make the middleware swallow all the actions that matched the criteria and not allow them to continue down the middleware chain to the reducers.  This is easily used to make "pessimistic" updates of your state, by having the server respond by sending back an action type of the same type it was sent.
```js
import createSocketIoMiddleware from 'redux-socket.io';
function pessimisticExecute(action, emit, next, dispatch) {
  emit('action', action);
}
let socketIoMiddleware = createSocketIoMiddleware(socket, "server/", { execute: pessimisticExecute });
```

Here's a function that would make the middleware dispatch an alternate action that could be used in a scenario where you want the optimistic updates to be very explicit.  Here you would have actions of type `server/<actionName>` sent to the server, and also have another action `optimistic/<actionName>` dispatched as well with the same content.

```js
import createSocketIoMiddleware from 'redux-socket.io';
function optimisticExecute(action, emit, next, dispatch) {
  emit('action', action);
  const optimisticAction = {
    ...action,
    type: 'optimistic/' action.type.split('/')[1];
  }
  dispatch(optimisticAction);
}
let socketIoMiddleware = createSocketIoMiddleware(socket, "server/", { execute: optimisticExecute });
```

### MIT License
Copyright (c) 2015-2016 Ian Taylor

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
