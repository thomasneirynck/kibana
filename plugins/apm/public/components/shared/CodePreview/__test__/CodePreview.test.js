import React from 'react';
import { mount } from 'enzyme';

import CodePreview from '../index';
import props from './props.json';
import { toJson } from '../../../../utils/testHelpers';

describe('CodePreview', () => {
  it('should render with data', () => {
    const wrapper = mount(<CodePreview {...props} />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });
});
