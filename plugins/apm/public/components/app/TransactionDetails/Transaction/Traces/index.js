import React, { Component } from 'react';
import Trace from './Trace';
import { get } from 'lodash';
import { TRACE_ID } from '../../../../../../common/constants';

function loadTraces(props) {
  const { appName, start, end, transactionId } = props.urlParams;
  if (appName && start && end && transactionId && !props.traces.status) {
    props.loadTraces({ appName, start, end, transactionId });
  }
}

class Traces extends Component {
  componentDidMount() {
    loadTraces(this.props);
  }

  componentWillReceiveProps(nextProps) {
    loadTraces(nextProps);
  }

  render() {
    const { totalDuration } = this.props;
    const traces = get(this.props.traces, 'data.traces');

    if (!traces) {
      return null;
    }

    return (
      <div>
        {traces.map(trace =>
          <Trace
            key={get({ trace }, TRACE_ID)}
            trace={trace}
            totalDuration={totalDuration}
            isSelected={
              get({ trace }, TRACE_ID) === this.props.urlParams.traceId
            }
          />
        )}
      </div>
    );
  }
}

export default Traces;
