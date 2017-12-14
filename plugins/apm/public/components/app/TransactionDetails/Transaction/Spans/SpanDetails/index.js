import React from 'react';
import styled from 'styled-components';
import numeral from 'numeral';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import Stacktrace from '../../../../../shared/Stacktrace';
import DiscoverButton from '../../../../../shared/DiscoverButton';
import { asMillis } from '../../../../../../utils/formatters';
import {
  SPAN_DURATION,
  SPAN_NAME,
  TRANSACTION_ID,
  SERVICE_LANGUAGE_NAME
} from '../../../../../../../common/constants';
import {
  unit,
  units,
  px,
  colors,
  fontSizes
} from '../../../../../../style/variables';

const DetailsWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  border-bottom: 1px solid ${colors.gray4};
  padding: ${px(unit)} 0;
  position: relative;
`;

const DetailsHeader = styled.div`
  font-weight: 100;
  font-size: ${fontSizes.small};
  color: ${colors.gray1};
  margin-bottom: ${units.quarter};
`;

const DetailsText = styled.div`
  font-size: ${fontSizes.large};
`;

const StackTraceContainer = styled.div`
  margin-top: ${unit}px;
`;

function SpanDetails({ span, totalDuration, transactionId }) {
  const spanDuration = get({ span }, SPAN_DURATION);
  const relativeDuration = spanDuration / totalDuration;
  const spanName = get({ span }, SPAN_NAME);
  const stackframes = span.stacktrace;
  const codeLanguage = get(span, SERVICE_LANGUAGE_NAME);

  const discoverQuery = {
    _a: {
      interval: 'auto',
      query: {
        language: 'lucene',
        query: `${TRANSACTION_ID}:${transactionId}`
      },
      sort: { '@timestamp': 'desc' }
    }
  };

  return (
    <div>
      <DetailsWrapper>
        <div>
          <DetailsHeader>Span name</DetailsHeader>
          <DetailsText>{spanName}</DetailsText>
        </div>
        <div>
          <DetailsHeader>Span duration</DetailsHeader>
          <DetailsText>{asMillis(spanDuration)}</DetailsText>
        </div>
        <div>
          <DetailsHeader>% of total time</DetailsHeader>
          <DetailsText>{numeral(relativeDuration).format('0.00%')}</DetailsText>
        </div>
        <DiscoverButton query={discoverQuery}>
          {`View spans in Discover`}
        </DiscoverButton>
      </DetailsWrapper>

      <StackTraceContainer>
        <Stacktrace stackframes={stackframes} codeLanguage={codeLanguage} />
      </StackTraceContainer>
    </div>
  );
}

SpanDetails.propTypes = {
  span: PropTypes.object.isRequired,
  totalDuration: PropTypes.number.isRequired
};

export default SpanDetails;
