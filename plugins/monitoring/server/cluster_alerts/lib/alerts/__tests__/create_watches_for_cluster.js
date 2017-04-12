import expect from 'expect.js';
import { get, isObject, isString, merge, set, values } from 'lodash';
import { alertIndexFields, alerts, createWatchesForCluster, watchIdsForCluster } from '../create_watches_for_cluster';

function expectToNotFindValue(objectValues, value) {
  for (const objectValue of objectValues) {
    if (isObject(objectValue)) {
      expectToNotFindValue(values(objectValue));
    }
    else if (isString(objectValue)) {
      expect(objectValue).to.not.contain(value);
    }
  }
}

function replaceExpectedValues(watch, fields, expected) {
  const watchCopy = merge({}, watch);

  // erase the expected value so we can catch mistakes
  for (const field of fields) {
    set(watchCopy, field, get(watchCopy, field).replace('{{' + expected + '}}', 'expected'));
  }

  // I intentionally added only one set of {} because I want to catch typos and not match against the field name (in scripts)!
  expectToNotFindValue(values(watchCopy), '{' + expected + '}');
}

describe('Alerts can be converted into watches', () => {
  const alertIndex = '.monitoring-alerts-N';
  const clusterUuid = 'alerts-test_123';
  const version = '1.2.3-alpha1';
  const watches = createWatchesForCluster(alertIndex, clusterUuid, version);
  const watchIds = watchIdsForCluster(clusterUuid);

  describe('createWatchesForCluster', () => {
    it('All alerts should be converted into watches', () => {
      expect(watches).to.have.length(alerts.length);
    });

    it('All alerts should be modified', () => {
      for (let i = 0; i < watches.length; ++i) {
        const watch = watches[i];
        const alert = alerts[i];

        // id
        expect(watch.id).to.contain(clusterUuid);
        expect(watch.id).to.be(get(alert.watch, alert.id).replace('{{cluster_uuid}}', clusterUuid));

        // version
        expect(watch.version).to.be(version);
        expect(watch.watch.metadata.xpack.version).to.be(version);

        // alert_index replacement in watch fields
        for (const field of alertIndexFields) {
          expect(get(watch.watch, field)).to.be(alertIndex);
        }

        // cluster_uuid replacement in watch fields
        for (const field of alert.cluster_uuid_fields) {
          const watchValue = get(watch.watch, field);

          expect(watchValue).to.contain(clusterUuid);
          expect(watchValue).to.be(get(alert.watch, field).replace('{{cluster_uuid}}', clusterUuid));
        }
      }
    });

    describe('{{variable}} fields', () => {
      for (const alert of alerts) {
        describe(`alert ${alert.watch.metadata.xpack.watch}`, () => {
          it('Only expected alert fields should contain {{alert_index}}', () => {
            // does the expect internally
            replaceExpectedValues(alert.watch, alertIndexFields, 'alert_index');
          });

          it('Only expected alert fields should contain {{cluster_uuid}}', () => {
            // does the expect internally
            replaceExpectedValues(alert.watch, alert.cluster_uuid_fields, 'cluster_uuid');
          });

          it('Expected alert fields equal {{alert_index}}', () => {
            for (const field of alertIndexFields) {
              expect(get(alert.watch, field)).to.be('{{alert_index}}');
            }
          });

          it('Expected alert fields contain {{cluster_uuid}}', () => {
            for (const field of alert.cluster_uuid_fields) {
              expect(get(alert.watch, field)).to.contain('{{cluster_uuid}}');
            }
          });
        });
      }
    });
  });

  describe('watchIdsForCluster', () => {
    it('All alerts should be converted into watch IDs', () => {
      expect(watchIds).to.have.length(alerts.length);
    });

    it('All watch IDs have the Cluster UUID replaced', () => {
      for (let i = 0; i < alerts.length; ++i) {
        expect(watchIds[i]).to.eql(get(alerts[i].watch, alerts[i].id).replace('{{cluster_uuid}}', clusterUuid));
      }
    });
  });
});
