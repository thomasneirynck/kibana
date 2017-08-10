import React, { Component } from 'react';
import styled from 'styled-components';
import { STATUS } from '../../../../constants';
import { unit, units, colors } from '../../../../style/variables';
import WiremockContainer from '../../../shared/WiremockContainer';
import { RelativeLink } from '../../../../utils/url';
import Tab from '../../../shared/Tab';
import TransactionTable from './TransactionTable';
import Traces from './Traces/container';
import { get } from 'lodash';
import { TRANSACTION_DURATION } from '../../../../../common/constants';

function loadTransaction(props) {
  const { appName, start, end, transactionId } = props.urlParams;
  if (appName && start && end && transactionId && !props.transaction.status) {
    props.loadTransaction({ appName, start, end, transactionId });
  }
}

const TabContentContainer = styled.div`
  border: 1px solid ${colors.elementBorder};
  border-radius: ${units.quarter}px;
  background-color: ${colors.elementBackground};
  overflow: hidden;
  padding: ${unit}px;
`;

class Transaction extends Component {
  componentDidMount() {
    loadTransaction(this.props);
  }

  componentWillReceiveProps(nextProps) {
    loadTransaction(nextProps);
  }

  render() {
    const { transactionTab, tabs, transaction } = this.props;
    if (transaction.status !== STATUS.SUCCESS) {
      return null;
    }

    return (
      <WiremockContainer>
        <h3>Transaction sample</h3>
        {tabs.map(key => {
          return (
            <Tab selected={transactionTab === key} key={key}>
              <RelativeLink query={{ transactionTab: key }}>
                {key.toUpperCase()}
              </RelativeLink>
            </Tab>
          );
        })}

        <TabContentContainer>
          {transactionTab === 'timeline'
            ? <Traces
                totalDuration={get(transaction.data, TRANSACTION_DURATION)}
              />
            : <TransactionTable
                tabData={transaction.data.context[transactionTab]}
                tabKey={transactionTab}
              />}
        </TabContentContainer>
      </WiremockContainer>
    );
  }
}

export default Transaction;
