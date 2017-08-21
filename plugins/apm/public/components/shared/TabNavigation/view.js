import React from 'react';
import { RelativeLink } from '../../../utils/url';
import Tab from '../Tab';
import styled from 'styled-components';
import withApp from '../withApp';
import { unit, units, colors } from '../../../style/variables';

const Divider = styled.div`
  border-left: 1px solid ${colors.elementBorder};
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
            selected={transactionType === type && !errorsSelected}
            key={type}
          >
            <RelativeLink
              path={`${appName}/transactions/${encodeURIComponent(type)}`}
            >
              {type}
            </RelativeLink>
          </Tab>
        );
      })}
      <Divider />
      <Tab selected={errorsSelected}>
        <RelativeLink path={`${appName}/errors`}>Errors</RelativeLink>
      </Tab>
    </div>
  );
}

export default withApp(TabNavigation);
