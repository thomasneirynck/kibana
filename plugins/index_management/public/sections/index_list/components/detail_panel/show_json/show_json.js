import React from "react";
import { EuiCodeEditor } from "@elastic/eui";

export class ShowJson extends React.PureComponent {
  componentWillMount() {
    this.props.loadIndexData(this.props);
  }
  componentWillUpdate(newProps) {
    const { data, loadIndexData } = newProps;
    if (!data) {
      loadIndexData(newProps);
    }
  }
  render() {
    const { data } = this.props;
    if (!data) {
      return null;
    }
    const json = JSON.stringify(data, null, 2);
    return (
      <EuiCodeEditor
        mode="json"
        theme="github"
        isReadOnly
        setOptions={{ maxLines: Infinity }}
        value={json}
      />
    );
  }
}
