import React from 'react';
import { mount } from 'enzyme';
import { Comment } from '../';

describe('Comment component', () => {
  test('renders text in HTML comment', () => {
    const wrapper = mount(
      <div>
        Important test stuff here.
        <Comment text="Important comment about important test stuff" />
      </div>
    );
    expect(wrapper.html()).toBe(
      '<div>Important test stuff here.<!-- Important comment about important test stuff --></div>'
    );

  });
});
