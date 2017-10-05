import React, { PureComponent } from 'react';
import styled from 'styled-components';
import Trace from './Trace';
import { get, zipObject, difference } from 'lodash';
import { TRACE_ID } from '../../../../../../common/constants';
import { STATUS } from '../../../../../constants';
import TimelineHeader from './TimelineHeader';
import { colors, units, px } from '../../../../../style/variables';
import { StickyContainer } from 'react-sticky';
import Timeline from '../../../../shared/charts/Timeline';

const Container = styled.div`
  transition: 0.1s padding ease;
  padding-bottom: ${props => px(props.paddingBottom)};
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

    const paddingBottom = getPaddingBottom(
      traces.data.traces,
      this.props.urlParams
    );

    const traceTypes = traces.data.traceTypes.map(({ type }) => type);
    const getColor = getColorByType(traceTypes);

    const totalDuration = traces.data.duration;
    const traceContainerHeight = 53;
    const height = traceContainerHeight * traces.data.traces.length;

    return (
      <Container paddingBottom={paddingBottom}>
        <StickyContainer>
          <Timeline
            header={
              <TimelineHeader
                traceTypes={traceTypes}
                getColor={getColor}
                transactionName={this.props.urlParams.transactionName}
              />
            }
            duration={totalDuration}
            height={height}
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
  const definedColors = {
    app: '#3185fc',
    cache: '#00b3a4',
    ext: '#490092',
    template: '#db1374',
    custom: '#bfa180',
    'db.postgresql.query': '#f98510'
  };

  const unknownTypes = difference(types, Object.keys(colors));
  const fallbackColors = zipObject(unknownTypes, [
    '#feb6db',
    '#ecae23',
    '#920000',
    '#461a0a'
  ]);

  return type => definedColors[type] || fallbackColors[type];
}

export default Traces;
