import { shallow } from 'enzyme';
import React from 'react';

import { IndexDeprecations } from './index_deprecations';

jest.mock('ui/chrome', () => {}, { virtual: true });
jest.mock('ui/notify/notifier', () => ({
  Notifier: function () {},
}), { virtual: true });


describe('IndexDeprecations', () => {
  test('renders the className property', () => {
    const component = (
      <IndexDeprecations className="myClass" />
    );

    expect(shallow(component)).toMatchSnapshot();
  });

  test('renders a success message when there are no deprecations', () => {
    const component = (
      <IndexDeprecations deprecations={ {} }/>
    );

    expect(shallow(component)).toMatchSnapshot();
  });

  test('renders Issues and IssueSummary components for each index when there are deprecations', () => {
    const deprecations = {
      index1: [
        { level: 'info', },
        { level: 'critical', },
        { level: 'critical', },
      ],
      index2: [
        { level: 'warning', },
        { level: 'info', },
        { level: 'none', },
      ],
    };
    const component = (
      <IndexDeprecations deprecations={ deprecations }/>
    );

    expect(shallow(component)).toMatchSnapshot();
  });
});
