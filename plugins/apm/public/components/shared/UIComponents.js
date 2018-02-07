import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {
  unit,
  units,
  px,
  fontSizes,
  colors,
  truncate
} from '../../style/variables';
import { RelativeLink } from '../../utils/url';

const PagerHeaderWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: ${px(units.plus)};

  > *:not(h1) {
    position: relative;
    top: ${px(units.minus)};
    margin-left: ${px(unit)};
  }
`;

const PageHeading = styled.h1`
  font-size: ${fontSizes.xxlarge};
  margin: 0;
  height: ${px(unit * 2.5)};
  line-height: ${px(unit * 2.5)};
  ${truncate('100%')};
  flex-grow: 1;
`;

export function PageHeader({ title, children }) {
  return (
    <PagerHeaderWrapper>
      <PageHeading>{title}</PageHeading>
      {children}
    </PagerHeaderWrapper>
  );
}

PageHeader.propTypes = {
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired
};

export const SectionHeader = styled.h2`
  margin: ${px(units.plus)} 0;
  font-size: ${fontSizes.xlarge};
`;

export const GraphHeader = styled.h3`
  margin: ${px(units.plus)} 0;
  font-size: ${fontSizes.large};
`;

export const Tab = styled.div`
  display: inline-block;
  font-size: ${fontSizes.large};
  padding: ${px(unit)} ${px(unit + units.quarter)};
  text-align: center;
  cursor: pointer;
  user-select: none;

  border-bottom: ${props =>
    props.selected && `${units.quarter / 2}px solid ${colors.blue1}`};
`;

export const TabLink = Tab.withComponent(RelativeLink);
