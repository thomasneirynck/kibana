import React from 'react';
import styled from 'styled-components';
import {
  unit,
  units,
  px,
  colors,
  fontFamily,
  fontSize
} from '../../../style/variables';

export const Table = styled.table`width: 100%;`;
export const TableHead = styled.th`
  border-bottom: 1px solid ${colors.elementBorder};
  padding: ${px(units.half)} ${px(unit)};
  position: relative;
  cursor: pointer;
  font-weight: normal;
  color: ${props => (props.selected ? '#666' : colors.tableHeaderColor)};
  user-select: none;
  background: ${props => (props.selected ? '#eee' : 'initial')};
`;

const LoadingContainer = styled.div`
  padding: ${px(units.half)};
  text-align: center;
  font-family: ${fontFamily};
  font-size: ${fontSize};
  font-weight: bold;
  background: ${colors.elementBackground};
`;

export function TableLoader({ status, columns }) {
  if (status === 'SUCCESS') {
    return null;
  }
  return (
    <tr>
      <td colSpan={columns || 10}>
        <LoadingContainer>Loading...</LoadingContainer>
      </td>
    </tr>
  );
}
