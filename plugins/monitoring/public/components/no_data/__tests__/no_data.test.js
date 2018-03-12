import React from 'react';
import { render } from 'enzyme';
import { NoData } from '../';

const enabler = {};

describe('NoData', () => {
  test('should show text next to the spinner while checking a setting', () => {
    const component = render(
      <NoData
        isLoading={true}
        checkMessage="checking something to test"
        enabler={enabler}
      />
    );
    expect(component).toMatchSnapshot();
  });

  test('should show a default message if reason is unknown', () => {
    const component = render(
      <NoData
        isLoading={false}
        reason={{
          property: 'xpack.monitoring.foo.bar',
          data: 'taco',
          context: 'food'
        }}
        enabler={enabler}
      />
    );
    expect(component).toMatchSnapshot();
  });
});
