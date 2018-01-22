import url from 'url';
export function requestFixture({
  headers = { accept: 'something/html' },
  path = '/wat',
  search = '',
  payload
} = {}) {
  return {
    raw: { req: { headers } },
    headers,
    url: { path, search },
    query: search ? url.parse(search, { parseQueryString: true }).query : {},
    payload,
    state: { user: 'these are the contents of the user client cookie' }
  };
}
