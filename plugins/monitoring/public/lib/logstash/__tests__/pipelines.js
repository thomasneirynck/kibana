import expect from 'expect.js';
import {
  isPipelineMonitoringSupportedInVersion,
  processPipelinesAPIResponse
} from '../pipelines';

describe('pipelines', () => {

  describe('isPipelineMonitoringSupportedInVersion', () => {
    it('returns false if lower major version than supported version is supplied', () => {
      const logstashVersion = '5.7.1';
      expect(isPipelineMonitoringSupportedInVersion(logstashVersion)).to.be(false);
    });

    it('returns true if exact major version as supported version is supplied', () => {
      const logstashVersion = '6.1.0';
      expect(isPipelineMonitoringSupportedInVersion(logstashVersion)).to.be(true);
    });

    it('returns true if higher major version than supported version is supplied', () => {
      const logstashVersion = '7.0.2';
      expect(isPipelineMonitoringSupportedInVersion(logstashVersion)).to.be(true);
    });
  });

  describe('processPipelinesAPIResponse', () => {
    let response;
    beforeEach(() => {
      response = {
        pipelines: [
          {
            metrics: {
              throughput_for_cluster: {
                data: [
                  [ 1513721903, 17 ],
                  [ 1513722162, 23 ]
                ]
              },
              nodes_count_for_cluster: {
                data: [
                  [ 1513721903, 3 ],
                  [ 1513722162, 2 ]
                ]
              }
            }
          }
        ]
      };
    });

    it('normalizes the metric keys', () => {
      const processedResponse = processPipelinesAPIResponse(response, 'throughput_for_cluster', 'nodes_count_for_cluster');
      expect(processedResponse.pipelines[0].metrics.throughput).to.eql(response.pipelines[0].metrics.throughput_for_cluster);
      expect(processedResponse.pipelines[0].metrics.nodesCount).to.eql(response.pipelines[0].metrics.nodes_count_for_cluster);
    });

    it('computes the latest metrics', () => {
      const processedResponse = processPipelinesAPIResponse(response, 'throughput_for_cluster', 'nodes_count_for_cluster');
      expect(processedResponse.pipelines[0].latestThroughput).to.eql(23);
      expect(processedResponse.pipelines[0].latestNodesCount).to.eql(2);
    });

  });

});
