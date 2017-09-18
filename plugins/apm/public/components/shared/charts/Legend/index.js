import React from 'react';
import styled from 'styled-components';
import { units, px, fontSizes, colors } from '../../../../style/variables';

const Container = styled.div`
  display: flex;
  align-items: center;
  font-size: ${props => {
    switch (Math.round(props.size)) {
      case 1:
        return fontSizes.small;
      case 2:
        return fontSizes.large;
      case 3:
        return fontSizes.xlarge;
      default:
        return fontSizes.small;
    }
  }};
  color: ${colors.gray2};
  cursor: pointer;
  opacity: ${props => (props.isDisabled ? 0.4 : 1)};
  margin-right: ${px(units.half)};

  &:last-of-type {
    margin-right: 0;
  }
`;

const Indicator = styled.span`
  width: ${props => px(units.half + units.quarter * props.size)};
  height: ${props => px(units.half + units.quarter * props.size)};
  margin-right: ${px(units.quarter)};
  background: ${props => props.color};
  border-radius: 100%;
`;

export default function Legend({
  onClick,
  color,
  text,
  size = 1,
  isDisabled = false
}) {
  return (
    <Container onClick={onClick} isDisabled={isDisabled} size={size}>
      <Indicator color={color} size={size} />
      {text}
    </Container>
  );
}
