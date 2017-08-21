import React from 'react';
import styled from 'styled-components';
import { fontSize, fontSizes } from '../../../style/variables';
import Breadcrumbs from '../../shared/Breadcrumbs';
import PageHeader from '../../shared/PageHeader';
import Input from '../../shared/Input';
import withApp from '../../shared/withApp';
import withErrorHandler from '../../shared/withErrorHandler';

const SectionTitle = styled.h2`font-size: ${fontSizes.xlarge};`;

const SettingLabel = styled.h3`
  font-size: ${fontSize};
  font-weight: bold;
`;

const SettingField = Input.extend``;

function AppSettings({ app }) {
  const appName = app.data.appName || '';
  return (
    <div>
      <Breadcrumbs />
      <PageHeader title="Settings" showSettingsButton={false} />
      <SectionTitle>General</SectionTitle>
      <SettingLabel>App ID</SettingLabel>
      <SettingField type="text" value={appName} disabled />
    </div>
  );
}

export default withApp(withErrorHandler(AppSettings, ['app']));
