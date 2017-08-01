import { shallow } from 'enzyme';
import React from 'react';

import { UpgradeSection } from './section';


const createStubView = (name) => {
  const stubView = () => (
    <div />
  );
  stubView.displayName = name;

  return stubView;
};

const VIEWS = {
  HOME: {
    component: createStubView('HomeView'),
    label: 'home label',
    location: 'home',
  },
  CHECKUP: {
    component: createStubView('CheckupView'),
    label: 'checkup label',
    location: 'checkup',
  },
  REINDEX: {
    component: createStubView('ReindexView'),
    label: 'reindex label',
    location: 'reindex',
  },
  LOGGING: {
    component: createStubView('LoggingView'),
    label: 'logging label',
    location: 'logging',
  },
};

describe('UpgradeSection', () => {
  test('renders the default view if no location is given', () => {
    const component = (
      <UpgradeSection
        defaultViewId="HOME"
        views={ VIEWS }
      />
    );

    expect(shallow(component).find('HomeView').exists()).toBe(true);
  });
});
