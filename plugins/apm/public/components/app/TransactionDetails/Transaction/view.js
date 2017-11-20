import React, { Component } from 'react';
import styled from 'styled-components';
import { STATUS } from '../../../../constants';
import { units, colors, px } from '../../../../style/variables';
import { Tab } from '../../../shared/UIComponents';
import { capitalize, get } from 'lodash';
import {
  PropertiesTable,
  getLevelOneProps
} from '../../../shared/PropertiesTable';
import Traces from './Traces';
import DiscoverButton from '../../../shared/DiscoverButton';

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

const Container = styled.div`
  margin-top: ${px(units.triple)};
`;

const TabContentContainer = styled.div`
  border: 1px solid ${colors.gray4};
  border-radius: ${units.quarter}px;
  background-color: ${colors.white};
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
`;

const Title = styled.h3`
  margin-top: -${px(units.quarter)};
`;

const DEFAULT_TAB = 'timeline';

// Ensure the selected tab exists or use the default
function getCurrentTab(tabs = [], detailTab) {
  return tabs.includes(detailTab) ? detailTab : DEFAULT_TAB;
}

function getTabs(transactionData) {
  const dynamicProps = Object.keys(transactionData.context || {});
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
    const { appName, transactionId } = this.props.urlParams;

    if (transaction.status !== STATUS.SUCCESS) {
      return null;
    }

    const tabs = getTabs(transaction.data);
    const currentTab = getCurrentTab(tabs, this.props.urlParams.detailTab);

    const discoverQuery = {
      _a: {
        interval: 'auto',
        query: {
          language: 'lucene',
          query: `context.app.name:${appName} AND transaction.id:${
            transactionId
          }`
        },
        sort: { '@timestamp': 'desc' }
      }
    };

    return (
      <Container>
        <Header>
          <Title>Transaction sample</Title>
          <DiscoverButton query={discoverQuery}>
            {`View transaction in Discover`}
          </DiscoverButton>
        </Header>

        {[DEFAULT_TAB, ...tabs].map(key => {
          return (
            <Tab
              query={{ detailTab: key }}
              selected={currentTab === key}
              key={key}
            >
              {capitalize(key)}
            </Tab>
          );
        })}

        <TabContentContainer>
          {currentTab === DEFAULT_TAB ? (
            <Traces />
          ) : (
            <PropertiesTable
              propData={get(transaction.data.context, currentTab)}
              propKey={currentTab}
            />
          )}
        </TabContentContainer>
      </Container>
    );
  }
}

export default Transaction;
