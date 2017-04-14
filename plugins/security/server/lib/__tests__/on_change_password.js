import expect from 'expect.js';
import sinon from 'sinon';
import { onChangePassword } from '../../../server/lib/on_change_password';

describe('On change password', () => {
  const username = 'elastic';
  const password = 'password';
  const expires = new Date();
  const calculateExpires = sinon.stub().returns(expires);
  const reply = sinon.stub().returns({ code: sinon.stub() });
  let request;

  beforeEach(() => {
    request = {
      cookieAuth: { set: sinon.spy() },
      auth: {
        credentials: { username }
      }
    };
  });

  it('should return a function', () => {
    expect(onChangePassword(request, username, password, calculateExpires, reply)).to.be.a('function');
  });

  it('should update the session if changing the password of the current user', () => {
    onChangePassword(request, username, password, calculateExpires, reply)();

    sinon.assert.calledOnce(request.cookieAuth.set);
    sinon.assert.calledWith(request.cookieAuth.set, { username, password, expires });
  });

  it('should not update the session if changing the password of a user other than the current user', () => {
    onChangePassword(request, 'kibana', password, calculateExpires, reply)();

    sinon.assert.notCalled(request.cookieAuth.set);
  });
});
