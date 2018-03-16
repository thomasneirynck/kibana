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
import { validateJob } from '../job_validation';

// mock callWithRequest
const callWithRequest = () => {
  return new Promise((resolve) => {
    resolve({});
  });
};

describe('ML - validateJob', () => {
  it('calling factory without payload throws an error', (done) => {
    validateJob(callWithRequest).then(
      () => done(new Error('Promise should not resolve for this test without payload.')),
      () => done()
    );
  });

  it('calling factory with incomplete payload throws an error', (done) => {
    const payload = {};

    validateJob(callWithRequest, payload).then(
      () => done(new Error('Promise should not resolve for this test with incomplete payload.')),
      () => done()
    );
  });

  it('throws an error because job.analysis_config is not an object', (done) => {
    const payload = { job: {} };

    validateJob(callWithRequest, payload).then(
      () => done(new Error('Promise should not resolve for this test with job.analisys_config not being an object.')),
      () => done()
    );
  });

  it('throws an error because job.analysis_config.detectors is not an Array', (done) => {
    const payload = { job: { analysis_config: {} } };

    validateJob(callWithRequest, payload).then(
      () => done(new Error('Promise should not resolve for this test when detectors is not an Array.')),
      () => done()
    );
  });

  it('basic validation messages', () => {
    const payload = { job: { analysis_config: { detectors: [] } } };

    return validateJob(callWithRequest, payload).then(
      (messages) => {
        const ids = messages.map(m => m.id);

        expect(ids).to.eql([
          'job_id_empty',
          'detectors_empty',
          'bucket_span_empty',
          'skipped_extended_tests'
        ]);
      }
    );
  });

  const jobIdTests = (testIds, messageId) => {
    const promises = testIds.map((id) => {
      const payload = { job: { analysis_config: { detectors: [] } } };
      payload.job.job_id = id;
      return validateJob(callWithRequest, payload).catch(() => {
        new Error('Promise should not fail for jobIdTests.');
      });
    });

    return Promise.all(promises).then(
      (testResults) => {
        testResults.forEach((messages) => {
          const ids = messages.map(m => m.id);
          expect(ids.includes(messageId)).to.equal(true);
        });
      }
    );
  };

  const jobGroupIdTest = (testIds, messageId) => {
    const payload = { job: { analysis_config: { detectors: [] } } };
    payload.job.groups = testIds;

    return validateJob(callWithRequest, payload).then(
      (messages) => {
        const ids = messages.map(m => m.id);
        expect(ids.includes(messageId)).to.equal(true);
      }
    );
  };

  const invalidTestIds = [
    '$', '$test', 'test$', 'te$st',
    '-', '-test', 'test-', '-test-',
    '_', '_test', 'test_', '_test_'
  ];
  it('invalid job ids', () => {
    return jobIdTests(invalidTestIds, 'job_id_invalid');
  });
  it('invalid job group ids', () => {
    return jobGroupIdTest(invalidTestIds, 'job_group_id_invalid');
  });

  const validTestIds = ['1test', 'test1', 'test-1', 'test_1'];
  it('valid job ids', () => {
    return jobIdTests(validTestIds, 'job_id_valid');
  });
  it('valid job group ids', () => {
    return jobGroupIdTest(validTestIds, 'job_group_id_valid');
  });

  const bucketSpanFormatTests = (testFormats, messageId) => {
    const promises = testFormats.map((format) => {
      const payload = { job: { analysis_config: { detectors: [] } } };
      payload.job.analysis_config.bucket_span = format;
      return validateJob(callWithRequest, payload).catch(() => {
        new Error('Promise should not fail for bucketSpanFormatTests.');
      });
    });

    return Promise.all(promises).then(
      (testResults) => {
        testResults.forEach((messages) => {
          const ids = messages.map(m => m.id);
          expect(ids.includes(messageId)).to.equal(true);
        });
      }
    );
  };
  it('invalid bucket span formats', () => {
    const invalidBucketSpanFormats = ['a', '10', '$'];
    return bucketSpanFormatTests(invalidBucketSpanFormats, 'bucket_span_invalid');
  });
  it('valid bucket span formats', () => {
    const validBucketSpanFormats = ['1s', '4h', '10d', '6w', '2m', '3y'];
    return bucketSpanFormatTests(validBucketSpanFormats, 'bucket_span_valid');
  });

  it('at least one detector function is empty', () => {
    const payload = { job: { analysis_config: { detectors: [] } } };
    payload.job.analysis_config.detectors.push({
      function: 'count'
    });
    payload.job.analysis_config.detectors.push({
      function: ''
    });
    payload.job.analysis_config.detectors.push({
      function: undefined
    });

    return validateJob(callWithRequest, payload).then(
      (messages) => {
        const ids = messages.map(m => m.id);
        expect(ids.includes('detectors_function_empty')).to.equal(true);
      }
    );
  });

  it('detector function is not empty', () => {
    const payload = { job: { analysis_config: { detectors: [] } } };
    payload.job.analysis_config.detectors.push({
      function: 'count'
    });

    return validateJob(callWithRequest, payload).then(
      (messages) => {
        const ids = messages.map(m => m.id);
        expect(ids.includes('detectors_function_not_empty')).to.equal(true);
      }
    );
  });

  it('invalid index fields', () => {
    const payload = {
      job: { analysis_config: { detectors: [] } },
      fields: {}
    };

    return validateJob(callWithRequest, payload).then(
      (messages) => {
        const ids = messages.map(m => m.id);
        expect(ids.includes('index_fields_invalid')).to.equal(true);
      }
    );
  });

  it('valid index fields', () => {
    const payload = {
      job: { analysis_config: { detectors: [] } },
      fields: { testField: {} }
    };

    return validateJob(callWithRequest, payload).then(
      (messages) => {
        const ids = messages.map(m => m.id);
        expect(ids.includes('index_fields_valid')).to.equal(true);
      }
    );
  });

  const getBasicPayload = () => ({
    job: {
      job_id: 'test',
      analysis_config: {
        bucket_span: '15m',
        detectors: [{
          function: 'count'
        }],
        influencers: []
      },
      data_description: { time_field: '@timestamp' },
      datafeed_config: { indices: [] }
    },
    fields: { testField: {} }
  });

  it('throws an error because job.analysis_config.influencers is not an Array', (done) => {
    const payload = getBasicPayload();
    delete payload.job.analysis_config.influencers;

    validateJob(callWithRequest, payload).then(
      () => done(new Error('Promise should not resolve for this test when influencers is not an Array.')),
      () => done()
    );
  });

  it('basic validation passes, extended checks return some messages', () => {
    const payload = getBasicPayload();
    return validateJob(callWithRequest, payload).then(
      (messages) => {
        const ids = messages.map(m => m.id);
        expect(ids).to.eql([
          'job_id_valid',
          'detectors_function_not_empty',
          'index_fields_valid',
          'success_cardinality',
          'bucket_span_no_duration',
          'influencer_low'
        ]);
      }
    );
  });

});
