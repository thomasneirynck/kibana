import expect from 'expect.js';
import parseNext from '../parse_next';

describe('parseNext', () => {
  it('should return a function', () => {
    expect(parseNext).to.be.a('function');
  });

  // trailing slash is important since it must match the cookie path exactly
  it('should return basePath with a trailing slash when next is not specified', () => {
    const basePath = '/iqf';
    const href = `${basePath}/login`;
    expect(parseNext(href, basePath)).to.equal(`${basePath}/`);
  });

  it('should properly handle next without hash', () => {
    const basePath = '/iqf';
    const next = `${basePath}/app/kibana`;
    const href = `${basePath}/login?next=${next}`;
    expect(parseNext(href, basePath)).to.equal(next);
  });

  it('should properly handle next with hash', () => {
    const basePath = '/iqf';
    const next = `${basePath}/app/kibana`;
    const hash = '/discover/New-Saved-Search';
    const href = `${basePath}/login?next=${next}#${hash}`;
    expect(parseNext(href, basePath)).to.equal(`${next}#${hash}`);
  });

  it('should properly decode special characters', () => {
    const basePath = '/iqf';
    const next = `${encodeURIComponent(basePath)}%2Fapp%2Fkibana`;
    const hash = '/discover/New-Saved-Search';
    const href = `${basePath}/login?next=${next}#${hash}`;
    expect(parseNext(href, basePath)).to.equal(decodeURIComponent(`${next}#${hash}`));
  });

  // to help prevent open redirect to a different url
  it('should return basePath if next includes a protocol/hostname', () => {
    const basePath = '/iqf';
    const next = `https://example.com${basePath}/app/kibana`;
    const href = `${basePath}/login?next=${next}`;
    expect(parseNext(href, basePath)).to.equal(`${basePath}/`);
  });

  // to help prevent open redirect to a different url by abusing encodings
  it('should return basePath if including a protocol/host even if it is encoded', () => {
    const basePath = '/iqf';
    const baseUrl = `http://example.com${basePath}`;
    const next = `${encodeURIComponent(baseUrl)}%2Fapp%2Fkibana`;
    const hash = '/discover/New-Saved-Search';
    const href = `${basePath}/login?next=${next}#${hash}`;
    expect(parseNext(href, basePath)).to.equal(`${basePath}/`);
  });

  // to help prevent open redirect to a different port
  it('should return basePath if next includes a port', () => {
    const basePath = '/iqf';
    const next = `http://localhost:5601${basePath}/app/kibana`;
    const href = `${basePath}/login?next=${next}`;
    expect(parseNext(href, basePath)).to.equal(`${basePath}/`);
  });

  // to help prevent open redirect to a different port by abusing encodings
  it('should return basePath if including a port even if it is encoded', () => {
    const basePath = '/iqf';
    const baseUrl = `http://example.com:5601${basePath}`;
    const next = `${encodeURIComponent(baseUrl)}%2Fapp%2Fkibana`;
    const hash = '/discover/New-Saved-Search';
    const href = `${basePath}/login?next=${next}#${hash}`;
    expect(parseNext(href, basePath)).to.equal(`${basePath}/`);
  });

  // to help prevent open redirect to a different base path
  it('should return basePath if next does not begin with basePath', () => {
    const basePath = '/iqf';
    const next = `/notbasepath/app/kibana`;
    const href = `${basePath}/login?next=${next}`;
    expect(parseNext(href, basePath)).to.equal(`${basePath}/`);
  });
});
