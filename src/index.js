/**
* Allows you to register actions that when dispatched, send the action to the server via a socket.io socket.
* `option` may be an array of action types, a test function, or a string prefix.
*/
export default function createSocketIoMiddleware(socket, option = [], {eventName = 'action'} = {}){
  return ({dispatch}) => {
    // Wire socket.io to dispatch actions sent by the server.
    socket.on(eventName, dispatch);

    return next => action => {
      const {type} = action;

      if (type) {
        let emit = false;

        // String prefix
        if (typeof option === 'string') {
          emit = type.indexOf(option) === 0;
        }
        // Test function
        else if (typeof option === 'function') {
          emit = option(type);
        }
        // Array of types
        else if (Array.isArray(option)) {
          emit = option.indexOf(type) !== -1;
        }

        if(emit){
          socket.emit(eventName, action);
        }
      }

      return next(action);
    }
  }
}
