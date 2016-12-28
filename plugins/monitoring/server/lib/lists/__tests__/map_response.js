import expect from 'expect.js';
import mapResponse from '../map_response';
import responseOptionsIndices from './fixtures/map_response_indices_options';
import responseMapResultIndices from './fixtures/map_response_indices_result';
import responseOptionsNodes from './fixtures/map_response_nodes_options';
import responseMapResultNodes from './fixtures/map_response_nodes_result';

describe('mapResponse', () => {

  it('correctly maps listing response with indices data', () => {
    const result = mapResponse(responseOptionsIndices);
    expect(result).to.eql(responseMapResultIndices);
  });

  it('correctly maps listing response with nodes data', () => {
    const result = mapResponse(responseOptionsNodes);
    expect(result).to.eql(responseMapResultNodes);
  });

});
