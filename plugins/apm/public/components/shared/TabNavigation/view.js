import React from 'react';
import { Tab } from '../UIComponents';
import styled from 'styled-components';
import withService from '../withService';
import { unit, units, px, colors, fontSizes } from '../../../style/variables';
import { isEmpty } from 'lodash';

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

const EmptyMessage = styled.div`
  display: inline-block;
  font-size: ${fontSizes.large};
  color: ${colors.gray3};
  padding: ${px(unit)} ${px(unit + units.quarter)};
  border-bottom: 2px solid transparent;
`;

function transactionTypeLabel(type) {
  return type === 'request' ? 'Request' : type;
}

function TabNavigation({ urlParams, location, service }) {
  const { serviceName, transactionType } = urlParams;
  const errorsSelected = location.pathname.includes('/errors');
  const { types } = service.data;

  return (
    <Container>
      {types.map(type => {
        return (
          <Tab
            path={`${serviceName}/transactions/${encodeURIComponent(type)}`}
            selected={transactionType === type && !errorsSelected}
            key={type}
          >
            {transactionTypeLabel(type)}
          </Tab>
        );
      })}
      {isEmpty(types) && <EmptyMessage>No transactions available</EmptyMessage>}
      <Divider />
      <Tab path={`${serviceName}/errors`} selected={errorsSelected}>
        Errors
      </Tab>
    </Container>
  );
}

export default withService(TabNavigation);
