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

import expect from 'expect.js';
import { estimateBucketSpanFactory } from '../bucket_span_estimator';

// mock callWithRequest
const callWithRequest = () => {
  return new Promise((resolve) => {
    resolve({});
  });
};

describe('ML - BucketSpanEstimator', () => {
  it('call factory', () => {
    expect(function () {
      estimateBucketSpanFactory(callWithRequest);
    }).to.not.throwError('Not initialized.');
  });

  it('call factory and estimator', (done) => {
    expect(function () {
      const estimateBucketSpan = estimateBucketSpanFactory(callWithRequest);

      estimateBucketSpan({
        aggTypes: ['count'],
        duration: {},
        fields: [null],
        filters: [],
        index: '',
        query: {
          bool: {
            must: [{ query_string: { analyze_wildcard: true, query: '*' } }],
            must_not: []
          }
        }
      }).catch((catchData) => {
        expect(catchData).to.be('BucketSpanEstimator: run has stopped because no checks returned a valid interval');
        done();
      });

    }).to.not.throwError('Not initialized.');
  });

});
