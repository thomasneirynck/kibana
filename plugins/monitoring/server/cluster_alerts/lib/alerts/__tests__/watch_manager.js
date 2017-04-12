import expect from 'expect.js';
import sinon from 'sinon';
import { WatchManager } from '../watch_manager';
import { alerts, watchIdsForCluster } from '../create_watches_for_cluster';

describe('manage watches for alerts', () => {
  const alertIndex = '.monitoring-alerts-N';
  const monitoringTag = 'monitoring-ui';
  const serverInfo = { version: '4.5.6-beta1' };
  const server = {
    config: sinon.stub().returns({
      get: sinon.stub().withArgs('xpack.monitoring.cluster_alerts.index').returns(alertIndex)
                       .withArgs('xpack.monitoring.loggingTag').returns(monitoringTag)
                       .withArgs('xpack.monitoring.max_bucket_size').returns(1000)
    }),
    log: sinon.stub()
  };

  describe('create* / setup*', () => {
    it('createWatch handles failure', async () => {
      const id = 'bad-watch';
      const client = { watcher: { put_watch: sinon.stub().returns(Promise.reject(new Error('expected for test'))) } };
      const clusterUuid = 'imgoingtofail';
      const watchManager = new WatchManager(serverInfo, server, client);

      const watch = await watchManager._createWatch(clusterUuid, id, { invalid: { } });

      expect(watch._id).to.be(id);
      expect(watch.found).to.be(false);
      expect(client.watcher.put_watch.calledOnce).to.be(true);
    });

    it('createWatch acknowledges success', async () => {
      const id = 'good-watch';
      const client = { watcher: { put_watch: sinon.stub().returns(Promise.resolve({ _id: id })) } };
      const clusterUuid = 'imgoingtosucceed';
      const watchManager = new WatchManager(serverInfo, server, client);

      const watch = await watchManager._createWatch(clusterUuid, id, { totally_valid: { } });

      expect(watch._id).to.be(id);
      expect(watch.found).to.be(true);
      expect(client.watcher.put_watch.calledOnce).to.be(true);
    });

    it('createWatchIfNeeded handles failure', async () => {
      const id = 'bad-watch';
      const client = { watcher: { get_watch: sinon.stub().returns(Promise.reject(new Error('expected for test'))) } };
      const clusterUuid = 'imgoingtofail';
      const watchManager = new WatchManager(serverInfo, server, client);

      const watch = await watchManager._createWatchIfNeeded(clusterUuid, id, { invalid: { } });

      expect(watch._id).to.be(id);
      expect(watch.found).to.be(false);
      expect(client.watcher.get_watch.calledOnce).to.be(true);
    });

    it('createWatchIfNeeded acknowledges existence', async () => {
      const id = 'good-watch';
      const client = { watcher: { get_watch: sinon.stub().returns(Promise.resolve({ found: true })) } };
      const clusterUuid = 'imgoingtosucceed';
      const watchManager = new WatchManager(serverInfo, server, client);

      const watch = await watchManager._createWatchIfNeeded(clusterUuid, id, { totally_valid: { } });

      expect(watch._id).to.be(id);
      expect(watch.found).to.be(true);
      expect(client.watcher.get_watch.calledOnce).to.be(true);
    });

    it('createWatchIfNeeded creates watch if it does not exist', async () => {
      const id = 'good-watch';
      const client = {
        watcher: {
          get_watch: sinon.stub().returns(Promise.resolve({ found: false })),
          put_watch: sinon.stub().returns(Promise.resolve({ _id: id }))
        }
      };
      const clusterUuid = 'imgoingtosucceed';
      const watchManager = new WatchManager(serverInfo, server, client);

      const watch = await watchManager._createWatchIfNeeded(clusterUuid, id, { like_so_valid: { } });

      expect(watch._id).to.be(id);
      expect(watch.found).to.be(true);
      expect(client.watcher.get_watch.calledOnce).to.be(true);
      expect(client.watcher.put_watch.calledOnce).to.be(true);
    });

    it('createWatchIfNeeded creates watch if it does not exist, and accepts failure to create', async () => {
      const id = 'bad-watch';
      const client = {
        watcher: {
          get_watch: sinon.stub().returns(Promise.resolve({ found: false })),
          put_watch: sinon.stub().returns(Promise.reject(new Error('expected for test')))
        }
      };
      const clusterUuid = 'imgoingtofail';
      const watchManager = new WatchManager(serverInfo, server, client);

      const watch = await watchManager._createWatchIfNeeded(clusterUuid, id, { invalid: { } });

      expect(watch._id).to.be(id);
      expect(watch.found).to.be(false);
      expect(client.watcher.get_watch.calledOnce).to.be(true);
      expect(client.watcher.put_watch.calledOnce).to.be(true);
    });

    it('addWatchesToCluster looks up/creates watches, and accepts failure to create', async () => {
      const client = {
        watcher: {
          get_watch: sinon.stub().returns(Promise.resolve({ found: false })),
          put_watch: sinon.stub().returns(Promise.reject(new Error('expected for test')))
        }
      };
      const clusterUuid = 'imgoingtofail';
      const watchManager = new WatchManager(serverInfo, server, client);

      const success = await watchManager._addWatchesToCluster(clusterUuid, [ { id: 'bad-watch', watch: { invalid: { } } } ]);

      expect(success).to.be(false);
      expect(client.watcher.get_watch.calledOnce).to.be(true);
      expect(client.watcher.put_watch.calledOnce).to.be(true);
    });

    it('addWatchesToCluster looks up/creates watches, and accepts failure to create', async () => {
      const watches = [
        { id: 'good-watch1', watch: { totally_valid: { } } },
        { id: 'bad-watch', watch: { invalid: { } } },
        { id: 'good-watch2', watch: { like_so_valid: { } } }
      ];

      const client = {
        watcher: {
          get_watch: sinon.stub(),
          put_watch: sinon.stub().returns(Promise.reject(new Error('expected for test')))
        }
      };

      // fail to put it
      client.watcher.get_watch.onCall(1).returns(Promise.resolve({ found: false }));

      // otherwise find it
      client.watcher.get_watch.returns(Promise.resolve({ found: true }));

      const clusterUuid = 'imgoingtofail';
      const watchManager = new WatchManager(serverInfo, server, client);

      const success = await watchManager._addWatchesToCluster(clusterUuid, watches);

      expect(success).to.be(false);
      expect(client.watcher.get_watch.callCount).to.be(watches.length);
      expect(client.watcher.put_watch.calledOnce).to.be(true);
    });

    it('addWatchesToCluster looks up/creates watches successfully', async () => {
      const watches = [
        { id: 'good-watch1', watch: { totally_valid: { } } },
        { id: 'good-watch2', watch: { like_so_valid: { } } }
      ];

      const client = {
        watcher: {
          get_watch: sinon.stub(),
          put_watch: sinon.stub().returns(Promise.resolve({ id: 'ignored' }))
        }
      };

      client.watcher.get_watch.onCall(0).returns(Promise.resolve({ found: false }))
                              .onCall(1).returns(Promise.resolve({ found: true }));

      const clusterUuid = 'imgoingtosucceed';
      const watchManager = new WatchManager(serverInfo, server, client);

      const success = await watchManager._addWatchesToCluster(clusterUuid, watches);

      expect(success).to.be(true);
      expect(client.watcher.get_watch.callCount).to.be(watches.length);
      expect(client.watcher.put_watch.callCount).to.be(watches.length - 1);
    });

    it('setupWatchesForCluster looks up/creates watches, and accepts failure to create', async () => {
      const watches = [
        { id: 'good-watch1', watch: { totally_valid: { } } },
        { id: 'bad-watch', watch: { invalid: { } } },
        { id: 'good-watch2', watch: { like_so_valid: { } } }
      ];

      const client = {
        watcher: {
          get_watch: sinon.stub(),
          put_watch: sinon.stub().returns(Promise.reject(new Error('expected for test')))
        }
      };

      // fail to put it
      client.watcher.get_watch.onCall(1).returns(Promise.resolve({ found: false }));

      // otherwise find it
      client.watcher.get_watch.returns(Promise.resolve({ found: true }));

      const clusterUuid = 'imgoingtofail';
      const createWatches = sinon.stub().withArgs(alertIndex, clusterUuid, serverInfo.version).returns(watches);
      const watchManager = new WatchManager(serverInfo, server, client);

      const success = await watchManager.setupWatchesForCluster(clusterUuid, createWatches);

      expect(success).to.be(false);
      expect(createWatches.calledOnce).to.be(true);
      expect(client.watcher.get_watch.callCount).to.be(watches.length);
      expect(client.watcher.put_watch.calledOnce).to.be(true);
    });

    it('setupWatchesForCluster looks up/creates watches successfully', async () => {
      const watches = [
        { id: 'good-watch1', watch: { totally_valid: { } } },
        { id: 'good-watch2', watch: { like_so_valid: { } } }
      ];

      const client = {
        watcher: {
          get_watch: sinon.stub(),
          put_watch: sinon.stub().returns(Promise.resolve({ id: 'ignored' }))
        }
      };

      client.watcher.get_watch.onCall(0).returns(Promise.resolve({ found: false }))
                              .onCall(1).returns(Promise.resolve({ found: true }));

      const clusterUuid = 'imgoingtosucceed';
      const createWatches = sinon.stub().withArgs(alertIndex, clusterUuid, serverInfo.version).returns(watches);
      const watchManager = new WatchManager(serverInfo, server, client);

      const success = await watchManager.setupWatchesForCluster(clusterUuid, createWatches);

      expect(success).to.be(true);
      expect(createWatches.calledOnce).to.be(true);
      expect(client.watcher.get_watch.callCount).to.be(watches.length);
      expect(client.watcher.put_watch.callCount).to.be(watches.length - 1);
    });

    it('setupWatchesForCluster looks up/creates watches successfully for actual watches', async () => {
      const client = {
        watcher: {
          get_watch: sinon.stub(),
          put_watch: sinon.stub().returns(Promise.resolve({ id: 'ignored' }))
        }
      };

      client.watcher.get_watch.onCall(0).returns(Promise.resolve({ found: false }));

      // otherwise find it
      client.watcher.get_watch.returns(Promise.resolve({ found: true }));

      const clusterUuid = 'imgoingtosucceed';
      const watchManager = new WatchManager(serverInfo, server, client);

      const successes = await watchManager.setupWatchesForCluster(clusterUuid);

      expect(successes).to.not.contain(false);
      expect(client.watcher.get_watch.callCount).to.be(alerts.length);
      expect(client.watcher.put_watch.calledOnce).to.be(true);
    });

    it('setupWatchesForClusters looks up/creates watches, and accepts failure to create', async () => {
      const watches = [
        { id: 'good-watch1', watch: { totally_valid: { } } },
        { id: 'bad-watch', watch: { invalid: { } } },
        { id: 'good-watch2', watch: { like_so_valid: { } } }
      ];

      const client = {
        watcher: {
          get_watch: sinon.stub(),
          put_watch: sinon.stub().returns(Promise.reject(new Error('expected for test')))
        }
      };

      // fail to put it
      client.watcher.get_watch.onCall(1).returns(Promise.resolve({ found: false }))
                              .onCall(watches.length + 1).returns(Promise.resolve({ found: false }));

      // otherwise find it/succeed
      client.watcher.get_watch.returns(Promise.resolve({ found: true }));

      const clusterUuids = [ 'imgoingtofail1', 'imgoingtofail2' ];
      const createWatches = sinon.stub().returns(watches);
      const watchManager = new WatchManager(serverInfo, server, client);

      const successes = await watchManager.setupWatchesForClusters(clusterUuids, createWatches);

      expect(successes).to.not.contain(true);
      expect(createWatches.callCount).to.be(clusterUuids.length);
      expect(client.watcher.get_watch.callCount).to.be(watches.length * clusterUuids.length);
      expect(client.watcher.put_watch.callCount).to.be(clusterUuids.length);
    });

    it('setupWatchesForClusters looks up/creates watches successfully', async () => {
      const watches = [
        { id: 'good-watch1', watch: { totally_valid: { } } },
        { id: 'good-watch2', watch: { like_so_valid: { } } }
      ];

      const client = {
        watcher: {
          get_watch: sinon.stub(),
          put_watch: sinon.stub().returns(Promise.resolve({ id: 'ignored' }))
        }
      };

      client.watcher.get_watch.onCall(0).returns(Promise.resolve({ found: false }))
                              .onCall(watches.length).returns(Promise.resolve({ found: false }));

      // otherwise find it
      client.watcher.get_watch.returns(Promise.resolve({ found: true }));

      const clusterUuids = [ 'imgoingtosucceed1', 'imgoingtosucceed2' ];
      const createWatches = sinon.stub().returns(watches);
      const watchManager = new WatchManager(serverInfo, server, client);

      const successes = await watchManager.setupWatchesForClusters(clusterUuids, createWatches);

      expect(successes).to.not.contain(false);
      expect(createWatches.callCount).to.be(clusterUuids.length);
      expect(client.watcher.get_watch.callCount).to.be(watches.length * clusterUuids.length);
      expect(client.watcher.put_watch.callCount).to.be(clusterUuids.length);
    });

    it('setupWatchesForClusters looks up/creates watches successfully', async () => {
      const client = {
        watcher: {
          get_watch: sinon.stub(),
          put_watch: sinon.stub().returns(Promise.resolve({ id: 'ignored' }))
        }
      };

      client.watcher.get_watch.onCall(0).returns(Promise.resolve({ found: false }))
                              .onCall(alerts.length).returns(Promise.resolve({ found: false }));

      // otherwise find it
      client.watcher.get_watch.returns(Promise.resolve({ found: true }));

      const clusterUuids = [ 'imgoingtosucceed1', 'imgoingtosucceed2' ];
      const watchManager = new WatchManager(serverInfo, server, client);

      const successes = await watchManager.setupWatchesForClusters(clusterUuids);

      expect(successes).to.not.contain(false);
      expect(client.watcher.get_watch.callCount).to.be(alerts.length * clusterUuids.length);
      expect(client.watcher.put_watch.callCount).to.be(clusterUuids.length);
    });
  });

  describe('delete* / remove*', () => {
    it('deleteWatch handles failure', async () => {
      const id = 'bad-watch';
      const client = { watcher: { delete_watch: sinon.stub().returns(Promise.reject(new Error('expected for test'))) } };
      const clusterUuid = 'imgoingtofail';
      const watchManager = new WatchManager(serverInfo, server, client);

      const watch = await watchManager._deleteWatch(clusterUuid, id);

      expect(watch._id).to.be(id);
      expect(watch.found).to.be(false);
      expect(client.watcher.delete_watch.calledOnce).to.be(true);
    });

    it('deleteWatch acknowledges success', async () => {
      const id = 'good-watch';
      const client = { watcher: { delete_watch: sinon.stub().returns(Promise.resolve({ _id: id })) } };
      const clusterUuid = 'imgoingtosucceed';
      const watchManager = new WatchManager(serverInfo, server, client);

      const watch = await watchManager._deleteWatch(clusterUuid, id);

      expect(watch._id).to.be(id);
      expect(watch.found).to.be(true);
      expect(client.watcher.delete_watch.calledOnce).to.be(true);
    });

    it('deleteWatchesForCluster accepts failure to delete', async () => {
      const client = {
        watcher: {
          delete_watch: sinon.stub().returns(Promise.reject(new Error('expected for test')))
        }
      };
      const clusterUuid = 'imgoingtofail';
      const watchManager = new WatchManager(serverInfo, server, client);

      const success = await watchManager._deleteWatchesForCluster(clusterUuid, [ 'bad-watch' ]);

      expect(success).to.be(false);
      expect(client.watcher.delete_watch.calledOnce).to.be(true);
    });

    it('deleteWatchesForCluster removes watches, and accepts failure to delete for some', async () => {
      const watches = [ 'good-watch1', 'bad-watch', 'good-watch2' ];

      const client = { watcher: { delete_watch: sinon.stub() } };

      // fail to delete this one
      client.watcher.delete_watch.onCall(1).returns(Promise.reject(new Error('expected for test')));
      // otherwise find it
      client.watcher.delete_watch.returns(Promise.resolve({ found: true }));

      const clusterUuid = 'imgoingtofail';
      const watchManager = new WatchManager(serverInfo, server, client);

      const success = await watchManager._deleteWatchesForCluster(clusterUuid, watches);

      expect(success).to.be(false);
      expect(client.watcher.delete_watch.callCount).to.be(watches.length);
    });

    it('deleteWatchesForCluster removes watches successfully', async () => {
      const client = { watcher: { delete_watch: sinon.stub().returns(Promise.resolve({ found: true })) } };

      const clusterUuid = 'imgoingtosucceed';
      const watchManager = new WatchManager(serverInfo, server, client);

      const success = await watchManager._deleteWatchesForCluster(clusterUuid, watchIdsForCluster(clusterUuid));

      expect(success).to.be(true);
      expect(client.watcher.delete_watch.callCount).to.be(alerts.length);
    });

    it('removeWatchesForCluster deletess watches and accepts failure', async () => {
      const client = { watcher: { delete_watch: sinon.stub() } };

      // fail to delete it
      client.watcher.delete_watch.onCall(alerts.length - 1).returns(Promise.reject(new Error('expected for test')));
      // otherwise delete it
      client.watcher.delete_watch.returns(Promise.resolve({ found: true }));

      const clusterUuid = 'imgoingtofail';
      const watchManager = new WatchManager(serverInfo, server, client);

      const success = await watchManager.removeWatchesForCluster(clusterUuid);

      expect(success).to.be(false);
      expect(client.watcher.delete_watch.callCount).to.be(alerts.length);
    });

    it('removeWatchesForCluster deletes watches successfully', async () => {
      // note: found: false is okay because we just care that it was handled
      const client = { watcher: { delete_watch: sinon.stub().returns(Promise.resolve({ found: false })) } };

      const clusterUuid = 'imgoingtosucceed';
      const watchManager = new WatchManager(serverInfo, server, client);

      const success = await watchManager.removeWatchesForCluster(clusterUuid);

      expect(success).to.be(true);
      expect(client.watcher.delete_watch.callCount).to.be(alerts.length);
    });

    it('removeWatchesForClusters deletes all watches, and accepts failure to delete', async () => {
      const client = { watcher: { delete_watch: sinon.stub() } };

      // fail to delete it for a random watch per "cluster"
      client.watcher.delete_watch.onCall(alerts.length - 1).returns(Promise.reject(new Error('expected for test')))
                                 .onCall(alerts.length + 1).returns(Promise.reject(new Error('expected for test')));

      // otherwise find it/succeed (false indicates it wasn't there, but that's still successful!)
      client.watcher.delete_watch.returns(Promise.resolve({ found: false }));

      const clusterUuids = [ 'imgoingtofail1', 'imgoingtofail2' ];
      const watchManager = new WatchManager(serverInfo, server, client);

      const successes = await watchManager.removeWatchesForClusters(clusterUuids);

      expect(successes).to.not.contain(true);
      expect(client.watcher.delete_watch.callCount).to.be(alerts.length * clusterUuids.length);
    });

    it('removeWatchesForClusters deletes all watches successfully', async () => {
      const client = { watcher: { delete_watch: sinon.stub() } };

      // don't find the first watch for each cluster
      client.watcher.delete_watch.onCall(0).returns(Promise.resolve({ found: false }))
                                 .onCall(alerts.length).returns(Promise.resolve({ found: false }));

      // otherwise find it and delete it
      client.watcher.delete_watch.returns(Promise.resolve({ found: true }));

      const clusterUuids = [ 'imgoingtosucceed1', 'imgoingtosucceed2' ];
      const watchManager = new WatchManager(serverInfo, server, client);

      const successes = await watchManager.removeWatchesForClusters(clusterUuids);

      expect(successes).to.not.contain(false);
      expect(client.watcher.delete_watch.callCount).to.be(alerts.length * clusterUuids.length);
    });
  });
});
