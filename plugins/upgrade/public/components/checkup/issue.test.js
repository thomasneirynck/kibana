import { shallow } from 'enzyme';
import React from 'react';

import { Issue } from './issue';

jest.mock('ui/chrome', () => {}, { virtual: true });
jest.mock('ui/notify/notifier', () => ({
  Notifier: function () {},
}), { virtual: true });


describe('Issue', () => {
  test('renders the details property', () => {
    const component = (
      <Issue details="issue details" />
    );

    expect(shallow(component)).toMatchSnapshot();
  });

  test('renders the level property', () => {
    const component = (
      <Issue level="info" />
    );

    expect(shallow(component)).toMatchSnapshot();
  });

  test('renders the message property', () => {
    const component = (
      <Issue message="a message" />
    );

    expect(shallow(component)).toMatchSnapshot();
  });

  test('renders the url property', () => {
    const component = (
      <Issue url="/some/url" />
    );

    expect(shallow(component)).toMatchSnapshot();
  });
});
