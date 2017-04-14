import expect from 'expect.js';
import { getTitle } from '../get_title';

describe('getTitle', function () {
  it('with metric.title', () => {
    const series = [
      { metric: { title: 'Foo', label: 'Bar X' } },
      { metric: { title: 'Foo', label: 'Bar Y' } }
    ];
    expect(getTitle(series)).to.be('Foo');
  });

  it('with metric.label', () => {
    const series = [
      { metric: { label: 'Bar A' } },
      { metric: { label: 'Bar B' } },
      { metric: { label: 'Bar B' } }
    ];
    expect(getTitle(series)).to.be('Bar A');
  });
});
