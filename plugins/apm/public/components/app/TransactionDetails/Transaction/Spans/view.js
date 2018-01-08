import React, { PureComponent } from 'react';
import styled from 'styled-components';
import { first, get, zipObject, difference, uniq } from 'lodash';
import Span from './Span';
import TimelineHeader from './TimelineHeader';
import { SPAN_ID } from '../../../../../../common/constants';
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

class Spans extends PureComponent {
  componentDidMount() {
    loadSpans(this.props);
  }

  componentWillReceiveProps(nextProps) {
    loadSpans(nextProps);
  }

  render() {
    const { spans, urlParams } = this.props;
    if (spans.status !== STATUS.SUCCESS) {
      return null;
    }

    if (spans.data.spans.length <= 0) {
      return (
        <EmptyMessage
          heading="No spans available for this transaction."
          showSubheading={false}
        />
      );
    }

    const spanTypes = uniq(
      spans.data.spanTypes.map(({ type }) => getPrimaryType(type))
    );
    const getSpanColor = getColorByType(spanTypes);

    const totalDuration = spans.data.duration;
    const spanContainerHeight = 58;
    const timelineHeight = spanContainerHeight * spans.data.spans.length;

    return (
      <Container>
        <StickyContainer>
          <Timeline
            header={
              <TimelineHeader
                legends={spanTypes.map(type => ({
                  label: getSpanLabel(type),
                  color: getSpanColor(type)
                }))}
                transactionName={urlParams.transactionName}
              />
            }
            duration={totalDuration}
            height={timelineHeight}
            margins={TIMELINE_MARGINS}
          />
          <div
            style={{
              paddingTop: TIMELINE_MARGINS.top
            }}
          >
            {spans.data.spans.map(span => (
              <Span
                transactionId={urlParams.transactionId}
                timelineMargins={TIMELINE_MARGINS}
                key={get({ span }, SPAN_ID)}
                color={getSpanColor(getPrimaryType(span.type))}
                span={span}
                totalDuration={totalDuration}
                isSelected={get({ span }, SPAN_ID) === urlParams.spanId}
              />
            ))}
          </div>
        </StickyContainer>
      </Container>
    );
  }
}

function loadSpans(props) {
  const { serviceName, start, end, transactionId } = props.urlParams;
  if (serviceName && start && end && transactionId && !props.spansNext.status) {
    props.loadSpans({ serviceName, start, end, transactionId });
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
    colors.apmYellow,
    colors.apmRed,
    colors.apmBrown,
    colors.apmPink
  ]);

  return type => assignedColors[type] || unassignedColors[type];
}

function getSpanLabel(type) {
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

export default Spans;
