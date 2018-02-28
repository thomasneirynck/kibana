/*
 * config options opt into telemetry
 * @type {string}
 */
export const CONFIG_TELEMETRY = 'telemetry:optIn';
/*
 * config description for opting into telemetry
 * @type {string}
 */
export const CONFIG_TELEMETRY_DESC = 'Help us improve Kibana and Elasticsearch?';

/**
 * The name of the Kibana System ID used to publish and look up Kibana stats through the Monitoring system.
 * @type {string}
 */
export const KIBANA_SYSTEM_ID = 'kibana';

/**
 * The name of the Kibana System ID used to look up Logstash stats through the Monitoring system.
 * @type {string}
 */
export const LOGSTASH_SYSTEM_ID = 'logstash';

/**
 * The name of the Kibana System ID used to look up Reporting stats through the Monitoring system.
 * @type {string}
 */
export const REPORTING_SYSTEM_ID = 'reporting';

/**
 * The amount of time, in milliseconds, to wait between reports when enabled.
 *
 * Currently 24 hours.
 * @type {Number}
 */
export const REPORT_INTERVAL_MS = 86400000;

/*
 * Key for the localStorage service
 */
export const LOCALSTORAGE_KEY = 'xpack.data';
