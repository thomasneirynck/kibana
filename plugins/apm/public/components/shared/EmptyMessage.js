import React from 'react';
import styled from 'styled-components';
import { units, px, fontSizes, fontSize } from '../../style/variables';
import { KuiTableInfo } from 'ui_framework/components';

const Container = styled(KuiTableInfo)`
  text-align: center;
  font-size: ${fontSizes.large};
`;

const HelpMessage = styled.div`
  text-align: center;
  font-size: ${fontSize};
  margin-top: ${px(units.half)};
`;

function EmptyMessage({ heading, subheading, link }) {
  return (
    <Container>
      {heading || 'No data found.'}
      <HelpMessage>
        {subheading}
        {' If you were expecting something more here, please refer to our '}
        <a href={link || '#'}>Troubleshooting Guide</a>.
      </HelpMessage>
    </Container>
  );
}

export default EmptyMessage;
