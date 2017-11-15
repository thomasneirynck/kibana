import React from 'react';
import { Tab } from '../UIComponents';
import styled from 'styled-components';
import withApp from '../withApp';
import { unit, units, px, colors } from '../../../style/variables';

const Container = styled.div`
  box-shadow: 0 1px 0 ${colors.gray4};
  margin: 0 0 ${px(units.double)} 0;
`;

const Divider = styled.div`
  border-left: 1px solid ${colors.gray4};
  height: ${px(units.double)};
  margin: 0 ${px(unit)};
  display: inline-block;
  vertical-align: middle;
`;

function TabNavigation({ urlParams, location, app }) {
  const { appName, transactionType } = urlParams;
  const errorsSelected = location.pathname.includes('/errors');
  const { types } = app.data;

  return (
    <Container>
      {types.map(type => {
        return (
          <Tab
            path={`${appName}/transactions/${encodeURIComponent(type)}`}
            selected={transactionType === type && !errorsSelected}
            key={type}
          >
            {type}
          </Tab>
        );
      })}
      <Divider />
      <Tab path={`${appName}/errors`} selected={errorsSelected}>
        Errors
      </Tab>
    </Container>
  );
}

export default withApp(TabNavigation);
