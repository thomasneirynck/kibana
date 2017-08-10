import styled from 'styled-components';
import { unit, units, px, fontSize } from '../../style/variables';

const Tab = styled.span`
  display: inline-block;
  font-size: ${fontSize};
  width: ${px(unit * 10)};
  margin: 0 0 ${px(units.plus)} 0;
  padding: ${px(units.half)};
  text-align: center;

  &:hover {
    opacity: 1;
  }

  opacity: ${props => (props.selected ? 1 : 0.7)};
  border-bottom: ${props =>
    props.selected && `${units.quarter / 2}px solid #005472`};
  pointer-events: ${props => props.selected && 'none'};
`;

export default Tab;
