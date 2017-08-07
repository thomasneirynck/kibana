import { shallow } from 'enzyme';
import React from 'react';

import { IssueSymbol } from './issue_symbol';

jest.mock('ui/chrome', () => {}, { virtual: true });
jest.mock('ui/notify/notifier', () => ({
  Notifier: function () {},
}), { virtual: true });


describe('IssueSymbol', () => {
  test('renders a symbol for the "critical" level', () => {
    const component = (
      <IssueSymbol level="critical" />
    );

    expect(shallow(component)).toMatchSnapshot();
  });

  test('renders a symbol for the "info" level', () => {
    const component = (
      <IssueSymbol level="info" />
    );

    expect(shallow(component)).toMatchSnapshot();
  });

  test('renders a symbol for the "none" level', () => {
    const component = (
      <IssueSymbol level="none" />
    );

    expect(shallow(component)).toMatchSnapshot();
  });

  test('renders a symbol for the "warning" level', () => {
    const component = (
      <IssueSymbol level="warning" />
    );

    expect(shallow(component)).toMatchSnapshot();
  });
});
