import { shallow } from 'enzyme';
import React from 'react';

import { NodeDeprecations } from './node_deprecations';

jest.mock('ui/chrome', () => {}, { virtual: true });
jest.mock('ui/notify/notifier', () => ({
  Notifier: function () {},
}), { virtual: true });


describe('NodeDeprecations', () => {
  test('renders the className property', () => {
    const component = (
      <NodeDeprecations className="myClass" />
    );

    expect(shallow(component)).toMatchSnapshot();
  });

  test('renders a success message when there are no deprecations', () => {
    const component = (
      <NodeDeprecations deprecations={[]}/>
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
      <NodeDeprecations deprecations={deprecations}/>
    );

    expect(shallow(component)).toMatchSnapshot();
  });
});
