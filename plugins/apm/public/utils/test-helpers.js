import configureStore from '../store/config/configureStore';
import PropTypes from 'prop-types';
import createHistory from 'history/createHashHistory';

export function getMockedStoreAndRouter() {
  const store = configureStore();
  const history = createHistory();

  return {
    context: { store, router: { history, route: { location: {} } } },
    childContextTypes: {
      store: PropTypes.object.isRequired,
      router: PropTypes.object.isRequired
    }
  };
}
