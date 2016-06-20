import EventEmitter from 'events';
import expect from 'expect.js';
import mirrorPluginStatus from '../mirror_plugin_status';

describe('mirror_plugin_status', () => {

  class MockPluginStatus extends EventEmitter {
    constructor() {
      super();
      this.state = 'uninitialized';
    }

    _changeState(newState, newMessage) {
      this.state = newState;
      this.message = newMessage;
      this.emit(newState);
      this.emit('change');
    }

    red(message) { this._changeState('red', message); }
    yellow(message) { this._changeState('yellow', message); }
    green(message) { this._changeState('green', message); }
    uninitialized(message) { this._changeState('uninitialized', message); }
  }

  class MockPlugin {
    constructor() {
      this.status = new MockPluginStatus();
    }
  };

  let upstreamPlugin;
  let downstreamPlugin;

  beforeEach(() => {
    upstreamPlugin = new MockPlugin();
    downstreamPlugin = new MockPlugin();
  });

  it('should mirror all downstream plugin statuses to upstream plugin statuses', () => {
    mirrorPluginStatus(upstreamPlugin, downstreamPlugin);

    upstreamPlugin.status.red('test message');
    expect(downstreamPlugin.status.state).to.be('red');
    expect(downstreamPlugin.status.message).to.be('test message');
  });

  it('should only mirror specific downstream plugin statuses to corresponding upstream plugin statuses', () => {
    mirrorPluginStatus(upstreamPlugin, downstreamPlugin, 'yellow', 'red');

    upstreamPlugin.status.yellow('test yellow message');
    expect(downstreamPlugin.status.state).to.be('yellow');
    expect(downstreamPlugin.status.message).to.be('test yellow message');

    upstreamPlugin.status.red('test red message');
    expect(downstreamPlugin.status.state).to.be('red');
    expect(downstreamPlugin.status.message).to.be('test red message');

    upstreamPlugin.status.green('test green message');
    expect(downstreamPlugin.status.state).not.to.be('green');
    expect(downstreamPlugin.status.message).not.to.be('test green message');
  });
});
