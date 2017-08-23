import { shallow } from 'enzyme';
import React from 'react';
import sinon from 'sinon';

import { HomeView } from './home';


const VIEWS = {
  CHECKUP: {
    absoluteLocation: '/absolute/checkup/location',
  },
  REINDEX: {
    absoluteLocation: '/absolute/reindex/location',
  },
  LOGGING: {
    absoluteLocation: '/absolute/logging/location',
  },
};

describe('HomeView', () => {
  test('renders view links using the absolute locations', () => {
    const component = (
      <HomeView
        views={VIEWS}
        viewState={{}}
      />
    );

    const wrapper = shallow(component).dive();

    expect(wrapper.find(`a[href="${VIEWS.CHECKUP.absoluteLocation}"]`).exists()).toBe(true);
    expect(wrapper.find(`a[href="${VIEWS.REINDEX.absoluteLocation}"]`).exists()).toBe(true);
    expect(wrapper.find(`a[href="${VIEWS.LOGGING.absoluteLocation}"]`).exists()).toBe(true);
  });

  test('renders an expanded InfoGroup by default', () => {
    const component = (
      <HomeView
        viewState={{}}
      />
    );

    const wrapper = shallow(component).dive();

    expect(wrapper.find('InfoGroup').prop('isCollapsed')).toBe(false);
  });

  test('renders a collapsed InfoGroup when the viewState requires it', () => {
    const component = (
      <HomeView
        viewState={{
          HomeView: {
            isInfoCollapsed: true,
          },
        }}
      />
    );

    const wrapper = shallow(component).dive();

    expect(wrapper.find('InfoGroup').prop('isCollapsed')).toBe(true);
  });

  test(`calls setViewState when the InfoPanel's collapse button is clicked` , () => {
    const setViewState = sinon.stub();
    const component = (
      <HomeView
        setViewState={setViewState}
        viewState={{}}
      />
    );

    const wrapper = shallow(component).dive();
    wrapper.find('InfoGroup').prop('onChangeCollapsed')();

    expect(setViewState).toHaveProperty('calledOnce', true);
  });
});
