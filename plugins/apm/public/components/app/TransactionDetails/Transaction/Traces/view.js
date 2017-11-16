import React, { PureComponent } from 'react';
import styled from 'styled-components';
import { first, get, zipObject, difference, uniq } from 'lodash';
import Trace from './Trace';
import TimelineHeader from './TimelineHeader';
import { TRACE_ID } from '../../../../../../common/constants';
import { STATUS } from '../../../../../constants';
import { colors } from '../../../../../style/variables';
import { StickyContainer } from 'react-sticky';
import Timeline from '../../../../shared/charts/Timeline';
import EmptyMessage from '../../../../shared/EmptyMessage';

const Container = styled.div`
  transition: 0.1s padding ease;
  position: relative;
`;

const TIMELINE_HEADER_HEIGHT = 100;
const TIMELINE_MARGINS = {
  top: TIMELINE_HEADER_HEIGHT,
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

    if (traces.data.traces.length <= 0) {
      return (
        <EmptyMessage
          heading="No traces available for this transaction."
          subheading="Try selecting another transaction bucket above."
        />
      );
    }

    const traceTypes = uniq(
      traces.data.traceTypes.map(({ type }) => getPrimaryType(type))
    );
    const getTraceColor = getColorByType(traceTypes);

    const totalDuration = traces.data.duration;
    const traceContainerHeight = 58;
    const timelineHeight = traceContainerHeight * traces.data.traces.length;

    return (
      <Container>
        <StickyContainer>
          <Timeline
            header={
              <TimelineHeader
                legends={traceTypes.map(type => ({
                  label: getTraceLabel(type),
                  color: getTraceColor(type)
                }))}
                transactionName={this.props.urlParams.transactionName}
              />
            }
            duration={totalDuration}
            height={timelineHeight}
            timelineMargins={TIMELINE_MARGINS}
          />
          <div
            style={{
              paddingTop: TIMELINE_MARGINS.top
            }}
          >
            {traces.data.traces.map(trace => (
              <Trace
                timelineMargins={TIMELINE_MARGINS}
                key={get({ trace }, TRACE_ID)}
                color={getTraceColor(getPrimaryType(trace.type))}
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

function getColorByType(types) {
  const assignedColors = {
    app: colors.apmBlue,
    cache: colors.apmGreen,
    ext: colors.apmPurple,
    template: colors.apmRed2,
    custom: colors.apmTan,
    db: colors.apmOrange
  };

  const unknownTypes = difference(types, Object.keys(assignedColors));
  const unassignedColors = zipObject(unknownTypes, [
    colors.apmPink,
    colors.apmYellow,
    colors.apmRed,
    colors.apmBrown
  ]);

  return type => assignedColors[type] || unassignedColors[type];
}

function getTraceLabel(type) {
  switch (type) {
    case 'db':
      return 'DB';
    default:
      return type;
  }
}

function getPrimaryType(type) {
  return first(type.split('.'));
}

export default Traces;
