import { shallow } from 'enzyme';
import React from 'react';

import { CheckupOutput } from './checkup_output';

jest.mock('ui/chrome', () => {}, { virtual: true });
jest.mock('ui/notify/notifier', () => ({
  Notifier: function () {},
}), { virtual: true });


describe('CheckupOutput', () => {
  test('renders the className property', () => {
    const component = (
      <CheckupOutput className="myClass" />
    );

    expect(shallow(component)).toMatchSnapshot();
  });

  test('renders Index-, Node- and ClusterDeprecations with the given deprecations', () => {
    const output = {
      index_settings: {
        index1: [],
      },
      node_settings: [
        {
          level: 'warning',
        },
      ],
      cluster_settings: [
        {
          level: 'critical',
        },
      ],
    };
    const component = (
      <CheckupOutput output={output}/>
    );

    expect(shallow(component)).toMatchSnapshot();
  });
});
