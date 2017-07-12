import { isEmpty, cloneDeep, has } from 'lodash';
import { BaseWatch } from './base_watch';
import { WATCH_TYPES } from '../../../common/constants';

export class JsonWatch extends BaseWatch {
  constructor(props) {
    props.type = WATCH_TYPES.JSON;
    super(props);

    this.watch = props.watch;
    this.watchJson = props.watchJson;
  }

  get watchJSON() {
    return this.watch;
  }

  get downstreamJSON() {
    const result = super.downstreamJSON;
    Object.assign(result, {
      watch: this.watch
    });

    return result;
  }

  static fromUpstreamJSON(json) {
    const props = super.getPropsFromUpstreamJSON(json);

    const watch = cloneDeep(props.watchJson);

    if (has(watch, 'metadata.name')) {
      delete watch.metadata.name;
    }

    if (isEmpty(watch.metadata)) {
      delete watch.metadata;
    }

    Object.assign(props, {
      watch
    });

    return new JsonWatch(props);
  }

  // generate Watch object from kibana response
  static fromDownstreamJSON(json) {
    const props = super.getPropsFromDownstreamJSON(json);

    Object.assign(props, {
      watch: json.watch
    });

    return new JsonWatch(props);
  }

};
