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

const Legends = styled.div`display: flex;`;

export default function TimelineHeader({
  traceTypes,
  getColor,
  transactionName
}) {
  return (
    <TimelineHeaderContainer>
      <Heading>{transactionName}</Heading>
      <Legends>
        {traceTypes.map(type => (
          <Legend
            key={type}
            color={getColor(type)}
            text={getTraceTypeLabel(type)}
          />
        ))}
      </Legends>
    </TimelineHeaderContainer>
  );
}

function getTraceTypeLabel(type) {
  switch (type) {
    case 'db.postgresql.query':
      return 'DB';
    default:
      return type;
  }
}
