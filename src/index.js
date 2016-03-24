
/**
* Allows you to register actions that when dispatched, send the action to the
* server via a socket.io socket.
* `option` may be an array of action types, a test function, or a string prefix.
*/
export default function createSocketIoMiddleware(socket, option = [],
  { eventName = 'action' } = {}) {
  return ({ dispatch }) => {
    // Wire socket.io to dispatch actions sent by the server.
    socket.on(eventName, dispatch);

    return next => action => {
      const { type } = action;

      if (type) {
        let emit = false;

        if (typeof option === 'string') {
          // String prefix
          emit = type.indexOf(option) === 0;
        } else if (typeof option === 'function') {
          // Test function
          emit = option(type);
        } else if (Array.isArray(option)) {
          // Array of types
          emit = option.some((item) => type.indexOf(item) === 0);
        }

        if (emit) {
          socket.emit(eventName, action);
        }
      }

      return next(action);
    };
  };
}
