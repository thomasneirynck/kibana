import React from 'react';
import styled from 'styled-components';
import numeral from 'numeral';
import { get, uniq } from 'lodash';
import PropTypes from 'prop-types';
import Stacktrace from '../../../../../shared/Stacktrace';
import DiscoverButton from '../../../../../shared/DiscoverButton';
import {
  asMillis,
  getColorByType,
  getPrimaryType,
  getSpanLabel
} from '../../../../../../utils/formatters';
import Legend from '../../../../../shared/charts/Legend';
import {
  SPAN_DURATION,
  SPAN_NAME,
  TRANSACTION_ID,
  SERVICE_LANGUAGE_NAME,
  PROCESSOR_EVENT
} from '../../../../../../../common/constants';
import {
  unit,
  units,
  px,
  colors,
  borderRadius,
  fontFamilyCode,
  fontSizes
} from '../../../../../../style/variables';

import SyntaxHighlighter, {
  registerLanguage
} from 'react-syntax-highlighter/dist/light';
import { xcode } from 'react-syntax-highlighter/dist/styles';

import sql from 'react-syntax-highlighter/dist/languages/sql';

registerLanguage('sql', sql);

const DetailsWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  border-bottom: 1px solid ${colors.gray4};
  padding: ${px(unit)} 0;
  position: relative;
`;

const DetailsHeader = styled.div`
  margin-bottom: ${px(units.half)};
  font-size: ${fontSizes.small};
  color: ${colors.gray3};
`;

const DetailsText = styled.div`
  display: flex;
  font-size: ${fontSizes.large};
`;

const StackTraceContainer = styled.div`
  margin-top: ${px(unit)};
`;

const DatabaseStatement = styled.div`
  margin-top: ${px(unit)};
  padding: ${px(units.half)} ${px(unit)};
  background: ${colors.yellow};
  border-radius: ${borderRadius};
  border: 1px solid ${colors.gray4};
  font-family: ${fontFamilyCode};
`;

function SpanDetails({ span, spanTypes, totalDuration, transactionId }) {
  const spanDuration = get({ span }, SPAN_DURATION);
  const relativeDuration = spanDuration / totalDuration;
  const spanName = get({ span }, SPAN_NAME);
  const stackframes = span.stacktrace;
  const codeLanguage = get(span, SERVICE_LANGUAGE_NAME);
  const dbContext = get(span, 'context.db');

  const allSpanTypes = uniq(spanTypes.map(({ type }) => getPrimaryType(type)));
  const getSpanColor = getColorByType(allSpanTypes);
  const spanLabel = getSpanLabel(getPrimaryType(span.type));
  const spanColor = getSpanColor(getPrimaryType(span.type));

  const discoverQuery = {
    _a: {
      interval: 'auto',
      query: {
        language: 'lucene',
        query: `${PROCESSOR_EVENT}:span AND ${TRANSACTION_ID}:${transactionId}`
      },
      sort: { '@timestamp': 'desc' }
    }
  };

  return (
    <div>
      <DetailsWrapper>
        <div>
          <DetailsHeader>Name</DetailsHeader>
          <DetailsText>{spanName}</DetailsText>
        </div>
        <div>
          <DetailsHeader>Type</DetailsHeader>
          <DetailsText>
            <Legend clickable={false} color={spanColor} />
            {spanLabel}
          </DetailsText>
        </div>
        <div>
          <DetailsHeader>Duration</DetailsHeader>
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

      <DatabaseContext dbContext={dbContext} />

      <StackTraceContainer>
        <Stacktrace stackframes={stackframes} codeLanguage={codeLanguage} />
      </StackTraceContainer>
    </div>
  );
}

function DatabaseContext({ dbContext }) {
  if (!dbContext) {
    return null;
  }

  if (dbContext.type && dbContext.type === 'sql') {
    return (
      <DatabaseStatement>
        <SyntaxHighlighter
          language={'sql'}
          style={xcode}
          customStyle={{
            color: null,
            background: null,
            padding: null,
            lineHeight: px(unit * 1.5),
            whiteSpace: 'pre-wrap',
            overflowX: 'scroll'
          }}
        >
          {dbContext.statement || 'N/A'}
        </SyntaxHighlighter>
      </DatabaseStatement>
    );
  } else {
    return (
      <DatabaseStatement>{dbContext.statement || 'N/A'}</DatabaseStatement>
    );
  }
}

SpanDetails.propTypes = {
  span: PropTypes.object.isRequired,
  totalDuration: PropTypes.number.isRequired
};

export default SpanDetails;
