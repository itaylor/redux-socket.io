import { createStore, applyMiddleware } from 'redux';
import createSocketIoMiddleware from '../dist/index.js';

suite('Redux-socket.io middleware basic tests');

test('Using a string prefix to determine whether to call socket', 6, () => {
  const socket = new MockSocket();
  const socketIoMiddleware = createSocketIoMiddleware(socket, 'server/');
  const createStoreWithMiddleware = applyMiddleware(socketIoMiddleware)(createStore);
  const store = createStoreWithMiddleware(simpleReducer);

  store.dispatch({type:'server/socketAction1', payload:'action1'});
  store.dispatch({type:'action2', payload:'action2'});

  equal(store.getState().socketAction1, 'action1');
  equal(store.getState().action2, 'action2');
  equal(socket.emitted.length, 1);
  equal(socket.emitted[0][0], 'action');
  equal(socket.emitted[0][1].type, 'server/socketAction1');
  equal(socket.emitted[0][1].payload, 'action1');
});

test('Using an array of action names to determine whether to call socket', 6, () => {
  const socket = new MockSocket();
  const socketIoMiddleware = createSocketIoMiddleware(socket, ['server/socketAction1']);
  const createStoreWithMiddleware = applyMiddleware(socketIoMiddleware)(createStore);
  const store = createStoreWithMiddleware(simpleReducer);

  store.dispatch({type:'server/socketAction1', payload:'action1'});
  store.dispatch({type:'action2', payload:'action2'});

  equal(store.getState().socketAction1, 'action1');
  equal(store.getState().action2, 'action2');
  equal(socket.emitted.length, 1);
  equal(socket.emitted[0][0], 'action');
  equal(socket.emitted[0][1].type, 'server/socketAction1');
  equal(socket.emitted[0][1].payload, 'action1');
});

test('Using a function to determine whether to call socket', 6, () => {
  const socket = new MockSocket();
  function callSocketTestFn(type) {
    return type.match(/server\//);
  }
  const socketIoMiddleware = createSocketIoMiddleware(socket, callSocketTestFn);
  const createStoreWithMiddleware = applyMiddleware(socketIoMiddleware)(createStore);
  const store = createStoreWithMiddleware(simpleReducer);

  store.dispatch({type:'server/socketAction1', payload:'action1'});
  store.dispatch({type:'action2', payload:'action2'});

  equal(store.getState().socketAction1, 'action1');
  equal(store.getState().action2, 'action2');
  equal(socket.emitted.length, 1);
  equal(socket.emitted[0][0], 'action');
  equal(socket.emitted[0][1].type, 'server/socketAction1');
  equal(socket.emitted[0][1].payload, 'action1');
});


test('Using an alternate event name', 6, () => {
  const socket = new MockSocket();
  function callSocketTestFn(type) {
    return type.match(/server\//);
  }
  const socketIoMiddleware = createSocketIoMiddleware(socket, callSocketTestFn, {eventName:'barfy!'});
  const createStoreWithMiddleware = applyMiddleware(socketIoMiddleware)(createStore);
  const store = createStoreWithMiddleware(simpleReducer);

  store.dispatch({type:'server/socketAction1', payload:'action1'});
  store.dispatch({type:'action2', payload:'action2'});

  equal(store.getState().socketAction1, 'action1');
  equal(store.getState().action2, 'action2');
  equal(socket.emitted.length, 1);
  equal(socket.emitted[0][0], 'barfy!');
  equal(socket.emitted[0][1].type, 'server/socketAction1');
  equal(socket.emitted[0][1].payload, 'action1');
});

class MockSocket{
  constructor(){
    this.emitted = [];
  }
  emit(...args){
    this.emitted.push(args);
  }
  on(){
  }
}

function simpleReducer(state={}, action){
  switch(action.type){
    case 'server/socketAction1':
      return Object.assign({}, state, {
        'socketAction1': action.payload
      });
    case 'action2':
      return Object.assign({}, state, {
        'action2': action.payload
      });
    default:
      return state;
  }
}
