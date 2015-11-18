/**
* Allows you to register actions that when dispatched, send the action to the server via a socket.io socket.
*/
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = createSocketIoMiddleware;

function createSocketIoMiddleware(socket) {
  var actionTypesOrTestFnOrPrefix = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

  return function (store) {
    //Wire socket.io to dispatch actions sent by the server.
    socket.on('action', store.dispatch);

    var optionType = typeof actionTypesOrTestFnOrPrefix;

    return function (next) {
      return function (action) {
        var type = action.type;

        var result = next(action);

        if (type) {
          var emit = false;
          // String Prefix
          if (optionType === 'string' && type.indexOf(actionTypesOrTestFnOrPrefix) === 0) {
            emit = true;
          }
          // test function
          else if (optionType === 'function' && actionTypesOrTestFnOrPrefix(type)) {
              emit = true;
            }
            // Array of types
            else if (Array.isArray(actionTypesOrTestFnOrPrefix) && actionTypesOrTestFnOrPrefix.indexOf(type) !== -1) {
                emit = true;
              }

          if (emit) {
            socket.emit(type, action);
          }
        }
        return result;
      };
    };
  };
}

module.exports = exports['default'];