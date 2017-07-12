import { BaseAction } from './base_action';
import { ACTION_TYPES } from '../../../common/constants';

export class UnknownAction extends BaseAction {
  constructor(props) {
    props.type = ACTION_TYPES.UNKNOWN;
    super(props);

    this.actionJson = props.actionJson;
  }

  // To Kibana
  get downstreamJSON() {
    const result = super.downstreamJSON;

    Object.assign(result, {
      actionJson: this.actionJson
    });

    return result;
  }

  // From Kibana
  static fromDownstreamJSON(json) {
    const props = super.getPropsFromDownstreamJSON(json);

    Object.assign(props, {
      actionJson: json.actionJson
    });

    return new UnknownAction(props);
  }

  // To Elasticsearch
  get upstreamJSON() {
    const result = super.upstreamJSON;

    result[this.id] = this.actionJson;

    return result;
  }

  // From Elasticsearch
  static fromUpstreamJSON(json) {
    const props = super.getPropsFromUpstreamJSON(json);

    if (!json.actionJson) {
      throw new Error('json argument must contain an actionJson property');
    }

    Object.assign(props, {
      actionJson: json.actionJson
    });

    return new UnknownAction(props);
  }

  /*
  json.actionJson should have the following structure:
  NOTE: The structure will actually vary considerably from type to type.
  {
    "logging": {
      ...
    }
  }
  */
};
