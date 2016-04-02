import { createStore, applyMiddleware } from 'redux';
import createSocketIoMiddleware from '../dist/index.js';
import expect from 'expect';

class MockSocket {
  constructor() {
    this.emitted = [];
  }
  emit(...args) {
    this.emitted.push(args);
  }
  on() {
  }
}

suite('Redux-socket.io middleware basic tests', () => {
  test('Using a string prefix to determine whether to call socket', () => {
    const socket = new MockSocket();
    const socketIoMiddleware = createSocketIoMiddleware(socket, 'server/');
    const createStoreWithMiddleware = applyMiddleware(socketIoMiddleware)(createStore);
    const store = createStoreWithMiddleware(simpleReducer);

    store.dispatch({ type: 'server/socketAction1', payload: 'action1' });
    store.dispatch({ type: 'action2', payload: 'action2' });

    expect(store.getState().socketAction1).toBe('action1');
    expect(store.getState().action2).toBe('action2');
    expect(socket.emitted.length).toBe(1);
    expect(socket.emitted[0][0]).toBe('action');
    expect(socket.emitted[0][1].type).toBe('server/socketAction1');
    expect(socket.emitted[0][1].payload).toBe('action1');
  });

  test('Using an array of action names to determine whether to call socket', () => {
    const socket = new MockSocket();
    const socketIoMiddleware = createSocketIoMiddleware(socket, ['server/socketAction1']);
    const createStoreWithMiddleware = applyMiddleware(socketIoMiddleware)(createStore);
    const store = createStoreWithMiddleware(simpleReducer);

    store.dispatch({ type: 'server/socketAction1', payload: 'action1' });
    store.dispatch({ type: 'action2', payload: 'action2' });

    expect(store.getState().socketAction1).toBe('action1');
    expect(store.getState().action2).toBe('action2');
    expect(socket.emitted.length).toBe(1);
    expect(socket.emitted[0][0]).toBe('action');
    expect(socket.emitted[0][1].type).toBe('server/socketAction1');
    expect(socket.emitted[0][1].payload).toBe('action1');
  });

  test('Using an array of action names and prefixes to determine whether to call socket', () => {
    const socket = new MockSocket();
    const socketIoMiddleware = createSocketIoMiddleware(socket, ['server/', 'action2']);
    const createStoreWithMiddleware = applyMiddleware(socketIoMiddleware)(createStore);
    const store = createStoreWithMiddleware(simpleReducer);

    store.dispatch({ type: 'server/socketAction1', payload: 'action1' });
    store.dispatch({ type: 'action2', payload: 'action2' });
    store.dispatch({ type: 'action3', payload: 'action3' });

    expect(store.getState().socketAction1).toBe('action1');
    expect(store.getState().action2).toBe('action2');
    expect(socket.emitted.length).toBe(2);
    expect(socket.emitted[0][0]).toBe('action');
    expect(socket.emitted[0][1].type).toBe('server/socketAction1');
    expect(socket.emitted[0][1].payload).toBe('action1');
    expect(socket.emitted[1][0]).toBe('action');
    expect(socket.emitted[1][1].type).toBe('action2');
    expect(socket.emitted[1][1].payload).toBe('action2');
  });

  test('Using a function to determine whether to call socket', () => {
    const socket = new MockSocket();
    function callSocketTestFn(type) {
      return type.match(/server\//);
    }
    const socketIoMiddleware = createSocketIoMiddleware(socket, callSocketTestFn);
    const createStoreWithMiddleware = applyMiddleware(socketIoMiddleware)(createStore);
    const store = createStoreWithMiddleware(simpleReducer);

    store.dispatch({ type: 'server/socketAction1', payload: 'action1' });
    store.dispatch({ type: 'action2', payload: 'action2' });

    expect(store.getState().socketAction1).toBe('action1');
    expect(store.getState().action2).toBe('action2');
    expect(socket.emitted.length).toBe(1);
    expect(socket.emitted[0][0]).toBe('action');
    expect(socket.emitted[0][1].type).toBe('server/socketAction1');
    expect(socket.emitted[0][1].payload).toBe('action1');
  });

  test('Using a function to determine whether to call socket by checking action property', () => {
    const socket = new MockSocket();
    function callSocketTestFn(type, action) {
      return action.sendIo;
    }
    const socketIoMiddleware = createSocketIoMiddleware(socket, callSocketTestFn);
    const createStoreWithMiddleware = applyMiddleware(socketIoMiddleware)(createStore);
    const store = createStoreWithMiddleware(simpleReducer);

    store.dispatch({ type: 'action2', payload: 'action2', sendIo: true });
    store.dispatch({ type: 'action3', payload: 'action3' });

    expect(store.getState().action2).toBe('action2');
    expect(store.getState().action3).toBe('action3');
    expect(socket.emitted.length).toBe(1);
    expect(socket.emitted[0][0]).toBe('action');
    expect(socket.emitted[0][1].type).toBe('action2');
    expect(socket.emitted[0][1].payload).toBe('action2');
  });

  test('Using an alternate event name', () => {
    const socket = new MockSocket();
    function callSocketTestFn(type) {
      return type.match(/server\//);
    }
    const socketIoMiddleware = createSocketIoMiddleware(socket, callSocketTestFn,
      { eventName: 'barfy!' });
    const createStoreWithMiddleware = applyMiddleware(socketIoMiddleware)(createStore);
    const store = createStoreWithMiddleware(simpleReducer);

    store.dispatch({ type: 'server/socketAction1', payload: 'action1' });
    store.dispatch({ type: 'action2', payload: 'action2' });

    expect(store.getState().socketAction1).toBe('action1');
    expect(store.getState().action2).toBe('action2');
    expect(socket.emitted.length).toBe(1);
    expect(socket.emitted[0][0]).toBe('barfy!');
    expect(socket.emitted[0][1].type).toBe('server/socketAction1');
    expect(socket.emitted[0][1].payload).toBe('action1');
  });

  test('Using optimistic update', () => {
    const socket = new MockSocket();

    const socketIoMiddleware = createSocketIoMiddleware(socket, 'server/',
      { optimistic: true });
    const createStoreWithMiddleware = applyMiddleware(socketIoMiddleware)(createStore);
    const store = createStoreWithMiddleware(simpleReducer);

    store.dispatch({ type: 'server/action2', payload: 'action2' });

    expect(store.getState().action2).toBe('action2');
    expect(socket.emitted.length).toBe(1);
    expect(socket.emitted[0][0]).toBe('action');
    expect(socket.emitted[0][1].type).toBe('server/action2');
    expect(socket.emitted[0][1].payload).toBe('action2');
  });

  test('Using optimistic update with prefixes array', () => {
    const socket = new MockSocket();

    const socketIoMiddleware = createSocketIoMiddleware(socket, ['server/', 'srv/'],
      { optimistic: true });
    const createStoreWithMiddleware = applyMiddleware(socketIoMiddleware)(createStore);
    const store = createStoreWithMiddleware(simpleReducer);

    store.dispatch({ type: 'server/action2', payload: 'action2' });
    store.dispatch({ type: 'srv/action3', payload: 'action3' });

    expect(store.getState().action2).toBe('action2');
    expect(store.getState().action3).toBe('action3');
    expect(socket.emitted.length).toBe(2);
    expect(socket.emitted[0][0]).toBe('action');
    expect(socket.emitted[0][1].type).toBe('server/action2');
    expect(socket.emitted[0][1].payload).toBe('action2');
    expect(socket.emitted[1][0]).toBe('action');
    expect(socket.emitted[1][1].type).toBe('srv/action3');
    expect(socket.emitted[1][1].payload).toBe('action3');
  });

  test('Using custom optimistic update', () => {
    const socket = new MockSocket();

    const serverPostfix = /\/server/;

    function callSocketTestFn(type) {
      return type.match(serverPostfix);
    }

    function slicePostfix(type) {
      return type.replace(serverPostfix, '');
    }

    const socketIoMiddleware = createSocketIoMiddleware(socket, callSocketTestFn,
      { optimistic: slicePostfix });
    const createStoreWithMiddleware = applyMiddleware(socketIoMiddleware)(createStore);
    const store = createStoreWithMiddleware(simpleReducer);

    store.dispatch({ type: 'action2/server', payload: 'action2' });

    expect(store.getState().action2).toBe('action2');
    expect(socket.emitted.length).toBe(1);
    expect(socket.emitted[0][0]).toBe('action');
    expect(socket.emitted[0][1].type).toBe('action2/server');
    expect(socket.emitted[0][1].payload).toBe('action2');
  });

  test('Swallowing action with "emit: false"', () => {
    const socket = new MockSocket();

    const socketIoMiddleware = createSocketIoMiddleware(socket, 'server/',
      { emit: false });
    const createStoreWithMiddleware = applyMiddleware(socketIoMiddleware)(createStore);
    const store = createStoreWithMiddleware(simpleReducer);

    const before = store.getState();

    store.dispatch({ type: 'server/someRandomAction', payload: 'foo' });

    expect(store.getState()).toBe(before);
    expect(socket.emitted.length).toBe(1);
  });
});

function simpleReducer(state = {}, action) {
  switch (action.type) {
    case 'server/socketAction1':
      return Object.assign({}, state, {
        socketAction1: action.payload,
      });
    case 'action2':
      return Object.assign({}, state, {
        action2: action.payload,
      });
    case 'action3':
      return Object.assign({}, state, {
        action3: action.payload,
      });
    default:
      return state;
  }
}
