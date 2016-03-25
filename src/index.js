/**
 * Allows you to register actions that when dispatched, send the action to the
 * server via a socket.io socket.
 * `option` may be an array of action types, a test function, or a string prefix.
 */
export default function createSocketIoMiddleware(socket,
                                                 fromSocketAction = 'fromSocket/',
                                                 toSocketAction = 'toSocket/',
                                                 eventsToListen = ['fromSocket/action']) {
  return ({ dispatch }) => {
    // Wire socket.io to dispatch actions sent by the server.
    eventsToListen.forEach(eventName => {
      const fromSocketEvent = eventName.substr(fromSocketAction.length);
      socket.on(fromSocketEvent, data => {
        dispatch({
          type: eventName,
          payload: data
        });
      });
    });

    return next => action => {
      const type = action.type;
      const payload = action.payload;

      if (type.startsWith(toSocketAction)) {
        const toSocketEvent = type.substr(toSocketAction.length);
        socket.emit(toSocketEvent, payload);
      }

      return next(action);
    };
  };
}
