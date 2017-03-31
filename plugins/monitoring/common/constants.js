/**
 * The Monitoring API version is the expected API format that we export and expect to import.
 * @type {string}
 */
export const MONITORING_SYSTEM_API_VERSION = '2';
/**
 * The name of the Kibana System ID used to publish and lookup Kibana stats through the Monitoring system.
 * @type {string}
 */
export const KIBANA_SYSTEM_ID = 'kibana';
/**
 * The name of the Kibana System ID used to lookup Kibana stats through the Monitoring system.
 * @type {string}
 */
export const LOGSTASH_SYSTEM_ID = 'logstash';
/**
 * The type name used within the Monitoring index to publish Kibana stats.
 * @type {string}
 */
export const KIBANA_STATS_TYPE = 'kibana_stats';

/*
 * config options for welcome banner / allow phone home
 */
export const CONFIG_SHOW_BANNER = 'xPackMonitoring:showBanner';
export const CONFIG_ALLOW_REPORT = 'xPackMonitoring:allowReport';

/*
 * Chart colors
 */
export const CHART_LINE_COLOR = '#d2d2d2';
export const CHART_TEXT_COLOR = '#9c9c9c';
