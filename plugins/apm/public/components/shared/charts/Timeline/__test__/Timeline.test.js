import React from 'react';
import { mount } from 'enzyme';
import { StickyContainer } from 'react-sticky';

import Timeline from '../index';
import props from './props.json';
import { mockMoment, toJson } from '../../../../../utils/testHelpers';

describe('Timline', () => {
  beforeAll(() => {
    mockMoment();
  });

  it('should render with data', () => {
    const wrapper = mount(
      <StickyContainer>
        <Timeline header={<div>Hello - i am a header</div>} {...props} />
      </StickyContainer>
    );

    expect(toJson(wrapper)).toMatchSnapshot();
  });
});
