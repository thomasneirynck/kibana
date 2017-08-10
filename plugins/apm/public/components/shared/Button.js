import React from 'react';
import { RelativeLink } from '../../utils/url';
import styled from 'styled-components';
import {
  fontSize,
  unit,
  units,
  px,
  colors,
  borderRadius
} from '../../style/variables';

const Button = styled(RelativeLink)`
  display: block;
  font-size: ${fontSize};
  min-width: ${px(unit * 5)};
  margin: 0;
  padding: ${px(units.half)} ${px(unit * 2)};
  text-align: center;
  border: 1px solid ${colors.elementBorderDark};
  border-radius: ${borderRadius};
  background-color: ${colors.elementBackgroundDark};
  cursor: pointer;

  &:hover{
    background-color: ${colors.elementBackground};
  }
`;

export default function({ label, path }) {
  if (!label) {
    return null;
  }
  return (
    <Button path={path}>
      {label}
    </Button>
  );
}
