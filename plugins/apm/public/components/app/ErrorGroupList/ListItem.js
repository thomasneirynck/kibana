import React from 'react';
import styled from 'styled-components';
import {
  units,
  px,
  colors,
  fontFamilyCode,
  fontSizes
} from '../../../style/variables';
import { RelativeLink } from '../../../utils/url';
import numeral from 'numeral';

export const Row = styled.tr`
  &:nth-child(even) {
    background: ${colors.elementBackgroundDark};
  }
`;

const TableCell = styled.td`
  padding: ${px(units.half)} ${px(units.minus)};
  border-left: 1px solid ${colors.tableBorder};

  &:first-child {
    border-left: 0;
  }
`;

const Title = TableCell.extend`
  // Position: relative doesn't work on <tr> elements, so adding it here
  position: relative;
`;

const LinkExpand = styled.span`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 1;
`;

const Message = styled.div`
  font-family: ${fontFamilyCode};
  font-weight: bold;
  font-size: ${fontSizes.large};
  color: ${colors.linkColor};
`;

const Culprit = styled.div`font-family: ${fontFamilyCode};`;

const Occurrences = TableCell.extend`
  text-align: right;
  font-weight: bold;
  font-size: ${fontSizes.large};
`;

function ErrorGroupListItem({ error, appName }) {
  const { groupingId, culprit, message, occurrenceCount } = error;
  const count = numeral(occurrenceCount).format('0.[0]a');

  return (
    <Row>
      <Title>
        <RelativeLink path={`${appName}/errors/${groupingId}`}>
          <LinkExpand />
        </RelativeLink>
        <Message>
          {message || 'N/A'}
        </Message>
        <Culprit>
          {culprit || 'N/A'}
        </Culprit>
      </Title>
      <Occurrences>
        {count || 'N/A'}
      </Occurrences>
    </Row>
  );
}

export default ErrorGroupListItem;
