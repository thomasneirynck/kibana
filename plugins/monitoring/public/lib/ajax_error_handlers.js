import uiChrome from 'ui/chrome';

export default function ajaxErrorHandlersProvider(Notifier, $window, Promise) {
  return (err) => {
    if (err.status === 403) {
      /* redirect to error message view */
      $window.location.href = uiChrome.addBasePath('/app/monitoring#/access-denied');
    } else {
      const genericNotifier = new Notifier({ location: 'Monitoring' });
      genericNotifier.fatal(err);
    }

    return Promise.reject(err);
  };
};
