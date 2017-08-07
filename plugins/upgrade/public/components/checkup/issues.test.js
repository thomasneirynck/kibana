import { shallow } from 'enzyme';
import React from 'react';

import { Issues } from './issues';

jest.mock('ui/chrome', () => {}, { virtual: true });
jest.mock('ui/notify/notifier', () => ({
  Notifier: function () {},
}), { virtual: true });


describe('Issues', () => {
  test('renders the className property', () => {
    const component = (
      <Issues className="myClass" />
    );

    expect(shallow(component)).toMatchSnapshot();
  });

  test('renders a list of Issue components', () => {
    const issues = [
      {
        details: 'issue 1 details',
        level: 'issue 1 level',
        message: 'issue 1 message',
        url: 'issue 1 url',
      },
      {
        details: 'issue 2 details',
        level: 'issue 2 level',
        message: 'issue 2 message',
        url: 'issue 2 url',
      },
    ];
    const component = (
      <Issues issues={ issues } />
    );

    expect(shallow(component)).toMatchSnapshot();
  });
});
