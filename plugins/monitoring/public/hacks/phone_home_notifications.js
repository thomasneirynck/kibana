import _ from 'lodash';
import Notifier from 'ui/notify/notifier';
import uiModules from 'ui/modules';
import 'plugins/monitoring/services/features';

const PHONE_HOME_FEATURE = 'report';
const PHONE_HOME_NOTIFICATION_SEEN = 'report_notification_seen';

function confirmOptInMessage() {
  return {
    message: (
      `You have opted in to sharing cluster statistics.`
    ),
    actionFactories: [ { text: 'Ok' } ]
  };
}

function confirmOptOutMessage() {
  return {
    message: (
      `You have opted out of sharing cluster statistics.`
    ),
    actionFactories: [ { text: 'Ok' } ]
  };
}

function initialMessage() {
  return {
    message: (
      `Thanks for installing the X-Pack plugin. We want to know how your
      Elastic experience is going. Sharing your cluster statistics will help us
      improve the quality across all versions of our products. We will never
      share your data or use it for any other purposes. Are you interested?`
    ),
    actionFactories: [
      {
        text: 'Sure',
        featuresHandler: (features) => {
          return () => {
            features.update(PHONE_HOME_NOTIFICATION_SEEN, true);
            features.update(PHONE_HOME_FEATURE, true);
            showNotification(confirmOptInMessage());
          };
        }
      },
      {
        text: 'No thanks',
        featuresHandler: (features) => {
          return () => {
            features.update(PHONE_HOME_NOTIFICATION_SEEN, true);
            features.update(PHONE_HOME_FEATURE, false);
            showNotification(confirmOptOutMessage());
          };
        }
      }
    ]
  };
}

/*
 * @param options.message {String}
 * @param options.actionFactories {Array} Array of objects with `text` and `featuresHandler` fields
 * -- @param text {String} Message string
 * -- @param featuresHandler {Function} (optional) Fn that returns the callback function
 * @param features {Service} (optional) passed to action factory in getting the callback
 */
function showNotification({ message, actionFactories }, features) {
  const notify = new Notifier();
  const actions = actionFactories.map(factory => {
    let callback = _.noop;
    if (factory.featuresHandler) {
      callback = factory.featuresHandler(features);
    }
    return { text: factory.text, callback };
  });

  notify.custom(message, {
    type: 'banner',
    lifetime: Infinity,
    truncationLength: 500,
    actions
  });
}

function customNotification(ShieldUser, features) {
  // TODO: Use Shield isLoginPage service instead
  const currentUser = ShieldUser.getCurrent();
  if (_.isEmpty(currentUser)) {
    return; // user not logged in
  }

  // only run once
  const hasRan = features.isEnabled(PHONE_HOME_NOTIFICATION_SEEN);
  if (hasRan) {
    return;
  }

  showNotification(initialMessage(), features);
}

uiModules.get('kibana').run(customNotification);
