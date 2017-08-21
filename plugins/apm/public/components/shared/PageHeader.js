import React from 'react';
import styled from 'styled-components';
import { units, px, fontSizes } from '../../style/variables';

const Container = styled.div`
  display: flex;
  justify-content: space-between;
  margin: ${px(units.plus)} 0 ${px(units.plus)} 0;
`;

const Title = styled.h1`
  margin: 0;
  font-size: ${fontSizes.xxlarge};
`;

function PageHeader({ title }) {
  if (!title) {
    return null;
  }
  return (
    <Container>
      <Title>
        {title}
      </Title>
    </Container>
  );
}

export default PageHeader;
