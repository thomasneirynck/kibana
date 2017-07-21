import chrome from 'ui/chrome';

function get(url) {
  return new Promise((resolve, reject) => {
    const req = new window.XMLHttpRequest();

    req.open('GET', url);

    req.onload = () => {
      if (req.status === 200) {
        resolve(JSON.parse(req.response));
      } else {
        reject(JSON.parse(req.response));
      }
    };

    req.onerror = () => {
      reject(new Error('Network error'));
    };

    req.send();
  });
}

export function getFromApi(url) {
  return get(chrome.addBasePath(url));
}

function post(url, data) {
  return new Promise((resolve, reject) => {
    const xhr = new window.XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('Content-type', 'application/json');
    xhr.setRequestHeader('kbn-version', chrome.getXsrfToken());
    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.response));
      } else {
        reject(JSON.parse(xhr.response));
      }
    };
    xhr.send(JSON.stringify(data));
  });
}

export function postToApi(url, data) {
  return post(chrome.addBasePath(url), data);
}

function put(url, data) {
  return new Promise((resolve, reject) => {
    const xhr = new window.XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-type', 'application/json');
    xhr.setRequestHeader('kbn-version', chrome.getXsrfToken());
    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.response));
      } else {
        reject(JSON.parse(xhr.response));
      }
    };
    xhr.send(JSON.stringify(data));
  });
}

export function putToApi(url, data) {
  return put(chrome.addBasePath(url), data);
}

function del(url) {
  return new Promise((resolve, reject) => {
    const xhr = new window.XMLHttpRequest();
    xhr.open('DELETE', url);
    xhr.setRequestHeader('Content-type', 'application/json');
    xhr.setRequestHeader('kbn-version', chrome.getXsrfToken());
    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.response));
      } else {
        reject(JSON.parse(xhr.response));
      }
    };
    xhr.send();
  });
}

export function deleteFromApi(url) {
  return del(chrome.addBasePath(url));
}
