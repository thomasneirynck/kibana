import { uniq } from 'lodash';
import { getExportTypesHandler } from './get_export_type_handler';
import { getReportingJobTypeCount } from './get_reporting_job_type_count';

export async function getReportingUsage(callCluster, server) {
  const xpackInfo = server.plugins.xpack_main.info;
  const config = server.config();
  const available = xpackInfo && xpackInfo.isAvailable(); // some form of reporting (csv at least) is available for all valid licenses
  const enabled = available && config.get('xpack.reporting.enabled'); // follow ES behavior: if its not available then its not enabled

  // 1. gather job types and their availability, according to the export types registry and x-pack info
  const exportTypesHandler = await getExportTypesHandler(server);
  const availability = exportTypesHandler.getAvailability(xpackInfo);

  // 2. combine types with jobs seen in the reporting data
  const { total, counts } = await getReportingJobTypeCount(callCluster, config, exportTypesHandler.getNumExportTypes());

  // 3. merge availability and count info
  const keys = uniq([].concat(Object.keys(availability), Object.keys(counts)));
  const jobTypes = keys.reduce((accum, key) => {
    const availabilityFromData = availability[key];
    const countFromData = counts[key];

    let count; // if this remains undefined, the key/value gets removed in serialization
    if (countFromData || countFromData === 0) {
      count = countFromData;
    } else if (enabled) { // jobtype is not in the agg result because it has never been used
      count = 0;
    }

    return {
      ...accum,
      [key]: {
        available: availabilityFromData ? availabilityFromData : false,
        count,
      }
    };
  }, {});

  return {
    available,
    enabled,
    _all: (total || total === 0) ? total : undefined,
    ...jobTypes,
  };
}
