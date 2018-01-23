import moment from 'moment';
import { cryptoFactory } from '../../../../server/lib/crypto';
import { oncePerServer } from '../../../../server/lib/once_per_server';
import { compatibilityShimFactory } from './compatibility_shim';
import { convertRelativeUrlToAbsoluteTime } from './convert_relative_url_to_absolute_time';

const stringifyTimeRange = (browserTimezone, timeRange) => {
  if (!timeRange) {
    return null;
  }

  return {
    from: moment.tz(timeRange.from, browserTimezone).format('llll'),
    to: moment.tz(timeRange.to, browserTimezone).format('llll')
  };
};

function createJobFn(server) {
  const compatibiltyShim = compatibilityShimFactory(server);
  const crypto = cryptoFactory(server);

  return compatibiltyShim(async function createJob({ objectType, title, relativeUrl, browserTimezone, layout }, headers) {
    const serializedEncryptedHeaders = await crypto.encrypt(headers);

    // we have to do this on the server because if we did so on the client,
    // it'd break Watcher integration and we can't keep it relative because
    // then it wouldn't be from the moment the user clicked the button
    const absoluteTime = convertRelativeUrlToAbsoluteTime(relativeUrl, browserTimezone);

    return {
      type: objectType,
      title: title,
      objects: [ { relativeUrl: absoluteTime.relativeUrl } ],
      timeRange: stringifyTimeRange(browserTimezone, absoluteTime.timeRange),
      headers: serializedEncryptedHeaders,
      layout,
    };
  });
}

export const createJobFactory = oncePerServer(createJobFn);
