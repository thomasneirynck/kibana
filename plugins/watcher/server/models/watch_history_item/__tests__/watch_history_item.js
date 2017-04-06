import moment from 'moment';
import expect from 'expect.js';
import { WatchHistoryItem } from '../watch_history_item';

describe('watch_history_item', () => {
  describe('WatchHistoryItem', () => {
    let upstreamJson;

    beforeEach(() => {
      upstreamJson = {
        id: 'only-trigger_76220454-7e10-4088-96ca-3d77c49d34bf-2017-01-25T13:30:33.070',
        watchId: 'only-trigger',
        watchHistoryItemJson: {
          _status: {
            state: {
              active: true
            }
          },
          state: 'throttled',
          result: {
            execution_time: '2017-01-05T21:49:27.000Z',
            actions: [{
              id: 'test-log',
              type: 'logging',
              status: 'success',
              logging: {
                logged_text: 'hello there, i am a test log',
              },
            }, {
              id: 'throttled-log',
              type: 'logging',
              status: 'throttled',
              logging: {
                logged_text: 'action [throttled-log] was acked at [2017-01-04T21:29:27.000Z]',
              },
            }],
          }
        }
      };
    });

    describe('fromUpstreamJSON factory method', () => {
      it('returns correct WatchHistoryItem instance', () => {
        const watchHistoryItem = WatchHistoryItem.fromUpstreamJSON(upstreamJson);
        expect(watchHistoryItem).to.have.property('id');
        expect(watchHistoryItem).to.have.property('watchId');
        expect(watchHistoryItem).to.have.property('watchHistoryItemJson');
        expect(watchHistoryItem).to.have.property('includeDetails');
        expect(watchHistoryItem).to.have.property('details');
        expect(watchHistoryItem).to.have.property('startTime');
        expect(watchHistoryItem).to.have.property('watchStatus');

        expect(watchHistoryItem.id).to.eql(upstreamJson.id);
        expect(watchHistoryItem.watchId).to.eql(upstreamJson.watchId);
        expect(watchHistoryItem.watchHistoryItemJson).to.eql(upstreamJson.watchHistoryItemJson);
        expect(watchHistoryItem.includeDetails).to.be(false);
        expect(watchHistoryItem.details).to.eql(upstreamJson.watchHistoryItemJson);
        expect(watchHistoryItem.startTime).to.be.a(moment);
        expect(watchHistoryItem.watchStatus).to.eql({
          id: upstreamJson.watchId,
          actionStatuses: [],
          isActive: upstreamJson.watchHistoryItemJson._status.state.active,
          lastChecked: null,
          lastMetCondition: null,
          watchStatusJson: {
            state: {
              active: upstreamJson.watchHistoryItemJson._status.state.active
            }
          }
        });
      });

    });

    describe('downstreamJSON getter method', () => {
      it('returns correct downstream JSON object', () => {
        const watchHistoryItem = WatchHistoryItem.fromUpstreamJSON(upstreamJson);
        const expectedDownstreamJSON = {
          id: upstreamJson.id,
          watchId: upstreamJson.watchId,
          details: null,
          startTime: upstreamJson.watchHistoryItemJson.result.execution_time,
          watchStatus: {
            id: upstreamJson.watchId,
            actionStatuses: [],
            comment: '',
            isActive: upstreamJson.watchHistoryItemJson._status.state.active,
            lastChecked: null,
            lastMetCondition: null,
            lastFired: undefined,
            state: 'OK'
          }
        };
        expect(watchHistoryItem.downstreamJSON).to.eql(expectedDownstreamJSON);
      });
    });
  });
});