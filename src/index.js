
/**
* Allows you to register actions that when dispatched, send the action to the
* server via a socket.io socket.
* `criteria` may be a function (type, action) that returns true if you wish to send the
*  action to the server, array of action types, or a string prefix.
* the third parameter is an options object with the following properties:
* {
*   eventName,// a string name to use to send and receive actions from the server.
*   execute, // a function (action, emit, next, dispatch) that is responsible for
*            // sending the message to the server.
*   listeners, // an array contains a set of actions, which would be dispatch depened on
               // the receive action.type with arguments in action.arguments. 
               // ex: 'action/someAction' => dispatch 'someAction(action.arguments)'
* }
*
*/
export default function createSocketIoMiddleware(socket, criteria = [],
  { eventName = 'action', execute = defaultExecute, listeners = [] } = {}) {
  const emitBound = socket.emit.bind(socket);
  return ({ dispatch }) => {
    // Wire socket.io to dispatch actions sent by the server.
    socket.on(eventName, dispatchlisteners(dispatch));
    return next => (action) => {
      if (evaluate(action, criteria)) {
        return execute(action, emitBound, next, dispatch);
      }
      return next(action);
    };
  };

  function evaluate(action, option) {
    if (!action || !action.type) {
      return false;
    }

    const { type } = action;
    let matched = false;
    if (typeof option === 'function') {
      // Test function
      matched = option(type, action);
    } else if (typeof option === 'string') {
      // String prefix
      matched = type.indexOf(option) === 0;
    } else if (Array.isArray(option)) {
      // Array of types
      matched = option.some(item => type.indexOf(item) === 0);
    }
    return matched;
  }

  function defaultExecute(action, emit, next, dispatch) { // eslint-disable-line no-unused-vars
    emit(eventName, action);
    return next(action);
  }

  function dispatchlisteners(dispatch) {
    return function(action) {
      let typeArr = action.type.split('/');
      if (typeArr[0] !== 'action'){
        // dispatch action without prefix 'action/'
        return dispatch(action);
      }
      var matched;
      listeners.some(item => (
        (typeof item === 'function' && item.name === typeArr[1]) && (matched = item)
      ));
      if (!matched){
        console.log('No match action: ' + typeArr[1]);
        // dispatch action not matched action
        return dispatch(action);
      }
      return dispatch(matched.apply(undefined, action.arguments));
    }
  }
}
