import React from 'react';
import styled from 'styled-components';
import { fontSize, unit, px } from '../../style/variables';
import { KuiTableInfo } from 'ui_framework/components';
import { Info } from './Icons';

const TipMessage = styled(KuiTableInfo)`
  padding: ${px(unit)} 0 0;
  text-align: center;
  font-size: ${fontSize};
`;

const Link = styled.div`display: inline-block;`;

function tipMessage({ heading, link }) {
  return (
    <TipMessage>
      <Info />
      {heading || ''}
      {heading && ' – '}
      <Link>
        <a href={link || '#'} target="_blank">
          Learn more in the documentation
        </a>
      </Link>
    </TipMessage>
  );
}

export default tipMessage;
