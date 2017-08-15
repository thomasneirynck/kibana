import _ from 'lodash';
import { shallow } from 'enzyme';
import React from 'react';

import { IndexTable } from './index_table';

jest.mock('ui/chrome', () => {}, { virtual: true });
jest.mock('ui/notify/notifier', () => ({
  Notifier: function Notifier() {},
}), { virtual: true });


describe('IndexTable', () => {
  test('renders the index count', () => {
    const component = (
      <IndexTable
        indices={ {
          index2: { name: 'index1' },
          index1: { name: 'index2' },
          index3: { name: 'index3' },
        } }
      />
    );

    const wrapper = shallow(component);

    expect(wrapper.findWhere((node) => node.childAt(0).text() === '3 indices').exists()).toBe(true);
  });

  test('renders an IndexTableRow for every index sorted by name', () => {
    const component = (
      <IndexTable
        indices={ {
          index2: { name: 'index1' },
          index1: { name: 'index2' },
          index3: { name: 'index3' },
        } }
      />
    );

    const wrapper = shallow(component);

    expect(wrapper.find('IndexTableRow').map(_.identity)).toMatchSnapshot();
  });
});
