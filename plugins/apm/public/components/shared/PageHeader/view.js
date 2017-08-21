import React from 'react';
import styled from 'styled-components';
import { units, px, fontSizes } from '../../../style/variables';
import Button from '../Button';

const Container = styled.div`
  display: flex;
  justify-content: space-between;
  margin: ${px(units.plus)} 0 ${px(units.plus)} 0;
`;

const Title = styled.h1`
  margin: 0;
  font-size: ${fontSizes.xxlarge};
`;

function PageHeader({ appName, title, showSettingsButton }) {
  return (
    <Container>
      <Title>
        {title}
      </Title>
      {showSettingsButton !== false &&
        <Button path={`${appName}/settings`} label="Settings" />}
    </Container>
  );
}

export default PageHeader;
