import React from 'react';
import styled from 'styled-components';
import { units, px, fontSizes } from '../../../../style/variables';

const legendFontColor = '#666666';
const legendValueFontColor = '#000000';

export const LegendElm = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-right: ${px(units.half)};
  font-size: ${fontSizes.small};
  color: ${legendFontColor};
  cursor: pointer;
  opacity: ${props => (props.isDisabled ? '0.4' : '1')};

  &:last-of-type {
    margin-right: 0;
  }
`;

export const Indicator = styled.span`
  display: flex;
  align-items: center;
  width: ${px(units.minus - 1)};
  height: ${px(units.minus - 1)};
  margin-right: ${px(units.quarter)};
  background: ${props => props.color};
  border-radius: 100%;
`;

export const Value = styled.div`
  margin-left: ${px(units.quarter)};
  color: ${legendValueFontColor};
`;

export function Legend({ serie, i, isDisabled, onClick }) {
  return (
    <LegendElm onClick={() => onClick(i)} isDisabled={isDisabled}>
      <Indicator color={serie.color} />
      {serie.title} <Value>{serie.legendValue}</Value>
    </LegendElm>
  );
}
