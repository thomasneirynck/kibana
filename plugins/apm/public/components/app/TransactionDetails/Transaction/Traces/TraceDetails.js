import React from 'react';
import styled from 'styled-components';
import numeral from 'numeral';
import { get } from 'lodash';
import { TRACE_SQL, TRACE_DURATION } from '../../../../../../common/constants';

const TraceDetailsContainer = styled.div`text-align: center;`;

function TraceDetails({ trace, totalDuration }) {
  const traceDuration = get({ trace }, TRACE_DURATION);
  const relativeDuration = traceDuration / totalDuration;
  const sql = get(trace, TRACE_SQL);
  return (
    <TraceDetailsContainer>
      <p>
        {numeral(traceDuration / 1000).format('0.00')} ms ({numeral(relativeDuration).format('0.00%')}{' '}
        of total time)
      </p>
      <p>
        {sql}
      </p>
    </TraceDetailsContainer>
  );
}

export default TraceDetails;
