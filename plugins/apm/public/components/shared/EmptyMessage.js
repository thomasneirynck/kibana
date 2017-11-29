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
  const defaultSubheading = (
    <span>
      {
        " Oops! You should try another time range. If that's no good, there's always the "
      }
      <a
        href={
          link ||
          'https://www.elastic.co/guide/en/apm/get-started/6.1/index.html'
        }
      >
        documentation
      </a>.
    </span>
  );

  return (
    <Container>
      {heading || 'No data found.'}
      <HelpMessage>{subheading || defaultSubheading}</HelpMessage>
    </Container>
  );
}

export default EmptyMessage;
