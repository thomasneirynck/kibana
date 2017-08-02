import { get, map, pick } from 'lodash';
import { Action } from '../action';
import { WatchStatus } from '../watch_status';

export class BaseWatch {
  // This constructor should not be used directly.
  // JsonWatch objects should be instantiated using the
  // fromUpstreamJson and fromDownstreamJson static methods
  constructor(props) {
    this.id = props.id;
    this.name = props.name;
    this.type = props.type;

    this.isSystemWatch = false;

    this.watchStatus = props.watchStatus;
    this.actions = props.actions;
  }

  get watchJSON() {
    const result = {
      metadata: {
        xpack: {
          type: this.type
        }
      }
    };

    if (this.name) {
      result.metadata.name = this.name;
    }

    return result;
  }

  getVisualizeQuery() {
    return {};
  }

  formatVisualizeData() {
    return [];
  }

  // to Kibana
  get downstreamJSON() {
    const json = {
      id: this.id,
      name: this.name,
      type: this.type,
      isSystemWatch: this.isSystemWatch,
      watchStatus: this.watchStatus ? this.watchStatus.downstreamJSON : undefined,
      actions: map(this.actions, (action) => action.downstreamJSON)
    };

    return json;
  }

  // to Elasticsearch
  get upstreamJSON() {
    const watch = this.watchJSON;

    return {
      id: this.id,
      watch
    };
  }

  // from Kibana
  static getPropsFromDownstreamJSON(json) {
    const actions = map(json.actions, action => {
      return Action.fromDownstreamJSON(action);
    });

    return {
      id: json.id,
      name: json.name,
      actions
    };
  }

  // from Elasticsearch
  static getPropsFromUpstreamJSON(json) {
    if (!json.id) {
      throw new Error('json argument must contain an id property');
    }
    if (!json.watchJson) {
      throw new Error('json argument must contain a watchJson property');
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

    const watchStatus = WatchStatus.fromUpstreamJSON({
      id,
      watchStatusJson
    });

    return {
      id,
      name,
      watchJson,
      watchStatus,
      actions
    };
  }
};
