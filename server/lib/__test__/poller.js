import expect from 'expect.js';
import Bluebird from 'bluebird';
import sinon from 'sinon';
import Poller from '../poller';

describe('Poller', () => {

  let functionToPoll;
  let successFunction;
  let errorFunction;
  let pollFrequencyInMillis;
  let poller;

  beforeEach(() => {
    pollFrequencyInMillis = 20;
  });

  describe('start()', () => {

    beforeEach(() => {
      functionToPoll = sinon.spy(() => { return Promise.resolve(42); });
      successFunction = sinon.spy();
      errorFunction = sinon.spy();
      poller = new Poller({
        functionToPoll,
        successFunction,
        errorFunction,
        pollFrequencyInMillis
      });
    });

    it ('polls the functionToPoll multiple times', (done) => {
      poller.start()
      .then(() => {
        return Bluebird.delay(pollFrequencyInMillis * 1.5);
      })
      .then(() => {
        poller.stop();
        expect(functionToPoll.callCount).to.be(2);
      })
      .then(done);
    });

    describe('when the function to poll succeeds', () => {

      it ('calls the successFunction multiple times', (done) => {
        poller.start()
        .then(() => {
          return Bluebird.delay(pollFrequencyInMillis * 1.5);
        })
        .then(() => {
          poller.stop();
          expect(successFunction.callCount).to.be(2);
          expect(errorFunction.callCount).to.be(0);
        })
        .then(done);
      });

    });

    describe('when the function to poll fails', () => {

      beforeEach(() => {
        functionToPoll = sinon.spy(() => { return Promise.reject(42); });
      });

      describe('when the continuePollingOnError option has not been set', () => {

        beforeEach(() => {
          poller = new Poller({
            functionToPoll,
            successFunction,
            errorFunction,
            pollFrequencyInMillis
          });
        });

        it ('calls the errorFunction exactly once and polling is stopped', (done) => {
          poller.start()
          .then(() => {
            return Bluebird.delay(pollFrequencyInMillis * 3.5);
          })
          .then(() => {
            expect(poller.isRunning()).to.be(false);
            expect(successFunction.callCount).to.be(0);
            expect(errorFunction.callCount).to.be(1);
          })
          .then(done);
        });
      });

      describe('when the continuePollingOnError option has been set to true', () => {

        beforeEach(() => {
          poller = new Poller({
            functionToPoll,
            successFunction,
            errorFunction,
            pollFrequencyInMillis,
            continuePollingOnError: true
          });
        });

        it ('calls the errorFunction multiple times', (done) => {
          poller.start()
          .then(() => {
            return Bluebird.delay(pollFrequencyInMillis * 1.5);
          })
          .then(() => {
            poller.stop();
            expect(successFunction.callCount).to.be(0);
            expect(errorFunction.callCount).to.be(2);
          })
          .then(done);
        });
      });

    });
  });
});
