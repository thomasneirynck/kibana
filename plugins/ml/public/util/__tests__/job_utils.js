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
  isTimeSeriesViewJob,
  isTimeSeriesViewFunction,
  isModelPlotEnabled,
  mlFunctionToESAggregation
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

    it('returns true when job has a single detector with a metric function', () => {
      const job = {
        analysis_config: {
          detectors: [
              { 'function':'high_count','partition_field_name':'status','detector_description': 'High count status code' }
          ]
        }
      };

      expect(isTimeSeriesViewJob(job)).to.be(true);
    });

    it('returns true when job has at least one detector with a metric function', () => {
      const job = {
        analysis_config: {
          detectors: [
              { 'function':'high_count','partition_field_name':'status','detector_description': 'High count status code' },
              { 'function':'rare','by_field_name':'status','over_field_name':'clientip', 'detector_description': 'Rare status code' }
          ]
        }
      };

      expect(isTimeSeriesViewJob(job)).to.be(true);
    });

    it('returns false when job does not have at least one detector with a metric function', () => {
      const job = {
        analysis_config: {
          detectors: [
              { 'function':'rare','by_field_name':'status','over_field_name':'clientip','detector_description': 'Rare status code' },
              { 'function':'freq_rare','by_field_name':'uri','over_field_name':'clientip','detector_description': 'Freq rare URI' }
          ]
        }
      };

      expect(isTimeSeriesViewJob(job)).to.be(false);
    });

    it('returns false when job has a single count by category detector', () => {
      const job = {
        analysis_config: {
          detectors: [
              { 'function':'count','by_field_name':'mlcategory', 'detector_description': 'Count by category' }
          ]
        }
      };

      expect(isTimeSeriesViewJob(job)).to.be(false);
    });

  });

  describe('isTimeSeriesViewFunction', () => {

    it('returns true for expected functions', () => {
      expect(isTimeSeriesViewFunction('count')).to.be(true);
      expect(isTimeSeriesViewFunction('low_count')).to.be(true);
      expect(isTimeSeriesViewFunction('high_count')).to.be(true);
      expect(isTimeSeriesViewFunction('non_zero_count')).to.be(true);
      expect(isTimeSeriesViewFunction('low_non_zero_count')).to.be(true);
      expect(isTimeSeriesViewFunction('high_non_zero_count')).to.be(true);
      expect(isTimeSeriesViewFunction('distinct_count')).to.be(true);
      expect(isTimeSeriesViewFunction('low_distinct_count')).to.be(true);
      expect(isTimeSeriesViewFunction('high_distinct_count')).to.be(true);
      expect(isTimeSeriesViewFunction('metric')).to.be(true);
      expect(isTimeSeriesViewFunction('mean')).to.be(true);
      expect(isTimeSeriesViewFunction('low_mean')).to.be(true);
      expect(isTimeSeriesViewFunction('high_mean')).to.be(true);
      expect(isTimeSeriesViewFunction('min')).to.be(true);
      expect(isTimeSeriesViewFunction('max')).to.be(true);
      expect(isTimeSeriesViewFunction('sum')).to.be(true);
      expect(isTimeSeriesViewFunction('low_sum')).to.be(true);
      expect(isTimeSeriesViewFunction('high_sum')).to.be(true);
      expect(isTimeSeriesViewFunction('non_null_sum')).to.be(true);
      expect(isTimeSeriesViewFunction('low_non_null_sum')).to.be(true);
      expect(isTimeSeriesViewFunction('high_non_null_sum')).to.be(true);
    });

    it('returns false for expected functions', () => {
      expect(isTimeSeriesViewFunction('rare')).to.be(false);
      expect(isTimeSeriesViewFunction('freq_rare')).to.be(false);
      expect(isTimeSeriesViewFunction('info_content')).to.be(false);
      expect(isTimeSeriesViewFunction('low_info_content')).to.be(false);
      expect(isTimeSeriesViewFunction('high_info_content')).to.be(false);
      expect(isTimeSeriesViewFunction('median')).to.be(false);
      expect(isTimeSeriesViewFunction('low_median')).to.be(false);
      expect(isTimeSeriesViewFunction('high_median')).to.be(false);
      expect(isTimeSeriesViewFunction('varp')).to.be(false);
      expect(isTimeSeriesViewFunction('low_varp')).to.be(false);
      expect(isTimeSeriesViewFunction('high_varp')).to.be(false);
      expect(isTimeSeriesViewFunction('time_of_day')).to.be(false);
      expect(isTimeSeriesViewFunction('time_of_week')).to.be(false);
      expect(isTimeSeriesViewFunction('lat_long')).to.be(false);
    });
  });

  describe('isModelPlotEnabled', () => {

    it('returns true for a job in which model plot has been enabled', () => {
      const job = {
        model_plot_config: {
          enabled: true
        }
      };

      expect(isModelPlotEnabled(job)).to.be(true);
    });

    it('returns true for jobs in which model plot has not been enabled', () => {
      const job1 = {
        model_plot_config: {
          enabled: false
        }
      };
      const job2 = {};

      expect(isModelPlotEnabled(job1)).to.be(false);
      expect(isModelPlotEnabled(job2)).to.be(false);
    });

  });

  describe('mlFunctionToESAggregation', () => {
    it('returns correct ES aggregation type for ML function', () => {
      expect(mlFunctionToESAggregation('count')).to.be('count');
      expect(mlFunctionToESAggregation('low_count')).to.be('count');
      expect(mlFunctionToESAggregation('high_count')).to.be('count');
      expect(mlFunctionToESAggregation('non_zero_count')).to.be('count');
      expect(mlFunctionToESAggregation('low_non_zero_count')).to.be('count');
      expect(mlFunctionToESAggregation('high_non_zero_count')).to.be('count');
      expect(mlFunctionToESAggregation('distinct_count')).to.be('cardinality');
      expect(mlFunctionToESAggregation('low_distinct_count')).to.be('cardinality');
      expect(mlFunctionToESAggregation('high_distinct_count')).to.be('cardinality');
      expect(mlFunctionToESAggregation('metric')).to.be('avg');
      expect(mlFunctionToESAggregation('mean')).to.be('avg');
      expect(mlFunctionToESAggregation('low_mean')).to.be('avg');
      expect(mlFunctionToESAggregation('high_mean')).to.be('avg');
      expect(mlFunctionToESAggregation('min')).to.be('min');
      expect(mlFunctionToESAggregation('max')).to.be('max');
      expect(mlFunctionToESAggregation('sum')).to.be('sum');
      expect(mlFunctionToESAggregation('low_sum')).to.be('sum');
      expect(mlFunctionToESAggregation('high_sum')).to.be('sum');
      expect(mlFunctionToESAggregation('non_null_sum')).to.be('sum');
      expect(mlFunctionToESAggregation('low_non_null_sum')).to.be('sum');
      expect(mlFunctionToESAggregation('high_non_null_sum')).to.be('sum');
      expect(mlFunctionToESAggregation('rare')).to.be(null);
      expect(mlFunctionToESAggregation('freq_rare')).to.be(null);
      expect(mlFunctionToESAggregation('info_content')).to.be(null);
      expect(mlFunctionToESAggregation('low_info_content')).to.be(null);
      expect(mlFunctionToESAggregation('high_info_content')).to.be(null);
      expect(mlFunctionToESAggregation('median')).to.be(null);
      expect(mlFunctionToESAggregation('low_median')).to.be(null);
      expect(mlFunctionToESAggregation('high_median')).to.be(null);
      expect(mlFunctionToESAggregation('varp')).to.be(null);
      expect(mlFunctionToESAggregation('low_varp')).to.be(null);
      expect(mlFunctionToESAggregation('high_varp')).to.be(null);
      expect(mlFunctionToESAggregation('time_of_day')).to.be(null);
      expect(mlFunctionToESAggregation('time_of_week')).to.be(null);
      expect(mlFunctionToESAggregation('lat_long')).to.be(null);
    });
  });

});
