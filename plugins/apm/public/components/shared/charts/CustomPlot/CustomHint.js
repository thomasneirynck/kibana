import React from 'react';
import _ from 'lodash';
import moment from 'moment';
import { Hint } from 'react-vis';
import styled from 'styled-components';
import {
  unit,
  units,
  px,
  borderRadius,
  fontSize,
  fontSizes
} from '../../../../style/variables';
import { LegendElm, Indicator } from './Legend';

const customHintBorderColor = '#d9d9d9';
const customHintBgColor = '#fff';
const customHintTitleBgColor = '#f5f5f5';
const customHintFontColor = '#404040';
const legendValueFontColor = '#000000';

const CustomHintElm = styled.div`
  margin: 0 ${px(unit)};
  transform: translateY(-50%);
  border: 1px solid ${customHintBorderColor};
  background: ${customHintBgColor};
  border-radius: ${borderRadius};
  font-size: ${fontSize};
  color: ${legendValueFontColor};
`;

const Header = styled.div`
  background: ${customHintTitleBgColor};
  border-bottom: 1px solid ${customHintBorderColor};
  border-radius: ${borderRadius} ${borderRadius} 0 0;
  padding: ${px(units.half)};
  color: ${customHintFontColor};
`;

const Legends = styled.div`
  display: flex;
  align-items: center;
  padding: ${px(units.half)};
`;

const LegendAndValueWrap = styled.div`
  min-width: ${px(units.minus * 6)};
  font-size: ${fontSizes.small};
`;

const SmallIndicator = Indicator.extend`
  width: ${px(units.half)};
  height: ${px(units.half)};
`;

const Value = styled.div`
  color: ${legendValueFontColor};
  font-size: ${fontSize};
`;

export function CustomHint({
  hoveredPoints,
  series,
  seriesValueType,
  valueFormatter,
  y,
  ...props
}) {
  if (_.isEmpty(hoveredPoints)) {
    return null;
  }
  const x = hoveredPoints[0].x;

  const timestamp = moment(x).format('MMMM Do YYYY, HH:mm');

  return (
    <Hint {...props} value={{ x, y }}>
      <CustomHintElm>
        <Header>{timestamp}</Header>
        <Legends>
          {hoveredPoints.map((point, i) => (
            <LegendAndValueWrap key={i}>
              <LegendElm>
                <SmallIndicator color={series[i].color} />{' '}
                {series[i].titleShort || series[i].title}
              </LegendElm>
              <Value>{valueFormatter(point.y)}</Value>
            </LegendAndValueWrap>
          ))}
        </Legends>
      </CustomHintElm>
    </Hint>
  );
}
