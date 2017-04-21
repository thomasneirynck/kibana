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
import {
  calculateDatafeedFrequencyDefaultSeconds,
  isTimeSeriesViewJob
} from '../job_utils';

describe('ML - job utils', () => {
  describe('calculateDatafeedFrequencyDefaultSeconds', () => {

    it('returns correct frequency for 119', () => {
      const result = calculateDatafeedFrequencyDefaultSeconds(119);
      expect(result).to.be(60);
    });
    it('returns correct frequency for 120', () => {
      const result = calculateDatafeedFrequencyDefaultSeconds(120);
      expect(result).to.be(60);
    });
    it('returns correct frequency for 300', () => {
      const result = calculateDatafeedFrequencyDefaultSeconds(300);
      expect(result).to.be(150);
    });
    it('returns correct frequency for 601', () => {
      const result = calculateDatafeedFrequencyDefaultSeconds(601);
      expect(result).to.be(300);
    });
    it('returns correct frequency for 43200', () => {
      const result = calculateDatafeedFrequencyDefaultSeconds(43200);
      expect(result).to.be(600);
    });
    it('returns correct frequency for 43201', () => {
      const result = calculateDatafeedFrequencyDefaultSeconds(43201);
      expect(result).to.be(3600);
    });

  });

  describe('isTimeSeriesViewJob', () => {

    it('returns false when job has no model_plot_config', () => {
      const job = {
        analysis_config: {
          detectors: []
        }
      };

      expect(isTimeSeriesViewJob(job)).to.be(false);
    });

    it('returns false when job has model_plot_config but no detectors', () => {
      const job = {
        model_plot_config: {},
        analysis_config: {
          detectors: []
        }
      };

      const result = isTimeSeriesViewJob(job);
      expect(result).to.be(false);
    });

    it('returns false when job has more than one detector', () => {
      const job = {
        model_plot_config: {},
        analysis_config: {
          detectors: [{}, {}]
        }
      };

      const result = isTimeSeriesViewJob(job);
      expect(result).to.be(false);
    });

    it('returns false when job has one detector with a by, and no over or partition field', () => {
      const job = {
        model_plot_config: {},
        analysis_config: {
          detectors: [{
            by_field_name: ''
          }]
        }
      };

      const result = isTimeSeriesViewJob(job);
      expect(result).to.be(false);
    });

    it('returns true when job has one detector with no by, over or partition field', () => {
      const job = {
        model_plot_config: {},
        analysis_config: {
          detectors: [{}]
        }
      };

      const result = isTimeSeriesViewJob(job);
      expect(result).to.be(true);
    });

  });
});
