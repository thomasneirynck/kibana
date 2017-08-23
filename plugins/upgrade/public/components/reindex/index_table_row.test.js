import { shallow } from 'enzyme';
import React from 'react';

import { IndexTableRow } from './index_table_row';
import { isCancelable, isNotStarted, isResettable } from '../../lib';
import { INDEX_ACTION } from '../../lib/constants';

jest.mock('ui/chrome', () => {}, { virtual: true });
jest.mock('ui/notify/notifier', () => ({
  Notifier: function Notifier() {},
}), { virtual: true });
jest.mock('../../lib/reindex/state');


describe('IndexTableRow', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('renders the index name', () => {
    const component = (
      <IndexTableRow
        index={{
          action: INDEX_ACTION.TYPE.UPGRADE,
          name: 'A UNIQUE INDEX NAME',
          steps: [],
        }}
      />
    );

    const wrapper = shallow(component);

    expect(wrapper.containsMatchingElement('A UNIQUE INDEX NAME')).toBe(true);
  });

  describe('upgrade/reindex button', () => {
    test('is enabled for indices that require an upgrade', () => {
      isNotStarted.mockReturnValue(true);
      const component = (
        <IndexTableRow
          index={{
            action: INDEX_ACTION.TYPE.UPGRADE,
            name: 'INDEX NAME',
            steps: [],
          }}
        />
      );

      expect(shallow(component).containsMatchingElement(
        <button disabled={false} >{ INDEX_ACTION.LABEL.UPGRADE }</button>
      )).toBe(true);
    });

    test('is disabled for indices that are being upgraded', () => {
      isNotStarted.mockReturnValue(false);
      const component = (
        <IndexTableRow
          index={{
            action: INDEX_ACTION.TYPE.UPGRADE,
            name: 'INDEX NAME',
            steps: [],
          }}
        />
      );

      expect(shallow(component).containsMatchingElement(
        <button disabled={true}>{ INDEX_ACTION.LABEL.UPGRADE }</button>
      )).toBe(true);
    });

    test('is enabled for indices that require reindexing', () => {
      isNotStarted.mockReturnValue(true);
      const component = (
        <IndexTableRow
          index={{
            action: INDEX_ACTION.TYPE.REINDEX,
            name: 'INDEX NAME',
            steps: [],
          }}
        />
      );

      expect(shallow(component).containsMatchingElement(
        <button disabled={false} >{ INDEX_ACTION.LABEL.REINDEX }</button>
      )).toBe(true);
    });

    test('is disabled for indices that are being reindexed', () => {
      isNotStarted.mockReturnValue(false);
      const component = (
        <IndexTableRow
          index={{
            action: INDEX_ACTION.TYPE.REINDEX,
            name: 'INDEX NAME',
            steps: [],
          }}
        />
      );

      expect(shallow(component).containsMatchingElement(
        <button disabled={true}>{ INDEX_ACTION.LABEL.REINDEX }</button>
      )).toBe(true);
    });

    test('calls the processIndex property when clicked', () => {
      isNotStarted.mockReturnValue(true);
      const processIndex = jest.fn();
      const component = (
        <IndexTableRow
          index={{
            action: INDEX_ACTION.TYPE.UPGRADE,
            name: 'INDEX',
            steps: [],
          }}
          processIndex={processIndex}
        />
      );

      const wrapper = shallow(component);
      wrapper.findWhere((node) => node.matchesElement(
        <button>{ INDEX_ACTION.LABEL.UPGRADE }</button>
      )).simulate('click');

      expect(processIndex).toHaveBeenCalledWith('INDEX');
    });
  });

  describe('cancel button', () => {
    test('is enabled for indices that are being processed', () => {
      isCancelable.mockReturnValue(true);
      const component = (
        <IndexTableRow
          index={{
            action: INDEX_ACTION.TYPE.UPGRADE,
            name: 'INDEX NAME',
            steps: [],
          }}
        />
      );

      expect(shallow(component).containsMatchingElement(
        <button disabled={false} >Cancel</button>
      )).toBe(true);
    });

    test('is disabled for indices that are not being processed', () => {
      isCancelable.mockReturnValue(false);
      const component = (
        <IndexTableRow
          index={{
            action: INDEX_ACTION.TYPE.UPGRADE,
            name: 'INDEX NAME',
            steps: [],
          }}
        />
      );

      expect(shallow(component).containsMatchingElement(
        <button disabled={true} >Cancel</button>
      )).toBe(true);
    });

    test('calls the cancelAction property when clicked', () => {
      isCancelable.mockReturnValue(true);
      const cancelAction = jest.fn();
      const component = (
        <IndexTableRow
          index={{
            action: INDEX_ACTION.TYPE.UPGRADE,
            name: 'INDEX',
            steps: [],
          }}
          cancelAction={cancelAction}
        />
      );

      const wrapper = shallow(component);
      wrapper.findWhere((node) => node.matchesElement(
        <button>Cancel</button>
      )).simulate('click');

      expect(cancelAction).toHaveBeenCalledWith('INDEX');
    });
  });

  describe('reset button', () => {
    test('is enabled for indices that are resettable', () => {
      isResettable.mockReturnValue(true);
      const component = (
        <IndexTableRow
          index={{
            action: INDEX_ACTION.TYPE.UPGRADE,
            name: 'INDEX NAME',
            steps: [],
          }}
        />
      );

      expect(shallow(component).containsMatchingElement(
        <button disabled={false} >Reset</button>
      )).toBe(true);
    });

    test('is disabled for indices that are not resettable', () => {
      isResettable.mockReturnValue(false);
      const component = (
        <IndexTableRow
          index={{
            action: INDEX_ACTION.TYPE.UPGRADE,
            name: 'INDEX NAME',
            steps: [],
          }}
        />
      );

      expect(shallow(component).containsMatchingElement(
        <button disabled={true} >Reset</button>
      )).toBe(true);
    });

    test('calls the resetAction property when clicked', () => {
      isResettable.mockReturnValue(true);
      const resetAction = jest.fn();
      const component = (
        <IndexTableRow
          index={{
            action: INDEX_ACTION.TYPE.UPGRADE,
            name: 'INDEX',
            steps: [],
          }}
          resetAction={resetAction}
        />
      );

      const wrapper = shallow(component);
      wrapper.findWhere((node) => node.matchesElement(
        <button>Reset</button>
      )).simulate('click');

      expect(resetAction).toHaveBeenCalledWith('INDEX');
    });
  });

  test('renders no IndexActionSteps component when there are no steps', () => {
    const component = (
      <IndexTableRow
        index={{
          action: INDEX_ACTION.TYPE.UPGRADE,
          name: 'INDEX',
          steps: [],
        }}
      />
    );

    const wrapper = shallow(component);

    expect(wrapper.find('IndexActionSteps').exists()).toBe(false);
  });

  test('renders an IndexActionSteps component when there are steps', () => {
    const component = (
      <IndexTableRow
        index={{
          action: INDEX_ACTION.TYPE.UPGRADE,
          name: 'INDEX',
          steps: [
            { name: 'STEP 1' },
          ],
        }}
      />
    );

    const wrapper = shallow(component);

    expect(wrapper.find('IndexActionSteps')).toMatchSnapshot();
  });

});
