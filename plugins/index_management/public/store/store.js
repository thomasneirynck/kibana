import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';

import { indexManagement } from './reducers/';

export const indexManagementStore = (initialState = {}) => {
  const enhancers = [ applyMiddleware(thunk) ];

  window.__REDUX_DEVTOOLS_EXTENSION__ && enhancers.push(window.__REDUX_DEVTOOLS_EXTENSION__());
  return createStore(
    indexManagement,
    initialState,
    compose(...enhancers)
  );
};
