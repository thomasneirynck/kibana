import expect from 'expect.js';
import { Settings } from '../settings';

describe('settings module', () => {
  describe('Settings class', () => {
    describe('fromUpstreamJSON factory method', () => {
      describe('when no upstream JSON is specified', () => {
        it('returns the correct Settings instance', () => {
          const settings = Settings.fromUpstreamJSON();

          const actionTypes = settings.actionTypes;
          expect(actionTypes.email.enabled).to.be(false);
          expect(actionTypes.webhook.enabled).to.be(true);
          expect(actionTypes.index.enabled).to.be(true);
          expect(actionTypes.logging.enabled).to.be(true);
          expect(actionTypes.hipchat.enabled).to.be(false);
          expect(actionTypes.slack.enabled).to.be(true);
          expect(actionTypes.jira.enabled).to.be(false);
          expect(actionTypes.pagerduty.enabled).to.be(false);
        });
      });

      describe('when upstream JSON contains a configured action type', () => {
        it('returns the correct Settings instance', () => {
          const upstreamJson = {
            defaults: {
              xpack: {
                notification: {
                  email: {
                    account: {
                      scooby: {},
                      scrappy: {}
                    },
                    default_account: 'scooby'
                  }
                }
              }
            }
          };
          const settings = Settings.fromUpstreamJSON(upstreamJson);

          const actionTypes = settings.actionTypes;
          expect(actionTypes.email.enabled).to.be(true);
          expect(actionTypes.email.accounts.scooby.default).to.be(true);
          expect(actionTypes.email.accounts.scrappy).to.be.an('object');
        });
      });
    });

    describe('downstreamJSON getter method', () => {
      it('returns correct JSON for client', () => {
        const upstreamJson = {
          defaults: {
            xpack: {
              notification: {
                email: {
                  account: {
                    scooby: {},
                    scrappy: {}
                  },
                  default_account: 'scooby'
                }
              }
            }
          }
        };
        const settings = Settings.fromUpstreamJSON(upstreamJson);
        const json = settings.downstreamJSON;

        expect(json.action_types.email.enabled).to.be(true);
        expect(json.action_types.email.accounts.scooby.default).to.be(true);
        expect(json.action_types.email.accounts.scrappy).to.be.an('object');
        expect(json.action_types.webhook.enabled).to.be(true);
        expect(json.action_types.index.enabled).to.be(true);
        expect(json.action_types.logging.enabled).to.be(true);
        expect(json.action_types.hipchat.enabled).to.be(false);
        expect(json.action_types.slack.enabled).to.be(true);
        expect(json.action_types.jira.enabled).to.be(false);
        expect(json.action_types.pagerduty.enabled).to.be(false);
      });
    });
  });
});
