import React, { Component } from 'react';
import styled from 'styled-components';
import { STATUS } from '../../../../constants';
import { unit, units, colors } from '../../../../style/variables';
import WiremockContainer from '../../../shared/WiremockContainer';
import { RelativeLink } from '../../../../utils/url';
import Tab from '../../../shared/Tab';
import {
  PropertiesTable,
  getLevelOneProps
} from '../../../shared/PropertiesTable';
import Traces from './Traces/container';

function loadTransaction(props) {
  const { appName, start, end, transactionId } = props.urlParams;
  if (
    appName &&
    start &&
    end &&
    transactionId &&
    !props.transactionNext.status
  ) {
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

const DEFAULT_TAB = 'timeline';

// Ensure the selected tab exists or use the default
function getCurrentTab(tabs = [], detailTab) {
  return tabs.includes(detailTab) ? detailTab : DEFAULT_TAB;
}

function getTabs(transaction) {
  const dynamicProps = Object.keys(transaction.data.context);
  return getLevelOneProps(dynamicProps);
}

class Transaction extends Component {
  componentDidMount() {
    loadTransaction(this.props);
  }

  componentWillReceiveProps(nextProps) {
    loadTransaction(nextProps);
  }

  render() {
    const { transaction } = this.props;
    if (transaction.status !== STATUS.SUCCESS) {
      return null;
    }

    const tabs = getTabs(transaction);
    const currentTab = getCurrentTab(tabs, this.props.urlParams.detailTab);

    return (
      <WiremockContainer>
        <h3>Transaction sample</h3>
        {[DEFAULT_TAB, ...tabs].map(key => {
          return (
            <Tab selected={currentTab === key} key={key}>
              <RelativeLink query={{ detailTab: key }}>
                {key.toUpperCase()}
              </RelativeLink>
            </Tab>
          );
        })}

        <TabContentContainer>
          {currentTab === DEFAULT_TAB
            ? <Traces />
            : <PropertiesTable
                propData={transaction.data.context[currentTab]}
                propKey={currentTab}
              />}
        </TabContentContainer>
      </WiremockContainer>
    );
  }
}

export default Transaction;
