import React from 'react';
import styled from 'styled-components';
import {
  unit,
  units,
  px,
  colors,
  fontSizes,
  borderRadius
} from '../../../style/variables';
import { get, capitalize, isEmpty } from 'lodash';
import { STATUS } from '../../../constants';
import {
  PropertiesTable,
  getLevelOneProps
} from '../../shared/PropertiesTable';

import moment from 'moment';
import Tab from '../../shared/Tab';
import Stacktrace from '../../shared/Stacktrace';

const Container = styled.div`
  position: relative;
  border: 1px solid ${colors.gray4};
  border-radius: ${borderRadius};
  padding: ${px(units.plus)};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
`;

const Properties = styled.div`
  display: flex;
  margin: ${px(units.double)} 0;
  width: 100%;
  justify-content: space-between;
  flex-flow: row wrap;
`;

const Property = styled.div`
  width: 30%;
  margin-bottom: ${px(units.plus)};
`;

const PropertyLabel = styled.div`
  margin-bottom: ${px(units.quarter)};
`;

const PropertyValue = styled.div`
  font-weight: bold;
  font-size: ${fontSizes.large};
`;

function AllOccurrencesLink({ errorGroup, appName }) {
  const groupId = errorGroup.group_id;
  const occurrencesCount = errorGroup.occurrences_count;

  if (!appName || !groupId) {
    return null;
  }

  const DiscoverLink = styled.a`
    margin: ${px(units.plus)} ${px(unit)} 0;
  `;

  const DiscoverIcon = styled.img`
    height: 18px;
    margin-top: -3px;
    margin-right: 6px;
    background: ${colors.blue1};
    padding: 2px;
    border-radius: 4px;
    vertical-align: middle;
  `;

  const discoverRoute = `/app/kibana#/discover?_g=(refreshInterval:(display:Off,pause:!f,value:0),time:(from:now-24h,mode:quick,to:now))&_a=(interval:auto,query:(language:lucene,query:'context.app.name:${appName}%20AND%20error.grouping_key:${groupId}'),sort:!('@timestamp',desc))`;
  return (
    <DiscoverLink href={discoverRoute}>
      <DiscoverIcon src="/plugins/kibana/assets/discover.svg" />
      View {occurrencesCount} occurrences
    </DiscoverLink>
  );
}

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
  const timestamp = moment(get(errorGroup, 'data.error.@timestamp')).format();

  const stackframes = get(errorGroup.data.error.error.exception, 'stacktrace');
  const codeLanguage = get(errorGroup.data.error, 'context.app.language.name');

  const tabs = getTabs(errorGroup);
  const currentTab = getCurrentTab(tabs, urlParams.detailTab);

  return (
    <Container>
      <Header>
        <h3>Error occurrence</h3>
        <AllOccurrencesLink errorGroup={errorGroup.data} appName={appName} />
      </Header>
      <Properties>
        <Property>
          <PropertyLabel>Occurrence recorded</PropertyLabel>
          <PropertyValue>{timestamp}</PropertyValue>
        </Property>
        {[1, 2, 3, 4, 5].map(item => {
          return (
            <Property key={item}>
              <PropertyLabel>Data label</PropertyLabel>
              <PropertyValue>Value</PropertyValue>
            </Property>
          );
        })}
      </Properties>

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

      <div>
        {currentTab === STACKTRACE_TAB ? (
          <Stacktrace stackframes={stackframes} codeLanguage={codeLanguage} />
        ) : (
          <PropertiesTable
            propData={errorGroup.data.error.context[currentTab]}
            propKey={currentTab}
          />
        )}
      </div>
    </Container>
  );
}

export default DetailView;
