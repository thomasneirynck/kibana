import React from 'react';
import styled from 'styled-components';
import { units, px, colors, borderRadius } from '../../../style/variables';
import { get, capitalize, isEmpty } from 'lodash';
import { STATUS } from '../../../constants';

import { Properties } from '../../shared/ContextProperties';
import { TabLink } from '../../shared/UIComponents';
import DiscoverButton from '../../shared/DiscoverButton';
import {
  PropertiesTable,
  getLevelOneProps
} from '../../shared/PropertiesTable';
import Stacktrace from '../../shared/Stacktrace';
import {
  SERVICE_NAME,
  ERROR_GROUP_ID,
  SERVICE_AGENT_NAME,
  SERVICE_LANGUAGE_NAME
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

function getTabs(context) {
  const dynamicProps = Object.keys(context);
  return [STACKTRACE_TAB, ...getLevelOneProps(dynamicProps)];
}

function DetailView({ errorGroup, urlParams }) {
  if (errorGroup.status !== STATUS.SUCCESS) {
    return null;
  }

  if (isEmpty(errorGroup.data.error)) {
    return null;
  }

  const { serviceName } = urlParams;

  const timestamp = get(errorGroup, 'data.error.@timestamp');
  const url = get(errorGroup.data.error, 'context.request.url.raw', 'N/A');

  const stackframes = get(errorGroup.data.error.error, 'exception.stacktrace');
  const codeLanguage = get(errorGroup.data.error, SERVICE_LANGUAGE_NAME);

  const context = get(errorGroup.data.error.error, 'context', []);
  const tabs = getTabs(context);
  const currentTab = getCurrentTab(tabs, urlParams.detailTab);

  const occurencesCount = errorGroup.data.occurrencesCount;
  const groupId = errorGroup.data.groupId;

  const agentName = get(errorGroup.data.error, SERVICE_AGENT_NAME);

  const discoverQuery = {
    _a: {
      interval: 'auto',
      query: {
        language: 'lucene',
        query: `${SERVICE_NAME}:${serviceName} AND ${ERROR_GROUP_ID}:${groupId}`
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

      <Properties timestamp={timestamp} url={url} />

      <TabContainer>
        {tabs.map(key => {
          return (
            <TabLink
              query={{ detailTab: key }}
              selected={currentTab === key}
              key={key}
            >
              {capitalize(key)}
            </TabLink>
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
