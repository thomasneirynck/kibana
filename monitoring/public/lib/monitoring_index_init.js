define(function (require) {
  /*
   * Accepts a function that is expecting a kibana IndexPattern, but of course for monitoring
   *
   */
  return function monitoringIndexPatternProvider(monitoringIndexPrefix, Private, indexPatterns) {
    return function () {
      var MonitoringConfig = {
        indexPattern: `${monitoringIndexPrefix}*`,
        timeField: 'timestamp',
        intervalName: 'days'
      };
      return indexPatterns.get(MonitoringConfig.indexPattern);
    };
  };
});
