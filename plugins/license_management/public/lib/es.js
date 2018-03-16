import chrome from 'ui/chrome';

import $ from 'jquery';

export function putLicense(license, acknowledge) {
  const options = {
    url: `${chrome.addBasePath('/api/license')}${acknowledge ? '?acknowledge=true' : ''}`,
    data: license,
    contentType: 'application/json',
    cache: false,
    crossDomain: true,
    type: 'PUT',
  };

  return $.ajax(options);
}

export function startBasic(acknowledge) {
  const options = {
    url: `${chrome.addBasePath('/api/license/start_basic')}${acknowledge ? '?acknowledge=true' : ''}`,
    contentType: 'application/json',
    cache: false,
    crossDomain: true,
    type: 'POST',
  };

  return $.ajax(options);
}

export function startTrial() {
  const options = {
    url: chrome.addBasePath('/api/license/start_trial'),
    contentType: 'application/json',
    cache: false,
    crossDomain: true,
    type: 'POST',
  };

  return $.ajax(options);
}

export function canStartTrial() {
  const options = {
    url: chrome.addBasePath('/api/license/start_trial'),
    contentType: 'application/json',
    cache: false,
    crossDomain: true,
    type: 'GET',
  };

  return $.ajax(options);
}

