import React from 'react';
import styled from 'styled-components';
import {
  units,
  px,
  colors,
  fontFamily,
  fontSize
} from '../../../style/variables';

export const Table = styled.table`width: 100%;`;
export const TableHead = styled.th`
  text-align: right;
  border-bottom: 1px solid ${colors.elementBorder};
  border-left: 1px solid ${colors.tableBorder};
  padding: ${px(units.minus)};
  position: relative;
  cursor: pointer;

  &:first-child {
    border-left: 0;
    text-align: left;
  }
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
