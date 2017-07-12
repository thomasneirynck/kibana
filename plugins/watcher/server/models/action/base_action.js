export class BaseAction {
  constructor(props) {
    this.id = props.id;
    this.type = props.type;
  }

  get downstreamJSON() {
    const result = {
      id: this.id,
      type: this.type
    };

    return result;
  }

  get upstreamJSON() {
    const result = {};
    return result;
  }

  static getPropsFromDownstreamJSON(json) {
    return {
      id: json.id
    };
  }

  static getPropsFromUpstreamJSON(json) {
    if (!json.id) {
      throw new Error('json argument must contain an id property');
    }

    return {
      id: json.id
    };
  }
};
