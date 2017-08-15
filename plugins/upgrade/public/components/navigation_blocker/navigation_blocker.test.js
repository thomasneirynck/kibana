import { shallow } from 'enzyme';
import React from 'react';

import { withNavigationBlocker } from './navigation_blocker';


function InnerComponent() {}

describe('withNavigationBlocker', () => {
  test('renders the wrapped component', () => {
    const WrappedComponent = withNavigationBlocker({
      predicate: () => false,
    })(InnerComponent);

    const component = (
      <WrappedComponent
        propA="prop A value"
        propB="prop B value"
      />
    );

    const wrapper = shallow(component);

    expect(wrapper.find('InnerComponent').props()).toMatchObject({
      propA: 'prop A value',
      propB: 'prop B value',
    });
  });

  test('does not render a modal by default', () => {
    const WrappedComponent = withNavigationBlocker({
      predicate: () => false,
    })(InnerComponent);

    const component = (
      <WrappedComponent />
    );

    const wrapper = shallow(component);

    expect(wrapper.find('KuiConfirmModal').exists()).toBe(false);
  });

  test('registers and unregisters a listener for route changes when mounted and unmounted', () => {
    const WrappedComponent = withNavigationBlocker({
      predicate: () => false,
    })(InnerComponent);
    const unregisterRouteChangeListener = jest.fn();
    const registerRouteChangeListener = jest.fn()
      .mockReturnValue(unregisterRouteChangeListener);

    const component = (
      <WrappedComponent
        registerRouteChangeListener={ registerRouteChangeListener }
      />
    );

    const wrapper = shallow(component);
    wrapper.instance().componentDidMount();

    expect(registerRouteChangeListener).toHaveBeenCalledWith(expect.any(Function));
    expect(unregisterRouteChangeListener).not.toHaveBeenCalled();

    wrapper.instance().componentWillUnmount();

    expect(unregisterRouteChangeListener).toHaveBeenCalledWith();
  });

  test('renders a modal and blocks the navigation when the route has changed while the predicate returns true', () => {
    const WrappedComponent = withNavigationBlocker({
      predicate: () => true,
    })(InnerComponent);
    const registerRouteChangeListener = jest.fn();

    const component = (
      <WrappedComponent
        registerRouteChangeListener={ registerRouteChangeListener }
      />
    );

    const wrapper = shallow(component);
    wrapper.instance().componentDidMount();
    const blockNavigation = registerRouteChangeListener.mock.calls[0][0]('a/target/url');

    expect(blockNavigation).toBe(true);
    expect(wrapper.find('KuiConfirmModal').exists()).toBe(true);
  });

  test('hides the modal and resumes navigation when the modal has been confirmed', () => {
    const WrappedComponent = withNavigationBlocker({
      predicate: () => true,
    })(InnerComponent);
    const navigateTo = jest.fn();
    const registerRouteChangeListener = jest.fn();

    const component = (
      <WrappedComponent
        navigateTo={ navigateTo }
        registerRouteChangeListener={ registerRouteChangeListener }
      />
    );

    const wrapper = shallow(component);
    wrapper.instance().componentDidMount();
    registerRouteChangeListener.mock.calls[0][0]('a/target/url');
    wrapper.find('KuiConfirmModal').prop('onConfirm')();

    expect(wrapper.find('KuiConfirmModal').exists()).toBe(false);
    expect(navigateTo).toHaveBeenCalledWith('a/target/url');

    const blockNavigation = registerRouteChangeListener.mock.calls[0][0]('another/target/url');

    expect(blockNavigation).toBeFalsy();
  });

  test('hides the modal and blocks navigation when the modal has been canceled', () => {
    const WrappedComponent = withNavigationBlocker({
      predicate: () => true,
    })(InnerComponent);
    const navigateTo = jest.fn();
    const registerRouteChangeListener = jest.fn();

    const component = (
      <WrappedComponent
        navigateTo={ navigateTo }
        registerRouteChangeListener={ registerRouteChangeListener }
      />
    );

    const wrapper = shallow(component);
    wrapper.instance().componentDidMount();
    registerRouteChangeListener.mock.calls[0][0]('a/target/url');
    wrapper.find('KuiConfirmModal').prop('onCancel')();

    expect(wrapper.find('KuiConfirmModal').exists()).toBe(false);
    expect(navigateTo).not.toHaveBeenCalled();

    const blockNavigation = registerRouteChangeListener.mock.calls[0][0]('another/target/url');

    expect(blockNavigation).toBe(true);
  });

  test('does not render a modal or block navigation when the route has changed while the predicate returns false', () => {
    const WrappedComponent = withNavigationBlocker({
      predicate: () => false,
    })(InnerComponent);
    const registerRouteChangeListener = jest.fn();

    const component = (
      <WrappedComponent
        registerRouteChangeListener={ registerRouteChangeListener }
      />
    );

    const wrapper = shallow(component);
    wrapper.instance().componentDidMount();
    const blockNavigation = registerRouteChangeListener.mock.calls[0][0]('a/target/url');

    expect(blockNavigation).toBeFalsy();
    expect(wrapper.find('KuiConfirmModal').exists()).toBe(false);
  });
});
