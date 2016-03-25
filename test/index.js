import { createStore, applyMiddleware } from 'redux';
import createSocketIoMiddleware from '../dist/index.js';
import expect from 'expect';

class MockSocket {
    constructor() {
        this.emitted = [];
        this.listeners = {};
    }

    emit(...args) {
        this.emitted.push(args);
    }

    on(event, action) {
        if(!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(action);
    }

    _emulateEmit(event, payload) {
        if(this.listeners[event]) {
            this.listeners[event].forEach(listener => listener(payload));
        }
    }
}

suite('Redux-socket.io middleware basic tests', () => {
    test('Determine whether to call socket', () => {
        const socket = new MockSocket();
        const socketIoMiddleware = createSocketIoMiddleware(socket, 'fromServer/', 'toServer/');
        const createStoreWithMiddleware = applyMiddleware(socketIoMiddleware)(createStore);
        const store = createStoreWithMiddleware(simpleReducer);

        store.dispatch({type: 'toServer/socketAction1', payload: 'action1'});
        store.dispatch({type: 'action2', payload: 'action2'});

        expect(store.getState().action2).toBe('action2');
        expect(socket.emitted.length).toBe(1);
        expect(socket.emitted[0][0]).toBe('socketAction1');
        expect(socket.emitted[0][1]).toBe('action1');
    });

    test('Ensure message emitted from socket is dispatched', () => {
        const socket = new MockSocket();
        const socketIoMiddleware = createSocketIoMiddleware(socket, 'fromServer/', 'toServer/', ['fromServer/socketAction1']);
        const createStoreWithMiddleware = applyMiddleware(socketIoMiddleware)(createStore);
        const store = createStoreWithMiddleware(simpleReducer);

        socket._emulateEmit('socketAction1', 'action1');
        socket._emulateEmit('socketAction2', 'action2');

        expect(store.getState()['fromServer/socketAction1']).toBe('action1');
        expect(store.getState()['fromServer/socketAction2']).toBe(undefined);
    });

    test('Ensure default config', () => {
        const socket = new MockSocket();
        const socketIoMiddleware = createSocketIoMiddleware(socket);
        const createStoreWithMiddleware = applyMiddleware(socketIoMiddleware)(createStore);
        const store = createStoreWithMiddleware(simpleReducer);

        socket._emulateEmit('action', 'action1');
        store.dispatch({type: 'toSocket/action2', payload: 'action2'});

        expect(store.getState()['fromSocket/action']).toBe('action1');
        expect(socket.emitted.length).toBe(1);
        expect(socket.emitted[0][0]).toBe('action2');
        expect(socket.emitted[0][1]).toBe('action2');
    });
});

function simpleReducer(state = {}, action) {
    return Object.assign({}, state, {
        [action.type]: action.payload
    });
}
