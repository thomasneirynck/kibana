import styled from 'styled-components';
import { unit, units, px, colors, borderRadius } from '../../style/variables';

const Container = styled.div`
  padding: 0 ${px(units.double)} ${px(unit)} ${px(units.double)};
  min-height: ${px(units.unit * 10)};
  margin: 0 0 ${px(units.plus)} 0px;
  border: 1px solid ${colors.gray4};
  background-color: ${colors.gray5};
  border-radius: ${borderRadius};
`;

export default Container;
