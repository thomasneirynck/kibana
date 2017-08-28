import _ from 'lodash';
import { shallow } from 'enzyme';
import React from 'react';

import { ReindexView } from './reindex_view';
import { LOADING_STATUS } from '../../lib/constants';

jest.mock('ui/chrome', () => {}, { virtual: true });
jest.mock('ui/notify/notifier', () => ({
  Notifier: function Notifier() {},
}), { virtual: true });


describe('ReindexView', () => {
  test('renders an expanded InfoGroup by default', () => {
    const component = (
      <ReindexView
        setViewState={_.noop}
        viewState={{}}
      />
    );

    const wrapper = shallow(component).dive();

    expect(wrapper.find('InfoGroup').prop('isCollapsed')).toBe(false);
  });

  test('renders a collapsed InfoGroup when the viewState declares it', () => {
    const component = (
      <ReindexView
        setViewState={_.noop}
        viewState={{
          ReindexView: {
            isInfoCollapsed: true,
          },
        }}
      />
    );

    const wrapper = shallow(component).dive();

    expect(wrapper.find('InfoGroup').prop('isCollapsed')).toBe(true);
  });

  test('calls setViewState when the InfoPanel\'s collapse button is clicked' , () => {
    const setViewState = jest.fn();
    const component = (
      <ReindexView
        setViewState={setViewState}
        viewState={{}}
      />
    );

    const wrapper = shallow(component).dive();
    wrapper.find('InfoGroup').prop('onChangeCollapsed')();

    expect(setViewState).toHaveBeenCalledTimes(1);
  });

  test('renders an IndexTable when loadingStatus indicates success', () => {
    const cancelAction = () => {};
    const indices = {
      index1: {},
    };
    const loadIndices = () => {};
    const processIndex = () => {};
    const resetAction = () => {};
    const component = (
      <ReindexView
        loadingStatus={LOADING_STATUS.SUCCESS}
        cancelAction={cancelAction}
        indices={indices}
        loadIndices={loadIndices}
        processIndex={processIndex}
        resetAction={resetAction}
        setViewState={_.noop}
        viewState={{}}
      />
    );

    const wrapper = shallow(component).dive();
    expect(wrapper.find('IndexTable').props()).toMatchObject({
      cancelAction,
      indices,
      loadIndices,
      processIndex,
      resetAction,
    });
  });

  test('renders an ErrorPanel when the loadingStatus indicates forbidden access', () => {
    const component = (
      <ReindexView
        loadingStatus={LOADING_STATUS.FORBIDDEN}
        setViewState={_.noop}
        viewState={{}}
      />
    );

    const wrapper = shallow(component).dive();
    expect(wrapper.find('ErrorPanel')).toMatchSnapshot();
  });

  test('renders an ErrorPanel with the errorMessage when the loadingStatus indicates a failure', () => {
    const component = (
      <ReindexView
        errorMessage="an error message"
        loadingStatus={LOADING_STATUS.FAILURE}
        setViewState={_.noop}
        viewState={{}}
      />
    );

    const wrapper = shallow(component).dive();
    expect(wrapper.find('ErrorPanel')).toMatchSnapshot();
  });
});
