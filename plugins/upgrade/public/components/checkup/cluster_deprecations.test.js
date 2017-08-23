import { shallow } from 'enzyme';
import React from 'react';

import { ClusterDeprecations } from './cluster_deprecations';

jest.mock('ui/chrome', () => {}, { virtual: true });
jest.mock('ui/notify/notifier', () => ({
  Notifier: function () {},
}), { virtual: true });


describe('ClusterDeprecations', () => {
  test('renders the className property', () => {
    const component = (
      <ClusterDeprecations className="myClass" />
    );

    expect(shallow(component)).toMatchSnapshot();
  });

  test('renders a success message when there are no deprecations', () => {
    const component = (
      <ClusterDeprecations deprecations={[]}/>
    );

    expect(shallow(component)).toMatchSnapshot();
  });

  test('renders Issues and IssueSummary components when there are deprecations', () => {
    const deprecations = [
      { level: 'info', },
      { level: 'critical', },
      { level: 'critical', },
    ];
    const component = (
      <ClusterDeprecations deprecations={deprecations}/>
    );

    expect(shallow(component)).toMatchSnapshot();
  });
});
