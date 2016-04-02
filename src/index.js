
/**
* Allows you to register actions that when dispatched, send the action to the
* server via a socket.io socket.
* `option` may be an array of action types, a test function, or a string prefix.
*/
export default function createSocketIoMiddleware(socket, option = [],
  { eventName = 'action', optimistic = false, emit = true } = {}) {
  return ({ dispatch }) => {
    // Wire socket.io to dispatch actions sent by the server.
    socket.on(eventName, dispatch);

    let dispatchOptimisticAction = optimistic;
    let match;
    let slice;

    // Test function
    if (typeof option === 'function') {
      match = option;
      dispatchOptimisticAction = false;

      // Optimistic updates only possible with custom slice method
      if (typeof optimistic === 'function') {
        slice = optimistic;
        dispatchOptimisticAction = true;
      }
    }

    // String prefix or Array of String prefixes
    if (typeof option === 'string' || Array.isArray(option)) {
      const matches = type => prefix => type.indexOf(prefix) === 0;
      const prefixes = [].concat(option);

      match = (type) => prefixes.some(matches(type));

      slice = (type) => {
        const prefixIndex = prefixes.findIndex(matches(type));

        if (prefixIndex === -1) {
          return type;
        }

        const prefix = prefixes[prefixIndex];

        return type.replace(prefix, '');
      };
    }

    return next => action => {
      const { type } = action;

      if (!type || !match(type, action)) {
        return next(action);
      }

      socket.emit(eventName, action);

      if (!emit) {
        return false;
      }

      if (dispatchOptimisticAction) {
        const nextAction = Object.assign({}, action, { type: slice(type) });
        return dispatch(nextAction);
      }

      return next(action);
    };
  };
}
