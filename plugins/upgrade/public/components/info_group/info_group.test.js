import { render, shallow } from 'enzyme';
import React from 'react';
import sinon from 'sinon';

import { InfoGroup } from './info_group';


describe('InfoGroup', () => {
  test('renders without properties', () => {
    const component = (
      <InfoGroup />
    );

    expect(render(component)).toMatchSnapshot();
  });

  test('renders the className property', () => {
    const component = (
      <InfoGroup className="specificInfoGroup" />
    );

    expect(render(component)).toMatchSnapshot();
  });

  test('renders the title property', () => {
    const component = (
      <InfoGroup title="A different title" />
    );

    expect(render(component)).toMatchSnapshot();
  });

  test('does not render its children when isCollapsed is true', () => {
    const component = (
      <InfoGroup isCollapsed={true}>
        Info Message
      </InfoGroup>
    );

    expect(render(component)).toMatchSnapshot();
  });

  test('renders its children when isCollapsed is false', () => {
    const component = (
      <InfoGroup isCollapsed={false}>
        Info Message
      </InfoGroup>
    );

    expect(render(component)).toMatchSnapshot();
  });

  test('renders its children by default', () => {
    const component = (
      <InfoGroup>
        Info message
      </InfoGroup>
    );

    expect(render(component)).toMatchSnapshot();
  });

  test('calls onChangeCollapsed when the toggle button is clicked', () => {
    const handleChangeCollapsed = sinon.stub();
    const component = (
      <InfoGroup onChangeCollapsed={handleChangeCollapsed}/>
    );

    const wrapper = shallow(component);
    wrapper.find('button').simulate('click');

    expect(handleChangeCollapsed).toHaveProperty('calledOnce', true);
  });
});
