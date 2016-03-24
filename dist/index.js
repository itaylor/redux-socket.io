'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createSocketIoMiddleware;

/**
* Allows you to register actions that when dispatched, send the action to the
* server via a socket.io socket.
* `option` may be an array of action types, a test function, or a string prefix.
*/
function createSocketIoMiddleware(socket) {
  var option = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

  var _ref = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

  var _ref$eventName = _ref.eventName;
  var eventName = _ref$eventName === undefined ? 'action' : _ref$eventName;

  return function (_ref2) {
    var dispatch = _ref2.dispatch;

    // Wire socket.io to dispatch actions sent by the server.
    socket.on(eventName, dispatch);

    return function (next) {
      return function (action) {
        var type = action.type;


        if (type) {
          var emit = false;

          if (typeof option === 'string') {
            // String prefix
            emit = type.indexOf(option) === 0;
          } else if (typeof option === 'function') {
            // Test function
            emit = option(type);
          } else if (Array.isArray(option)) {
            // Array of types
            emit = option.some(function (item) {
              return type.indexOf(item) === 0;
            });
          }

          if (emit) {
            socket.emit(eventName, action);
          }
        }

        return next(action);
      };
    };
  };
}