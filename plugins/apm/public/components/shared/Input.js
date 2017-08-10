import styled from 'styled-components';
import { fontSize, unit, units, px } from '../../style/variables';

const Input = styled.input`
  display: block;
  font-size: ${fontSize};
  min-width: ${px(unit * 8)};
  margin: 0;
  padding: ${px(units.half)} ${px(unit)};
`;

export default Input;
