import { shallow } from 'enzyme';
import React from 'react';

import { StatusGroup } from './status_group';


describe('StatusGroup', () => {
  test('renders the className, title and status properties', () => {
    const component = (
      <StatusGroup
        className="specificStatusGroup"
        title="A different title"
        status="the status"
      />
    );

    expect(shallow(component)).toMatchSnapshot();
  });

  test('renders its children by default', () => {
    const component = (
      <StatusGroup>
        Info Message
      </StatusGroup>
    );

    expect(shallow(component)).toMatchSnapshot();
  });

  test('renders its children by default when isInitiallyCollapsed is false', () => {
    const component = (
      <StatusGroup isInitiallyCollapsed={ false }>
        Info Message
      </StatusGroup>
    );

    expect(shallow(component)).toMatchSnapshot();
  });

  test('does not render its children by default when isInitiallyCollapsed is true', () => {
    const component = (
      <StatusGroup isInitiallyCollapsed={ true }>
        Info Message
      </StatusGroup>
    );

    expect(shallow(component)).toMatchSnapshot();
  });

  test('renders its children after being expanded via the toggle button', () => {
    const component = (
      <StatusGroup isInitiallyCollapsed={ true }>
        Info Message
      </StatusGroup>
    );

    const wrapper = shallow(component);
    wrapper.find('button').simulate('click');

    expect(wrapper).toMatchSnapshot();
  });

  test('does not render its children after being collapsed via the toggle button', () => {
    const component = (
      <StatusGroup isInitiallyCollapsed={ false }>
        Info Message
      </StatusGroup>
    );

    const wrapper = shallow(component);
    wrapper.find('button').simulate('click');

    expect(wrapper).toMatchSnapshot();
  });
});
