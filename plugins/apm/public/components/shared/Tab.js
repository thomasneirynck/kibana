import styled from 'styled-components';
import { unit, units, px, fontSizes, colors } from '../../style/variables';
import { RelativeLink } from '../../utils/url';

const Tab = styled(RelativeLink)`
  display: inline-block;
  font-size: ${fontSizes.large};
  margin: 0 0 ${px(units.plus)} 0;
  padding: ${px(unit)} ${px(unit + units.quarter)};
  text-align: center;

  border-bottom: ${props =>
    props.selected && `${units.quarter / 2}px solid ${colors.blue1}`};
`;

export default Tab;
