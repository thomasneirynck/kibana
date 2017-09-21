import React from 'react';
import Tab from '../Tab';
import styled from 'styled-components';
import withApp from '../withApp';
import { unit, units, colors } from '../../../style/variables';

const Divider = styled.div`
  border-left: 1px solid ${colors.gray4};
  height: ${units.double}px;
  margin: 0 ${unit}px;
  display: inline-block;
  vertical-align: middle;
`;

function TabNavigation({ urlParams, location, app }) {
  const { appName, transactionType } = urlParams;
  const errorsSelected = location.pathname.includes('/errors');
  const { types } = app.data;
  if (!types) {
    return null;
  }

  return (
    <div>
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
    </div>
  );
}

export default withApp(TabNavigation);
