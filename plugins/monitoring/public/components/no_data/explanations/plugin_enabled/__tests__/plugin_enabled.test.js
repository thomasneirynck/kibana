import React from 'react';
import { render } from 'enzyme';
import { ExplainPluginEnabled } from '../plugin_enabled';

describe('ExplainPluginEnabled', () => {
  test('should explain about xpack.monitoring.enabled setting', () => {
    const component = render(
      <ExplainPluginEnabled
        property="xpack.monitoring.enabled"
        data="false"
        context="cluster"
      />
    );
    expect(component).toMatchSnapshot();
  });
});
