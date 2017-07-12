import { BaseWatch } from './base_watch';
import { WATCH_TYPES } from '../../../common/constants';

export class MonitoringWatch extends BaseWatch {
  constructor(props) {
    props.type = WATCH_TYPES.MONITORING;
    super(props);

    this.isSystemWatch = true;
  }

  get watchJSON() {
    return {};
  }

  get downstreamJSON() {
    const result = super.downstreamJSON;

    return result;
  }

  static fromUpstreamJSON(json) {
    const props = super.getPropsFromUpstreamJSON(json);

    return new MonitoringWatch(props);
  }

};
