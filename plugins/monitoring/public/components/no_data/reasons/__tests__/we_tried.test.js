import React from 'react';
import { render } from 'enzyme';
import { WeTried } from '../';

describe('WeTried', () => {
  test('should render "we tried" message', () => {
    const component = render(<WeTried />);
    expect(component).toMatchSnapshot();
  });
});
