import expect from 'expect.js';
import { mapResponse } from '../map_response';
import responseOptionsNodes from './fixtures/map_response_nodes_options';
import responseMapResultNodes from './fixtures/map_response_nodes_result';

describe('map response of nodes data', () => {
  it('correctly maps listing response with nodes data', () => {
    const result = mapResponse(responseOptionsNodes);
    expect(result).to.eql(responseMapResultNodes);
  });
});
