import { shallow } from 'enzyme';
import React from 'react';

import { withReindexOrchestrator } from './reindex_orchestrator';
import {
  cancelTask,
  createIndex,
  getAssistance,
  getMappingsAndSettings,
  getSettingsAndAliases,
  getTaskDetails,
  isCompleted,
  isFailed,
  isNotStarted,
  isRunning,
  refreshIndex,
  replaceIndex,
  resetIndex,
  runReindex,
  runUpgrade,
  setReadOnly,
  updateRefreshInterval,
  verifyDocs,
} from '../../lib/reindex';
import {
  INDEX_ACTION,
  LOADING_STATUS,
  REINDEX_STEPS,
  STEP_RESULTS,
  UPGRADE_STEPS,
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

async function mountWrappedComponent() {
  const WrappedComponent = createWrappedComponent();
  const component = (
    <WrappedComponent />
  );

  const wrapper = shallow(component);
  await wrapper.instance().loadIndices();

  return wrapper;
}

describe('withReindexOrchestrator', () => {
  beforeEach(() => {
    getAssistance.mockReturnValue(Promise.resolve({
      reindexableIndex: {
        action_required: 'reindex',
      },
      upgradableIndex: {
        action_required: 'upgrade',
      },
    }));
  });

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
    const WrappedComponent = createWrappedComponent();
    const component = (
      <WrappedComponent />
    );

    const wrapper = shallow(component);
    wrapper.instance().componentDidMount();

    expect(getAssistance).toHaveBeenCalledWith();
  });

  test('passes the loading status to the inner component', async () => {
    const WrappedComponent = createWrappedComponent();
    const component = (
      <WrappedComponent />
    );

    const wrapper = shallow(component);

    expect(wrapper.find('InnerComponent').prop('loadingStatus')).toBe(LOADING_STATUS.UNINITIALIZED);

    await wrapper.instance().loadIndices();

    expect(wrapper.find('InnerComponent').prop('loadingStatus')).toBe(LOADING_STATUS.SUCCESS);
  });

  test('passes the index states to the inner component after loading the indices', async () => {
    const wrapper = await mountWrappedComponent();

    expect(wrapper.find('InnerComponent').prop('indices')).toMatchObject({
      reindexableIndex: {
        name: 'reindexableIndex',
        action: INDEX_ACTION.TYPE.REINDEX,
        steps: [],
      },
      upgradableIndex: {
        name: 'upgradableIndex',
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

    const wrapper = await mountWrappedComponent();

    expect(wrapper.find('InnerComponent').prop('progress')).toMatchObject({
      completed: 2,
      failed: 1,
      notStarted: 1,
      running: 1,
      unknown: 1,
    });
  });

  describe('createIndex step', () => {
    beforeEach(() => {
      getMappingsAndSettings.mockReturnValue(Promise.resolve({
        mappings: {},
        settings: {},
      }));
      createIndex.mockReturnValue(Promise.resolve());
    });

    test('sets the CREATE_INDEX step result to COMPLETED when no error was thrown', async () => {
      const wrapper = await mountWrappedComponent();

      await expect(wrapper.instance().stepCreateIndex('reindexableIndex')).resolves.toBeUndefined();

      expect(getMappingsAndSettings).toHaveBeenLastCalledWith('reindexableIndex');
      expect(createIndex).toHaveBeenLastCalledWith('reindexableIndex', expect.objectContaining({
        mappings: expect.any(Object),
        settings: expect.any(Object),
      }));
      expect(wrapper.find('InnerComponent').prop('indices')).toMatchObject({
        reindexableIndex: {
          steps: [
            {
              name: REINDEX_STEPS.CREATE_INDEX,
              result: STEP_RESULTS.COMPLETED,
            },
          ],
        },
      });
    });

    test('sets the CREATE_INDEX step result to the error with taskId when one was thrown', async () => {
      getMappingsAndSettings.mockReturnValueOnce(Promise.reject({
        error: 'ERROR',
        taskId: 'TASK_ID',
      }));

      const wrapper = await mountWrappedComponent();

      await expect(wrapper.instance().stepCreateIndex('reindexableIndex')).rejects.toBeDefined();

      expect(getMappingsAndSettings).toHaveBeenLastCalledWith('reindexableIndex');
      expect(createIndex).not.toHaveBeenCalled();
      expect(wrapper.find('InnerComponent').prop('indices')).toMatchObject({
        reindexableIndex: {
          steps: [
            {
              name: REINDEX_STEPS.CREATE_INDEX,
              result: {
                error: 'ERROR',
                taskId: 'TASK_ID',
              },
            },
          ],
        },
      });
    });
  });

  describe('setReadOnly step', () => {
    beforeEach(() => {
      setReadOnly.mockReturnValue(Promise.resolve());
    });

    test('sets the SET_READONLY step result to COMPLETED when no error was thrown', async () => {
      const wrapper = await mountWrappedComponent();

      await expect(wrapper.instance().stepSetReadOnly('reindexableIndex')).resolves.toBeUndefined();

      expect(setReadOnly).toHaveBeenLastCalledWith('reindexableIndex');
      expect(wrapper.find('InnerComponent').prop('indices')).toMatchObject({
        reindexableIndex: {
          steps: [
            {
              name: REINDEX_STEPS.SET_READONLY,
              result: STEP_RESULTS.COMPLETED,
            },
          ],
        },
      });
    });

    test('sets the SET_READONLY step result to the error when one was thrown', async () => {
      setReadOnly.mockReturnValueOnce(Promise.reject({
        error: 'ERROR',
      }));

      const wrapper = await mountWrappedComponent();

      await expect(wrapper.instance().stepSetReadOnly('reindexableIndex')).rejects.toBeDefined();

      expect(setReadOnly).toHaveBeenLastCalledWith('reindexableIndex');
      expect(wrapper.find('InnerComponent').prop('indices')).toMatchObject({
        reindexableIndex: {
          steps: [
            {
              name: REINDEX_STEPS.SET_READONLY,
              result: {
                error: 'ERROR',
              },
            },
          ],
        },
      });
    });
  });

  describe('reindex step', () => {
    beforeEach(() => {
      runReindex.mockReturnValue(Promise.resolve({
        task: "TASK_ID",
      }));
      getTaskDetails.mockReturnValue(Promise.resolve({
        completed: true,
      }));
    });

    test('sets the REINDEX step result to RUNNING while polling and then to COMPLETED when no error was thrown', async () => {
      let resolveGetTaskDetails;
      getTaskDetails.mockReturnValue(new Promise((resolve) => resolveGetTaskDetails = resolve));
      const wrapper = await mountWrappedComponent();

      const reindexPromise = wrapper.instance().stepReindex('reindexableIndex');

      // wait for the first async step of stepReindex() to finish
      await runReindex();

      expect(runReindex).toHaveBeenCalledWith('reindexableIndex');
      expect(getTaskDetails).toHaveBeenCalledWith('TASK_ID');
      expect(wrapper.find('InnerComponent').prop('indices')).toMatchObject({
        reindexableIndex: {
          steps: [
            {
              name: REINDEX_STEPS.REINDEX,
              result: STEP_RESULTS.RUNNING,
            },
          ],
        },
      });

      resolveGetTaskDetails({
        completed: true,
      });

      // wait for the second async step of stepReindex() to finish
      await reindexPromise;

      expect(wrapper.find('InnerComponent').prop('indices')).toMatchObject({
        reindexableIndex: {
          steps: [
            {
              name: REINDEX_STEPS.REINDEX,
              result: STEP_RESULTS.COMPLETED,
            },
          ],
        },
      });
    });

    test('sets the REINDEX step result to the error when one was thrown', async () => {
      runReindex.mockReturnValueOnce(Promise.reject({
        error: 'ERROR',
      }));

      const wrapper = await mountWrappedComponent();

      await expect(wrapper.instance().stepReindex('reindexableIndex')).rejects.toBeDefined();

      expect(runReindex).toHaveBeenCalledWith('reindexableIndex');
      expect(wrapper.find('InnerComponent').prop('indices')).toMatchObject({
        reindexableIndex: {
          steps: [
            {
              name: REINDEX_STEPS.REINDEX,
              result: {
                error: 'ERROR',
              },
            },
          ],
        },
      });
    });
  });

  describe('refreshIndex step', () => {
    beforeEach(() => {
      refreshIndex.mockReturnValue(Promise.resolve());
    });

    test('sets the REFRESH_INDEX step result to COMPLETED when no error was thrown', async () => {
      const wrapper = await mountWrappedComponent();

      await expect(wrapper.instance().stepRefreshIndex('reindexableIndex')).resolves.toBeUndefined();

      expect(refreshIndex).toHaveBeenLastCalledWith('reindexableIndex');
      expect(wrapper.find('InnerComponent').prop('indices')).toMatchObject({
        reindexableIndex: {
          steps: [
            {
              name: REINDEX_STEPS.REFRESH_INDEX,
              result: STEP_RESULTS.COMPLETED,
            },
          ],
        },
      });
    });

    test('sets the REFRESH_INDEX step result to the error when one was thrown', async () => {
      refreshIndex.mockReturnValueOnce(Promise.reject({
        error: 'ERROR',
      }));

      const wrapper = await mountWrappedComponent();

      await expect(wrapper.instance().stepRefreshIndex('reindexableIndex')).rejects.toBeDefined();

      expect(refreshIndex).toHaveBeenLastCalledWith('reindexableIndex');
      expect(wrapper.find('InnerComponent').prop('indices')).toMatchObject({
        reindexableIndex: {
          steps: [
            {
              name: REINDEX_STEPS.REFRESH_INDEX,
              result: {
                error: 'ERROR',
              },
            },
          ],
        },
      });
    });
  });

  describe('verifyDocs step', () => {
    beforeEach(() => {
      verifyDocs.mockReturnValue(Promise.resolve());
    });

    test('sets the VERIFY_DOCS step result to COMPLETED when no error was thrown', async () => {
      const wrapper = await mountWrappedComponent();

      await expect(wrapper.instance().stepVerifyDocs('reindexableIndex')).resolves.toBeUndefined();

      expect(verifyDocs).toHaveBeenLastCalledWith('reindexableIndex');
      expect(wrapper.find('InnerComponent').prop('indices')).toMatchObject({
        reindexableIndex: {
          steps: [
            {
              name: REINDEX_STEPS.VERIFY_DOCS,
              result: STEP_RESULTS.COMPLETED,
            },
          ],
        },
      });
    });

    test('sets the VERIFY_DOCS step result to the error when one was thrown', async () => {
      verifyDocs.mockReturnValueOnce(Promise.reject({
        error: 'ERROR',
      }));

      const wrapper = await mountWrappedComponent();

      await expect(wrapper.instance().stepVerifyDocs('reindexableIndex')).rejects.toBeDefined();

      expect(verifyDocs).toHaveBeenLastCalledWith('reindexableIndex');
      expect(wrapper.find('InnerComponent').prop('indices')).toMatchObject({
        reindexableIndex: {
          steps: [
            {
              name: REINDEX_STEPS.VERIFY_DOCS,
              result: {
                error: 'ERROR',
              },
            },
          ],
        },
      });
    });
  });

  describe('replaceIndex step', () => {
    beforeEach(() => {
      getSettingsAndAliases.mockReturnValue(Promise.resolve({
        reindexableIndex: {
          aliases: {
            alias1: 'value1',
          },
          settings: {
            setting1: 'value1',
          },
        },
      }));
      updateRefreshInterval.mockReturnValue(Promise.resolve());
      replaceIndex.mockReturnValue(Promise.resolve());
    });

    test('sets the REPLACE_INDEX step result to COMPLETED when no error was thrown', async () => {
      const wrapper = await mountWrappedComponent();

      await expect(wrapper.instance().stepReplaceIndex('reindexableIndex')).resolves.toBeUndefined();

      expect(getSettingsAndAliases).toHaveBeenLastCalledWith('reindexableIndex');
      expect(updateRefreshInterval).toHaveBeenCalledWith('reindexableIndex', expect.objectContaining({
        setting1: 'value1',
      }));
      expect(replaceIndex).toHaveBeenLastCalledWith('reindexableIndex', expect.objectContaining({
        alias1: 'value1',
      }));
      expect(wrapper.find('InnerComponent').prop('indices')).toMatchObject({
        reindexableIndex: {
          steps: [
            {
              name: REINDEX_STEPS.REPLACE_INDEX,
              result: STEP_RESULTS.COMPLETED,
            },
          ],
        },
      });
    });

    test('sets the REPLACE_INDEX step result to the error when one was thrown', async () => {
      replaceIndex.mockReturnValueOnce(Promise.reject({
        error: 'ERROR',
      }));

      const wrapper = await mountWrappedComponent();

      await expect(wrapper.instance().stepReplaceIndex('reindexableIndex')).rejects.toBeDefined();

      expect(getSettingsAndAliases).toHaveBeenLastCalledWith('reindexableIndex');
      expect(updateRefreshInterval).toHaveBeenCalledWith('reindexableIndex', expect.objectContaining({
        setting1: 'value1',
      }));
      expect(replaceIndex).toHaveBeenLastCalledWith('reindexableIndex', expect.objectContaining({
        alias1: 'value1',
      }));
      expect(wrapper.find('InnerComponent').prop('indices')).toMatchObject({
        reindexableIndex: {
          steps: [
            {
              name: REINDEX_STEPS.REPLACE_INDEX,
              result: {
                error: 'ERROR',
              },
            },
          ],
        },
      });
    });
  });

  describe('upgrade step', () => {
    beforeEach(() => {
      runUpgrade.mockReturnValue(Promise.resolve({
        task: 'TASK_ID',
      }));
    });

    test('sets the UPGRADE step result to RUNNING while polling and then to COMPLETED when no error was thrown', async () => {
      let resolveGetTaskDetails;
      getTaskDetails.mockReturnValue(new Promise((resolve) => resolveGetTaskDetails = resolve));
      const wrapper = await mountWrappedComponent();

      const upgradePromise = wrapper.instance().stepUpgrade('upgradableIndex');

      // wait for the first async step of stepUpgrade() to finish
      await runUpgrade();

      expect(runUpgrade).toHaveBeenCalledWith('upgradableIndex');
      expect(getTaskDetails).toHaveBeenCalledWith('TASK_ID');
      expect(wrapper.find('InnerComponent').prop('indices')).toMatchObject({
        upgradableIndex: {
          steps: [
            {
              name: UPGRADE_STEPS.UPGRADE,
              result: STEP_RESULTS.RUNNING,
            },
          ],
        },
      });

      resolveGetTaskDetails({
        completed: true,
      });

      // wait for the second async step of stepUpgrade() to finish
      await upgradePromise;

      expect(wrapper.find('InnerComponent').prop('indices')).toMatchObject({
        upgradableIndex: {
          steps: [
            {
              name: UPGRADE_STEPS.UPGRADE,
              result: STEP_RESULTS.COMPLETED,
            },
          ],
        },
      });
    });


    test('sets the UPGRADE step result to the error when one was thrown', async () => {
      runUpgrade.mockReturnValueOnce(Promise.reject({
        error: 'ERROR',
      }));

      const wrapper = await mountWrappedComponent();

      await expect(wrapper.instance().stepUpgrade('upgradableIndex')).rejects.toBeDefined();

      expect(runUpgrade).toHaveBeenCalledWith('upgradableIndex');
      expect(getTaskDetails).not.toHaveBeenCalled();
      expect(wrapper.find('InnerComponent').prop('indices')).toMatchObject({
        upgradableIndex: {
          steps: [
            {
              name: UPGRADE_STEPS.UPGRADE,
              result: {
                error: 'ERROR',
              },
            },
          ],
        },
      });
    });
  });

  describe('cancelAction method', () => {
    beforeEach(() => {
      getAssistance.mockReturnValue(Promise.resolve({
        reindexableIndex: {
          action_required: 'reindex',
          taskId: 'TASK_ID',
        },
      }));
      cancelTask.mockReturnValue(Promise.resolve());
      resetIndex.mockReturnValue(Promise.resolve());
    });

    test('sets the most recent step result to CANCELED with the taskId', async () => {
      const wrapper = await mountWrappedComponent();

      await expect(wrapper.instance().cancelAction('reindexableIndex')).resolves.toBeUndefined();

      expect(cancelTask).toHaveBeenLastCalledWith('TASK_ID');
      expect(resetIndex).toHaveBeenLastCalledWith('reindexableIndex', 'TASK_ID');
      expect(wrapper.find('InnerComponent').prop('indices')).toMatchObject({
        reindexableIndex: {
          steps: [
            {
              name: REINDEX_STEPS.CREATE_INDEX,
              result: STEP_RESULTS.CANCELED,
              taskId: 'TASK_ID',
            },
          ],
        },
      });
    });
  });

  describe('resetAction method', () => {
    beforeEach(() => {
      getAssistance.mockReturnValue(Promise.resolve({
        reindexableIndex: {
          action_required: 'reindex',
          taskId: 'TASK_ID',
        },
      }));
      resetIndex.mockReturnValue(Promise.resolve());
    });

    test('resets the steps list and the taskId', async () => {
      const wrapper = await mountWrappedComponent();

      expect(wrapper.find('InnerComponent').prop('indices')).toMatchObject({
        reindexableIndex: {
          steps: [
            {
              name: REINDEX_STEPS.CREATE_INDEX,
              result: {
                taskId: 'TASK_ID',
              },
            },
          ],
        },
      });

      await expect(wrapper.instance().resetAction('reindexableIndex')).resolves.toBeUndefined();

      expect(resetIndex).toHaveBeenLastCalledWith('reindexableIndex', 'TASK_ID');
      expect(wrapper.find('InnerComponent').prop('indices')).toMatchObject({
        reindexableIndex: {
          steps: [],
          taskId: undefined,
        },
      });
    });
  });
});
