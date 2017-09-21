import React from 'react';
import _ from 'lodash';
import moment from 'moment';
import { Hint } from 'react-vis';
import styled from 'styled-components';
import {
  colors,
  unit,
  units,
  px,
  borderRadius,
  fontSize,
  fontSizes
} from '../../../../style/variables';
import Legend from '../Legend';

const TooltipElm = styled.div`
  margin: 0 ${px(unit)};
  transform: translateY(-50%);
  border: 1px solid ${colors.gray4};
  background: ${colors.white};
  border-radius: ${borderRadius};
  font-size: ${fontSize};
  color: ${colors.black};
`;

const Header = styled.div`
  background: ${colors.gray5};
  border-bottom: 1px solid ${colors.gray4};
  border-radius: ${borderRadius} ${borderRadius} 0 0;
  padding: ${px(units.half)};
  color: ${colors.black2};
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

const Value = styled.div`
  color: ${colors.black};
  font-size: ${fontSize};
`;

export function Tooltip({
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
      <TooltipElm>
        <Header>{timestamp}</Header>
        <Legends>
          {hoveredPoints.map((point, i) => (
            <LegendAndValueWrap key={i}>
              <Legend
                fontSize={fontSize.tiny}
                radius={units.half}
                color={series[i].color}
                text={series[i].titleShort || series[i].title}
              />
              <Value>{valueFormatter(point.y)}</Value>
            </LegendAndValueWrap>
          ))}
        </Legends>
      </TooltipElm>
    </Hint>
  );
}
