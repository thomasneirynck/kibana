import { shallow } from 'enzyme';
import React from 'react';

import { IndexActionStep } from './index_action_step';
import { getStepMessage } from '../../lib';
import { STEP_RESULTS } from '../../lib/constants';

jest.mock('ui/chrome', () => {}, { virtual: true });
jest.mock('ui/notify/notifier', () => ({
  Notifier: function Notifier() {},
}), { virtual: true });
jest.mock('../../lib/reindex/messages');


describe('IndexActionStep', () => {
  beforeEach(() => {
    getStepMessage.mockImplementation((action, result, name, { indexName }) => (
      `Message for ${action} step ${name} for index ${indexName} with result ${result}`
    ));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('renders a success message for a completed step', () => {
    const component = (
      <IndexActionStep
        step={ {
          name: "COMPLETED STEP",
          result: STEP_RESULTS.COMPLETED,
        } }
        action="COMPLETED ACTION"
        indexName="COMPLETED INDEX_NAME"
      />
    );

    expect(shallow(component)).toMatchSnapshot();
  });

  test('renders an error message for a failed step', () => {
    const component = (
      <IndexActionStep
        step={ {
          name: "FAILED STEP",
          result: {
            message: 'FAILED',
          },
        } }
        action="FAILED ACTION"
        indexName="FAILED INDEX_NAME"
      />
    );

    expect(shallow(component)).toMatchSnapshot();
  });

  test('renders a spinner message for a running step', () => {
    const component = (
      <IndexActionStep
        step={ {
          name: "RUNNING STEP",
          result: STEP_RESULTS.RUNNING,
        } }
        action="RUNNING ACTION"
        indexName="RUNNING INDEX_NAME"
      />
    );

    expect(shallow(component)).toMatchSnapshot();
  });
});
