import expect from 'expect.js';
import { pluginDefinition } from '../plugin_definition';

describe ('pluginDefinition', () => {
  it('defines the configPrefix correctly', () => {
    expect(pluginDefinition.configPrefix).to.be('xpack.watcher');
  });
});
