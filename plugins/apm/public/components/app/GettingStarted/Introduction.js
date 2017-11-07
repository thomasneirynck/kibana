import React from 'react';
import styled from 'styled-components';
import { px, unit, units } from '../../../style/variables';

const IntroductionWrapper = styled.div`
  padding: ${px(unit)} 0;
  margin-bottom: ${px(units.plus)};
`;

const Icon = styled.div`
  display: inline-block;
  width: ${px(units.double)};
  height: ${px(units.double)};
  object-fit: contain;
  background-size: ${px(units.double)} ${px(units.double)};
  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjkyIiB2aWV3Qm94PSIwIDAgMTAwIDkyIj4gICAgPGRlZnM+ICAgICAgICA8cGF0aCBpZD0iYSIgZD0iTTAgMGgxMDB2MTAwSDB6Ii8+ICAgIDwvZGVmcz4gICAgPGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwIC00KSI+ICAgICAgICA8bWFzayBpZD0iYiIgZmlsbD0iI2ZmZiI+ICAgICAgICAgICAgPHVzZSB4bGluazpocmVmPSIjYSIvPiAgICAgICAgPC9tYXNrPiAgICAgICAgPHBhdGggZmlsbD0iIzEzQTdERiIgZD0iTTE3IDMwaDY2YTcgNyAwIDEgMSAwIDE0SDE3YTcgNyAwIDEgMSAwLTE0eiIgbWFzaz0idXJsKCNiKSIvPiAgICAgICAgPHBhdGggZmlsbD0iIzAwQkZCMyIgZD0iTTY3IDgyaDI2YTcgNyAwIDEgMSAwIDE0SDY3YTcgNyAwIDAgMSAwLTE0ek03IDRoMzZhNyA3IDAgMSAxIDAgMTRIN0E3IDcgMCAxIDEgNyA0ek0xNyA1NmgzNmE3IDcgMCAwIDEgMCAxNEgxN2E3IDcgMCAwIDEgMC0xNHoiIG1hc2s9InVybCgjYikiLz4gICAgPC9nPjwvc3ZnPg==);
  margin-right: ${px(unit)};
`;

const Title = styled.h1`
  display: inline-block;
`;

const Description = styled.div`
  margin: ${px(unit)} 0;
`;

function Introduction() {
  return (
    <IntroductionWrapper>
      <Icon />
      <Title>APM</Title>
      <Description>
        Elastic APM consists of three components - the Agents, the Server, and
        the UI. The Agents are libraries in your application that run inside of
        your application process. <br /> The Server processes data from agents
        and stores the application data in Elasticsearch. The UI is this
        dedicated Kibana app.
      </Description>
    </IntroductionWrapper>
  );
}

export default Introduction;
