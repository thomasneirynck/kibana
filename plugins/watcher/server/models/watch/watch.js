import { set } from 'lodash';
import { WATCH_TYPES } from '../../../common/constants';
import { JsonWatch } from './json_watch';
import { MonitoringWatch } from './monitoring_watch';
import { ThresholdWatch } from './threshold_watch';
import { getWatchType } from './lib/get_watch_type';

const WatchTypes = {};
set(WatchTypes, WATCH_TYPES.JSON, JsonWatch);
set(WatchTypes, WATCH_TYPES.MONITORING, MonitoringWatch);
set(WatchTypes, WATCH_TYPES.THRESHOLD, ThresholdWatch);

export class Watch {
  static getWatchTypes = () => {
    return WatchTypes;
  }

  // from Kibana
  static fromDownstreamJSON(json) {
    if (!json.type) {
      throw new Error('json argument must contain an type property');
    }

    const WatchType = WatchTypes[json.type];
    if (!WatchType) {
      throw new Error(`Attempted to load unknown type ${json.type}`);
    }

    return WatchType.fromDownstreamJSON(json);
  }

  // from Elasticsearch
  static fromUpstreamJSON(json) {
    if (!json.watchJson) {
      throw new Error('json argument must contain a watchJson property');
    }

    const type = getWatchType(json.watchJson);
    const WatchType = WatchTypes[type];

    return WatchType.fromUpstreamJSON(json);
  }
};
