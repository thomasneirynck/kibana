import React from 'react';
import styled from 'styled-components';
import { withRouter } from 'react-router-dom';
import { get } from 'lodash';
import { toQuery, fromQuery, RelativeLink } from '../../../../../utils/url';
import TraceDetails from './TraceDetails';
import Modal from '../../../../shared/Modal';

import {
  unit,
  units,
  colors,
  px,
  fontFamilyCode,
  fontSizes
} from '../../../../../style/variables';
import {
  TRACE_DURATION,
  TRACE_START,
  TRACE_ID,
  TRACE_NAME
} from '../../../../../../common/constants';

const TraceBar = styled.div`
  position: relative;
  height: ${unit}px;
`;
const TraceLabel = styled.div`
  white-space: nowrap;
  position: relative;
  direction: rtl;
  text-align: left;
  margin: ${px(units.quarter)} 0 0;
  font-family: ${fontFamilyCode};
  font-size: ${fontSizes.small};
`;

const Container = styled(({ isSelected, timelineMargins, ...props }) => (
  <RelativeLink {...props} />
))`
  position: relative;
  display: block;
  user-select: none;
  padding: ${px(units.half)} ${props => px(props.timelineMargins.right)}
    ${px(units.eighth)} ${props => px(props.timelineMargins.left)};
  border-top: 1px solid ${colors.gray4};
  background-color: ${props => (props.isSelected ? colors.gray5 : 'initial')};
  &:hover {
    background-color: ${colors.gray5};
  }
`;

class Trace extends React.Component {
  onClose = () => {
    const { location, history } = this.props;
    const { traceId, ...currentQuery } = toQuery(location.search);
    history.push({
      ...location,
      search: fromQuery({
        ...currentQuery,
        traceId: null
      })
    });
  };

  render() {
    const {
      timelineMargins,
      totalDuration,
      trace,
      color,
      isSelected
    } = this.props;

    const width = get({ trace }, TRACE_DURATION) / totalDuration * 100;
    const left = get({ trace }, TRACE_START) / totalDuration * 100;

    const traceId = get({ trace }, TRACE_ID);
    const traceName = get({ trace }, TRACE_NAME);

    return (
      <Container
        query={{ traceId }}
        timelineMargins={timelineMargins}
        isSelected={isSelected}
      >
        <TraceBar
          style={{
            left: `${left}%`,
            width: `${width}%`,
            backgroundColor: color
          }}
        />
        <TraceLabel style={{ left: `${left}%`, width: `${100 - left}%` }}>
          {traceName}
        </TraceLabel>

        <Modal
          header="Trace details"
          isOpen={isSelected}
          onClose={this.onClose}
          close={this.onClose}
        >
          <TraceDetails trace={trace} totalDuration={totalDuration} />
        </Modal>
      </Container>
    );
  }
}

export default withRouter(Trace);
