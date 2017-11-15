import React from 'react';
import styled from 'styled-components';
import moment from 'moment';
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
import DiscoverButton from '../../shared/DiscoverButton';
import { Tab } from '../../shared/UIComponents';
import Stacktrace from '../../shared/Stacktrace';

const Container = styled.div`
  position: relative;
  border: 1px solid ${colors.gray4};
  border-radius: ${borderRadius};
  padding: ${px(units.plus)};
  margin-top: ${px(units.plus)};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
`;

const Title = styled.h3`
  margin-top: -${px(units.quarter)};
`;

const Properties = styled.div`
  display: flex;
  margin: ${px(unit)} 0;
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
  font-size: ${fontSizes.small};
  color: ${colors.gray3};
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
  const timestamp = moment(get(errorGroup, 'data.error.@timestamp')).format();

  const stackframes = get(errorGroup.data.error.error.exception, 'stacktrace');
  const codeLanguage = get(errorGroup.data.error, 'context.app.language.name');

  const tabs = getTabs(errorGroup);
  const currentTab = getCurrentTab(tabs, urlParams.detailTab);

  const occurencesCount = errorGroup.data.occurrencesCount;
  const groupId = errorGroup.data.groupId;

  const discoverQuery = {
    _a: {
      interval: 'auto',
      query: {
        language: 'lucene',
        query: `context.app.name:${appName} AND error.grouping_key:${groupId}`
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
      <Properties>
        <Property>
          <PropertyLabel>@timestamp</PropertyLabel>
          <div>{timestamp}</div>
        </Property>
        {[1, 2, 3, 4, 5].map(item => {
          return (
            <Property key={item}>
              <PropertyLabel>Data label</PropertyLabel>
              <div>Value</div>
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
