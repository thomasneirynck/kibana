import React from 'react';
import styled from 'styled-components';
import Legend from '../../../../shared/charts/Legend';
import { fontSizes, colors, units, px } from '../../../../../style/variables';

const TimelineHeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  padding: ${px(units.double)} ${px(units.double)} 0 ${px(units.double)};
`;

const Heading = styled.div`
  font-size: ${fontSizes.large};
  color: ${colors.gray2};
`;

const Legends = styled.div`
  display: flex;
`;

export default function TimelineHeader({ legends, transactionName }) {
  return (
    <TimelineHeaderContainer>
      <Heading>{transactionName}</Heading>
      <Legends>
        {legends.map(({ color, label }) => (
          <Legend clickable={false} key={color} color={color} text={label} />
        ))}
      </Legends>
    </TimelineHeaderContainer>
  );
}
