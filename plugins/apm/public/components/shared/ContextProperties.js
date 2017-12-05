import React from 'react';
import styled from 'styled-components';
import {
  unit,
  units,
  px,
  fontSizes,
  colors,
  truncate
} from '../../style/variables';

const PropertiesContainer = styled.div`
  display: flex;
  padding: 0 ${px(units.plus)};
  width: 100%;
  justify-content: flex-start;
  flex-flow: row wrap;
`;

const Property = styled.div`
  margin-bottom: ${px(units.plus)};

  &:first-of-type {
    margin-right: ${px(unit * 10)};
  }
`;

const PropertyLabel = styled.div`
  margin-bottom: ${px(units.quarter)};
  font-size: ${fontSizes.small};
  color: ${colors.gray3};
`;

const PropertyValue = styled.div`
  display: inline-block;
`;

const PropertyValueEmphasis = styled.span`
  color: ${colors.gray3};
`;

const PropertyUrl = PropertyValue.withComponent('span').extend`
  ${truncate(px(unit * 35))};
`;

export function Properties({ timestampAgo, timestampFull, url }) {
  return (
    <PropertiesContainer>
      <Property>
        <PropertyLabel>@timestamp</PropertyLabel>
        <PropertyValue>
          {timestampAgo}{' '}
          <PropertyValueEmphasis>({timestampFull})</PropertyValueEmphasis>
        </PropertyValue>
      </Property>
      <Property>
        <PropertyLabel>request.url.raw</PropertyLabel>
        <PropertyUrl title={url}>{url}</PropertyUrl>
      </Property>
    </PropertiesContainer>
  );
}
