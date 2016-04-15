import expect from 'expect.js';

import parseNext from '../../../public/lib/parse_next';

describe('parseNext', () => {
  it('should return a function', () => {
    expect(parseNext).to.be.a('function');
  });

  it('should return / by when next is not specified', () => {
    const location = {href: 'https://localhost:5601/iqf/login'};
    expect(parseNext(location)).to.equal('/');
  });

  it('should properly handle next without hash', () => {
    const next = '/app/kibana';
    const location = {href: `https://localhost:5601/iqf/login?next=${next}`};
    expect(parseNext(location)).to.equal(next);
  });

  it('should properly handle next with hash', () => {
    const next = '/app/kibana';
    const hash = '/discover/New-Saved-Search';
    const location = {href: `https://localhost:5601/iqf/login?next=${next}#${hash}`};
    expect(parseNext(location)).to.equal(`${next}#${hash}`);
  });

  it('should properly decode special characters', () => {
    const next = '%2Fapp%2Fkibana';
    const hash = '/discover/New-Saved-Search';
    const location = {href: `https://localhost:5601/iqf/login?next=${next}#${hash}`};
    expect(parseNext(location)).to.equal(decodeURIComponent(`${next}#${hash}`));
  });
});
