import expect from 'expect.js';
import sinon from 'sinon';

import { fetchTelemetry } from '../fetch_telemetry';

describe('fetch_telemetry', () => {

  it('fetchTelemetry calls expected URL with 20 minutes - now', () => {
    const response = Promise.resolve();
    const $http = {
      post: sinon.stub()
    };
    const basePath = 'fake';
    const moment = {
      subtract: sinon.stub(),
      toISOString: () => 'max123'
    };

    moment.subtract.withArgs(20, 'minutes').returns({
      toISOString: () => 'min456'
    });

    $http.post.withArgs(`fake/api/telemetry/v1/clusters/_stats`, {
      timeRange: {
        min: 'min456',
        max: 'max123'
      }
    })
      .returns(response);

    expect(fetchTelemetry($http, { basePath, _moment: () => moment })).to.be(response);
  });

});
