import { isEmpty, cloneDeep, has, merge } from 'lodash';
import { BaseWatch } from './base_watch';
import { WATCH_TYPES } from '../../../common/constants';

export class JsonWatch extends BaseWatch {
  // This constructor should not be used directly.
  // JsonWatch objects should be instantiated using the
  // fromUpstreamJson and fromDownstreamJson static methods
  constructor(props) {
    super(props);

    this.watch = props.watch;
    this.watchJson = props.watchJson;
  }

  get watchJSON() {
    const result = merge(
      {},
      super.watchJSON,
      this.watch
    );

    return result;
  }

  // To Elasicsearch
  get upstreamJSON() {
    const result = super.upstreamJSON;
    return result;
  }

  // To Kibana
  get downstreamJSON() {
    const result = merge(
      {},
      super.downstreamJSON,
      {
        watch: this.watch
      }
    );

    return result;
  }

  // From Elasticsearch
  static fromUpstreamJSON(json) {
    const baseProps = super.getPropsFromUpstreamJSON(json);
    const watch = cloneDeep(baseProps.watchJson);

    if (has(watch, 'metadata.name')) {
      delete watch.metadata.name;
    }
    if (has(watch, 'metadata.xpack')) {
      delete watch.metadata.xpack;
    }

    if (isEmpty(watch.metadata)) {
      delete watch.metadata;
    }

    const props = merge(
      {},
      baseProps,
      {
        type: WATCH_TYPES.JSON,
        watch
      }
    );

    return new JsonWatch(props);
  }

  // From Kibana
  static fromDownstreamJSON(json) {
    const props = merge(
      {},
      super.getPropsFromDownstreamJSON(json),
      {
        type: WATCH_TYPES.JSON,
        watch: json.watch
      }
    );

    return new JsonWatch(props);
  }

};
