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

import { SingleSeriesCheckerProvider } from './single_series_checker';

export function BucketSpanEstimatorProvider($injector, Private) {

  const SingleSeriesChecker = Private(SingleSeriesCheckerProvider);

  class BucketSpanEstimator {
    constructor(index, timeField, aggType, field, duration) {
      this.index = index;
      this.timeField = timeField;
      this.aggType = aggType;
      this.field = field;
      this.duration = duration;
      this.emc = new SingleSeriesChecker(index, timeField, aggType, field, duration);
    }

    run() {
      return new Promise((resolve, reject) => {
        this.emc.run()
        .then((resp) => {
          resolve(resp);
        })
        .catch((resp) => {
          reject(resp);
        });
      });
    }


  }
  return BucketSpanEstimator;
}
