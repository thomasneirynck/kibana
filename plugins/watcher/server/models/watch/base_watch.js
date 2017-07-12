import { get, set, isEmpty, map, pick } from 'lodash';
import { Action } from '../action';
import { WatchStatus } from '../watch_status';

export class BaseWatch {
  constructor(props) {
    this.id = props.id;
    this.name = props.name;
    this.type = props.type;
    this.isSystemWatch = false;

    if (props.watchStatusJson) {
      this.watchStatus = WatchStatus.fromUpstreamJSON({
        id: this.id,
        watchStatusJson: props.watchStatusJson
      });
    }

    this.actions = props.actions;
  }

  // Should be overridden by the extended class.
  get watchJSON() {
    return {};
  }

  getVisualizeQuery() {
    return {};
  }

  formatVisualizeData() {
    return [];
  }

  // generate object to send to kibana
  get downstreamJSON() {
    const json = {
      id: this.id,
      name: this.name,
      watch: this.watch,
      isSystemWatch: this.isSystemWatch,
      watchStatus: this.watchStatus ? this.watchStatus.downstreamJSON : undefined,
      actions: map(this.actions, (action) => action.downstreamJSON),
      type: this.type
    };

    return json;
  }

  // generate object to send to elasticsearch
  get upstreamJSON() {
    const watch = this.watchJSON;

    if (!isEmpty(this.name)) {
      set(watch, 'metadata.name', this.name);
    }
    set(watch, 'metadata.xpack.type', this.type);

    return {
      id: this.id,
      watch
    };
  }

  // generate Watch object from kibana response
  static getPropsFromDownstreamJSON(json) {
    const actions = map(json.actions, action => {
      return Action.fromDownstreamJSON(action);
    });

    return {
      id: json.id,
      name: json.name,
      type: json.type,
      actions
    };
  }

  static getPropsFromUpstreamJSON(json) {
    if (!json.id) {
      throw new Error('json argument must contain a id property');
    }
    if (!json.watchStatusJson) {
      throw new Error('json argument must contain a watchStatusJson property');
    }

    const id = json.id;
    const watchJson = pick(json.watchJson, [
      'trigger',
      'input',
      'condition',
      'actions',
      'metadata',
      'transform',
      'throttle_period',
      'throttle_period_in_millis'
    ]);
    const watchStatusJson = json.watchStatusJson;
    const name = get(watchJson, 'metadata.name');

    const actionsJson = get(watchJson, 'actions', {});
    const actions = map(actionsJson, (actionJson, actionId) => {
      return Action.fromUpstreamJSON({ id: actionId, actionJson });
    });

    return {
      id,
      name,
      watchJson,
      watchStatusJson,
      actions
    };
  }
};
