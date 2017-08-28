import React, { Component } from 'react';
import Trace from './Trace';
import { get } from 'lodash';
import { TRACE_ID } from '../../../../../../common/constants';
import { STATUS } from '../../../../../constants';

function loadTraces(props) {
  const { appName, start, end, transactionId } = props.urlParams;
  if (appName && start && end && transactionId && !props.tracesNext.status) {
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
    const { traces } = this.props;
    if (traces.status !== STATUS.SUCCESS) {
      return null;
    }

    return (
      <div>
        {traces.data.traces.map(trace => (
          <Trace
            key={get({ trace }, TRACE_ID)}
            trace={trace}
            totalDuration={traces.data.duration}
            isSelected={
              get({ trace }, TRACE_ID) === this.props.urlParams.traceId
            }
          />
        ))}
      </div>
    );
  }
}

export default Traces;
