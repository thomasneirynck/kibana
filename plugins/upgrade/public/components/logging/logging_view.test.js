import _ from 'lodash';
import { shallow } from 'enzyme';
import React from 'react';

import { LoggingView } from './logging_view';
import { getFromApi } from '../../lib/request';

jest.mock('ui/chrome', () => {}, { virtual: true });
jest.mock('ui/notify/notifier', () => ({
  Notifier: function Notifier() {},
}), { virtual: true });
jest.mock('../../lib/request');


describe('LoggingView', () => {
  afterEach(() => {
    getFromApi.mockReset();
  });

  test('renders an expanded InfoGroup by default', () => {
    const component = (
      <LoggingView
        setViewState={_.noop}
        viewState={{}}
      />
    );

    const wrapper = shallow(component).dive();

    expect(wrapper.find('InfoGroup').prop('isCollapsed')).toBe(false);
  });

  test('renders a collapsed InfoGroup when the viewState declares it', () => {
    const component = (
      <LoggingView
        setViewState={_.noop}
        viewState={{
          LoggingView: {
            isInfoCollapsed: true,
          },
        }}
      />
    );

    const wrapper = shallow(component).dive();

    expect(wrapper.find('InfoGroup').prop('isCollapsed')).toBe(true);
  });

  test('calls setViewState when the InfoPanel\'s collapse button is clicked' , () => {
    const setViewState = jest.fn();
    const component = (
      <LoggingView
        setViewState={setViewState}
        viewState={{}}
      />
    );

    const wrapper = shallow(component).dive();
    wrapper.find('InfoGroup').prop('onChangeCollapsed')();

    expect(setViewState).toHaveBeenCalledTimes(1);
  });

  test('renders a LoadingIndicator while loading the logging status', async () => {
    const responsePromise = new Promise(_.noop);
    getFromApi.mockReturnValue(responsePromise);

    const component = (
      <LoggingView
        setViewState={_.noop}
        viewState={{}}
      />
    );

    const wrapper = shallow(component).dive();
    wrapper.instance().componentDidMount();

    expect(getFromApi).toHaveBeenCalledWith('/api/migration/deprecation_logging');
    expect(wrapper.find('LoadingIndicator').exists()).toBe(true);
  });

  test('renders the LoggingForm after successfully loading the logging status', async () => {
    const responsePromise = Promise.resolve({
      isEnabled: true,
    });
    getFromApi.mockReturnValue(responsePromise);

    const component = (
      <LoggingView
        setViewState={_.noop}
        viewState={{}}
      />
    );

    const wrapper = shallow(component).dive();
    wrapper.instance().componentDidMount();
    await responsePromise;

    expect(getFromApi).toHaveBeenCalledWith('/api/migration/deprecation_logging');
    expect(wrapper.find('LoggingForm').prop('isLoggingEnabled')).toBe(true);
  });

  test('renders an ErrorPanel after unsuccessfully trying to load the logging status', async () => {
    const responsePromise = Promise.reject({
      error: 'an error'
    });
    getFromApi.mockReturnValue(responsePromise);

    const component = (
      <LoggingView
        setViewState={_.noop}
        viewState={{}}
      />
    );

    const wrapper = shallow(component).dive();
    wrapper.instance().componentDidMount();
    await expect(responsePromise).rejects.toBeDefined;

    expect(getFromApi).toHaveBeenCalledWith('/api/migration/deprecation_logging');
    expect(wrapper.find('ErrorPanel').contains('an error')).toBe(true);
  });
});
