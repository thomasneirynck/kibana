import { BaseAction } from './base_action';
import { ACTION_TYPES } from '../../../common/constants';

export class LoggingAction extends BaseAction {
  constructor(props) {
    props.type = ACTION_TYPES.LOGGING;
    super(props);

    this.text = props.text;
  }

  // To Kibana
  get downstreamJSON() {
    const result = super.downstreamJSON;
    Object.assign(result, {
      text: this.text
    });

    return result;
  }

  // From Kibana
  static fromDownstreamJSON(json) {
    const props = super.getPropsFromDownstreamJSON(json);

    Object.assign(props, {
      text: json.text
    });

    return new LoggingAction(props);
  }

  // To Elasticsearch
  get upstreamJSON() {
    const result = super.upstreamJSON;

    result[this.id] = {
      logging: {
        text: this.text
      }
    };

    return result;
  }

  // From Elasticsearch
  static fromUpstreamJSON(json) {
    const props = super.getPropsFromUpstreamJSON(json);

    if (!json.actionJson.logging) {
      throw new Error('json argument must contain an actionJson.logging property');
    }
    if (!json.actionJson.logging.text) {
      throw new Error('json argument must contain an actionJson.logging.text property');
    }

    Object.assign(props, {
      text: json.actionJson.logging.text
    });

    return new LoggingAction(props);
  }

  /*
  json.actionJson should have the following structure:
  {
    "logging" : {
      "text" : "executed at {{ctx.execution_time}}",
      ["category" : "xpack.watcher.actions.logging",]
      ["level" : "info"]
    }
  }
  */
};
