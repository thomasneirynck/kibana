import React from 'react';
import toDiffableHtml from 'diffable-html';
import { mount } from 'enzyme';
import DetailView from '../index';
import props from './props.json';
import {
  mountWithRouterAndStore,
  mockMoment
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
    const wrapper = mount(
      <DetailView errorGroup={[]} urlParams={props.urlParams} />,
      storeState
    );

    expect(toDiffableHtml(wrapper.html())).toMatchSnapshot();
  });

  it('should render with data', () => {
    const wrapper = mountWithRouterAndStore(
      <DetailView errorGroup={props.errorGroup} urlParams={props.urlParams} />,
      storeState
    );

    expect(toDiffableHtml(wrapper.html())).toMatchSnapshot();
  });
});
