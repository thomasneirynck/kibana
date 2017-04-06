import expect from 'expect.js';
import { Action } from '../action';
import { ACTION_TYPES } from '../../../../common/constants';

describe('action', () => {

  describe('Action', () => {

    describe('fromUpstreamJSON factory method', () => {

      let upstreamJson;
      beforeEach(() => {
        upstreamJson = {
          id: 'my-action',
          actionJson: {
            "logging": {
              "text": "foo"
            }
          }
        };
      });

      it(`throws an error if no 'id' property in json`, () => {
        delete upstreamJson.id;
        expect(Action.fromUpstreamJSON).withArgs(upstreamJson)
          .to.throwError(/must contain an id property/i);
      });

      it(`throws an error if no 'actionJson' property in json`, () => {
        delete upstreamJson.actionJson;
        expect(Action.fromUpstreamJSON).withArgs(upstreamJson)
          .to.throwError(/must contain an actionJson property/i);
      });

      it('returns correct Action instance', () => {
        const action = Action.fromUpstreamJSON(upstreamJson);

        expect(action.id).to.be(upstreamJson.id);
      });

    });

    describe('type getter method', () => {

      it(`returns a value from ACTION_TYPES`, () => {
        const upstreamJson = {
          id: 'my-action',
          actionJson: {
            email: {
              'foo': 'bar'
            }
          }
        };
        const action = Action.fromUpstreamJSON(upstreamJson);

        expect(action.type).to.be(ACTION_TYPES.EMAIL);
      });

    });

    describe('downstreamJSON getter method', () => {

      let upstreamJson;
      beforeEach(() => {
        upstreamJson = {
          id: 'my-action',
          actionJson: {
            "logging": {
              "text": "foo"
            }
          }
        };
      });

      it('returns correct JSON for client', () => {
        const action = Action.fromUpstreamJSON(upstreamJson);

        const json = action.downstreamJSON;

        expect(json.id).to.be(action.id);
        expect(json.type).to.be(action.type);
      });

    });

  });

});
