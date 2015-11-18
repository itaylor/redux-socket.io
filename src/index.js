/**
* Allows you to register actions that when dispatched, send the action to the server via a socket.io socket.
*/
export default function createSocketIoMiddleware(socket, actionTypesOrTestFnOrPrefix = []){

  return store => {
    //Wire socket.io to dispatch actions sent by the server.
    socket.on('action', store.dispatch);

    const optionType = typeof actionTypesOrTestFnOrPrefix;

    return next => action => {
      const {type} = action;
      const result = next(action);

      if(type){
        let emit = false;
        // String Prefix
        if (optionType === 'string' && (type.indexOf(actionTypesOrTestFnOrPrefix) === 0)){
          emit = true;
        }
        // test function
        else if(optionType === 'function' && actionTypesOrTestFnOrPrefix(type)){
          emit = true;
        }
        // Array of types
        else if(Array.isArray(actionTypesOrTestFnOrPrefix) && (actionTypesOrTestFnOrPrefix.indexOf(type) !== -1)){
          emit = true;
        }

        if(emit){
          socket.emit(type, action);
        }
      }
      return result;
    }
  }
}
