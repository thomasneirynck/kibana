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

const Message = styled.div`
  font-family: ${fontFamilyCode};
  font-weight: bold;
  font-size: ${fontSizes.large};
  color: ${colors.linkColor};
`;

const Culprit = styled.div`font-family: ${fontFamilyCode};`;

const OccurrencesCell = TableCell.extend`
  text-align: right;
  font-weight: bold;
  font-size: ${fontSizes.large};
`;

function ListItem({ error, appName }) {
  const { groupingId, culprit, message, occurrenceCount } = error;
  const count = numeral(occurrenceCount).format('0.[0]a');

  return (
    <Row>
      <TableCell>
        <RelativeLink path={`${appName}/errors/${groupingId}`}>
          <Message>{message || 'N/A'}</Message>
          <Culprit>{culprit || 'N/A'}</Culprit>
        </RelativeLink>
      </TableCell>
      <OccurrencesCell>{count || 'N/A'}</OccurrencesCell>
    </Row>
  );
}

export default ListItem;
