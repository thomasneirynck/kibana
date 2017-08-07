import { shallow } from 'enzyme';
import React from 'react';

import { CheckupInfo } from './checkup_info';

jest.mock('ui/chrome', () => {}, { virtual: true });
jest.mock('ui/notify/notifier', () => ({
  Notifier: function () {},
}), { virtual: true });


describe('CheckupInfo', () => {
  test('renders the className property', () => {
    const component = (
      <CheckupInfo className="myClass" />
    );

    expect(shallow(component)).toMatchSnapshot();
  });
});
