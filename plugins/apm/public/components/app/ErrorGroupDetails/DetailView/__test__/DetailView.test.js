import React from 'react';
import DetailView from '../index';
import props from './props.json';

import {
  mountWithRouterAndStore,
  mockMoment,
  toJson
} from '../../../../../utils/testHelpers';

describe('DetailView', () => {
  let storeState;
  beforeEach(() => {
    // Avoid timezone issues
    mockMoment();

    storeState = {
      location: { search: '' }
    };
  });

  it('should render empty state', () => {
    const wrapper = mountWithRouterAndStore(
      <DetailView errorGroup={[]} urlParams={props.urlParams} />,
      storeState
    );

    expect(toJson(wrapper)).toMatchSnapshot();
  });

  it('should render with data', () => {
    const wrapper = mountWithRouterAndStore(
      <DetailView errorGroup={props.errorGroup} urlParams={props.urlParams} />,
      storeState
    );

    expect(toJson(wrapper)).toMatchSnapshot();
  });
});
