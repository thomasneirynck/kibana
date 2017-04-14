import expect from 'expect.js';
import { watcherApi } from '../watcher_api';

describe('watcher API methods exist', () => {
  const Client = function () { };
  const Call = function () { };
  const components = {
    clientAction: {
      factory: arg => arg,
      namespaceFactory: () => {
        return Call;
      }
    }
  };

  watcherApi(Client, undefined, components);

  const endpoint = '/_xpack/watcher/watch/<%=watch_id%>';

  it('delete_watch API exists', () => {
    const client = new Client();
    client.watcher = new Call();

    expect(client.watcher.delete_watch.urls).to.have.length(1);
    expect(client.watcher.delete_watch.urls[0].fmt).to.be(endpoint);
    expect(client.watcher.delete_watch.urls[0].req.watch_id.type).to.be('string');
    expect(client.watcher.delete_watch.method).to.be('DELETE');
    expect(client.watcher.delete_watch.needBody).to.be(undefined);
    expect(client.watcher.delete_watch.params.filterPath.type).to.be('list');
    expect(client.watcher.delete_watch.params.filterPath.name).to.be('filter_path');
  });

  it('get_watch API exists', () => {
    const client = new Client();
    client.watcher = new Call();

    expect(client.watcher.get_watch.urls).to.have.length(1);
    expect(client.watcher.get_watch.urls[0].fmt).to.be(endpoint);
    expect(client.watcher.get_watch.urls[0].req.watch_id.type).to.be('string');
    expect(client.watcher.get_watch.method).to.be('GET');
    expect(client.watcher.get_watch.needBody).to.be(undefined);
    expect(client.watcher.get_watch.params.filterPath.type).to.be('list');
    expect(client.watcher.get_watch.params.filterPath.name).to.be('filter_path');
  });

  it('put_watch API exists', () => {
    const client = new Client();
    client.watcher = new Call();

    expect(client.watcher.put_watch.urls).to.have.length(1);
    expect(client.watcher.put_watch.urls[0].fmt).to.be(endpoint);
    expect(client.watcher.put_watch.urls[0].req.watch_id.type).to.be('string');
    expect(client.watcher.put_watch.needBody).to.be(true);
    expect(client.watcher.put_watch.method).to.be('PUT');
    expect(client.watcher.put_watch.params.filterPath.type).to.be('list');
    expect(client.watcher.put_watch.params.filterPath.name).to.be('filter_path');
  });
});
