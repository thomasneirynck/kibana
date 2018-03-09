import 'isomorphic-fetch';
import { camelizeKeys } from 'humps';
import url from 'url';
import _ from 'lodash';
import chrome from 'ui/chrome';

async function callApi(options) {
  const { pathname, query, camelcase, compact, ...urlOptions } = {
    compact: true, // remove empty query args
    camelcase: true,
    credentials: 'same-origin',
    method: 'GET',
    headers: new Headers({
      'Content-Type': 'application/json',
      'kbn-xsrf': true
    }),
    ...options
  };

  const fullUrl = url.format({
    pathname,
    query: compact ? _.omit(query, val => val == null) : query
  });

  try {
    const response = await fetch(fullUrl, urlOptions);
    const json = await response.json();
    if (!response.ok) {
      throw new Error(JSON.stringify(json, null, 4));
    }
    return camelcase ? camelizeKeys(json) : json;
  } catch (err) {
    console.error(
      'Rest request error with options:\n',
      JSON.stringify(options, null, 4),
      '\n',
      err.message,
      err.stack
    );
    throw err;
  }
}

function getAppRootPath(serviceName) {
  return `../api/apm/services/${serviceName}`;
}

export async function loadLicense() {
  return callApi({
    pathname: `../api/xpack/v1/info`
  });
}

export async function loadServerStatus() {
  return callApi({
    pathname: `../api/apm/status/server`
  });
}

export async function loadAgentStatus() {
  return callApi({
    pathname: `../api/apm/status/agent`
  });
}

export async function loadServiceList({ start, end, query }) {
  return callApi({
    pathname: `../api/apm/services`,
    query: {
      start,
      end,
      query
    }
  });
}

export async function loadService({ start, end, serviceName }) {
  return callApi({
    pathname: `../api/apm/services/${serviceName}`,
    query: {
      start,
      end
    }
  });
}

export async function loadTransactionList({
  serviceName,
  start,
  end,
  transactionType
}) {
  return callApi({
    pathname: `${getAppRootPath(serviceName)}/transactions`,
    query: {
      start,
      end,
      transaction_type: transactionType
    }
  });
}

export async function loadTransactionDistribution({
  serviceName,
  start,
  end,
  transactionName
}) {
  return callApi({
    pathname: `${getAppRootPath(serviceName)}/transactions/distribution`,
    query: {
      start,
      end,
      transaction_name: transactionName
    }
  });
}

export async function loadSpans({ serviceName, start, end, transactionId }) {
  return callApi({
    pathname: `${getAppRootPath(
      serviceName
    )}/transactions/${transactionId}/spans`,
    query: {
      start,
      end
    }
  });
}

export async function loadTransaction({
  serviceName,
  start,
  end,
  transactionId
}) {
  const res = await callApi({
    pathname: `${getAppRootPath(serviceName)}/transactions/${transactionId}`,
    camelcase: false,
    query: {
      start,
      end
    }
  });
  const camelizedRes = camelizeKeys(res);
  if (res.context) {
    camelizedRes.context = res.context;
  }
  return camelizedRes;
}

export async function loadCharts({
  serviceName,
  start,
  end,
  transactionType,
  transactionName
}) {
  return callApi({
    pathname: `${getAppRootPath(serviceName)}/transactions/charts`,
    query: {
      start,
      end,
      transaction_type: transactionType,
      transaction_name: transactionName
    }
  });
}

export async function loadErrorGroupList({
  serviceName,
  start,
  end,
  size,
  q,
  sortBy,
  sortOrder
}) {
  return callApi({
    pathname: `${getAppRootPath(serviceName)}/errors`,
    query: {
      start,
      end,
      size,
      q,
      sortBy,
      sortOrder
    }
  });
}

export async function loadErrorGroup({
  serviceName,
  errorGroupId,
  start,
  end
}) {
  const res = await callApi({
    pathname: `${getAppRootPath(serviceName)}/errors/${errorGroupId}`,
    camelcase: false,
    query: {
      start,
      end
    }
  });
  const camelizedRes = camelizeKeys(res);
  if (res.error.context) {
    camelizedRes.error.context = res.error.context;
  }
  return camelizedRes;
}

export async function loadErrorDistribution({
  serviceName,
  start,
  end,
  errorGroupId
}) {
  return callApi({
    pathname: `${getAppRootPath(
      serviceName
    )}/errors/${errorGroupId}/distribution`,
    query: {
      start,
      end
    }
  });
}

export async function createWatch(id, watch) {
  const basePath = chrome.addBasePath('/api/watcher');
  return callApi({
    method: 'PUT',
    pathname: `${basePath}/watch/${id}`,
    body: JSON.stringify({ type: 'json', id, watch })
  });
}

export async function getWatch({ id }) {
  const basePath = chrome.addBasePath('/api/watcher');
  return callApi({
    pathname: `${basePath}/watch/${id}`
  });
}
