import expect from 'expect.js';
import sinon from 'sinon';
import getCalculateExpires from '../get_calculate_expires';

describe('Calculate expires', function () {
  let calculateExpires;

  describe('with ttl', () => {
    const ttl = 1000;
    const config = {get: sinon.stub().returns(ttl)};
    const server = {config: sinon.stub().returns(config)};
    let clock;

    beforeEach(() => {
      clock = sinon.useFakeTimers();
      calculateExpires = getCalculateExpires(server);
    });

    afterEach(() => {
      clock.restore();
    });

    it('should return a function', function () {
      expect(calculateExpires).to.be.a('function');
    });

    it('should calculate the expires as the current time plus the session timeout', function () {
      expect(calculateExpires()).to.equal(Date.now() + ttl);
    });
  });

  describe('without ttl', () => {
    const config = {get: sinon.stub().returns(null)};
    const server = {config: sinon.stub().returns(config)};

    before(() => {
      calculateExpires = getCalculateExpires(server);
    });

    it('should return a function', function () {
      expect(calculateExpires).to.be.a('function');
    });

    it('should return null if the config is null', function () {
      expect(calculateExpires()).to.equal(null);
    });
  });
});
