import _ from 'lodash';
import mapPlugins from '../map_plugins';
import expect from 'expect.js';

describe('Map plugins', () => {
  it('pick name and state', () => {
    const plugins = [{
      name: 'foo',
      message: 'bar',
      since: 'Thu Apr 21 2016 15:46:18 GMT-0500 (CDT)',
      state: 'red'
    }];
    const expected = [{
      name: 'foo',
      state: 'red'
    }];
    expect(_.isEqual(mapPlugins(plugins), expected)).to.be(true);
  });
});
