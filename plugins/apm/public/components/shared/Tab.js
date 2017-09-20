import styled from 'styled-components';
import { unit, units, px, fontSize, colors } from '../../style/variables';

const Tab = styled.span`
  display: inline-block;
  font-size: ${fontSize};
  width: ${px(unit * 10)};
  margin: 0 0 ${px(units.plus)} 0;
  padding: ${px(units.half)};
  text-align: center;

  border-bottom: ${props =>
    props.selected && `${units.quarter / 2}px solid ${colors.blue1}`};
  pointer-events: ${props => props.selected && 'none'};
`;

export default Tab;
