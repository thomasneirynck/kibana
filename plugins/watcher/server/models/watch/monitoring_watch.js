import { merge } from 'lodash';
import { BaseWatch } from './base_watch';
import { WATCH_TYPES } from '../../../common/constants';

export class MonitoringWatch extends BaseWatch {
  // This constructor should not be used directly.
  // JsonWatch objects should be instantiated using the
  // fromUpstreamJson and fromDownstreamJson static methods
  constructor(props) {
    super(props);

    this.isSystemWatch = true;
  }

  get watchJson() {
    const result = merge(
      {},
      super.watchJson
    );

    return result;
  }

  getVisualizeQuery() {
    throw new Error('getVisualizeQuery called for monitoring watch');
  }

  formatVisualizeData() {
    throw new Error('formatVisualizeData called for monitoring watch');
  }

  // To Elasticsearch
  get upstreamJson() {
    throw new Error('upstreamJson called for monitoring watch');
  }

  // To Kibana
  get downstreamJson() {
    const result = merge(
      {},
      super.downstreamJson
    );

    return result;
  }

  // From Elasticsearch
  static fromUpstreamJson(json) {
    const props = merge(
      {},
      super.getPropsFromUpstreamJson(json),
      {
        type: WATCH_TYPES.MONITORING
      }
    );

    return new MonitoringWatch(props);
  }

  // From Kibana
  static fromDownstreamJson() {
    throw new Error('fromDownstreamJson called for monitoring watch');
  }

}
