import expect from 'expect.js';
import { _handleResponse } from '../get_pipelines';

describe('get_pipelines', () => {
  let fetchPipelinesWithMetricsResult;

  describe('fetchPipelinesWithMetrics result contains no pipelines', () => {
    beforeEach(() => {
      fetchPipelinesWithMetricsResult = {
        logstash_pipeline_throughput: [
          {
            data: []
          }
        ],
        logstash_pipeline_nodes_count: [
          {
            data: []
          }
        ]
      };
    });

    it ('returns an empty array', () => {
      const result = _handleResponse(fetchPipelinesWithMetricsResult);
      expect(result).to.eql([]);
    });
  });

  describe('fetchPipelinesWithMetrics result contains pipelines', () => {
    beforeEach(() => {
      fetchPipelinesWithMetricsResult = {
        logstash_pipeline_throughput: [
          {
            data: [
              [1513123151000, { apache_logs: 231, logstash_tweets: 34 }]
            ]
          }
        ],
        logstash_pipeline_nodes_count: [
          {
            data: [
              [1513123151000, { apache_logs: 3, logstash_tweets: 1 }]
            ]
          }
        ]
      };
    });

    it ('returns the correct structure for a non-empty response', () => {
      const result = _handleResponse(fetchPipelinesWithMetricsResult);
      expect(result).to.eql([
        {
          id: 'apache_logs',
          metrics: {
            logstash_pipeline_throughput: {
              data: [
                [ 1513123151000, 231 ]
              ]
            },
            logstash_pipeline_nodes_count: {
              data: [
                [ 1513123151000, 3 ]
              ]
            }
          }
        },
        {
          id: 'logstash_tweets',
          metrics: {
            logstash_pipeline_throughput: {
              data: [
                [ 1513123151000, 34 ]
              ]
            },
            logstash_pipeline_nodes_count: {
              data: [
                [ 1513123151000, 1 ]
              ]
            }
          }
        }
      ]);
    });
  });
});
