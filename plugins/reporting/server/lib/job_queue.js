// const EventEmitter = require('events').EventEmitter;
const Promise = require('bluebird');

// add items to queue
// start queue

class JobQueue {
  constructor(opts) {
    this._concurrency = opts.concurrency || Infinity;
    this._running = false;
    this._jobs = [];
  }

  add(job) {
    const queueJob = () => {
      return Promise.try(job);
    };

    this._jobs.push(queueJob);
    this.exec();
  }

  exec() {
    return Promise.map(this._jobs, (job) => {
      return job;
    }, { concurrency: this._concurrency });
  }
}

module.exports = function (concurrency = 1) {
  new JobQueue(concurrency);
};