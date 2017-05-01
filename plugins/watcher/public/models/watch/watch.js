import { getSearchValue } from 'plugins/watcher/lib/get_search_value';
import { get, pick, isEmpty, isEqual } from 'lodash';
import { Action } from '../action';
import { WatchStatus } from '../watch_status';

export class Watch {
  /**
   * Watch model constructor
   *
   * @param {object} props An object used to instantiate a watch instance
   * @param {string} props.id Id of the watch
   * @param {string} props.name Optional name for the watch
   * @param {object} props.watch Watch definition
   * @param {object} props.watchStatus WatchStatus definition
   * @param {array} props.actions Action definitions
   */
  constructor(props = {}) {
    this.id = get(props, 'id');
    this.isNew = isEmpty(this.id);

    this.name = get(props, 'name', '');
    this.watch = get(props, 'watch', {});
    this.isSystemWatch = Boolean(get(props, 'isSystemWatch'));
    this.watchStatus = WatchStatus.fromUpstreamJSON(get(props, 'watchStatus'));

    const actions = get(props, 'actions', []);
    this.actions = actions.map(Action.fromUpstreamJSON);
  }

  updateWatchStatus = watchStatus => {
    this.watchStatus = watchStatus;
  }

  get displayName() {
    return this.name ? this.name : this.id;
  }

  get searchValue() {
    return getSearchValue(this, ['id', 'name']);
  }

  get upstreamJSON() {
    return pick(this, [ 'id', 'watch', 'name' ]);
  }

  static fromUpstreamJSON(upstreamWatch) {
    return new Watch(upstreamWatch);
  }

  isEqualTo = (otherWatch) => {
    // Used to do any cleanup to the watch objects in order to properly
    // compare them in isEqual call below
    function simplify(watch) {
      // We need to create a POJO copy because isEqual would return false
      // because of property getters
      return Object.assign({}, watch);
    }

    return isEqual(simplify(this), simplify(otherWatch));
  }
};
