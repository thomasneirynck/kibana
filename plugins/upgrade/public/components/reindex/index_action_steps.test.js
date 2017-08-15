import { shallow } from 'enzyme';
import React from 'react';

import { IndexActionSteps } from './index_action_steps';

jest.mock('ui/chrome', () => {}, { virtual: true });
jest.mock('ui/notify/notifier', () => ({
  Notifier: function Notifier() {},
}), { virtual: true });


describe('IndexActionSteps', () => {
  test('renders an IndexActionStep for each of the steps', () => {
    const component = (
      <IndexActionSteps
        steps={ [
          { name: 'STEP 1' },
          { name: 'STEP 2' },
          { name: 'STEP 3' },
        ] }
        action="ACTION"
        indexName="INDEX_NAME"
      />
    );

    expect(shallow(component)).toMatchSnapshot();
  });
});
