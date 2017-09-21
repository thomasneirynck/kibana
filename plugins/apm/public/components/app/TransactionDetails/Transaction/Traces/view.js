import React, { PureComponent } from 'react';
import styled from 'styled-components';
import Trace from './Trace';
import { get, zipObject } from 'lodash';
import { TRACE_ID } from '../../../../../../common/constants';
import { STATUS } from '../../../../../constants';
import Legend from '../../../../shared/charts/Legend';
import { colors, units, px } from '../../../../../style/variables';
import { StickyContainer } from 'react-sticky';
import Timeline from '../../../../shared/charts/Timeline';

const Container = styled.div`
  transition: 0.1s padding ease;
  padding-bottom: ${props => px(props.paddingBottom)};
  position: relative;
`;

const LegendContainer = styled.div`display: flex;`;

const MARGINS = {
  top: 60,
  left: 50,
  right: 50,
  bottom: 0
};

class Traces extends PureComponent {
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

    const totalDuration = traces.data.duration;
    const traceContainerHeight = 53;
    const height = traceContainerHeight * traces.data.traces.length;

    const legends = (
      <LegendContainer>
        {traceTypes.map(type => (
          <Legend key={type} color={getColor(type)} text={type} />
        ))}
      </LegendContainer>
    );

    return (
      <Container paddingBottom={paddingBottom}>
        <StickyContainer>
          <Timeline
            legends={legends}
            duration={totalDuration}
            height={height}
            margins={MARGINS}
          />
          <div
            style={{
              paddingTop: MARGINS.top,
              paddingLeft: MARGINS.left,
              paddingRight: MARGINS.right
            }}
          >
            {traces.data.traces.map(trace => (
              <Trace
                key={get({ trace }, TRACE_ID)}
                color={getColor(trace.type)}
                trace={trace}
                totalDuration={totalDuration}
                isSelected={
                  get({ trace }, TRACE_ID) === this.props.urlParams.traceId
                }
              />
            ))}
          </div>
        </StickyContainer>
      </Container>
    );
  }
}

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
  const colorTypes = zipObject(types, [
    colors.red,
    colors.teal,
    colors.blue,
    colors.black
  ]);
  return type => colorTypes[type];
}

export default Traces;
