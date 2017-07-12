import { get } from 'lodash';
import { BaseAction } from './base_action';

export class UnknownAction extends BaseAction {
  constructor(props = {}) {
    super(props);

    this.actionJson = get(props, 'actionJson');
  }

  get upstreamJSON() {
    const result = super.upstreamJSON;

    Object.assign(result, {
      actionJson: this.actionJson
    });

    return result;
  }

  static fromUpstreamJSON(upstreamAction) {
    return new UnknownAction(upstreamAction);
  }
};
