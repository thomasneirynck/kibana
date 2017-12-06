import React from 'react';
import styled from 'styled-components';
import moment from 'moment';
import { units, px, colors, borderRadius } from '../../../style/variables';
import { get, capitalize, isEmpty } from 'lodash';
import { STATUS } from '../../../constants';

import { Properties } from '../../shared/ContextProperties';
import { Tab } from '../../shared/UIComponents';
import DiscoverButton from '../../shared/DiscoverButton';
import {
  PropertiesTable,
  getLevelOneProps
} from '../../shared/PropertiesTable';
import Stacktrace from '../../shared/Stacktrace';
import {
  APP_NAME,
  ERROR_GROUP_ID,
  APP_AGENT_NAME
} from '../../../../common/constants';

const Container = styled.div`
  position: relative;
  border: 1px solid ${colors.gray4};
  border-radius: ${borderRadius};
  margin-top: ${px(units.plus)};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  padding: ${px(units.plus)};
`;

const Title = styled.h3`
  margin-top: -${px(units.quarter)};
`;

const TabContainer = styled.div`
  padding: 0 ${px(units.plus)};
  border-bottom: 1px solid ${colors.gray4};
`;

const TabContentContainer = styled.div`
  padding: ${px(units.plus)} ${px(units.plus)} 0;
`;

const STACKTRACE_TAB = 'stacktrace';

// Ensure the selected tab exists or use the first
function getCurrentTab(tabs = [], selectedTab) {
  return tabs.includes(selectedTab) ? selectedTab : tabs[0];
}

function getTabs(errorGroup) {
  const dynamicProps = Object.keys(errorGroup.data.error.context);
  return [STACKTRACE_TAB, ...getLevelOneProps(dynamicProps)];
}

function DetailView({ errorGroup, urlParams }) {
  if (errorGroup.status !== STATUS.SUCCESS) {
    return null;
  }

  if (isEmpty(errorGroup.data.error)) {
    return null;
  }

  const { appName } = urlParams;

  const timestamp = moment(get(errorGroup, 'data.error.@timestamp'));
  const timestampFull = timestamp.format('MMMM Do YYYY, HH:mm:ss.SSS');
  const timestampAgo = timestamp.fromNow();

  const stackframes = get(errorGroup.data.error.error.exception, 'stacktrace');
  const codeLanguage = get(errorGroup.data.error, 'context.app.language.name');

  const tabs = getTabs(errorGroup);
  const currentTab = getCurrentTab(tabs, urlParams.detailTab);

  const occurencesCount = errorGroup.data.occurrencesCount;
  const groupId = errorGroup.data.groupId;

  const url = get(errorGroup.data.error, 'context.request.url.raw', 'N/A');

  const agentName = get(errorGroup.data.error, APP_AGENT_NAME);

  const discoverQuery = {
    _a: {
      interval: 'auto',
      query: {
        language: 'lucene',
        query: `${APP_NAME}:${appName} AND ${ERROR_GROUP_ID}:${groupId}`
      },
      sort: { '@timestamp': 'desc' }
    }
  };

  return (
    <Container>
      <Header>
        <Title>Error occurrence</Title>
        <DiscoverButton query={discoverQuery}>
          {`View ${occurencesCount} occurences in Discover`}
        </DiscoverButton>
      </Header>

      <Properties
        timestampAgo={timestampAgo}
        timestampFull={timestampFull}
        url={url}
      />

      <TabContainer>
        {tabs.map(key => {
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
      </TabContainer>

      <TabContentContainer>
        {currentTab === STACKTRACE_TAB ? (
          <Stacktrace stackframes={stackframes} codeLanguage={codeLanguage} />
        ) : (
          <PropertiesTable
            propData={errorGroup.data.error.context[currentTab]}
            propKey={currentTab}
            agentName={agentName}
          />
        )}
      </TabContentContainer>
    </Container>
  );
}

export default DetailView;
