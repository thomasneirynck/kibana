import expect from 'expect.js';
import mapResponse from '../map_response';
import responseOptionsIndices from './fixtures/map_response_indices_options';
import responseMapResultIndices from './fixtures/map_response_indices_result';
import responseOptionsNodes from './fixtures/map_response_nodes_options';
import responseMapResultNodes from './fixtures/map_response_nodes_result';

describe('mapResponse', () => {

  describe('of indices data', () => {
    it('defaults `last` value to 0 for null bucket (e.g. index with 0 documents)', () => {
      const result = mapResponse({
        "type": "indices",
        "listingMetrics": [ "index_document_count" ],
        "items": [
          {
            "index_document_count": {
              "buckets": [
                {
                  "metric_deriv": { "normalized_value": null, "value": null },
                  "metric": { "value": null }
                }
              ]
            }
          }
        ]
      });
      expect(result[0].metrics.index_document_count.last).to.be(0);
    });

    it('correctly maps listing response with indices data', () => {
      const result = mapResponse(responseOptionsIndices);
      expect(result).to.eql(responseMapResultIndices);
    });
  });

  describe('of nodes data', () => {
    it('correctly maps listing response with nodes data', () => {
      const result = mapResponse(responseOptionsNodes);
      expect(result).to.eql(responseMapResultNodes);
    });
  });

});
