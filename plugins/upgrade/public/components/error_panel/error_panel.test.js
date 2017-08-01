import { render } from 'enzyme';
import React from 'react';

import { ErrorPanel } from './error_panel';


describe('ErrorPanel', () => {
  test('renders without properties', () => {
    const component = (
      <ErrorPanel />
    );

    expect(render(component)).toMatchSnapshot();
  });

  test('renders the className property', () => {
    const component = (
      <ErrorPanel className="specificErrorPanel" />
    );

    expect(render(component)).toMatchSnapshot();
  });

  test('renders the title property', () => {
    const component = (
      <ErrorPanel title="A different title" />
    );

    expect(render(component)).toMatchSnapshot();
  });

  test('renders its children', () => {
    const component = (
      <ErrorPanel>
        Error message
      </ErrorPanel>
    );

    expect(render(component)).toMatchSnapshot();
  });
});
