import { STATUS } from '../../constants';
import {
  createActionTypes,
  createReducer,
  createAction,
  getKey
} from '../apiHelpers';

describe('apiHelpers', () => {
  describe('createActionTypes', () => {
    it('should return 3 action types', () => {
      expect(createActionTypes('MY_ACTION')).toEqual([
        'MY_ACTION_LOADING',
        'MY_ACTION_SUCCESS',
        'MY_ACTION_FAILURE'
      ]);
    });
  });

  describe('createReducer', () => {
    const actionTypes = createActionTypes('MY_ACTION_TYPE');
    const [
      MY_ACTION_TYPE_LOADING,
      MY_ACTION_TYPE_SUCCESS,
      MY_ACTION_TYPE_FAILURE
    ] = actionTypes;

    const initialState = { foo: 'bar' };

    it('should return loading state', () => {
      expect(
        createReducer(actionTypes, initialState)(undefined, {
          type: MY_ACTION_TYPE_LOADING
        })
      ).toEqual({
        foo: 'bar',
        status: STATUS.LOADING
      });
    });

    it('should return success state', () => {
      expect(
        createReducer(actionTypes, initialState)(undefined, {
          response: { user: 1337 },
          type: MY_ACTION_TYPE_SUCCESS
        })
      ).toEqual({
        data: { user: 1337 },
        status: STATUS.SUCCESS
      });
    });

    it('should return failure state', () => {
      expect(
        createReducer(actionTypes, initialState)(undefined, {
          error: { msg: 'Something failed :(' },
          type: MY_ACTION_TYPE_FAILURE
        })
      ).toEqual({
        error: { msg: 'Something failed :(' },
        foo: 'bar',
        status: STATUS.FAILURE
      });
    });
  });

  describe('createAction', () => {
    const actionTypes = createActionTypes('MY_ACTION_TYPE');
    const [
      MY_ACTION_TYPE_LOADING,
      MY_ACTION_TYPE_SUCCESS,
      MY_ACTION_TYPE_FAILURE
    ] = actionTypes;

    describe('succesful request', () => {
      let key;
      let dispatchMock;
      let apiMock;
      let args;
      beforeEach(async () => {
        dispatchMock = jest.fn();
        apiMock = jest.fn(() => Promise.resolve('foo'));
        args = { a: 'aa', b: 'bb' };
        key = getKey(args);
        await createAction(actionTypes, apiMock)(args)(dispatchMock);
      });

      it('should dispatch loading action', () => {
        expect(dispatchMock).toHaveBeenCalledWith({
          key,
          type: MY_ACTION_TYPE_LOADING
        });
      });

      it('should call apiMock with args', () => {
        expect(apiMock).toHaveBeenCalledWith(args);
      });

      it('should dispatch success action', () => {
        expect(dispatchMock).toHaveBeenCalledWith({
          key,
          response: 'foo',
          type: MY_ACTION_TYPE_SUCCESS
        });
      });
    });

    describe('unsuccesful request', () => {
      it('should dispatch error action', async () => {
        const dispatchMock = jest.fn();
        const apiMock = jest.fn(() =>
          Promise.reject(new Error('an error occured :('))
        );
        const args = { a: 'aa', b: 'bb' };
        const key = getKey(args);
        await createAction(actionTypes, apiMock)(args)(dispatchMock);

        expect(dispatchMock).toHaveBeenCalledWith({
          key,
          error: expect.any(Error),
          type: MY_ACTION_TYPE_FAILURE
        });
      });
    });

    describe('without arguments', () => {
      it('should dispatch success action', async () => {
        const dispatchMock = jest.fn();
        const apiMock = jest.fn(() => Promise.resolve('foobar'));
        const args = undefined;
        const key = getKey(args);
        await createAction(actionTypes, apiMock)(args)(dispatchMock);

        expect(dispatchMock).toHaveBeenCalledWith({
          key,
          response: 'foobar',
          type: MY_ACTION_TYPE_SUCCESS
        });
      });
    });
  });
});
