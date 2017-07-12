import expect from 'expect.js';
import { Watch } from '../watch';
import { WATCH_TYPES } from '../../../../common/constants';

describe('watch', () => {

  describe('Watch', () => {

    describe('fromUpstreamJSON factory method', () => {

      let upstreamWatch;
      beforeEach(() => {
        upstreamWatch = {
          id: 'my-watch',
          type: 'json',
          watchJson: {
            metadata: {
              name: 'foo'
            },
            condition: {
              never: {}
            }
          },
          watchStatusJson: {
            state: {
              active: true
            }
          }
        };
      });

      it('returns correct Watch instance', () => {
        const watchModel = Watch.fromUpstreamJSON(upstreamWatch);

        expect(watchModel.id).to.be(upstreamWatch.id);
        expect(watchModel.name).to.be(upstreamWatch.watchJson.metadata.name);
        expect(watchModel.watch).to.eql({ condition: { never: {} } });
        expect(watchModel.watchStatus.isActive).to.eql(true);
      });

      it('returns correct Watch instance with no metadata in source', () => {
        delete upstreamWatch.watchJson.metadata;
        const watchModel = Watch.fromUpstreamJSON(upstreamWatch);

        expect(watchModel.id).to.be(upstreamWatch.id);
        expect(watchModel.name).to.be(undefined);
        expect(watchModel.watch).to.eql({ condition: { never: {} } });
        expect(watchModel.watchStatus.isActive).to.eql(true);
      });

    });

    describe('fromDownstreamJSON factory method', () => {

      let downstreamWatch;
      beforeEach(() => {
        downstreamWatch = {
          id: 'watch_id',
          type: 'json',
          name: 'watch name',
          watch: {
            foo: 'bar'
          }
        };
      });

      it('returns correct Watch instance', () => {
        const watchModel = Watch.fromDownstreamJSON(downstreamWatch);
        expect(watchModel.id).to.be(downstreamWatch.id);
        expect(watchModel.name).to.be(downstreamWatch.name);
        expect(watchModel.watch).to.eql({ foo: 'bar' });
      });

    });

    describe('downstreamJSON getter method', () => {

      let watchModel;
      beforeEach(() => {
        watchModel = new (Watch.getWatchTypes()[WATCH_TYPES.JSON])({
          id: 'watch_id',
          name: 'watch name',
          watchJson: {
            metadata: {
              name: 'foo'
            },
            condition: {
              never: {}
            }
          },
          watchStatusJson: {
            state: {
              active: true
            }
          },
          watch: {
            condition: {
              never: {}
            }
          }
        });
      });

      it('returns correct JSON for client', () => {
        const json = watchModel.downstreamJSON;
        expect(json.id).to.be(watchModel.id);
        expect(json.name).to.be(watchModel.name);
        expect(json.watch).to.eql(watchModel.watch);
        expect(json.watchStatus).to.eql({
          actionStatuses: [],
          comment: '',
          id: watchModel.id,
          lastChecked: null,
          lastFired: undefined,
          lastMetCondition: null,
          isActive: true,
          state: 'OK'
        });
      });

    });


    describe('upstreamJSON getter method', () => {

      let watchModel;
      beforeEach(() => {
        watchModel = new (Watch.getWatchTypes()[WATCH_TYPES.JSON])({
          id: 'watch_id',
          name: 'watch name',
          watch: {
            foo: 'bar'
          }
        });
      });

      it('returns correct JSON for client', () => {
        const json = watchModel.upstreamJSON;
        expect(json.id).to.be(watchModel.id);
        expect(json.watch).to.eql({
          foo: 'bar',
          metadata: {
            name: 'watch name',
            xpack: {
              type: 'json'
            }
          }
        });
      });

      it('preserves existing metadata properties (besides name)', () => {
        watchModel.watch.metadata = {
          foo: 'bar',
          bar: 'baz'
        };

        const json = watchModel.upstreamJSON;
        expect(json.id).to.be(watchModel.id);
        expect(json.watch).to.eql({
          foo: 'bar',
          metadata: {
            foo: 'bar',
            bar: 'baz',
            name: 'watch name',
            xpack: {
              type: 'json'
            }
          }
        });
      });


      it('metadata is removed if there are no fields (including name)', () => {
        watchModel.name = '';
        const json = watchModel.upstreamJSON;
        expect(json.id).to.be(watchModel.id);
        expect(json.watch).to.eql({
          foo: 'bar',
          metadata: {
            xpack: {
              type: 'json'
            }
          }
        });
      });

    });

  });

});
