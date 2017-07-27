import semver from 'semver';
import { LOGSTASH } from '../../../common/constants';

export function isPipelineMonitoringSupportedInVersion(logstashVersion) {
  const major = semver.major(logstashVersion);
  return major >= LOGSTASH.MAJOR_VER_REQD_FOR_PIPELINES;
}