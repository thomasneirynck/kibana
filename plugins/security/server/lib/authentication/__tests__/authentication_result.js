import expect from 'expect.js';

import { AuthenticationResult } from '../authentication_result';

describe('AuthenticationResult', () => {
  describe('notHandled', () => {
    it('correctly produces `notHandled` authentication result.', () => {
      const authenticationResult = AuthenticationResult.notHandled();

      expect(authenticationResult.notHandled()).to.be(true);
      expect(authenticationResult.succeeded()).to.be(false);
      expect(authenticationResult.failed()).to.be(false);

      expect(authenticationResult.user).to.be(undefined);
      expect(authenticationResult.state).to.be(undefined);
      expect(authenticationResult.error).to.be(undefined);
    });
  });

  describe('failed', () => {
    it('fails if error is not specified.', () => {
      expect(() => AuthenticationResult.failed()).to.throwError('Error should be specified.');
    });

    it('correctly produces `failed` authentication result.', () => {
      const failureReason = new Error('Something went wrong.');
      const authenticationResult = AuthenticationResult.failed(failureReason);

      expect(authenticationResult.failed()).to.be(true);
      expect(authenticationResult.notHandled()).to.be(false);
      expect(authenticationResult.succeeded()).to.be(false);

      expect(authenticationResult.error).to.be(failureReason);
      expect(authenticationResult.user).to.be(undefined);
      expect(authenticationResult.state).to.be(undefined);
    });
  });

  describe('succeeded', () => {
    it('fails if user is not specified.', () => {
      expect(() => AuthenticationResult.succeeded()).to.throwError('User should be specified.');
    });

    it('correctly produces `succeeded` authentication result without state.', () => {
      const user = { username: 'user' };
      const authenticationResult = AuthenticationResult.succeeded(user);

      expect(authenticationResult.succeeded()).to.be(true);
      expect(authenticationResult.failed()).to.be(false);
      expect(authenticationResult.notHandled()).to.be(false);

      expect(authenticationResult.user).to.be(user);
      expect(authenticationResult.state).to.be(undefined);
      expect(authenticationResult.error).to.be(undefined);
    });

    it('correctly produces `succeeded` authentication result with state.', () => {
      const user = { username: 'user' };
      const state = { some: 'state' };
      const authenticationResult = AuthenticationResult.succeeded(user, state);

      expect(authenticationResult.succeeded()).to.be(true);
      expect(authenticationResult.failed()).to.be(false);
      expect(authenticationResult.notHandled()).to.be(false);

      expect(authenticationResult.user).to.be(user);
      expect(authenticationResult.state).to.be(state);
      expect(authenticationResult.error).to.be(undefined);
    });
  });
});
