import React from 'react';
import { mount } from 'enzyme';
import toDiffableHtml from 'diffable-html';
import { MemoryRouter } from 'react-router-dom';
import List from '../index';
import props from './props.json';
import {
  mountWithRouterAndStore,
  mockMoment
} from '../../../../../utils/testHelpers';

describe('ErrorGroupOverview -> List', () => {
  beforeAll(() => {
    mockMoment();
  });

  it('should render empty state', () => {
    const storeState = {};
    const wrapper = mount(
      <MemoryRouter>
        <List items={[]} />
      </MemoryRouter>,
      storeState
    );

    expect(toDiffableHtml(wrapper.html())).toMatchSnapshot();
  });

  it('should render with data', () => {
    const storeState = { location: {} };
    const wrapper = mountWithRouterAndStore(
      <List
        items={props.items}
        changeServiceSorting={props.changeServiceSorting}
        serviceSorting={props.serviceSorting}
      />,
      storeState
    );

    expect(toDiffableHtml(wrapper.html())).toMatchSnapshot();
  });
});
