import _ from 'lodash';
import { shallow } from 'enzyme';
import React from 'react';

import { CheckupView } from './checkup_view';
import { getDeprecations } from '../../lib/checkup';

jest.mock('ui/chrome', () => {}, { virtual: true });
jest.mock('ui/notify/notifier', () => ({
  Notifier: function Notifier() {},
}), { virtual: true });
jest.mock('../../lib/checkup');


describe('CheckupView', () => {
  afterEach(() => {
    getDeprecations.mockReset();
  });

  test('renders an expanded InfoGroup by default', () => {
    const component = (
      <CheckupView
        setViewState={ _.noop }
        viewState={ {} }
      />
    );

    const wrapper = shallow(component).dive();

    expect(wrapper.find('InfoGroup').prop('isCollapsed')).toBe(false);
  });

  test('renders a collapsed InfoGroup when the viewState declares it', () => {
    const component = (
      <CheckupView
        setViewState={ _.noop }
        viewState={ {
          CheckupView: {
            isInfoCollapsed: true,
          },
        } }
      />
    );

    const wrapper = shallow(component).dive();

    expect(wrapper.find('InfoGroup').prop('isCollapsed')).toBe(true);
  });

  test('calls setViewState when the InfoPanel\'s collapse button is clicked' , () => {
    const setViewState = jest.fn();
    const component = (
      <CheckupView
        setViewState={ setViewState }
        viewState={ {} }
      />
    );

    const wrapper = shallow(component).dive();
    wrapper.find('InfoGroup').prop('onChangeCollapsed')();

    expect(setViewState).toHaveBeenCalledTimes(1);
  });

  test('renders the CheckupOutput after successfully loading the deprecations', async () => {
    const responsePromise = Promise.resolve({
      cluster_settings: [],
      index_settings: {},
      node_settings: [],
    });
    getDeprecations.mockReturnValue(responsePromise);

    const component = (
      <CheckupView
        setViewState={ _.noop }
        viewState={ {} }
      />
    );

    const wrapper = shallow(component).dive();
    wrapper.instance().componentDidMount();
    await responsePromise;

    expect(getDeprecations).toHaveBeenCalledWith();
    const outputProp = wrapper.find('CheckupOutput').prop('output');
    expect(outputProp).toHaveProperty('cluster_settings');
    expect(outputProp).toHaveProperty('index_settings');
    expect(outputProp).toHaveProperty('node_settings');
  });

  test('renders an ErrorPanel after unsuccessfully trying to load the deprecations', async () => {
    const responsePromise = Promise.reject({
      message: 'an error'
    });
    getDeprecations.mockReturnValue(responsePromise);

    const component = (
      <CheckupView
        setViewState={ _.noop }
        viewState={ {} }
      />
    );

    const wrapper = shallow(component).dive();
    wrapper.instance().componentDidMount();
    await expect(responsePromise).rejects.toBeDefined;

    expect(getDeprecations).toHaveBeenCalledWith();
    expect(wrapper.find('ErrorPanel').contains('an error')).toBe(true);
  });

  test('renders a RefreshButton that reloads the deprecations', async () => {
    const responsePromise = Promise.resolve({
      cluster_settings: [],
      index_settings: {},
      node_settings: [],
    });
    getDeprecations.mockReturnValue(responsePromise);

    const component = (
      <CheckupView
        setViewState={ _.noop }
        viewState={ {} }
      />
    );

    const wrapper = shallow(component).dive();

    expect(wrapper.find('CheckupOutput').exists()).toBe(false);

    expect(wrapper.find('RefreshButton').exists()).toBe(true);
    wrapper.find('RefreshButton').simulate('click');
    await responsePromise;

    expect(getDeprecations).toHaveBeenCalledWith();
    expect(wrapper.find('CheckupOutput').exists()).toBe(true);
  });
});
