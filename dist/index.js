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
  var fromSocketAction = arguments.length <= 1 || arguments[1] === undefined ? 'fromSocket/' : arguments[1];
  var toSocketAction = arguments.length <= 2 || arguments[2] === undefined ? 'toSocket/' : arguments[2];
  var eventsToListen = arguments.length <= 3 || arguments[3] === undefined ? ['fromSocket/action'] : arguments[3];

  return function (_ref) {
    var dispatch = _ref.dispatch;

    // Wire socket.io to dispatch actions sent by the server.
    eventsToListen.forEach(function (eventName) {
      var fromSocketEvent = eventName.substr(fromSocketAction.length);
      socket.on(fromSocketEvent, function (data) {
        dispatch({
          type: eventName,
          payload: data
        });
      });
    });

    return function (next) {
      return function (action) {
        var type = action.type;
        var payload = action.payload;

        if (type.startsWith(toSocketAction)) {
          var toSocketEvent = type.substr(toSocketAction.length);
          socket.emit(toSocketEvent, payload);
        }

        return next(action);
      };
    };
  };
}