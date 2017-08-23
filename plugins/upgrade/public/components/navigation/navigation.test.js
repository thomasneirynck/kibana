import { render } from 'enzyme';
import React from 'react';

import { UpgradeSectionNavigation } from './navigation';


const VIEWS = {
  HOME: {
    label: 'home label',
    location: 'home',
    absoluteLocation: '/absolute/home/location',
  },
  CHECKUP: {
    label: 'checkup label',
    location: 'checkup',
    absoluteLocation: '/absolute/checkup/location',
  },
  REINDEX: {
    label: 'reindex label',
    location: 'reindex',
    absoluteLocation: '/absolute/reindex/location',
  },
  LOGGING: {
    label: 'logging label',
    location: 'logging',
    absoluteLocation: '/absolute/logging/location',
  },
};

describe('UpgradeSectionNavigation', () => {
  test('renders the views as tabs using their labels and absolute locations', () => {
    const component = (
      <UpgradeSectionNavigation
        views={VIEWS}
      />
    );

    expect(render(component)).toMatchSnapshot();
  });

  test('renders the view as selected if the currentViewLocation matches', () => {
    const component = (
      <UpgradeSectionNavigation
        views={VIEWS}
        currentViewLocation="checkup"
      />
    );

    expect(render(component)).toMatchSnapshot();
  });
});
