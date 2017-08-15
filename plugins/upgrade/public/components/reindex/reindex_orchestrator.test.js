import { shallow } from 'enzyme';
import React from 'react';

import { withReindexOrchestrator } from './reindex_orchestrator';
import {
  getAssistance,
  isCompleted,
  isFailed,
  isNotStarted,
  isRunning,
} from '../../lib/reindex';
import {
  INDEX_ACTION,
  LOADING_STATUS,
} from '../../lib/constants';

jest.mock('ui/chrome', () => {}, { virtual: true });
jest.mock('ui/notify/notifier', () => ({
  Notifier: function Notifier() {},
}), { virtual: true });
jest.mock('../../lib/reindex');


function InnerComponent() {}

function createWrappedComponent() {
  return withReindexOrchestrator()(InnerComponent);
}

describe('withReindexOrchestrator', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('renders the wrapped component', () => {
    const WrappedComponent = createWrappedComponent();
    const component = (
      <WrappedComponent
        propA="prop A value"
        propB="prop B value"
      />
    );

    const wrapper = shallow(component);

    expect(wrapper.find('InnerComponent').props()).toMatchObject({
      propA: 'prop A value',
      propB: 'prop B value',
    });
  });

  test('loads the indices from the assistance api after being mounted', async () => {
    const responsePromise = Promise.resolve({});
    getAssistance.mockReturnValue(responsePromise);

    const WrappedComponent = createWrappedComponent();
    const component = (
      <WrappedComponent />
    );

    const wrapper = shallow(component);
    wrapper.instance().componentDidMount();

    // let the component's async functions take some turns
    await responsePromise;

    expect(getAssistance).toHaveBeenCalledWith();
  });

  test('passes the loading status to the inner component', async () => {
    const responsePromise = Promise.resolve({});
    getAssistance.mockReturnValue(responsePromise);

    const WrappedComponent = createWrappedComponent();
    const component = (
      <WrappedComponent />
    );

    const wrapper = shallow(component);

    expect(wrapper.find('InnerComponent').prop('loadingStatus')).toBe(LOADING_STATUS.UNINITIALIZED);

    wrapper.instance().loadIndices();
    await responsePromise;

    expect(wrapper.find('InnerComponent').prop('loadingStatus')).toBe(LOADING_STATUS.SUCCESS);
  });

  test('passes the index states to the inner component after loading the indices', async () => {
    const responsePromise = Promise.resolve({
      index1: {
        action_required: 'reindex',
      },
      index2: {
        action_required: 'upgrade',
      },
    });
    getAssistance.mockReturnValue(responsePromise);

    const WrappedComponent = createWrappedComponent();
    const component = (
      <WrappedComponent />
    );

    const wrapper = shallow(component);
    wrapper.instance().loadIndices();

    // let the component's async functions take some turns
    await responsePromise;
    await responsePromise;

    expect(wrapper.find('InnerComponent').prop('indices')).toMatchObject({
      index1: {
        name: 'index1',
        action: INDEX_ACTION.TYPE.REINDEX,
        steps: [],
      },
      index2: {
        name: 'index2',
        action: INDEX_ACTION.TYPE.UPGRADE,
        steps: [],
      },
    });
  });

  test('passes the progress to the inner component when there are no indices', () => {
    const WrappedComponent = createWrappedComponent();
    const component = (
      <WrappedComponent />
    );

    const wrapper = shallow(component);

    expect(wrapper.find('InnerComponent').prop('progress')).toMatchObject({
      completed: 0,
      failed: 0,
      notStarted: 0,
      running: 0,
      unknown: 0,
    });
  });

  test('passes the progress to the inner component when there are indices', async () => {
    const responsePromise = Promise.resolve({
      index1: {
        action_required: 'reindex',
      },
      index2: {
        action_required: 'reindex',
      },
      index3: {
        action_required: 'reindex',
      },
      index4: {
        action_required: 'reindex',
      },
      index5: {
        action_required: 'reindex',
      },
      index6: {
        action_required: 'reindex',
      },
    });
    getAssistance.mockReturnValue(responsePromise);

    isCompleted
      .mockReturnValue(false)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true);

    isFailed
      .mockReturnValue(false)
      .mockReturnValueOnce(true);

    isRunning
      .mockReturnValue(false)
      .mockReturnValueOnce(true);

    isNotStarted
      .mockReturnValue(false)
      .mockReturnValueOnce(true);

    const WrappedComponent = createWrappedComponent();
    const component = (
      <WrappedComponent />
    );

    const wrapper = shallow(component);
    wrapper.instance().loadIndices();

    // let the component's async functions take some turns
    await responsePromise;
    await responsePromise;

    expect(wrapper.find('InnerComponent').prop('progress')).toMatchObject({
      completed: 2,
      failed: 1,
      notStarted: 1,
      running: 1,
      unknown: 1,
    });
  });
});
