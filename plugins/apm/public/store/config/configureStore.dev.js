import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import throttle from '../middleware/throttle';
import rootReducer from '../rootReducer';

export default function configureStore(preloadedState) {
  const composeEnhancers =
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose; // eslint-disable-line

  const store = createStore(
    rootReducer,
    preloadedState,
    composeEnhancers(applyMiddleware(throttle, thunk))
  );

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('../reducers', () => {
      const nextRootReducer = require('../reducers').default; // eslint-disable-line
      store.replaceReducer(nextRootReducer);
    });
  }

  return store;
}
