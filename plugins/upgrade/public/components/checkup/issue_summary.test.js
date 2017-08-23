import { shallow } from 'enzyme';
import React from 'react';

import { IssueSummary } from './issue_summary';

jest.mock('ui/chrome', () => {}, { virtual: true });
jest.mock('ui/notify/notifier', () => ({
  Notifier: function () {},
}), { virtual: true });


describe('IssueSummary', () => {
  test('renders the className property', () => {
    const component = (
      <IssueSummary className="myClass" />
    );

    expect(shallow(component)).toMatchSnapshot();
  });

  test('renders a success message when all issue level counts are 0', () => {
    const issueLevelCounts = {
      'critical': 0,
      'info': 0,
      'none': 0,
      'warning': 0,
    };
    const component = (
      <IssueSummary issueLevelCounts={issueLevelCounts} />
    );

    expect(shallow(component)).toMatchSnapshot();
  });

  test('renders a success message when only the none level count is non-zero', () => {
    const issueLevelCounts = {
      'critical': 0,
      'info': 0,
      'none': 4,
      'warning': 0,
    };
    const component = (
      <IssueSummary issueLevelCounts={issueLevelCounts} />
    );

    expect(shallow(component)).toMatchSnapshot();
  });

  test('renders an info message when only none and info level counts are non-zero', () => {
    const issueLevelCounts = {
      'critical': 0,
      'info': 3,
      'none': 4,
      'warning': 0,
    };
    const component = (
      <IssueSummary issueLevelCounts={issueLevelCounts} />
    );

    expect(shallow(component)).toMatchSnapshot();
  });

  test('renders a warning message when only none, info and warning level counts are non-zero', () => {
    const issueLevelCounts = {
      'critical': 0,
      'info': 3,
      'none': 4,
      'warning': 2,
    };
    const component = (
      <IssueSummary issueLevelCounts={issueLevelCounts} />
    );

    expect(shallow(component)).toMatchSnapshot();
  });

  test('renders a critical message when the critical level count is non-zero', () => {
    const issueLevelCounts = {
      'critical': 1,
      'info': 3,
      'none': 4,
      'warning': 2,
    };
    const component = (
      <IssueSummary issueLevelCounts={issueLevelCounts} />
    );

    expect(shallow(component)).toMatchSnapshot();
  });
});
