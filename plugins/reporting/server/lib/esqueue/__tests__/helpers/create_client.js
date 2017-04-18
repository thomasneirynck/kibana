import expect from 'expect.js';
import proxyquire from 'proxyquire';
import { ClientMock } from '../fixtures/elasticsearch';

const { createClient, isClient } = proxyquire.noPreserveCache()('../../helpers/create_client', {
  'elasticsearch': { Client: ClientMock }
});

describe('Create client helper', function () {
  it('should have a client', function () {
    const options = {
      host: 'http://localhost:9200'
    };
    const client = createClient(options);
    expect(isClient(client)).to.be.ok();
  });

  it('should use passed in instance', function () {
    const clientInstance = new ClientMock();
    const client = createClient(clientInstance);
    expect(client).to.equal(clientInstance);
  });
});
