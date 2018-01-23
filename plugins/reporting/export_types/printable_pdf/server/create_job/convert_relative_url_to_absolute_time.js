import url from 'url';
import { uriEncode } from '../lib/uri_encode';
import { parseKibanaState } from '../../../../../../server/lib/parse_kibana_state';
import { getAbsoluteTime } from '../lib/get_absolute_time';

export function convertRelativeUrlToAbsoluteTime(relativeUrl) {
  const [ path, hash ] = relativeUrl.split('#');

  const relativeTimeHash = url.parse(hash, true);
  const { query } = relativeTimeHash;

  // modify the global state in the query
  let timeRange;
  const globalState = parseKibanaState(query, 'global');
  if (globalState.exists) {
    globalState.removeProps('refreshInterval');

    const absoluteTime = getAbsoluteTime(globalState.get('time'));

    if (absoluteTime) {
      timeRange = {
        from: absoluteTime.from,
        to: absoluteTime.to,
      };

      // transform to absolute time
      globalState.set('time', absoluteTime);
    }

    Object.assign(query, globalState.toQuery());
  }

  const absoluteTimeHash = url.format({
    ...relativeTimeHash,
    search: uriEncode.stringify(query)
  });

  return {
    timeRange,
    relativeUrl: `${path}#${absoluteTimeHash}`
  };
}
