/*
 * ELASTICSEARCH CONFIDENTIAL
 *
 * Copyright (c) 2017 Elasticsearch BV. All Rights Reserved.
 *
 * Notice: this software, and all information contained
 * therein, is the exclusive property of Elasticsearch BV
 * and its licensors, if any, and is protected under applicable
 * domestic and foreign law, and international treaties.
 *
 * Reproduction, republication or distribution without the
 * express written consent of Elasticsearch BV is
 * strictly prohibited.
 */

export function SingleSeriesCheckerProvider($injector) {
  const es = $injector.get('es');

  const intervals = [
    // { name:'1m',  ms: 60000 },
    { name:'5m',  ms: 300000 },
    { name:'10m', ms: 600000 },
    { name:'30m', ms: 1800000 },
    { name:'1h',  ms: 3600000 },
    { name:'3h',  ms: 10800000 }
  ];
  const BUCKET_MULTIPLIER = 500;
  const REF_DATA_INTERVAL = { name:'1h',  ms: 3600000 };

  class SingleSeriesChecker {
    constructor(index, timeField, aggType, field, duration) {
      this.index = index;
      this.timeField = timeField;
      this.aggType = aggType;
      this.field = field;
      this.duration = duration;
      this.refMetricData = {
        meanValue: 0,
        meanDiff: 0,
        varValue: 0,
        varDiff: 0
      };

      this.interval = null;
    }

    run() {
      return new Promise((resolve, reject) => {
        const start = () => {
          // run all tests, returns a suggested interval
          this.runTests()
          .then((interval) => {
            this.interval = interval;
            resolve(this.interval);
          })
          .catch((resp) => {
            reject(resp);
          });
        };

        // if a field has been selected, first create ref data used in metric check
        if (this.field === null) {
          start();
        } else {
          this.createRefMetricData(REF_DATA_INTERVAL.ms)
          .then(() => {
            start();
          })
          .catch((resp) => {
            reject(resp);
          });
        }
      });
    }

    runTests() {
      return new Promise((resolve, reject) => {
        let count = 0;

        // recursive function called with the index of the intervals array
        // each time one of the checks fails, the index is increased and
        // the tests are repeated.
        const runTest = (i) => {
          const interval = intervals[i];
          this.performSearch(interval.ms)
          .then((resp) => {

            const buckets = resp.aggregations.non_empty_buckets.buckets;
            const fullBuckets = this.getFullBuckets(buckets);

            let pass = true;
            if (pass && this.testBucketPercentage(fullBuckets, buckets) === false) {
              pass = false;
            }

            if (pass && this.testPolledData(fullBuckets, interval.ms) === false) {
              pass = false;
            }

            if (this.aggType.mlName === 'sum' || this.aggType.mlName === 'count') {
              if (pass && this.testSumCountBuckets(fullBuckets) === false) {
                pass = false;
              }
            }

            // only run this test for bucket spans less than 1 hour
            if (this.field !== null && interval.ms < 3600000) {
              if (pass && this.testMetricData(fullBuckets) === false) {
                pass = false;
              }
            }

            if (pass) {
              console.log(`Estimate bucket span: ${interval.name} passed`);
              resolve(interval);
            } else {
              count++;
              if (count === intervals.length) {
                console.log(`Estimate bucket span: ${interval.name} passed by default`);
                resolve(interval);
              } else {
                console.log(`Estimate bucket span: ${interval.name} failed`);
                runTest(count);
              }
            }
          })
          .catch((resp) => {
            // do something better with this
            reject(resp);
          });
        };

        runTest(count);
      });
    }

    createSearch(intervalMs) {
      this.duration.end = (intervalMs * BUCKET_MULTIPLIER) + this.duration.start;

      const search = {
        query: {
          range: {
            [this.timeField]: {
              gte: this.duration.start,
              lt: this.duration.end,
              format: 'epoch_millis'
            }
          }
        },
        aggs : {
          non_empty_buckets : {
            date_histogram : {
              field : this.timeField,
              interval : `${intervalMs}ms`
            }
          }
        }
      };

      if (this.field !== null) {
        search.aggs.non_empty_buckets.aggs = {
          fieldValue: {
            [this.aggType.name]: {
              field: this.field
            }
          }
        };
      }
      return search;
    }

    performSearch(intervalMs) {
      const body = this.createSearch(intervalMs);

      return es.search({
        index: this.index,
        size: 0,
        body
      });
    }

    getFullBuckets(buckets) {
      const fullBuckets = [];
      for (let i = 0; i < buckets.length; i++) {
        if (buckets[i].doc_count > 0) {
          fullBuckets.push(buckets[i]);
        }
      }
      return fullBuckets;
    }

    // test that the more than 20% of the buckets contain data
    testBucketPercentage(fullBuckets, buckets) {
      const pcnt = (fullBuckets.length / buckets.length);
      return (pcnt > 0.2);
    }

    // test that the coefficient of variation of time difference between non-empty buckets is small
    testPolledData(fullBuckets, intervalMs) {
      let pass = false;

      const timeDiffs = [];
      let sumOfTimeDiffs = 0;
      for (let i = 1; i < fullBuckets.length; i++) {
        const diff = (fullBuckets[i].key - fullBuckets[i - 1].key);
        sumOfTimeDiffs += diff;
        timeDiffs.push(diff);
      }

      const meanTimeDiff = sumOfTimeDiffs / (fullBuckets.length - 1);

      let sumSquareTimeDiffResiduals = 0;
      for (let i = 0; i < fullBuckets.length - 1; i++) {
        sumSquareTimeDiffResiduals += Math.pow(timeDiffs[i] - meanTimeDiff, 2);
      }

      const vari = sumSquareTimeDiffResiduals / (fullBuckets.length - 1);

      const cov = Math.sqrt(vari) / meanTimeDiff;

      if ((cov < 0.1) && (intervalMs < meanTimeDiff)) {
        pass = false;
      } else {
        pass = true;
      }
      return pass;
    }

    // test that the full buckets contain at least 5 documents
    testSumCountBuckets(fullBuckets) {
      let totalCount = 0;
      for (let i = 0; i < fullBuckets.length; i++) {
        totalCount += fullBuckets[i].doc_count;
      }
      const mean = totalCount / fullBuckets.length;
      return (mean >= 5);
    }

    // create the metric data used for the metric test and the metric test 1hr reference data
    createMetricData(fullBuckets) {
      const valueDiffs = [];
      let sumOfValues = fullBuckets[0].fieldValue.value;
      let sumOfValueDiffs = 0;
      for (let i = 1; i < fullBuckets.length; i++) {
        const value = fullBuckets[i].fieldValue.value;
        const diff = (value - fullBuckets[i - 1].fieldValue.value);
        sumOfValueDiffs += diff;
        valueDiffs.push(diff);
        sumOfValues += value;
      }

      const meanValue = sumOfValues / fullBuckets.length;
      const meanValueDiff = sumOfValueDiffs / (fullBuckets.length - 1);

      let sumOfSquareValueResiduals = 0;
      let sumOfSquareValueDiffResiduals = 0;
      for (let i = 0; i < fullBuckets.length - 1; i++) {
        sumOfSquareValueResiduals += Math.pow(fullBuckets[i].fieldValue.value - meanValue, 2);
        sumOfSquareValueDiffResiduals += Math.pow(valueDiffs[i] - meanValueDiff, 2);
      }
      sumOfSquareValueResiduals += Math.pow(fullBuckets[fullBuckets.length - 1].fieldValue.value - meanValue, 2);

      const varValue = sumOfSquareValueResiduals / (fullBuckets.length);
      const varDiff = sumOfSquareValueDiffResiduals / (fullBuckets.length - 1);

      return {
        varValue,
        varDiff
      };
    }

    // create reference data for the scale variation check
    createRefMetricData(intervalMs) {
      return new Promise((resolve, reject) => {
        if (this.field === null) {
          resolve();
          return;
        }

        this.performSearch(intervalMs) // 1h
        .then((resp) => {
          const buckets = resp.aggregations.non_empty_buckets.buckets;
          const fullBuckets = this.getFullBuckets(buckets);
          this.refMetricData = this.createMetricData(fullBuckets);

          resolve();
        })
        .catch((resp) => {
          reject(resp);
        });
      });
    }

    // scale variation check
    testMetricData(fullBuckets) {
      const metricData = this.createMetricData(fullBuckets);
      const stat = (metricData.varDiff / metricData.varValue) / (this.refMetricData.varDiff / this.refMetricData.varValue);
      return (stat <= 5);
    }


  }

  return SingleSeriesChecker;
}
