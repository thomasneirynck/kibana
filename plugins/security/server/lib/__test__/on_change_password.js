import expect from 'expect.js';
import sinon from 'sinon';
import onChangePassword from '../../../server/lib/on_change_password';

describe('On change password', () => {
  const username = 'elastic';
  const password = 'password';
  const expires = new Date();
  const calculateExpires = sinon.stub().returns(expires);
  const reply = sinon.stub().returns({code: sinon.stub()});
  let request;

  beforeEach(() => {
    request = {
      auth: {
        session: {set: sinon.spy()},
        credentials: {username}
      }
    };
  });

  it('should return a function', () => {
    expect(onChangePassword(request, username, password, calculateExpires, reply)).to.be.a('function');
  });

  it('should update the session if changing the password of the current user', () => {
    onChangePassword(request, username, password, calculateExpires, reply)();

    sinon.assert.calledOnce(request.auth.session.set);
    sinon.assert.calledWith(request.auth.session.set, {username, password, expires});
  });

  it('should not update the session if changing the password of a user other than the current user', () => {
    onChangePassword(request, 'kibana', password, calculateExpires, reply)();

    sinon.assert.notCalled(request.auth.session.set);
  });
});
