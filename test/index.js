import { createStore, applyMiddleware } from 'redux';
import expect, { createSpy } from 'expect';
import createSocketIoMiddleware from '../dist/index.js';

class MockSocket {
  constructor() {
    this.emitted = [];
  }
  emit(...args) {
    this.emitted.push(args);
  }
  on() { // eslint-disable-line class-methods-use-this
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
    const socketIoMiddleware = createSocketIoMiddleware(socket,
      ['server/socketAction1', 'action2']);
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

  test('Using an alternate execute function', () => {
    const socket = new MockSocket();
    const spy = createSpy();
    const socketIoMiddleware = createSocketIoMiddleware(socket, 'server/', { execute: spy });
    const createStoreWithMiddleware = applyMiddleware(socketIoMiddleware)(createStore);
    const store = createStoreWithMiddleware(simpleReducer);

    const action1 = { type: 'server/socketAction1', payload: 'action1' };
    store.dispatch(action1);
    store.dispatch({ type: 'action2', payload: 'action2' });

    expect(spy.calls.length).toBe(1);
    expect(spy.calls[0].arguments.length).toBe(4);
    expect(spy.calls[0].arguments[0]).toBe(action1);
    expect(spy.calls[0].arguments[1]).toBeA('function');
    expect(spy.calls[0].arguments[2]).toBeA('function');
    expect(spy.calls[0].arguments[3]).toBeA('function');
  });

  test('Using an alternate execute function keeps closure on socket.emit', () => {
    const socket = new MockSocket();
    const socketIoMiddleware = createSocketIoMiddleware(socket, 'server/');
    const createStoreWithMiddleware = applyMiddleware(socketIoMiddleware)(createStore);
    const store = createStoreWithMiddleware(simpleReducer);

    const action1 = { type: 'server/socketAction1', payload: 'action1' };
    store.dispatch(action1);
    store.dispatch({ type: 'action2', payload: 'action2' });
    expect(socket.emitted.length).toBe(1);
  });
});

suite('Better chainability', () => {
  const socket = new MockSocket();
  const socketIoMiddleware = createSocketIoMiddleware(socket, 'server/');
  const doDispatch = () => {};
  const doGetState = () => {};
  const nextHandler = socketIoMiddleware({ dispatch: doDispatch, getState: doGetState });

  // https://github.com/itaylor/redux-socket.io/pull/17
  test('Support functions as actions', () => {
    const actionAsFunction = () => {};
    const next = () => {};
    const actionHandler = nextHandler(next);
    expect(() => actionHandler(actionAsFunction)).toNotThrow();
  });

  test('Return the return value of next', () => {
    const expected = 'value';
    const next = action => action.payload;
    const actionHandler = nextHandler(next);
    const action = { type: 'test', payload: expected };
    expect(actionHandler(action)).toEqual(expected);
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
