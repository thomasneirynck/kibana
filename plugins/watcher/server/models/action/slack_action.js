import { BaseAction } from './base_action';
import { ACTION_TYPES } from '../../../common/constants';

export class SlackAction extends BaseAction {
  constructor(props) {
    props.type = ACTION_TYPES.SLACK;
    super(props);

    this.to = props.to;
    this.text = props.text;
  }

  // To Kibana
  get downstreamJSON() {
    const result = super.downstreamJSON;
    Object.assign(result, {
      to: this.to,
      text: this.text
    });

    return result;
  }

  // From Kibana
  static fromDownstreamJSON(json) {
    const props = super.getPropsFromDownstreamJSON(json);

    Object.assign(props, {
      to: json.to,
      text: json.text
    });

    return new SlackAction(props);
  }

  // To Elasticsearch
  get upstreamJSON() {
    const result = super.upstreamJSON;

    result[this.id] = {
      slack: {
        message: {
          to: this.to,
          text: this.text
        }
      }
    };

    return result;
  }

  // From Elasticsearch
  static fromUpstreamJSON(json) {
    const props = super.getPropsFromUpstreamJSON(json);

    if (!json.actionJson.slack) {
      throw new Error('json argument must contain an actionJson.slack property');
    }
    if (!json.actionJson.slack.message) {
      throw new Error('json argument must contain an actionJson.slack.message property');
    }
    if (!json.actionJson.slack.message.to) {
      throw new Error('json argument must contain an actionJson.slack.message.to property');
    }
    if (!json.actionJson.slack.message.text) {
      throw new Error('json argument must contain an actionJson.slack.message.text property');
    }

    Object.assign(props, {
      to: json.actionJson.slack.message.to,
      text: json.actionJson.slack.message.text
    });

    return new SlackAction(props);
  }

  /*
  json.actionJson should have the following structure:
  {
    "slack" : {
      "message" : {
        "to" : "#channel_name, @user"
        "text" : "executed at {{ctx.execution_time}}",
      }
    }
  }
  */
};
