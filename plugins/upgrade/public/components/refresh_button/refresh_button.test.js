import { shallow } from 'enzyme';
import React from 'react';

import { RefreshButton } from './refresh_button';
import { timeout } from '../../lib/util';

jest.mock('ui/chrome', () => {}, { virtual: true });
jest.mock('ui/notify/notifier', () => ({
  Notifier: function Notifier() {},
}), { virtual: true });
jest.mock('../../lib/util');


describe('RefreshButton', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('renders the className property', () => {
    const component = (
      <RefreshButton className="specificStatusGroup" />
    );

    expect(shallow(component)).toMatchSnapshot();
  });

  test('renders the buttonLabel property', () => {
    const component = (
      <RefreshButton buttonLabel="A different label" />
    );

    expect(shallow(component)).toMatchSnapshot();
  });

  test('is disabled until the promises returned by onClick and timeout have been resolved', async () => {
    let resolveOnClick;
    const onClickPromise = new Promise((resolve) => resolveOnClick = resolve);
    const onClick = jest.fn().mockReturnValue(onClickPromise);
    let resolveTimeout;
    const timeoutPromise = new Promise((resolve) => resolveTimeout = resolve);
    timeout.mockReturnValue(timeoutPromise);
    const component = (
      <RefreshButton onClick={ onClick } />
    );

    const wrapper = shallow(component);

    expect(wrapper.find('KuiButton').prop('disabled')).toBe(false);
    wrapper.find('KuiButton').prop('onClick')();

    expect(wrapper.find('KuiButton').prop('disabled')).toBe(true);
    expect(wrapper.find('KuiButton').contains('Running...')).toBe(true);

    resolveOnClick();
    await expect(onClickPromise).resolves.toBe();

    expect(wrapper.find('KuiButton').prop('disabled')).toBe(true);
    expect(wrapper.find('KuiButton').contains('Running...')).toBe(true);

    resolveTimeout();
    await expect(timeoutPromise).resolves.toBe();

    expect(timeout).toHaveBeenCalledWith(expect.any(Number));
    expect(wrapper.find('KuiButton').prop('disabled')).toBe(false);
    expect(wrapper.find('KuiButton').contains('Running...')).toBe(false);
  });

  test('is disabled until the promise returned by onClick has been rejected', async () => {
    let rejectOnClick;
    const onClickPromise = new Promise((resolve, reject) => rejectOnClick = reject);
    const onClick = jest.fn().mockReturnValue(onClickPromise);
    const component = (
      <RefreshButton onClick={ onClick } />
    );

    const wrapper = shallow(component);

    expect(wrapper.find('KuiButton').prop('disabled')).toBe(false);
    wrapper.find('KuiButton').prop('onClick')();

    expect(wrapper.find('KuiButton').prop('disabled')).toBe(true);
    expect(wrapper.find('KuiButton').contains('Running...')).toBe(true);

    rejectOnClick();
    await expect(onClickPromise).rejects.toBe();

    expect(timeout).not.toHaveBeenCalled();
    expect(wrapper.find('KuiButton').prop('disabled')).toBe(false);
    expect(wrapper.find('KuiButton').contains('Running...')).toBe(false);
  });
});
