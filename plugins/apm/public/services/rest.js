import 'isomorphic-fetch';
import { camelizeKeys } from 'humps';
import url from 'url';
import _ from 'lodash';
import isNil from 'lodash.isnil';

async function callApi(options) {
  const { pathname, query, camelcase, compact, ...urlOptions } = {
    compact: true, // remove empty query args
    camelcase: true,
    credentials: 'same-origin',
    method: 'GET',
    headers: new Headers({
      'Content-Type': 'application/json'
    }),
    ...options
  };

  const fullUrl = url.format({
    pathname,
    query: compact ? _.omit(query, isNil) : query
  });

  try {
    const response = await fetch(fullUrl, urlOptions);
    const json = await response.json();
    if (!response.ok) {
      throw new Error(json);
    }
    return camelcase ? camelizeKeys(json) : json;
  } catch (err) {
    console.error('Rest request error', options, err);
    throw err;
  }
}

function getAppRootPath(appName) {
  return `../api/apm/apps/${appName}`;
}

export async function loadLicense() {
  const response = await callApi({
    pathname: `../api/xpack/v1/info`
  });
  return response.license;
}

export async function loadAppList({ start, end, query }) {
  return callApi({
    pathname: `../api/apm/apps`,
    query: {
      start,
      end,
      query
    }
  });
}

export async function loadApp({ start, end, appName }) {
  const apps = await loadAppList({ start, end, query: appName });
  return _.first(apps);
}

export async function loadTransactionList({
  appName,
  start,
  end,
  transactionType
}) {
  return callApi({
    pathname: `${getAppRootPath(appName)}/transactions`,
    query: {
      start,
      end,
      transaction_type: transactionType
    }
  });
}

export async function loadTransactionDistribution({
  appName,
  start,
  end,
  transactionName
}) {
  return callApi({
    pathname: `${getAppRootPath(appName)}/transactions/distribution`,
    query: {
      start,
      end,
      transaction_name: transactionName
    }
  });
}

export async function loadTraces({ appName, start, end, transactionId }) {
  return callApi({
    pathname: `${getAppRootPath(appName)}/transactions/${transactionId}/traces`,
    query: {
      start,
      end
    }
  });
}

export async function loadTransaction({ appName, start, end, transactionId }) {
  return callApi({
    camelcase: false,
    pathname: `${getAppRootPath(appName)}/transactions/${transactionId}`,
    query: {
      start,
      end
    }
  });
}

export async function loadCharts({
  appName,
  start,
  end,
  transactionType,
  transactionName
}) {
  return callApi({
    pathname: `${getAppRootPath(appName)}/transactions/charts`,
    query: {
      start,
      end,
      transaction_type: transactionType,
      transaction_name: transactionName
    }
  });
}

export async function loadErrorGroupList({ appName, start, end }) {
  return callApi({
    pathname: `${getAppRootPath(appName)}/errors`,
    query: {
      start,
      end
    }
  });
}

export async function loadErrorGroup({ appName, errorGroupId, start, end }) {
  return callApi({
    pathname: `${getAppRootPath(appName)}/errors/${errorGroupId}`,
    camelcase: false,
    query: {
      start,
      end
    }
  });
}

export async function loadErrorDistribution({
  appName,
  start,
  end,
  errorGroupId
}) {
  return callApi({
    pathname: `${getAppRootPath(appName)}/errors/${errorGroupId}/distribution`,
    query: {
      start,
      end
    }
  });
}
