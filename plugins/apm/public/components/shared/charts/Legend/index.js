import React from 'react';
import styled from 'styled-components';
import { units, px, colors, fontSizes } from '../../../../style/variables';

const Container = styled.div`
  display: flex;
  align-items: center;
  font-size: ${props => props.fontSize};
  color: ${colors.gray2};
  cursor: pointer;
  opacity: ${props => (props.isDisabled ? 0.4 : 1)};
  margin-right: ${px(units.half)};

  &:last-of-type {
    margin-right: 0;
  }
`;

const Indicator = styled.span`
  width: ${props => px(props.radius)};
  height: ${props => px(props.radius)};
  margin-right: ${props => px(props.radius / 2)};
  background: ${props => props.color};
  border-radius: 100%;
`;

export default function Legend({
  onClick,
  color,
  text,
  fontSize = fontSizes.small,
  radius = units.minus - 1,
  isDisabled = false
}) {
  return (
    <Container onClick={onClick} isDisabled={isDisabled} fontSize={fontSize}>
      <Indicator color={color} radius={radius} />
      {text}
    </Container>
  );
}
