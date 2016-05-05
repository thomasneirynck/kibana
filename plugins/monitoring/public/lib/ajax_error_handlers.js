module.exports = function ajaxErrorHandlersProvider(Notifier) {
  return {
    /* full-screen error message */
    fatalError(err) {
      if (err.status === 403) {
        const shieldNotifier = new Notifier({ location: 'Security Plugin' });
        return shieldNotifier.fatal('Sorry, you are not authorized to access Monitoring');
      }
      const genericNotifier = new Notifier({ location: 'Monitoring' });
      return genericNotifier.fatal(err);
    },
    /* dismissable banner message */
    nonFatal(err) {
      const notifier = new Notifier({ location: 'Monitoring' });
      return notifier.error(err);
    }
  };
};
