import React, { Component } from 'react';
import styled from 'styled-components';
import Trace from './Trace';
import { get, zipObject } from 'lodash';
import { TRACE_ID } from '../../../../../../common/constants';
import { STATUS } from '../../../../../constants';
import Legend from '../../../../shared/charts/Legend';
import { colors, units, px } from '../../../../../style/variables';

const Container = styled.div`
  transition: 0.1s padding ease;
  padding-bottom: ${props => px(props.paddingBottom)};
`;

function loadTraces(props) {
  const { appName, start, end, transactionId } = props.urlParams;
  if (appName && start && end && transactionId && !props.tracesNext.status) {
    props.loadTraces({ appName, start, end, transactionId });
  }
}

function getPaddingBottom(traces, urlParams) {
  const selectedIndex = traces.findIndex(
    trace => get({ trace }, TRACE_ID) === urlParams.traceId
  );
  const selectedPos = traces.length - selectedIndex - 1;
  return selectedIndex > -1 ? 65 * units.half - selectedPos * 70 : 0;
}

function getColorByType(types) {
  const colorTypes = zipObject(types, [colors.red, colors.teal, colors.blue]);
  return type => colorTypes[type];
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

    const paddingBottom = getPaddingBottom(
      traces.data.traces,
      this.props.urlParams
    );

    const traceTypes = traces.data.traceTypes.map(({ type }) => type);
    const getColor = getColorByType(traceTypes);

    return (
      <Container paddingBottom={paddingBottom}>
        {traceTypes.map(type => (
          <Legend key={type} color={getColor(type)} text={type} />
        ))}

        {traces.data.traces.map(trace => (
          <Trace
            key={get({ trace }, TRACE_ID)}
            color={getColor(trace.type)}
            trace={trace}
            totalDuration={traces.data.duration}
            isSelected={
              get({ trace }, TRACE_ID) === this.props.urlParams.traceId
            }
          />
        ))}
      </Container>
    );
  }
}

export default Traces;
