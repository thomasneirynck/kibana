import React from 'react';
import { shallow } from 'enzyme';

import { TransactionOverview } from '../index';

const setup = () => {
  const props = {
    app: {
      data: {}
    },
    transactionList: {
      data: []
    },
    urlParams: {},
    loadTransactionList: jest.fn()
  };

  const wrapper = shallow(<TransactionOverview {...props} />);
  return { props, wrapper };
};

describe('TransactionOverview', () => {
  it('should not call loadTransactionList without any props', () => {
    const { props } = setup();
    expect(props.loadTransactionList).not.toHaveBeenCalled();
  });

  it('should call loadTransactionList when props are given, and list is not loading', () => {
    const { props, wrapper } = setup();

    wrapper.setProps({
      urlParams: {
        appName: 'myAppName',
        start: 'myStart',
        end: 'myEnd',
        transactionType: 'myTransactionType'
      },
      transactionList: {
        data: [],
        status: undefined
      }
    });

    expect(props.loadTransactionList).toHaveBeenCalledWith({
      appName: 'myAppName',
      end: 'myEnd',
      start: 'myStart',
      transactionType: 'myTransactionType'
    });
  });

  it('should not call loadTransactionList, if list is already loading', () => {
    const { props, wrapper } = setup();
    wrapper.setProps({
      urlParams: {
        appName: 'myAppName',
        start: 'myStart',
        end: 'myEnd',
        transactionType: 'myTransactionType'
      },
      transactionList: {
        data: [],
        status: 'LOADING'
      }
    });

    expect(props.loadTransactionList).not.toHaveBeenCalled();
  });
});
