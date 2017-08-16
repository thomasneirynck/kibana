import React from 'react';
import styled from 'styled-components';
import {
  units,
  px,
  colors,
  fontSize,
  fontFamily
} from '../../../style/variables';

const LoadingContainer = styled.div`
  padding: ${px(units.half)};
  text-align: center;
  font-family: ${fontFamily};
  font-size: ${fontSize};
  font-weight: bold;
  background: ${colors.elementBackground};
`;

function ErrorLoader({ status }) {
  if (status === 'SUCCESS') {
    return null;
  }
  return (
    <tr>
      <td colSpan="5">
        <LoadingContainer>Loading...</LoadingContainer>
      </td>
    </tr>
  );
}

export default ErrorLoader;
