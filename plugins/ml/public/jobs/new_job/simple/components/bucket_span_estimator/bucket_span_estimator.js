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

import _ from 'lodash';

import { INTERVALS } from './intervals';
import { SingleSeriesCheckerProvider } from './single_series_checker';

export function BucketSpanEstimatorProvider($injector, Private) {

  const SingleSeriesChecker = Private(SingleSeriesCheckerProvider);

  class BucketSpanEstimator {
    constructor(index, timeField, aggTypes, fields, duration) {
      this.index = index;
      this.timeField = timeField;
      this.aggTypes = aggTypes;
      this.fields = fields;
      this.duration = duration;
      this.checkers = [];

      if(this.aggTypes.length === this.fields.length) {
        for(let i = 0; i < this.aggTypes.length; i++) {
          this.checkers.push({
            check: new SingleSeriesChecker(
              this.index,
              this.timeField,
              this.aggTypes[i],
              this.fields[i],
              this.duration),
            result: null
          });
        }
      }
    }

    run() {
      return new Promise((resolve, reject) => {
        if (this.checkers.length === 0) {
          reject();
        }

        let checkCounter = this.checkers.length;
        _.each(this.checkers, (check) => {
          check.check.run()
          .then((interval) => {
            check.result = interval;
            checkCounter--;

            if (checkCounter === 0) {
              const results = this.processResults();
              resolve(results);
            }
          })
          .catch((resp) => {
            reject(resp);
          });
        });
      });
    }

    processResults() {
      let results = _.map(this.checkers, 'result');
      results = _.sortBy(results, r => r.ms);

      if (results.length % 2 === 0) {
        // even number of results
        const medIndex = (((results.length) / 2) - 1);
        // find the two middle values
        const med1 = results[medIndex];
        const med2 = results[medIndex + 1];

        let interval = null;

        if (med1 === med2) {
          // if they're the same, use them
          return med1;
        } else {
          // find the average ms value between the two middle intervals
          const avgMs = ((med2.ms - med1.ms) / 2) + med1.ms;
          // loop over the allowed bucket spans to find closest one
          for(let i = 1; i < INTERVALS.length; i++) {
            if(avgMs < INTERVALS[i].ms) {
              // see if it's closer to this interval or the one before
              const int1 = INTERVALS[i - 1];
              const int2 = INTERVALS[i];
              const diff = int2.ms - int1.ms;
              const d = avgMs - int1.ms;
              if ((d / diff) < 0.5) {
                interval =  int1;
              } else {
                interval =  int2;
              }
              break;
            }
          }
        }
        return interval;
      } else {
        return results[(results.length - 1) / 2];
      }

    }


  }
  return BucketSpanEstimator;
}
