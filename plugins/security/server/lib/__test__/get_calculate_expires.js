import expect from 'expect.js';
import sinon from 'sinon';
import getCalculateExpires from '../get_calculate_expires';

describe('Validate config', function () {
  const ttl = 1000;
  const config = {get: sinon.stub().returns(ttl)};
  const server = {config: sinon.stub().returns(config)};
  let clock;
  let calculateExpires;

  before(() => {
    clock = sinon.useFakeTimers();
    calculateExpires = getCalculateExpires(server);
  });

  after(() => {
    clock.restore();
  });

  it('should return a function', function () {
    expect(calculateExpires).to.be.a('function');
  });

  it('should calculate the expires as the current time plus the session timeout', function () {
    expect(calculateExpires()).to.equal(Date.now() + ttl);
  });
});
